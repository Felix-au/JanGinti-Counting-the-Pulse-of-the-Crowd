/**
 * PathwayRenderer — Draws animated pathways between areas on the canvas.
 */
import { stateManager } from '../core/StateManager.js';

export class PathwayRenderer {
  constructor() {
    this.pathParticles = {}; // pathId -> [{x,y,progress,speed}]
    this.pathOpenness = {};  // pathId -> smooth 0..1
    this.blinkingPaths = {}; // pathId -> { startTime, newState }

    stateManager.on('pathsUpdated', (changes) => {
      // Mark changed paths for blink animation
      if (Array.isArray(changes)) {
        for (const c of changes) {
          this.blinkingPaths[c.pathId] = {
            startTime: performance.now(),
            newState: c.isOpen,
          };
        }
      }
    });
  }

  render(ctx, dt, time, canvasW, canvasH) {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return;

    for (const path of scenario.paths) {
      const fromArea = scenario.areas.find(a => a.id === path.fromAreaId);
      const toArea = scenario.areas.find(a => a.id === path.toAreaId);
      if (!fromArea || !toArea) continue;

      this._drawPath(ctx, path, fromArea, toArea, dt, time);
    }
  }

  _getOpenness(path) {
    if (!this.pathOpenness[path.id]) {
      this.pathOpenness[path.id] = path.isOpen ? 1 : 0;
    }
    const target = path.isOpen ? 1 : 0;
    const current = this.pathOpenness[path.id];
    this.pathOpenness[path.id] += (target - current) * 0.05;
    return this.pathOpenness[path.id];
  }

  _getBlinkIntensity(pathId) {
    const blink = this.blinkingPaths[pathId];
    if (!blink) return 0;
    const elapsed = performance.now() - blink.startTime;
    const duration = 3000; // 3 second blink
    if (elapsed > duration) {
      delete this.blinkingPaths[pathId];
      return 0;
    }
    const fadeOut = 1 - (elapsed / duration);
    // Fast pulsing: 6 Hz
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 0.038);
    return pulse * fadeOut;
  }

  _drawPath(ctx, path, from, to, dt, time) {
    const isSelected = stateManager.state.selectedPathId === path.id;
    const openness = this._getOpenness(path);
    const blinkIntensity = this._getBlinkIntensity(path.id);

    // Compute control points for a curved path
    const fx = from.x, fy = from.y;
    const tx = to.x, ty = to.y;
    const mx = (fx + tx) / 2;
    const my = (fy + ty) / 2;

    // Perpendicular offset for curve
    const dx = tx - fx;
    const dy = ty - fy;
    const len = Math.sqrt(dx * dx + dy * dy);
    const nx = -dy / len;
    const ny = dx / len;
    const curveAmount = Math.min(len * 0.15, 40);
    const cx1 = mx + nx * curveAmount;
    const cy1 = my + ny * curveAmount;

    ctx.save();

    // Blink glow effect — bright attention pulse when rule changes path state
    if (blinkIntensity > 0.05) {
      const blinkColor = this.blinkingPaths[path.id]?.newState
        ? `rgba(52, 255, 180, ${blinkIntensity * 0.9})`   // bright green-white for opening
        : `rgba(255, 100, 100, ${blinkIntensity * 0.9})`;  // bright red for closing
      ctx.shadowColor = blinkColor;
      ctx.shadowBlur = 25 + blinkIntensity * 20;
      // Draw a thick glow underlay
      ctx.strokeStyle = blinkColor;
      ctx.lineWidth = 8 + blinkIntensity * 6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(cx1, cy1, tx, ty);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Path shadow/glow (normal)
    if (openness > 0.5 && blinkIntensity < 0.1) {
      ctx.shadowColor = `rgba(16, 185, 129, ${0.3 * openness})`;
      ctx.shadowBlur = 8;
    }

    // Main line
    const openColor = `rgba(16, 185, 129, ${0.3 + 0.5 * openness})`;
    const closedColor = `rgba(239, 68, 68, ${0.3 + 0.3 * (1 - openness)})`;

    ctx.strokeStyle = openness > 0.5 ? openColor : closedColor;
    ctx.lineWidth = isSelected ? 4 : 2.5;

    if (openness < 0.3) {
      ctx.setLineDash([8, 8]);
      ctx.lineDashOffset = -time / 100;
    }

    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.quadraticCurveTo(cx1, cy1, tx, ty);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Selection indicator
    if (isSelected) {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(fx, fy);
      ctx.quadraticCurveTo(cx1, cy1, tx, ty);
      ctx.stroke();
    }

    // Flow particles (only when open)
    if (openness > 0.3) {
      this._drawParticles(ctx, path, fx, fy, cx1, cy1, tx, ty, dt, time, openness);
    }

    // Direction arrows
    this._drawArrow(ctx, fx, fy, cx1, cy1, tx, ty, 0.7, openness);
    if (path.bidirectional) {
      this._drawArrow(ctx, tx, ty, cx1, cy1, fx, fy, 0.7, openness);
    }

    // Closed X marker
    if (openness < 0.3) {
      const xm = this._getQuadPoint(fx, fy, cx1, cy1, tx, ty, 0.5);
      ctx.strokeStyle = `rgba(239, 68, 68, ${0.8 * (1 - openness)})`;
      ctx.lineWidth = 3;
      const s = 8;
      ctx.beginPath();
      ctx.moveTo(xm.x - s, xm.y - s);
      ctx.lineTo(xm.x + s, xm.y + s);
      ctx.moveTo(xm.x + s, xm.y - s);
      ctx.lineTo(xm.x - s, xm.y + s);
      ctx.stroke();
    }

    // Path label
    const labelPos = this._getQuadPoint(fx, fy, cx1, cy1, tx, ty, 0.5);
    ctx.fillStyle = openness > 0.5 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const status = openness > 0.5 ? '● OPEN' : '✕ CLOSED';
    ctx.fillText(status, labelPos.x, labelPos.y - 10);

    ctx.restore();
  }

  _drawParticles(ctx, path, fx, fy, cx, cy, tx, ty, dt, time, openness) {
    if (!this.pathParticles[path.id]) {
      this.pathParticles[path.id] = [];
      for (let i = 0; i < 6; i++) {
        this.pathParticles[path.id].push({
          progress: Math.random(),
          speed: 0.0003 + Math.random() * 0.0003,
          size: 2 + Math.random() * 2,
        });
      }
    }

    const particles = this.pathParticles[path.id];
    for (const p of particles) {
      p.progress += p.speed * dt;
      if (p.progress > 1) p.progress -= 1;

      const pos = this._getQuadPoint(fx, fy, cx, cy, tx, ty, p.progress);
      const alpha = openness * (0.5 + 0.5 * Math.sin(time / 200 + p.progress * 10));

      ctx.fillStyle = `rgba(52, 211, 153, ${alpha})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawArrow(ctx, fx, fy, cx, cy, tx, ty, t, openness) {
    const pos = this._getQuadPoint(fx, fy, cx, cy, tx, ty, t);
    const pos2 = this._getQuadPoint(fx, fy, cx, cy, tx, ty, t - 0.02);
    const angle = Math.atan2(pos.y - pos2.y, pos.x - pos2.x);
    const size = 7;

    ctx.fillStyle = openness > 0.5
      ? `rgba(16, 185, 129, ${0.6 * openness})`
      : `rgba(239, 68, 68, ${0.4})`;
    ctx.beginPath();
    ctx.moveTo(pos.x + Math.cos(angle) * size, pos.y + Math.sin(angle) * size);
    ctx.lineTo(pos.x + Math.cos(angle + 2.5) * size, pos.y + Math.sin(angle + 2.5) * size);
    ctx.lineTo(pos.x + Math.cos(angle - 2.5) * size, pos.y + Math.sin(angle - 2.5) * size);
    ctx.closePath();
    ctx.fill();
  }

  _getQuadPoint(fx, fy, cx, cy, tx, ty, t) {
    const u = 1 - t;
    return {
      x: u * u * fx + 2 * u * t * cx + t * t * tx,
      y: u * u * fy + 2 * u * t * cy + t * t * ty,
    };
  }

  hitTest(x, y) {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return null;

    for (const path of scenario.paths) {
      const from = scenario.areas.find(a => a.id === path.fromAreaId);
      const to = scenario.areas.find(a => a.id === path.toAreaId);
      if (!from || !to) continue;

      // Sample points along the curve and check distance
      for (let t = 0; t <= 1; t += 0.05) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        const curveAmount = Math.min(len * 0.15, 40);
        const cx = mx + nx * curveAmount;
        const cy = my + ny * curveAmount;

        const pt = this._getQuadPoint(from.x, from.y, cx, cy, to.x, to.y, t);
        const dist = Math.sqrt((pt.x - x) ** 2 + (pt.y - y) ** 2);
        if (dist < 12) return path;
      }
    }
    return null;
  }
}
