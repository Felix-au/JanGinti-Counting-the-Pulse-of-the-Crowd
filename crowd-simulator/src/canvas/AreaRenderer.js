/**
 * AreaRenderer — Draws areas on the canvas with status-based styling and animations.
 */
import { stateManager } from '../core/StateManager.js';

const STATUS_COLORS = {
  normal: { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', glow: 'rgba(16, 185, 129, 0.3)', text: '#6ee7b7' },
  caution: { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)', text: '#fcd34d' },
  critical: { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', glow: 'rgba(239, 68, 68, 0.4)', text: '#fca5a5' },
};

export class AreaRenderer {
  constructor() {
    this.hoverAreaId = null;
    this.areaAnimations = {}; // areaId -> { countDisplay, targetCount, pulsePhase }
  }

  render(ctx, dt, time, canvasW, canvasH) {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return;

    for (const area of scenario.areas) {
      this._drawArea(ctx, area, dt, time);
    }
  }

  _getAnim(area) {
    if (!this.areaAnimations[area.id]) {
      this.areaAnimations[area.id] = {
        countDisplay: area.currentCount,
        targetCount: area.currentCount,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    }
    const anim = this.areaAnimations[area.id];
    anim.targetCount = area.currentCount;
    return anim;
  }

  _drawArea(ctx, area, dt, time) {
    const anim = this._getAnim(area);
    const colors = STATUS_COLORS[area.status] || STATUS_COLORS.normal;
    const isSelected = stateManager.state.selectedAreaId === area.id;
    const isHover = this.hoverAreaId === area.id;

    // Smooth count animation
    const diff = anim.targetCount - anim.countDisplay;
    anim.countDisplay += diff * Math.min(dt / 300, 1);

    const x = area.x;
    const y = area.y;
    const w = area.width;
    const h = area.height;
    const r = 16;

    ctx.save();

    // Glow effect for monitored or critical areas
    if (area.monitored || area.status === 'critical') {
      const pulse = Math.sin(time / 800 + anim.pulsePhase) * 0.3 + 0.7;
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 20 * pulse + (isSelected ? 10 : 0);
    }

    // Background
    ctx.fillStyle = isHover ? colors.bg.replace('0.12', '0.2') : colors.bg;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
    ctx.fill();

    // Backdrop glass effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h / 2, [r, r, 0, 0]);
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = isSelected ? '#00d4ff' : colors.border;
    ctx.lineWidth = isSelected ? 2.5 : 1.5;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, r);
    ctx.stroke();

    // Selection ring
    if (isSelected) {
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.roundRect(x - w / 2 - 6, y - h / 2 - 6, w + 12, h + 12, r + 4);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Area name
    ctx.fillStyle = '#e5e7eb';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(area.name, x, y - 18);

    // Count display
    const countStr = Math.round(anim.countDisplay).toString();
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.fillText(countStr, x, y + 6);

    // Capacity bar
    const barW = w - 30;
    const barH = 5;
    const barX = x - barW / 2;
    const barY = y + h / 2 - 18;
    const fillRatio = Math.min(area.currentCount / area.maxCapacity, 1);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3);
    ctx.fill();

    const barGrad = ctx.createLinearGradient(barX, 0, barX + barW * fillRatio, 0);
    if (fillRatio < 0.5) {
      barGrad.addColorStop(0, '#10b981');
      barGrad.addColorStop(1, '#34d399');
    } else if (fillRatio < 0.8) {
      barGrad.addColorStop(0, '#f59e0b');
      barGrad.addColorStop(1, '#fbbf24');
    } else {
      barGrad.addColorStop(0, '#ef4444');
      barGrad.addColorStop(1, '#f87171');
    }
    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * fillRatio, barH, 3);
    ctx.fill();

    // Capacity text
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`/ ${area.maxCapacity}`, x, y + 24);

    // Monitoring icon
    if (area.monitored) {
      this._drawCameraIcon(ctx, x + w / 2 - 18, y - h / 2 + 14, colors.border);
    }

    ctx.restore();
  }

  _drawCameraIcon(ctx, x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.8;
    // Simple camera glyph
    ctx.beginPath();
    ctx.roundRect(x - 7, y - 4, 14, 10, 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 7, y - 1);
    ctx.lineTo(x + 12, y - 3);
    ctx.lineTo(x + 12, y + 5);
    ctx.lineTo(x + 7, y + 3);
    ctx.fill();
    // Lens
    ctx.fillStyle = '#0a0e1a';
    ctx.beginPath();
    ctx.arc(x, y + 1, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  hitTest(x, y) {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return null;

    for (let i = scenario.areas.length - 1; i >= 0; i--) {
      const area = scenario.areas[i];
      if (
        x >= area.x - area.width / 2 &&
        x <= area.x + area.width / 2 &&
        y >= area.y - area.height / 2 &&
        y <= area.y + area.height / 2
      ) {
        return area;
      }
    }
    return null;
  }
}
