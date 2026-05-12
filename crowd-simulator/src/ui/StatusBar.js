/**
 * StatusBar — Bottom bar showing live simulation status.
 */
import { stateManager } from '../core/StateManager.js';

export class StatusBar {
  constructor(container) {
    this.container = container;
    this._render();
    stateManager.on('scenarioChanged', () => this._render());
    stateManager.on('areaCountUpdated', () => this._render());
    stateManager.on('pathsUpdated', () => this._render());
    stateManager.on('ruleTriggered', (changes) => {
      this.lastAlert = changes[0]?.reason || '';
      this._render();
    });
    this.lastAlert = '';
  }

  _render() {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) {
      this.container.innerHTML = `<div class="status-item">No active scenario</div>`;
      return;
    }

    const total = scenario.areas.reduce((s, a) => s + a.currentCount, 0);
    const critical = scenario.areas.filter(a => a.status === 'critical').length;
    const openPaths = scenario.paths.filter(p => p.isOpen).length;

    this.container.innerHTML = `
      <div class="status-item">
        <span class="status-dot green"></span>
        <span>Total: <strong>${total}</strong> people</span>
      </div>
      <div class="status-item">
        <span class="status-dot ${critical > 0 ? 'red pulse' : 'green'}"></span>
        <span>Critical Areas: <strong>${critical}</strong></span>
      </div>
      <div class="status-item">
        <span>Paths: <strong>${openPaths}/${scenario.paths.length}</strong> open</span>
      </div>
      <div class="status-item">
        <span>Rules: <strong>${scenario.rules.length}</strong> active</span>
      </div>
      ${this.lastAlert ? `<div class="status-item alert-item"><span class="status-dot orange pulse"></span>${this.lastAlert}</div>` : ''}
    `;
  }
}
