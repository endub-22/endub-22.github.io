// =====================
// Config + State
// =====================
const params = {
  noiseScale: 0.002,
  tSpeed:     0.02,
  octaves:    8,
  falloff:    0.3,
  downsample: 6,
  palette:    'Nebula',
  newPaletteName: 'MyPalette'
};

let t = 0;
let pg;
let gui, editorFolder, paletteController;

// Built-in palettes (HSB triples)
const PALETTES = {
  Nebula:  [ [300,80,90], [230,80,90], [190,70,90], [160,70,90] ],
  Sunset:  [ [10,95,100], [28,95,100], [45,90,95],  [300,60,90] ],
  Aurora:  [ [100,80,90], [140,80,90], [180,75,90], [220,70,90] ],
  Candy:   [ [330,80,95], [300,75,95], [200,75,95], [160,65,95] ]
};
const DEFAULT_NAMES = new Set(Object.keys(PALETTES));

// This is the editable list of HSB stops for the active palette
let activeStops = [];          // array of [h,s,b]
let activeColors = [];         // array of p5.Color computed from activeStops

// =====================
// Setup
// =====================
function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  frameRate(30);

  pg = createGraphics(
    floor(windowWidth / params.downsample),
    floor(windowHeight / params.downsample)
  );
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100);

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
}

// =====================
// Rendering
// =====================
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

      // pick two colors and blend
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

  // draw the buffer stretched to full size
  image(pg, 0, 0, width, height);

  t += params.tSpeed;
}

// =====================
// Palette plumbing
// =====================
function setActivePaletteFromName(name) {
  // deep copy stops
  activeStops = PALETTES[name].map(([h,s,b]) => [h, s, b]);
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
  // ensure dropdown shows the current value
  if (paletteController.setValue) paletteController.setValue(params.palette);
}

// =====================
// Editor GUI
// =====================
function buildEditorGUI() {
  if (editorFolder) {
    gui.removeFolder(editorFolder);
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
      buildEditorGUI(); // rebuild to show new controllers
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
// Resize helpers
// =====================
function resizeBuffer() {
  pg = createGraphics(
    floor(windowWidth / params.downsample),
    floor(windowHeight / params.downsample)
  );
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeBuffer();
}

// Click to jump time
function mousePressed() {
  t = random(1000);
}
