import { createWhispers } from './whispers.js';

// Vignette settings
const vignette = {
  enabled:   true,
  overText:  true,   // draw above whispers, set false to leave text untouched
  strength:  0.6,    // 0..1, alpha at edges
  radius:    0.6,    // 0..1.2, size of clear center
  softness:  0.5,    // 0.05..1, thickness of the fade
  x:         0.5,    // 0..1, center X as fraction of width
  y:         0.5     // 0..1, center Y as fraction of height
};
let vignettePG;       // offscreen gradient

function buildVignette() {
  vignettePG = createGraphics(width, height);
  vignettePG.pixelDensity(1);
  const ctx = vignettePG.drawingContext;
  // clear
  ctx.clearRect(0, 0, vignettePG.width, vignettePG.height);

  const cx = vignette.x * vignettePG.width;
  const cy = vignette.y * vignettePG.height;

  // outer radius reaches corners so the black goes to edges
  const maxR = 0.5 * Math.hypot(vignettePG.width, vignettePG.height);

  // transparent center radius
  const innerR = Math.min(vignettePG.width, vignettePG.height) * 0.5 * vignette.radius;

  // thickness of the feathered ring
  const ring = Math.max(10, maxR * vignette.softness);
  const outerR = Math.min(maxR, innerR + ring);

  const g = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(0,0,0,${vignette.strength})`);

  ctx.fillStyle = g;
  ctx.fillRect(0, 0, vignettePG.width, vignettePG.height);
}

// =====================
// Config + State
// =====================
const params = {
  noiseScale: 0.002,
  tSpeed:     0.007,
  octaves:    8,
  falloff:    0.3,
  downsample: 6,
  palette:    'Electric',
  newPaletteName: 'MyPalette'
};

let t = 0;
let pg;
let gui, editorFolder, paletteController;

// Built-in palettes (HSB triples)
const PALETTES = {
  Nebula:   [ [300,80,90], [230,80,90], [190,70,90], [160,70,90] ],
  Sunset:   [ [10,95,100], [28,95,100], [45,90,95],  [300,60,90] ],
  Aurora:   [ [100,80,90], [140,80,90], [180,75,90], [220,70,90] ],
  Candy:    [ [330,80,95], [300,75,95], [200,75,95], [160,65,95] ],
  Electric: [ [29,52,82],  [289,70,90], [318,0,86],  [99,32,32]  ]
};
const DEFAULT_NAMES = new Set(Object.keys(PALETTES));

// Editable HSB stops and computed colors
let activeStops = [];   // array of [h,s,b]
let activeColors = [];  // array of p5.Color

// Whispers module handle
let whispers;

// =====================
// p5 setup/draw
// =====================
function setup() {
  console.log('setup running, p5 =', typeof p5 !== 'undefined' ? p5.version : 'missing');

  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  frameRate(30);

  resizeBuffer(); // creates pg with current downsample
  noiseDetail(params.octaves, params.falloff);
  setActivePaletteFromName(params.palette);

  // GUI
  gui = new dat.GUI();
  gui.add(params, 'noiseScale', 0.0005, 0.01, 0.0001).name('Noise Scale');
  gui.add(params, 'tSpeed',     0.001,  0.1,  0.001).name('Time Speed');
  gui.add(params, 'octaves',    1,      16,   1).name('Octaves')
     .onChange(v => noiseDetail(v, params.falloff));
  gui.add(params, 'falloff',    0,      1,    0.01).name('Falloff')
     .onChange(v => noiseDetail(params.octaves, v));
  gui.add(params, 'downsample', 1,      8,    1).name('Downsample')
     .onChange(() => resizeBuffer());

  refreshPaletteDropdown();
  buildEditorGUI();

  // Whispers overlay module
  whispers = createWhispers(gui, () => params.palette);
  
  const vig = gui.addFolder('Vignette');
vig.add(vignette, 'enabled').name('Enabled');
vig.add(vignette, 'overText').name('Affects Text');
vig.add(vignette, 'strength', 0, 1, 0.01).name('Edge Strength').onChange(buildVignette);
vig.add(vignette, 'radius',   0.2, 1.2, 0.01).name('Clear Radius').onChange(buildVignette);
vig.add(vignette, 'softness', 0.05, 1, 0.01).name('Softness').onChange(buildVignette);
vig.add(vignette, 'x', 0, 1, 0.01).name('Center X').onChange(buildVignette);
vig.add(vignette, 'y', 0, 1, 0.01).name('Center Y').onChange(buildVignette);

// build once at start
buildVignette();

}

function draw() {
  // render into pg at lower res
  pg.loadPixels();
  for (let x = 0; x < pg.width; x++) {
    for (let y = 0; y < pg.height; y++) {
      const n = noise(
        x * params.noiseScale * params.downsample,
        y * params.noiseScale * params.downsample,
        t
      );

      const idxF = n * (activeColors.length - 1);
      const i = floor(idxF);
      const tt = idxF - i;
      const c1 = activeColors[i];
      const c2 = activeColors[min(i + 1, activeColors.length - 1)];
      const col = lerpColor(c1, c2, tt);

      const p = (x + y * pg.width) * 4;
      pg.pixels[p    ] = red(col);
      pg.pixels[p + 1] = green(col);
      pg.pixels[p + 2] = blue(col);
      pg.pixels[p + 3] = 255;
    }
  }
  pg.updatePixels();

  // paint nebula to main canvas
  image(pg, 0, 0, width, height);

  // optional vignette under text
  if (vignette.enabled && !vignette.overText) {
    image(vignettePG, 0, 0, width, height);
  }

  // whispers overlay once
  whispers.update(deltaTime);
  whispers.draw();

  // optional vignette over text
  if (vignette.enabled && vignette.overText) {
    image(vignettePG, 0, 0, width, height);
  }

  // evolve time
  t += params.tSpeed;
}


// expose for p5 global-mode lookup
window.setup = setup;
window.draw = draw;
window.windowResized = windowResized;
window.mousePressed = mousePressed;

// =====================
/* Palette plumbing */
// =====================
function setActivePaletteFromName(name) {
  activeStops = PALETTES[name].map(([h,s,b]) => [h, s, b]); // deep copy
  computeActiveColors();
}

function computeActiveColors() {
  activeColors = activeStops.map(([h,s,b]) => color(h, s, b));
}

function saveCurrentAsNewPalette() {
  const name = params.newPaletteName.trim();
  if (!name) { alert('Enter a name for your palette'); return; }
  PALETTES[name] = activeStops.map(([h,s,b]) => [h, s, b]);
  params.palette = name;
  refreshPaletteDropdown();
}

function deleteCurrentPalette() {
  const name = params.palette;
  if (DEFAULT_NAMES.has(name)) {
    alert('Built in palettes cannot be deleted');
    return;
  }
  delete PALETTES[name];
  params.palette = 'Nebula';
  setActivePaletteFromName(params.palette);
  refreshPaletteDropdown();
  buildEditorGUI();
}

function refreshPaletteDropdown() {
  const names = Object.keys(PALETTES);
  if (paletteController) gui.remove(paletteController);
  paletteController = gui.add(params, 'palette', names).name('Palette')
    .onChange(name => {
      setActivePaletteFromName(name);
      buildEditorGUI();
    });
  if (paletteController.setValue) paletteController.setValue(params.palette);
}

// =====================
/* Editor GUI */
// =====================
function buildEditorGUI() {
  if (editorFolder) {
    gui.removeFolder?.(editorFolder);
    if (editorFolder.domElement && editorFolder.domElement.parentNode) {
      editorFolder.domElement.parentNode.removeChild(editorFolder.domElement);
    }
    editorFolder = null;
  }
  editorFolder = gui.addFolder('Palette Editor');

  // Actions and inputs
  editorFolder.add(params, 'newPaletteName').name('Save As Name');
  editorFolder.add({ save: saveCurrentAsNewPalette }, 'save').name('Save Palette');
  editorFolder.add({ del: deleteCurrentPalette }, 'del').name('Delete Palette');

  // Stop count controls
  const actions = {
    addStop: () => {
      if (activeStops.length >= 8) return;
      const last = activeStops[activeStops.length - 1];
      activeStops.push([last[0], last[1], last[2]]);
      computeActiveColors();
      buildEditorGUI();
    },
    removeStop: () => {
      if (activeStops.length <= 2) return;
      activeStops.pop();
      computeActiveColors();
      buildEditorGUI();
    }
  };
  editorFolder.add({ count: activeStops.length }, 'count').name('Stops').listen();
  editorFolder.add(actions, 'addStop').name('Add Stop');
  editorFolder.add(actions, 'removeStop').name('Remove Stop');

  // Per stop H S B controls
  activeStops.forEach((stop, idx) => {
    const f = editorFolder.addFolder(`Stop ${idx + 1}`);
    const stopObj = { h: stop[0], s: stop[1], b: stop[2] };
    f.add(stopObj, 'h', 0, 360, 1).name('H').onChange(v => { activeStops[idx][0] = v; computeActiveColors(); });
    f.add(stopObj, 's', 0, 100, 1).name('S').onChange(v => { activeStops[idx][1] = v; computeActiveColors(); });
    f.add(stopObj, 'b', 0, 100, 1).name('B').onChange(v => { activeStops[idx][2] = v; computeActiveColors(); });
  });

  editorFolder.open();
}

// =====================
/* Resize helpers */
// =====================
function resizeBuffer() {
  const w = Math.max(1, Math.floor(windowWidth  / params.downsample));
  const h = Math.max(1, Math.floor(windowHeight / params.downsample));
  pg = createGraphics(w, h);
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeBuffer();
  buildVignette();
}

// Click to jump time
function mousePressed() {
  t = random(1000);
}
