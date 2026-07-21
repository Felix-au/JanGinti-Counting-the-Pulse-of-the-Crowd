/**
 * Toolbar — Top toolbar for edit mode selection and scenario controls.
 */
import { stateManager } from '../core/StateManager.js';
import { crowdCounter } from '../inference/CrowdCounter.js';
import { Modal } from './Modal.js';

export class Toolbar {
  constructor(container) {
    this.container = container;
    this._render();
    stateManager.on('editModeChanged', () => this._render());
    stateManager.on('scenarioChanged', () => this._render());
    crowdCounter.onStatusChange(() => this._render());
  }

  _render() {
    const mode = stateManager.state.editMode;
    const scenario = stateManager.getActiveScenario();
    const status = crowdCounter.getBackendStatus();

    this.container.innerHTML = `
      <div class="toolbar-left">
        <div class="app-brand">
          <span class="brand-icon">🔬</span>
          <span class="brand-text">CrowdFlow Simulator</span>
          <span class="brand-badge ${status.connected ? 'connected' : 'disconnected'}">
            ${status.connected ? '⚡ CSRNet Connected' : '⚠️ Backend Disconnected (Simulation Mode)'}
          </span>
        </div>
      </div>
      <div class="toolbar-center">
        ${scenario ? `
          <div class="toolbar-modes">
            <button class="mode-btn ${mode === 'select' ? 'active' : ''}" data-mode="select" title="Select & Move">
              <span>🖱️</span> Select
            </button>
            <button class="mode-btn ${mode === 'addArea' ? 'active' : ''}" data-mode="addArea" title="Add Area">
              <span>📍</span> Add Area
            </button>
            <button class="mode-btn ${mode === 'addPath' ? 'active' : ''}" data-mode="addPath" title="Connect Areas">
              <span>🔗</span> Add Path
            </button>
            <button class="mode-btn ${mode === 'delete' ? 'active' : ''}" data-mode="delete" title="Delete Mode">
              <span>🗑️</span> Delete
            </button>
          </div>
          <div class="toolbar-scenario-name">${scenario.name}</div>
        ` : '<div class="toolbar-hint">Select or create a scenario to begin</div>'}
      </div>
      <div class="toolbar-right">
        <div class="mode-indicator" id="mode-indicator"></div>
        <button id="btn-shortcuts" class="btn btn-sm btn-secondary" title="Keyboard Shortcuts">
          <span>❓ Shortcuts</span>
        </button>
      </div>
    `;

    this.container.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => stateManager.setEditMode(btn.dataset.mode));
    });

    this.container.querySelector('#btn-shortcuts')?.addEventListener('click', () => {
      Modal.shortcutsModal();
    });

    const el = this.container.querySelector('#mode-indicator');
    if (el) {
      const labels = {
        select: '🖱️ Click to select areas and paths',
        addArea: '📍 Click on canvas to place a new area',
        addPath: '🔗 Click two areas to connect them',
        delete: '🗑️ Click an area or path to remove it',
      };
      el.textContent = labels[mode] || '';
    }
  }
}


