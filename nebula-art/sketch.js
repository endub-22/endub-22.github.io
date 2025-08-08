let noiseScale = 0.005;

function setup() {
  console.log("🔧 setup() running");
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  noLoop();
}

function draw() {
  console.log("🎨 draw() running");
  background(0);               // fill screen black so we see something
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let n = noise(x * noiseScale, y * noiseScale);
      // map noise to a colorful palette
      let hue = map(n, 0, 1, 200, 320);  // tweak these
      let sat = map(n, 0, 1, 50, 100);
      let bri = map(n, 0, 1, 20, 100);
      let col = color(hue, sat, bri);
      pixels[(x + y * width) * 4 + 0] = red(col);
      pixels[(x + y * width) * 4 + 1] = green(col);
      pixels[(x + y * width) * 4 + 2] = blue(col);
      pixels[(x + y * width) * 4 + 3] = 255;
    }
  }
  updatePixels();
}

// regenerate on click
function mousePressed() {
  noiseSeed(floor(random(10000)));
  redraw();
}

// full-screen on resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}
