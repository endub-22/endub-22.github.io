// parameters object
const params = {
  noiseScale: 0.002,
  tSpeed:     0.02,
  octaves:    8,
  falloff:    0.3,
  downsample: 6,
  palette:    'Nebula' // default
};

let t = 0;      // time offset
let pg;         // offscreen buffer

// Palette definitions (HSB triples)
const PALETTES = {
  Nebula:  [ [300,80,90], [230,80,90], [190,70,90], [160,70,90] ],
  Sunset:  [ [10,95,100], [28,95,100], [45,90,95],  [300,60,90] ],
  Aurora:  [ [100,80,90], [140,80,90], [180,75,90], [220,70,90] ],
  Candy:   [ [330,80,95], [300,75,95], [200,75,95], [160,65,95] ]
};

let activePalette = []; // array of p5.Color objects

function buildActivePalette(name) {
  activePalette = PALETTES[name].map(([h,s,b]) => color(h, s, b));
}

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
  buildActivePalette(params.palette);

  // GUI
  const gui = new dat.GUI();
  gui.add(params, 'noiseScale', 0.0005, 0.01, 0.0001).name('Noise Scale');
  gui.add(params, 'tSpeed',     0.001,  0.1,  0.001).name('Time Speed');
  gui.add(params, 'octaves',    1,      16,   1)
     .name('Octaves')
     .onChange(v => noiseDetail(v, params.falloff));
  gui.add(params, 'falloff',    0,      1,    0.01)
     .name('Falloff')
     .onChange(v => noiseDetail(params.octaves, v));
  gui.add(params, 'downsample', 1,      8,    1)
     .name('Downsample')
     .onChange(() => resizeBuffer());
  gui.add(params, 'palette', Object.keys(PALETTES))
     .name('Palette')
     .onChange(name => buildActivePalette(name));
}

// call this whenever downsample changes or on resize
function resizeBuffer() {
  pg = createGraphics(
    floor(windowWidth / params.downsample),
    floor(windowHeight / params.downsample)
  );
  pg.pixelDensity(1);
  pg.colorMode(HSB, 360, 100, 100);
}

function draw() {
  // render into pg at lower res
  pg.loadPixels();
  for (let x = 0; x < pg.width; x++) {
    for (let y = 0; y < pg.height; y++) {
      let n = noise(
        x * params.noiseScale * params.downsample,
        y * params.noiseScale * params.downsample,
        t
      );

      // palette index and blend factor
      let idxF = n * (activePalette.length - 1);
      let i    = floor(idxF);
      let tt   = idxF - i;

      // clamp upper index
      let c1 = activePalette[i];
      let c2 = activePalette[min(i + 1, activePalette.length - 1)];

      // smooth color between stops
      let col = lerpColor(c1, c2, tt);

      // optional extra shading for depth
      // let shade = map(n, 0, 1, 0.7, 1.0);
      // col = color(red(col)*shade, green(col)*shade, blue(col)*shade); // if using RGB mode

      let p = (x + y * pg.width) * 4;
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

// click to jump time
function mousePressed() {
  t = random(1000);
}

// keep buffer in sync with window size
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeBuffer();
}
