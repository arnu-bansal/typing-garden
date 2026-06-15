const VOWELS = new Set(['a','e','i','o','u','A','E','I','O','U']);

let plants = [];
let breaths = [];
let stats = { flowers: 0, vines: 0, breaths: 0 };

function setup() {
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(10, 26, 6);

  for (let b of breaths) b.update();
  breaths = breaths.filter(b => b.alive);

  for (let p of plants) {
    p.grow();
    p.draw();
  }
}

function keyPressed() {
  const k = key;

  if (k === 'Backspace') {
    plants.pop();
    return;
  }

  const x = random(60, width - 60);

  if (VOWELS.has(k)) {
    plants.push(new Flower(x));
    stats.flowers++;
  } else if (k === ' ') {
    breaths.push(new Breath(random(80, width - 80), random(height * 0.3, height - 80)));
    stats.breaths++;
  } else if (k.match(/^[a-zA-Z]$/)) {
    plants.push(new Vine(x));
    stats.vines++;
  }

  updateStats();
}

function updateStats() {
  document.getElementById('flowers').textContent = stats.flowers;
  document.getElementById('vines').textContent = stats.vines;
  document.getElementById('breaths').textContent = stats.breaths;
}

// --- Breath ---
class Breath {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 10 + random(20);
    this.alpha = 180;
    this.alive = true;
  }
  update() {
    this.r += 0.8;
    this.alpha -= 2.5;
    if (this.alpha <= 0) this.alive = false;
    noFill();
    stroke(144, 205, 151, this.alpha);
    strokeWeight(1.2);
    circle(this.x, this.y, this.r * 2);
  }
}

// --- Vine ---
class Vine {
  constructor(x) {
    this.x = x;
    this.baseY = height - 44;
    this.segments = [{ x, y: this.baseY }];
    this.angle = -HALF_PI + random(-0.5, 0.5);
    this.twist = random(-0.04, 0.04);
    this.targetLen = random(30, 90);
    this.grown = 0;
    this.color = random(['#3B6D11','#27500A','#639922','#97C459','#0F6E56']);
    this.leaves = [];
    this.waveOff = random(100);
  }

  grow() {
    if (this.grown >= this.targetLen) return;
    this.angle += this.twist + sin(this.grown * 0.15 + this.waveOff) * 0.03;
    const last = this.segments[this.segments.length - 1];
    this.segments.push({
      x: last.x + cos(this.angle) * 1.5,
      y: last.y + sin(this.angle) * 1.5
    });
    this.grown++;

    if (this.grown % 10 === 0) {
      const tip = this.segments[this.segments.length - 1];
      this.leaves.push({
        x: tip.x, y: tip.y,
        side: random() > 0.5 ? 1 : -1,
        angle: this.angle,
        size: random(5, 11),
        alpha: 0
      });
    }
  }

  draw() {
    if (this.segments.length < 2) return;
    const wave = sin(frameCount * 0.015 + this.waveOff) * 1.5;

    stroke(this.color);
    strokeWeight(1.8);
    noFill();
    beginShape();
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      curveVertex(s.x + wave * sin(i * 0.3), s.y);
    }
    endShape();

    for (let l of this.leaves) {
      if (l.alpha < 220) l.alpha += 6;
      push();
      translate(l.x + wave * 0.5, l.y);
      rotate(l.angle + l.side * 0.9);
      fill(this.color + 'cc');
      noStroke();
      ellipse(0, 0, l.size, l.size * 0.45);
      pop();
    }
  }
}

// --- Flower ---
class Flower {
  constructor(x) {
    this.x = x;
    this.baseY = height - 44;
    this.stemH = 0;
    this.targetStemH = random(40, 95);
    this.stemColor = '#3B6D11';
    this.petalColor = random(['#D4537E','#EF9F27','#63B3ED','#9F7AEA','#F687B3','#FC8181','#68D391']);
    this.petalCount = floor(random(5, 9));
    this.petalSize = random(7, 15);
    this.bloom = 0;
    this.waveOff = random(100);
    this.swayAmp = random(0.6, 1.4);
  }

  grow() {
    if (this.stemH < this.targetStemH) {
      this.stemH += 1.1;
    } else if (this.bloom < 1) {
      this.bloom = min(this.bloom + 0.03, 1);
    }
  }

  draw() {
    const sway = sin(frameCount * 0.02 + this.waveOff) * this.swayAmp;
    const tipX = this.x + sway * (this.stemH / this.targetStemH) * 4;
    const tipY = this.baseY - this.stemH;

    stroke(this.stemColor);
    strokeWeight(2);
    noFill();
    beginShape();
    curveVertex(this.x, this.baseY);
    curveVertex(this.x, this.baseY);
    curveVertex(this.x + sway * 2, (this.baseY + tipY) / 2);
    curveVertex(tipX, tipY);
    curveVertex(tipX, tipY);
    endShape();

    if (this.bloom > 0) {
      const sz = this.petalSize * this.bloom;
      for (let i = 0; i < this.petalCount; i++) {
        const a = (i / this.petalCount) * TWO_PI + frameCount * 0.005;
        push();
        translate(tipX, tipY);
        rotate(a);
        fill(this.petalColor + 'cc');
        noStroke();
        ellipse(0, -sz * 1.1, sz * 0.55, sz);
        pop();
      }
      fill('#FEF3C7');
      noStroke();
      circle(tipX, tipY, sz * 0.9 * this.bloom);
    }
  }
}