/**
 * AnimationEngine — Manages canvas rendering loop with smooth animations.
 */
import { stateManager } from '../core/StateManager.js';

export class AnimationEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.time = 0;
    this.running = false;
    this.renderers = [];

    // Path particle systems
    this.particles = {};

    // Transition animations
    this.transitions = [];

    // Toast notifications
    this.toasts = [];

    this._resize();
    window.addEventListener('resize', () => this._resize());

    stateManager.on('ruleTriggered', (changes) => {
      changes.forEach(c => {
        this.addToast(c.reason, c.isOpen ? 'success' : 'warning');
      });
    });
  }

  _resize() {
    const container = this.canvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    this.canvas.style.width = rect.width + 'px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  addRenderer(renderer) {
    this.renderers.push(renderer);
  }

  addToast(message, type = 'info') {
    this.toasts.push({
      message,
      type,
      createdAt: this.time,
      duration: 4000,
      opacity: 0,
    });
    // Keep max 5 toasts
    if (this.toasts.length > 5) this.toasts.shift();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this._lastTime = performance.now();
    this._loop();
  }

  stop() {
    this.running = false;
  }

  _loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = now - this._lastTime;
    this._lastTime = now;
    this.time += dt;

    this._render(dt);
    requestAnimationFrame(() => this._loop());
  }

  _render(dt) {
    const ctx = this.ctx;
    const w = this.canvas.width / window.devicePixelRatio;
    const h = this.canvas.height / window.devicePixelRatio;

    // Clear with gradient background
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#09090b');
    bg.addColorStop(1, '#121215');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Draw subtle grid
    this._drawGrid(ctx, w, h);

    // Render all registered renderers
    ctx.save();
    for (const renderer of this.renderers) {
      renderer.render(ctx, dt, this.time, w, h);
    }
    ctx.restore();

    // Draw toasts
    this._drawToasts(ctx, w, h);
  }

  _drawGrid(ctx, w, h) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  _drawToasts(ctx, w, h) {
    const now = this.time;
    this.toasts = this.toasts.filter(t => now - t.createdAt < t.duration);

    this.toasts.forEach((toast, i) => {
      const age = now - toast.createdAt;
      const fadeIn = Math.min(age / 300, 1);
      const fadeOut = age > toast.duration - 500 ? (toast.duration - age) / 500 : 1;
      const alpha = fadeIn * fadeOut;

      const y = h - 60 - i * 50;
      const x = w / 2;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '13px Inter, sans-serif';
      const tm = ctx.measureText(toast.message);
      const pw = tm.width + 30;
      const ph = 36;

      // Background
      ctx.fillStyle = toast.type === 'success' ? 'rgba(16, 185, 129, 0.9)' :
                      toast.type === 'warning' ? 'rgba(245, 158, 11, 0.9)' :
                      'rgba(59, 130, 246, 0.9)';
      const rx = x - pw / 2;
      ctx.beginPath();
      ctx.roundRect(rx, y - ph / 2, pw, ph, 8);
      ctx.fill();

      // Text
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(toast.message, x, y);

      ctx.restore();
    });
  }

  getCanvasCoords(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }
}
