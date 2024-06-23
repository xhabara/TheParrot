let mic;
let filter;
let delay;
let toggleButton;
let delaySlider;
let feedbackSlider;
let autoButton;
let autoDelayButton;
let isAudioOn = true;
let autoMode = false;
let autoDelayMode = false;
let autoX, autoY;
let pAutoX, pAutoY;
let font;
let particles = [];
let autoTime = 0;
let autoSpeed = 0.05;
let lastAutoDelayChange = 0;

function preload() {
  font = loadFont('https://cdnjs.cloudflare.com/ajax/libs/topcoat/0.8.0/font/SourceCodePro-Bold.otf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont(font);
  
  // Initialize auto cursor position
  autoX = width / 2;
  autoY = height / 2;
  pAutoX = autoX;
  pAutoY = autoY;
  
  // Create an audio input and start it
  mic = new p5.AudioIn();
  mic.start();
  
  // Create a low-pass filter
  filter = new p5.LowPass();
  
  // Create a delay
  delay = new p5.Delay();
  
  // Connect the mic to the filter
  mic.connect(filter);
  
  // Disconnect filter to prevent feedback and connect to delay
  filter.disconnect();
  delay.process(filter, 0.12, 0.7, 2300);
  
  // Create UI elements
  createUIElements();
}

function draw() {
  background(0, 20);
  
  let currentX, currentY;
  
  if (autoMode) {
    pAutoX = autoX;
    pAutoY = autoY;
    updateAutoPosition();
    currentX = autoX;
    currentY = autoY;
  } else {
    currentX = mouseX;
    currentY = mouseY;
  }
  
  // Get the overall volume (between 0 and 1.0)
  let vol = mic.getLevel();
  
  // Change the frequency of the filter based on current X position
  let freq = map(currentX, 0, width, 40, 15000);
  
  // Change the resonance of the filter based on current Y position
  let res = map(currentY, 0, height, 4, 80);
  
  // Set the filter parameters
  filter.set(freq, res);
  
  // Update the delay time and feedback based on the slider values
  let delayTime = delaySlider.value();
  let feedback = feedbackSlider.value();
  
  if (autoDelayMode) {
    delayTime = updateAutoDelay();
  }
  
  delay.delayTime(delayTime);
  delay.feedback(feedback);
  
  // Visualize sound
  drawWaveform(vol);
  createParticles(currentX, currentY, vol);
  updateAndDrawParticles();
  
  // Draw UI text
  drawUIText(vol, freq, res, delayTime, feedback);
  
  // Draw auto-hack cursor
  if (autoMode) {
    drawAutoCursor();
  }
}

function updateAutoPosition() {
  autoTime += autoSpeed;
  
  // Create a more dynamic and unpredictable movement pattern
  let noiseX = noise(autoTime * 0.3);
  let noiseY = noise(autoTime * 0.3 + 1000);
  
  // Map noise values to the entire canvas
  autoX = map(noiseX, 0, 1, 0, width);
  autoY = map(noiseY, 0, 1, 0, height);
  
  // Add some rapid, small movements
  autoX += sin(autoTime * 5) * 20;
  autoY += cos(autoTime * 7) * 20;
  
  // Ensure the position stays within the canvas
  autoX = constrain(autoX, 0, width);
  autoY = constrain(autoY, 0, height);
  
  // Occasionally make large jumps
  if (random(1) < 0.005) { // 0.5% chance each frame
    autoX = random(width);
    autoY = random(height);
  }
}

function drawAutoCursor() {
  push();
  stroke(0, 255, 0);
  noFill();
  ellipse(autoX, autoY, 20, 20);
  line(autoX - 15, autoY, autoX + 15, autoY);
  line(autoX, autoY - 15, autoX, autoY + 15);
  
  // Add a trailing effect
  for (let i = 0; i < 5; i++) {
    let trailX = lerp(autoX, pAutoX, (i + 1) / 5);
    let trailY = lerp(autoY, pAutoY, (i + 1) / 5);
    stroke(0, 255, 0, 150 - i * 30);
    ellipse(trailX, trailY, 20 - i * 3);
  }
  pop();
}

function createUIElements() {
  toggleButton = createButton('PANIC BUTTON!');
  toggleButton.position(20, 20);
  toggleButton.mousePressed(toggleAudio);
  toggleButton.class('hacker-button');
  
  delaySlider = createSlider(0, 1, 0.5, 0.01);
  delaySlider.position(20, 80);
  delaySlider.class('hacker-slider');
  
  feedbackSlider = createSlider(0, 0.9, 0.6, 0.01);
  feedbackSlider.position(20, 100);
  feedbackSlider.class('hacker-slider');
  
  autoButton = createButton('XHABARABOT MODE');
  autoButton.position(20, 140);
  autoButton.mousePressed(toggleAutoMode);
  autoButton.class('hacker-button');
  
  autoDelayButton = createButton('AUTO DELAY');
  autoDelayButton.position(180, 140);
  autoDelayButton.mousePressed(toggleAutoDelay);
  autoDelayButton.class('hacker-button');
}

function drawWaveform(vol) {
  stroke(0, 255, 0);
  noFill();
  beginShape();
  for (let i = 0; i < width; i++) {
    let x = i;
    let y = height / 2 + sin(i * 0.01 + frameCount * 0.1) * height / 4 * vol;
    vertex(x, y);
  }
  endShape();
}

function createParticles(x, y, vol) {
  if (frameCount % 3 === 0) {  // Increased particle creation rate
    let angle = random(TWO_PI);
    let radius = random(20, 50);  // Particles appear within 20-50 pixels of the cursor
    let px = x + cos(angle) * radius;
    let py = y + sin(angle) * radius;
    particles.push(new Particle(px, py, vol));
  }
}

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].display();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
}

function drawUIText(vol, freq, res, delayTime, feedback) {
  fill(0, 255, 0);
  textSize(14);
  text(`Volume: ${nf(vol, 1, 2)}`, 180, 35);
  text(`Frequency: ${nf(freq, 0, 0)} Hz`, 180, 55);
  text(`Resonance: ${nf(res, 1, 1)}`, 180, 75);
  text(`Delay: ${nf(delayTime, 1, 2)}`, 180, 95);
  text(`Feedback: ${nf(feedback, 1, 2)}`, 180, 115);
  
  if (autoMode) {
    text("XHABARABOT ENGAGED", width - 200, 30);
  }
  if (autoDelayMode) {
    text("AUTO DELAY ACTIVE", width - 200, 50);
  }
}

function toggleAudio() {
  if (isAudioOn) {
    mic.disconnect();
    filter.disconnect();
    delay.disconnect();
    console.log('System terminated. Silence reigns.');
  } else {
    mic.connect(filter);
    filter.disconnect();
    delay.process(filter, 0.12, 0.7, 2300);
    console.log('System initiated. Prepare for sonic assault.');
  }
  isAudioOn = !isAudioOn;
}

function toggleAutoMode() {
  autoMode = !autoMode;
  console.log(autoMode ? "XHABARABOT ENGAGED. Surrendering control to the machine." : "XHABARABOT DISENGAGED. Manual override activated.");
}

function toggleAutoDelay() {
  autoDelayMode = !autoDelayMode;
  console.log(autoDelayMode ? "AUTO DELAY ACTIVATED. Temporal flux initiated." : "AUTO DELAY DEACTIVATED. Temporal stability restored.");
}

function updateAutoDelay() {
  if (millis() - lastAutoDelayChange > 500) {  // Change every 500ms
    delaySlider.value(random(0, 1));
    lastAutoDelayChange = millis();
  }
  return delaySlider.value();
}

class Particle {
  constructor(x, y, vol) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(1, 3));  // Reduced velocity for more localized effect
    this.acc = createVector(0, 0);
    this.life = 255;
    this.size = map(vol, 0, 1, 2, 8);  // Slightly reduced max size
  }
  
  update() {
    this.vel.add(this.acc);
    this.pos.add(this.vel);
    this.life -= 8;  // Faster fade out
  }
  
  display() {
    noStroke();
    fill(0, 255, 0, this.life);
    ellipse(this.pos.x, this.pos.y, this.size);
  }
  
  isDead() {
    return this.life < 0;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}