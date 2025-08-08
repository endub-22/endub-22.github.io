// parameters object
const params = {
  noiseScale: 0.002,
  tSpeed:     0.02,
  octaves:    8,
  falloff:    0.3
};

let t = 0;  // time offset

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  frameRate(30);

  // initial noise settings
  noiseDetail(params.octaves, params.falloff);

  // build GUI
  const gui = new dat.GUI();
  gui.add(params, 'noiseScale', 0.0005, 0.01, 0.0001).name('Noise Scale');
  gui.add(params, 'tSpeed',     0.001,  0.1,  0.001).name('Time Speed');
  gui.add(params, 'octaves',    1,      16,   1)
     .name('Octaves')
     .onChange(v => noiseDetail(v, params.falloff));
  gui.add(params, 'falloff',    0,      1,    0.01)
     .name('Falloff')
     .onChange(v => noiseDetail(params.octaves, v));
}

function draw() {
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let n = noise(
        x * params.noiseScale,
        y * params.noiseScale,
        t
      );
      let h = map(n, 0, 1, 200, 320),
          s = map(n, 0, 1, 50,  100),
          b = map(n, 0, 1, 20,  100);
      let idx = (x + y * width) * 4;
      let c = color(h, s, b);
      pixels[idx  ] = red(c);
      pixels[idx+1] = green(c);
      pixels[idx+2] = blue(c);
      pixels[idx+3] = 255;
    }
  }
  updatePixels();

  // advance time so the noise “clouds” shift
  t += params.tSpeed;
}

// regenerate pattern on click
function mousePressed() {
  t = random(1000);
}

// handle resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
