// parameters object
const params = {
  noiseScale: 0.002,
  tSpeed:     0.02,
  octaves:    8,
  falloff:    0.3,
  downsample: 6
};

let t = 0;  // time offset

let pg;

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

  const gui = new dat.GUI();
  gui.add(params, 'noiseScale', 0.0005, 0.01, 0.0001);
  gui.add(params, 'tSpeed',     0.001,  0.1,  0.001);
  gui.add(params, 'octaves', 1, 16, 1)
   .name('Octaves')
   .onChange(v => noiseDetail(v, params.falloff));
  gui.add(params, 'falloff', 0, 1, 0.01)
   .name('Falloff')
   .onChange(v => noiseDetail(params.octaves, v));
  gui.add(params, 'downsample', 1,      8,    1)
     .name('Downsample')
     .onChange(_ => {
  params.downsample = constrain(params.downsample, 1, 8);
  resizeBuffer();
});
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
      let h = map(n, 0, 1, 200, 320),
          s = map(n, 0, 1, 50,  100),
          b = map(n, 0, 1, 20,  100);
      let idx = (x + y * pg.width) * 4;
      let c = pg.color(h, s, b);
      pg.pixels[idx  ] = red(c);
      pg.pixels[idx+1] = green(c);
      pg.pixels[idx+2] = blue(c);
      pg.pixels[idx+3] = 255;
    }
  }
  pg.updatePixels();

  // draw the buffer stretched to full size
  image(pg, 0, 0, width, height);

  t += params.tSpeed;
}

// regenerate pattern on click
function mousePressed() {
  t = random(1000);
}

// handle resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resizeBuffer();
}
