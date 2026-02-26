/* ============================================================
   BEYOND LIMITS — main.js
   Pure vanilla JS — no libraries, no frameworks.
   ============================================================ */

'use strict';

// ─── Utility ────────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const lerp  = (a, b, t)    => a + (b - a) * t;
const rand  = (lo, hi)     => lo + Math.random() * (hi - lo);
const randInt = (lo, hi)   => Math.floor(rand(lo, hi + 1));
const TAU = Math.PI * 2;

// ─── Nav ────────────────────────────────────────────────────────────────────
(function initNav() {
  const btn = $('#menu-toggle');
  const links = $('.nav-links');
  btn.addEventListener('click', () => links.classList.toggle('open'));
  links.addEventListener('click', () => links.classList.remove('open'));
})();

// ─── Scroll Reveal ──────────────────────────────────────────────────────────
(function initScrollReveal() {
  const io = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
    { threshold: 0.15 }
  );
  $$('.reveal').forEach(el => io.observe(el));
})();

// ─────────────────────────────────────────────────────────────────────────────
// HERO CANVAS — starfield
// ─────────────────────────────────────────────────────────────────────────────
(function initHeroCanvas() {
  const canvas = $('#hero-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, stars;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    stars = Array.from({ length: 160 }, () => ({
      x: rand(0, W), y: rand(0, H),
      r: rand(0.5, 2.5),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.15, 0.15),
      alpha: rand(0.3, 1),
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(200,180,255,${s.alpha})`;
      ctx.fill();
      s.x = (s.x + s.vx + W) % W;
      s.y = (s.y + s.vy + H) % H;
      s.alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(Date.now() * 0.001 + s.x));
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE NETWORK
// ─────────────────────────────────────────────────────────────────────────────
(function initParticles() {
  const canvas   = $('#particle-canvas');
  const ctx      = canvas.getContext('2d');
  const cntInput = $('#particle-count');
  const spdInput = $('#particle-speed');
  const dstInput = $('#particle-dist');
  const resetBtn = $('#particle-reset');

  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  let animId;

  function getCount() { return +cntInput.value; }
  function getSpeed() { return +spdInput.value * 0.4; }
  function getDist()  { return +dstInput.value; }

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight  || 500;
  }

  function makeParticle() {
    const angle = rand(0, TAU);
    const speed = getSpeed();
    return {
      x: rand(0, W), y: rand(0, H),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: rand(2, 4),
      hue: randInt(180, 320),
    };
  }

  function reset() {
    particles = Array.from({ length: getCount() }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const dist = getDist();
    const spd  = getSpeed();

    // Adjust particle count smoothly
    while (particles.length < getCount()) particles.push(makeParticle());
    while (particles.length > getCount()) particles.pop();

    // Update
    particles.forEach(p => {
      // Mouse repulsion
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 8000) {
        const force = (8000 - d2) / 8000 * 1.5;
        p.vx += (dx / Math.sqrt(d2 || 1)) * force * 0.2;
        p.vy += (dy / Math.sqrt(d2 || 1)) * force * 0.2;
      }

      // Speed limit
      const spd2 = Math.hypot(p.vx, p.vy);
      const maxSpd = spd * 2;
      if (spd2 > maxSpd) { p.vx *= maxSpd / spd2; p.vy *= maxSpd / spd2; }
      if (spd2 < spd * 0.5) {
        const factor = spd / spd2;
        p.vx *= factor;
        p.vy *= factor;
      }

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x += W; if (p.x > W) p.x -= W;
      if (p.y < 0) p.y += H; if (p.y > H) p.y -= H;

      // Draw dot
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, TAU);
      ctx.fillStyle = `hsl(${p.hue},80%,65%)`;
      ctx.fill();
    });

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < dist) {
          const alpha = (1 - d / dist) * 0.6;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(120,160,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  canvas.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left) * (W / r.width);
    mouse.y = (e.clientY - r.top)  * (H / r.height);
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  canvas.addEventListener('touchmove', e => {
    const r = canvas.getBoundingClientRect();
    const t = e.touches[0];
    mouse.x = (t.clientX - r.left) * (W / r.width);
    mouse.y = (t.clientY - r.top)  * (H / r.height);
    e.preventDefault();
  }, { passive: false });

  resetBtn.addEventListener('click', reset);

  window.addEventListener('resize', () => { resize(); reset(); });
  resize();
  reset();
  draw();
})();

// ─────────────────────────────────────────────────────────────────────────────
// CSS 3D CUBE
// ─────────────────────────────────────────────────────────────────────────────
(function initCube() {
  const cube = $('#css-cube');
  const autoBtn = $('#auto-rotate-btn');
  let autoRotate = true;
  let rx = -20, ry = 0;

  autoBtn.addEventListener('click', () => {
    autoRotate = !autoRotate;
    autoBtn.textContent = `Auto-Rotate: ${autoRotate ? 'ON' : 'OFF'}`;
    cube.classList.toggle('paused', !autoRotate);
  });

  $$('.scene-btn[data-axis]').forEach(btn => {
    btn.addEventListener('click', () => {
      const axis = btn.dataset.axis;
      // Apply a 90-deg snap
      cube.style.animation = 'none';
      if (axis === 'x') rx += 90;
      if (axis === 'y') ry += 90;
      if (axis === 'z') { rx += 90; ry += 90; }
      cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
  });
})();

// ─────────────────────────────────────────────────────────────────────────────
// GENERATIVE ART ENGINE
// ─────────────────────────────────────────────────────────────────────────────
(function initArt() {
  const canvas  = $('#art-canvas');
  const ctx     = canvas.getContext('2d');
  const regenBtn = $('#art-regen');
  const saveBtn  = $('#art-save');
  const styleEl  = $('#art-style');

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight || 500;
  }

  // ── Lissajous ──
  function drawLissajous() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const a  = randInt(1, 5), b = randInt(1, 5);
    const delta = rand(0, Math.PI);
    const R = Math.min(W, H) * 0.42;
    const steps = 4000;
    const hue = randInt(180, 360);

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU * (lcm(a, b));
      const x = cx + R * Math.sin(a * t + delta);
      const y = cy + R * Math.sin(b * t);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${hue},80%,60%)`;
    ctx.lineWidth = 1.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = `hsl(${hue},80%,50%)`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }
  function lcm(a, b) { return (a * b) / gcd(a, b); }

  // ── Spirograph ──
  function drawSpirograph() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.38;
    const r = rand(R * 0.2, R * 0.5);
    const d = rand(r * 0.3, r * 1.2);
    const steps = 6000;
    const hue = randInt(0, 360);

    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * TAU * 50;
      const x = cx + (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t);
      const y = cy + (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.strokeStyle = `hsl(${hue},85%,65%)`;
    ctx.lineWidth = 1;
    ctx.shadowBlur = 6;
    ctx.shadowColor = `hsl(${hue + 40},80%,50%)`;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Mandala ──
  function drawMandala() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2;
    const folds = randInt(5, 12);
    const layers = randInt(3, 7);
    const R = Math.min(W, H) * 0.42;

    for (let l = 0; l < layers; l++) {
      const r0 = (R / layers) * l;
      const r1 = (R / layers) * (l + 1);
      const hue = (l / layers) * 300 + randInt(0, 60);

      for (let f = 0; f < folds; f++) {
        const angleStep = TAU / folds;
        const baseAngle = f * angleStep;

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(baseAngle);

        ctx.beginPath();
        ctx.moveTo(0, r0);
        ctx.bezierCurveTo(
          r1 * 0.5, r0 + (r1 - r0) * 0.3,
          r1 * 0.5, r0 + (r1 - r0) * 0.7,
          0, r1
        );
        ctx.bezierCurveTo(
          -r1 * 0.5, r0 + (r1 - r0) * 0.7,
          -r1 * 0.5, r0 + (r1 - r0) * 0.3,
          0, r0
        );
        ctx.closePath();
        ctx.fillStyle = `hsla(${hue},75%,55%,0.15)`;
        ctx.strokeStyle = `hsl(${hue},80%,65%)`;
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // ── Wave Field ──
  function drawWave() {
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#0a0a18';
    ctx.fillRect(0, 0, W, H);

    const rows = 40, freq = rand(0.01, 0.04), amp = rand(20, 60);
    const hueStart = randInt(160, 280);

    for (let row = 0; row <= rows; row++) {
      const y0 = (H / rows) * row;
      const hue = hueStart + (row / rows) * 80;

      ctx.beginPath();
      for (let x = 0; x <= W; x += 2) {
        const phase = row * 0.4;
        const y = y0 + Math.sin(x * freq + phase) * amp * Math.sin(row * 0.3);
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `hsla(${hue},80%,60%,0.5)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  function regen() {
    resize();
    const style = styleEl.value;
    if (style === 'lissajous')  drawLissajous();
    else if (style === 'spirograph') drawSpirograph();
    else if (style === 'mandala')    drawMandala();
    else                             drawWave();
  }

  function saveArt() {
    const a = document.createElement('a');
    a.download = `art-${Date.now()}.png`;
    a.href = canvas.toDataURL();
    a.click();
  }

  regenBtn.addEventListener('click', regen);
  saveBtn.addEventListener('click', saveArt);
  styleEl.addEventListener('change', regen);
  canvas.addEventListener('click', regen);
  window.addEventListener('resize', regen);

  resize();
  regen();
})();

// ─────────────────────────────────────────────────────────────────────────────
// WEB AUDIO SYNTHESIZER
// ─────────────────────────────────────────────────────────────────────────────
(function initSynth() {
  const piano    = $('#piano');
  const waveEl   = $('#wave-type');
  const reverbEl = $('#reverb');
  const gainEl   = $('#gain-ctrl');
  const oScope   = $('#oscilloscope');
  const scopeCtx = oScope.getContext('2d');

  let audioCtx, masterGain, reverbNode, analyser;
  const activeOscillators = new Map();

  // Note layout: C4..B4 + C5
  const notes = [
    { note: 'C4',  freq: 261.63, type: 'white', key: 'a' },
    { note: 'C#4', freq: 277.18, type: 'black', key: 'w' },
    { note: 'D4',  freq: 293.66, type: 'white', key: 's' },
    { note: 'D#4', freq: 311.13, type: 'black', key: 'e' },
    { note: 'E4',  freq: 329.63, type: 'white', key: 'd' },
    { note: 'F4',  freq: 349.23, type: 'white', key: 'f' },
    { note: 'F#4', freq: 369.99, type: 'black', key: 't' },
    { note: 'G4',  freq: 392.00, type: 'white', key: 'g' },
    { note: 'G#4', freq: 415.30, type: 'black', key: 'y' },
    { note: 'A4',  freq: 440.00, type: 'white', key: 'h' },
    { note: 'A#4', freq: 466.16, type: 'black', key: 'u' },
    { note: 'B4',  freq: 493.88, type: 'white', key: 'j' },
    { note: 'C5',  freq: 523.25, type: 'white', key: 'k' },
    { note: 'C#5', freq: 554.37, type: 'black', key: 'o' },
    { note: 'D5',  freq: 587.33, type: 'white', key: 'l' },
  ];

  // Keyboard map for fast lookup
  const keyMap = {};
  notes.forEach(n => { keyMap[n.key] = n; });

  function ensureAudio() {
    if (audioCtx) return;
    audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
    analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    masterGain = audioCtx.createGain();
    masterGain.gain.value = +gainEl.value;

    // Simple convolver reverb using white noise impulse
    reverbNode = audioCtx.createConvolver();
    const rate      = audioCtx.sampleRate;
    const length    = rate * 2;
    const impulse   = audioCtx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3);
      }
    }
    reverbNode.buffer = impulse;

    const dry = audioCtx.createGain();
    const wet = audioCtx.createGain();
    dry.gain.value = 1 - +reverbEl.value;
    wet.gain.value = +reverbEl.value;

    masterGain.connect(dry);
    masterGain.connect(reverbNode);
    reverbNode.connect(wet);
    dry.connect(analyser);
    wet.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Update reverb on slider
    reverbEl.addEventListener('input', () => {
      wet.gain.value = +reverbEl.value;
      dry.gain.value = 1 - +reverbEl.value;
    });
    gainEl.addEventListener('input', () => {
      masterGain.gain.value = +gainEl.value;
    });

    drawScope();
  }

  function playNote(freq) {
    ensureAudio();
    if (activeOscillators.has(freq)) return;
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = waveEl.value;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 0.01);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start();
    activeOscillators.set(freq, { osc, gain });
  }

  function stopNote(freq) {
    if (!activeOscillators.has(freq)) return;
    const { osc, gain } = activeOscillators.get(freq);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
    osc.stop(audioCtx.currentTime + 0.15);
    activeOscillators.delete(freq);
  }

  // Build piano keys
  notes.forEach(n => {
    const el = document.createElement('div');
    el.className = `key ${n.type}`;
    el.dataset.freq = n.freq;
    el.dataset.note = n.note;
    el.innerHTML = `<span>${n.key.toUpperCase()}</span>`;

    el.addEventListener('mousedown',  () => { playNote(n.freq); el.classList.add('active'); });
    el.addEventListener('mouseup',    () => { stopNote(n.freq); el.classList.remove('active'); });
    el.addEventListener('mouseleave', () => { stopNote(n.freq); el.classList.remove('active'); });
    el.addEventListener('touchstart', e => { e.preventDefault(); playNote(n.freq); el.classList.add('active'); }, { passive: false });
    el.addEventListener('touchend',   () => { stopNote(n.freq); el.classList.remove('active'); });
    piano.appendChild(el);
  });

  // Keyboard input
  const pressedKeys = new Set();
  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    const n = keyMap[e.key.toLowerCase()];
    if (!n) return;
    pressedKeys.add(e.key.toLowerCase());
    playNote(n.freq);
    const el = piano.querySelector(`[data-note="${n.note}"]`);
    if (el) el.classList.add('active');
  });
  document.addEventListener('keyup', e => {
    const n = keyMap[e.key.toLowerCase()];
    if (!n) return;
    pressedKeys.delete(e.key.toLowerCase());
    stopNote(n.freq);
    const el = piano.querySelector(`[data-note="${n.note}"]`);
    if (el) el.classList.remove('active');
  });

  // Oscilloscope
  function drawScope() {
    const W = oScope.width  = oScope.offsetWidth;
    const H = oScope.height = oScope.offsetHeight || 80;
    const data = new Uint8Array(analyser.fftSize);

    function loop() {
      requestAnimationFrame(loop);
      analyser.getByteTimeDomainData(data);
      scopeCtx.fillStyle = 'rgba(10,10,24,0.5)';
      scopeCtx.fillRect(0, 0, W, H);
      scopeCtx.beginPath();
      const sliceW = W / data.length;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = data[i] / 128;
        const y = (v * H) / 2;
        i === 0 ? scopeCtx.moveTo(x, y) : scopeCtx.lineTo(x, y);
        x += sliceW;
      }
      scopeCtx.strokeStyle = '#06b6d4';
      scopeCtx.lineWidth = 2;
      scopeCtx.stroke();
    }
    loop();
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// WEBGL SHADER PLAYGROUND
// ─────────────────────────────────────────────────────────────────────────────
(function initWebGL() {
  const canvas     = $('#webgl-canvas');
  const presetEl   = $('#shader-preset');
  const speedEl    = $('#shader-speed');

  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) {
    canvas.parentElement.insertAdjacentHTML('afterbegin',
      '<p style="padding:1rem;color:#f59e0b">WebGL is not supported in this browser.</p>');
    return;
  }

  // ── Vertex shader (shared) ──
  const vsSource = `
    attribute vec2 a_pos;
    void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
  `;

  // ── Fragment shaders ──
  const SHADERS = {
    plasma: `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      void main() {
        vec2 uv = gl_FragCoord.xy / u_res;
        float t = u_time * 0.6;
        float v = sin(uv.x * 8.0 + t) + sin(uv.y * 8.0 + t)
                + sin((uv.x + uv.y) * 6.0 + t)
                + sin(sqrt(pow(uv.x - 0.5, 2.0) + pow(uv.y - 0.5, 2.0)) * 14.0 - t);
        gl_FragColor = vec4(
          0.5 + 0.5 * sin(v + 0.0),
          0.5 + 0.5 * sin(v + 2.094),
          0.5 + 0.5 * sin(v + 4.189),
          1.0
        );
      }
    `,
    tunnel: `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res - 0.5) * 2.0;
        float r  = length(uv);
        float a  = atan(uv.y, uv.x);
        float t  = u_time * 0.5;
        float tx = 0.3 / (r + 0.05) + t;
        float ty = a / 3.14159;
        float c  = sin(tx * 10.0) * cos(ty * 10.0);
        float brightness = 1.0 - r;
        gl_FragColor = vec4(
          0.5 + 0.5 * sin(c + t),
          0.5 + 0.5 * sin(c + t + 2.0),
          0.5 + 0.5 * sin(c + t + 4.0),
          1.0
        ) * brightness;
      }
    `,
    fractal: `
      precision mediump float;
      uniform float u_time;
      uniform vec2  u_res;
      void main() {
        vec2 uv = (gl_FragCoord.xy / u_res - 0.5) * 3.5;
        vec2 c  = vec2(-0.7 + sin(u_time * 0.15) * 0.3, 0.27 + cos(u_time * 0.1) * 0.15);
        vec2 z  = uv;
        float i;
        for (i = 0.0; i < 80.0; i++) {
          z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
          if (dot(z, z) > 4.0) break;
        }
        float t = i / 80.0;
        gl_FragColor = vec4(
          0.5 + 0.5 * cos(6.28 * t + 0.0),
          0.5 + 0.5 * cos(6.28 * t + 2.1),
          0.5 + 0.5 * cos(6.28 * t + 4.2),
          1.0
        );
      }
    `,
  };

  // ── Shader compilation helpers ──
  function createShader(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  }

  function createProgram(fsSrc) {
    const prog = gl.createProgram();
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fsSrc));
    gl.linkProgram(prog);
    return prog;
  }

  // Build all programs up front
  const programs = {};
  Object.keys(SHADERS).forEach(k => { programs[k] = createProgram(SHADERS[k]); });

  // Full-screen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

  let startTime = performance.now();

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight || 500;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render() {
    const preset = presetEl.value;
    const speed  = +speedEl.value;
    const prog   = programs[preset];
    if (!prog) { requestAnimationFrame(render); return; }

    gl.useProgram(prog);

    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(gl.getUniformLocation(prog, 'u_time'), (performance.now() - startTime) / 1000 * speed);
    gl.uniform2f(gl.getUniformLocation(prog, 'u_res'),  canvas.width, canvas.height);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(render);
  }

  window.addEventListener('resize', resize);
  resize();
  render();
})();

// ─────────────────────────────────────────────────────────────────────────────
(function initPhysics() {
  const canvas     = $('#physics-canvas');
  const ctx        = canvas.getContext('2d');
  const clearBtn   = $('#phys-clear');
  const gravEl     = $('#gravity-ctrl');
  const bounceEl   = $('#bounce-ctrl');
  const shapeEl    = $('#shape-select');

  let W, H, bodies = [];
  const COLORS = ['#7c3aed','#06b6d4','#f59e0b','#10b981','#ef4444','#8b5cf6'];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight || 500;
  }

  function addBody(x, y) {
    const shape = shapeEl.value;
    const size  = rand(18, 40);
    bodies.push({
      x, y, vx: rand(-3, 3), vy: rand(-5, 0),
      size, shape,
      color: COLORS[randInt(0, COLORS.length - 1)],
      angle: rand(0, TAU), av: rand(-0.1, 0.1),
    });
  }

  // Draw shapes
  function drawCircle(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.size, 0, TAU);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  function drawRect(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    const s = b.size;
    ctx.fillStyle = b.color;
    ctx.fillRect(-s, -s * 0.7, s * 2, s * 1.4);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s, -s * 0.7, s * 2, s * 1.4);
    ctx.restore();
  }

  function drawTriangle(b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);
    const s = b.size;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s, s);
    ctx.lineTo(-s, s);
    ctx.closePath();
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  function simulate() {
    const grav    = +gravEl.value * 0.5;
    const bounce  = +bounceEl.value;

    // Background
    ctx.fillStyle = 'rgba(10,10,24,0.25)';
    ctx.fillRect(0, 0, W, H);

    // Floor/Wall grid lines for visual depth
    ctx.strokeStyle = 'rgba(50,50,100,0.3)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < W; gx += 60) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += 60) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }

    bodies.forEach(b => {
      b.vy += grav;
      b.x  += b.vx;
      b.y  += b.vy;
      b.angle += b.av;

      const r = b.size;
      // Walls
      if (b.x - r < 0)   { b.x = r;     b.vx = Math.abs(b.vx) * bounce; }
      if (b.x + r > W)   { b.x = W - r; b.vx = -Math.abs(b.vx) * bounce; }
      // Floor / ceiling
      if (b.y + r > H)   { b.y = H - r; b.vy = -Math.abs(b.vy) * bounce; b.vx *= 0.98; b.av *= 0.97; }
      if (b.y - r < 0)   { b.y = r;     b.vy = Math.abs(b.vy) * bounce; }

      // Body-body collision (circle approximation for simplicity)
      bodies.forEach(o => {
        if (o === b) return;
        const dx = o.x - b.x, dy = o.y - b.y;
        const dist = Math.hypot(dx, dy);
        const minD = b.size + o.size;
        if (dist < minD && dist > 0.1) {
          const nx = dx / dist, ny = dy / dist;
          const overlap = (minD - dist) / 2;
          b.x -= nx * overlap; b.y -= ny * overlap;
          o.x += nx * overlap; o.y += ny * overlap;
          const relV = (b.vx - o.vx) * nx + (b.vy - o.vy) * ny;
          if (relV > 0) {
            const imp = relV * bounce;
            b.vx -= imp * nx; b.vy -= imp * ny;
            o.vx += imp * nx; o.vy += imp * ny;
          }
        }
      });

      if (b.shape === 'circle')   drawCircle(b);
      else if (b.shape === 'rect') drawRect(b);
      else                         drawTriangle(b);
    });

    requestAnimationFrame(simulate);
  }

  function getCanvasPoint(e) {
    const r = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - r.left) * (W / r.width),
      y: (clientY - r.top)  * (H / r.height),
    };
  }

  canvas.addEventListener('click',     e => { const p = getCanvasPoint(e); addBody(p.x, p.y); });
  canvas.addEventListener('touchstart', e => { e.preventDefault(); const p = getCanvasPoint(e); addBody(p.x, p.y); }, { passive: false });
  clearBtn.addEventListener('click', () => { bodies = []; });

  window.addEventListener('resize', resize);
  resize();

  // Seed a few bodies
  for (let i = 0; i < 6; i++) addBody(rand(60, W - 60), rand(60, H / 2));

  simulate();
})();
