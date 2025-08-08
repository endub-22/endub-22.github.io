let noiseScale = 0.005;
let t = 0;               // time offset
let tSpeed = 0.05;      // how fast the nebula “evolves”

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  colorMode(HSB, 360, 100, 100);
  frameRate(60);         // aim for smooth animation
  loop(); 
}

function draw() {
  console.log("draw frame, t =", t.toFixed(3));
  loadPixels();
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      // 3D noise: x, y, and evolving t
      let n = noise(x * noiseScale, y * noiseScale, t);
      let hue = map(n, 0, 1, 200, 320);
      let sat = map(n, 0, 1, 50, 100);
      let bri = map(n, 0, 1, 20, 100);
      let idx = (x + y * width) * 4;
      let col = color(hue, sat, bri);
      pixels[idx + 0] = red(col);
      pixels[idx + 1] = green(col);
      pixels[idx + 2] = blue(col);
      pixels[idx + 3] = 255;
    }
  }
  updatePixels();

  // advance time so the noise “clouds” shift
  t += tSpeed;
}

// regenerate pattern speed on click
function mousePressed() {
  t = random(1000);
}

// handle resize
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
