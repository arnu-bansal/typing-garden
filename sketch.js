
const VOWELS = new Set(['a','e','i','o','u','A','E','I','O','U']);

const COLORS = {
  vine:   ['#3B6D11','#27500A','#639922','#97C459','#0F6E56'],
  petal:  ['#D4537E','#EF9F27','#63B3ED','#9F7AEA','#F687B3','#FC8181','#68D391'],
  stem:   '#3B6D11',
  center: '#FEF3C7',
  breath: [144, 205, 151],
  bg:     [10, 26, 6],
};

const CONFIG = {
  vine: {
    minLength: 30,
    maxLength: 90,
    segmentStep: 1.5,
    leafEvery: 10,
    leafMinSize: 5,
    leafMaxSize: 11,
    growthAngleNoise: 0.03,
    twistRange: 0.04,
    sway: { speed: 0.015, amp: 1.5 },
  },
  flower: {
    minStemH: 40,
    maxStemH: 95,
    minPetals: 5,
    maxPetals: 9,
    minPetalSize: 7,
    maxPetalSize: 15,
    growthRate: 1.1,
    bloomRate: 0.03,
    sway: { speed: 0.02, minAmp: 0.6, maxAmp: 1.4 },
    rotationSpeed: 0.005,
  },
  breath: {
    minRadius: 10,
    extraRadius: 20,
    expandRate: 0.8,
    fadeRate: 2.5,
    startAlpha: 180,
    strokeWeight: 1.2,
  },
};

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  plants: [],
  breaths: [],
  stats: { flowers: 0, vines: 0, breaths: 0 },
};

// ─── p5 lifecycle ─────────────────────────────────────────────────────────────

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('canvas-container');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(...COLORS.bg);
  updateBreaths();
  updatePlants();
}

// ─── Input ────────────────────────────────────────────────────────────────────

function keyPressed() {
  if (key === 'Backspace') {
    state.plants.pop();
    return;
  }

  if (key === ' ') {
    spawnBreath();
    return;
  }

  if (/^[a-zA-Z]$/.test(key)) {
    spawnPlant(key);
  }
}

function spawnPlant(k) {
  const x = random(60, width - 60);

  if (VOWELS.has(k)) {
    state.plants.push(new Flower(x));
    state.stats.flowers++;
  } else {
    state.plants.push(new Vine(x));
    state.stats.vines++;
  }

  updateStatsDisplay();
}

function spawnBreath() {
  const x = random(80, width - 80);
  const y = random(height * 0.3, height - 80);
  state.breaths.push(new Breath(x, y));
  state.stats.breaths++;
  updateStatsDisplay();
}

// ─── Update loops ─────────────────────────────────────────────────────────────

function updateBreaths() {
  for (const b of state.breaths) b.update();
  state.breaths = state.breaths.filter(b => b.alive);
}

function updatePlants() {
  for (const p of state.plants) {
    p.grow();
    p.draw();
  }
}

// ─── DOM ──────────────────────────────────────────────────────────────────────

function updateStatsDisplay() {
  document.getElementById('flowers').textContent = state.stats.flowers;
  document.getElementById('vines').textContent   = state.stats.vines;
  document.getElementById('breaths').textContent = state.stats.breaths;
}

// ─── Breath ───────────────────────────────────────────────────────────────────

class Breath {
  constructor(x, y) {
    this.x     = x;
    this.y     = y;
    this.r     = CONFIG.breath.minRadius + random(CONFIG.breath.extraRadius);
    this.alpha = CONFIG.breath.startAlpha;
    this.alive = true;
  }

  update() {
    this.r     += CONFIG.breath.expandRate;
    this.alpha -= CONFIG.breath.fadeRate;

    if (this.alpha <= 0) {
      this.alive = false;
      return;
    }

    this._draw();
  }

  _draw() {
    noFill();
    stroke(...COLORS.breath, this.alpha);
    strokeWeight(CONFIG.breath.strokeWeight);
    circle(this.x, this.y, this.r * 2);
  }
}

// ─── Vine ─────────────────────────────────────────────────────────────────────

class Vine {
  constructor(x) {
    const cfg = CONFIG.vine;
    this.baseY    = height - 44;
    this.segments = [{ x, y: this.baseY }];
    this.angle    = -HALF_PI + random(-0.5, 0.5);
    this.twist    = random(-cfg.twistRange, cfg.twistRange);
    this.targetLen = random(cfg.minLength, cfg.maxLength);
    this.grown    = 0;
    this.color    = random(COLORS.vine);
    this.leaves   = [];
    this.waveOff  = random(100);
  }

  grow() {
    if (this.grown >= this.targetLen) return;

    const cfg  = CONFIG.vine;
    const last = this.segments[this.segments.length - 1];

    this.angle += this.twist + sin(this.grown * 0.15 + this.waveOff) * cfg.growthAngleNoise;

    this.segments.push({
      x: last.x + cos(this.angle) * cfg.segmentStep,
      y: last.y + sin(this.angle) * cfg.segmentStep,
    });

    this.grown++;

    if (this.grown % cfg.leafEvery === 0) {
      this._spawnLeaf();
    }
  }

  _spawnLeaf() {
    const cfg = CONFIG.vine;
    const tip = this.segments[this.segments.length - 1];
    this.leaves.push({
      x:     tip.x,
      y:     tip.y,
      side:  random() > 0.5 ? 1 : -1,
      angle: this.angle,
      size:  random(cfg.leafMinSize, cfg.leafMaxSize),
      alpha: 0,
    });
  }

  draw() {
    if (this.segments.length < 2) return;

    const { speed, amp } = CONFIG.vine.sway;
    const wave = sin(frameCount * speed + this.waveOff) * amp;

    this._drawStem(wave);
    this._drawLeaves(wave);
  }

  _drawStem(wave) {
    stroke(this.color);
    strokeWeight(1.8);
    noFill();
    beginShape();
    for (let i = 0; i < this.segments.length; i++) {
      const s = this.segments[i];
      curveVertex(s.x + wave * sin(i * 0.3), s.y);
    }
    endShape();
  }

  _drawLeaves(wave) {
    for (const l of this.leaves) {
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

// ─── Flower ───────────────────────────────────────────────────────────────────

class Flower {
  constructor(x) {
    const cfg = CONFIG.flower;
    this.x           = x;
    this.baseY       = height - 44;
    this.stemH       = 0;
    this.targetStemH = random(cfg.minStemH, cfg.maxStemH);
    this.petalColor  = random(COLORS.petal);
    this.petalCount  = floor(random(cfg.minPetals, cfg.maxPetals));
    this.petalSize   = random(cfg.minPetalSize, cfg.maxPetalSize);
    this.bloom       = 0;
    this.waveOff     = random(100);
    this.swayAmp     = random(cfg.sway.minAmp, cfg.sway.maxAmp);
  }

  grow() {
    const cfg = CONFIG.flower;
    if (this.stemH < this.targetStemH) {
      this.stemH += cfg.growthRate;
    } else {
      this.bloom = min(this.bloom + cfg.bloomRate, 1);
    }
  }

  draw() {
    const { x, y } = this._tipPosition();
    this._drawStem(x, y);
    if (this.bloom > 0) {
      this._drawPetals(x, y);
      this._drawCenter(x, y);
    }
  }

  _tipPosition() {
    const { speed } = CONFIG.flower.sway;
    const sway = sin(frameCount * speed + this.waveOff) * this.swayAmp;
    const progress = this.stemH / this.targetStemH;
    return {
      x: this.x + sway * progress * 4,
      y: this.baseY - this.stemH,
    };
  }

  _drawStem(tipX, tipY) {
    const { speed } = CONFIG.flower.sway;
    const sway = sin(frameCount * speed + this.waveOff) * this.swayAmp;

    stroke(COLORS.stem);
    strokeWeight(2);
    noFill();
    beginShape();
    curveVertex(this.x, this.baseY);
    curveVertex(this.x, this.baseY);
    curveVertex(this.x + sway * 2, (this.baseY + tipY) / 2);
    curveVertex(tipX, tipY);
    curveVertex(tipX, tipY);
    endShape();
  }

  _drawPetals(tipX, tipY) {
    const sz = this.petalSize * this.bloom;
    const rot = frameCount * CONFIG.flower.rotationSpeed;

    for (let i = 0; i < this.petalCount; i++) {
      const angle = (i / this.petalCount) * TWO_PI + rot;
      push();
      translate(tipX, tipY);
      rotate(angle);
      fill(this.petalColor + 'cc');
      noStroke();
      ellipse(0, -sz * 1.1, sz * 0.55, sz);
      pop();
    }
  }

  _drawCenter(tipX, tipY) {
    const sz = this.petalSize * this.bloom;
    fill(COLORS.center);
    noStroke();
    circle(tipX, tipY, sz * 0.9 * this.bloom);
  }
}