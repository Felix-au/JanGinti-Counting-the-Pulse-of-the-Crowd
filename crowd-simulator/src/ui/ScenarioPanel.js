/**
 * ScenarioPanel — Left sidebar for scenario selection, creation, and editing.
 */
import { stateManager } from '../core/StateManager.js';
import { createScenario, cloneScenario } from '../core/Scenario.js';
import { getPrebuiltScenarios } from '../data/prebuiltScenarios.js';
import { crowdCounter } from '../inference/CrowdCounter.js';

export class ScenarioPanel {
  constructor(container) {
    this.container = container;
    this._render();
    stateManager.on('scenariosUpdated', () => this._render());
    stateManager.on('scenarioChanged', () => this._render());
    crowdCounter.onStatusChange(() => this._render());
  }

  _render() {
    const scenarios = stateManager.state.scenarios;
    const activeId = stateManager.state.activeScenarioId;
    const backendStatus = crowdCounter.getBackendStatus();

    this.container.innerHTML = `
      <div class="panel-header">
        <h2><span class="icon">📋</span> Scenarios</h2>
        <div class="panel-header-actions">
          <button id="btn-new-scenario" class="btn btn-sm btn-primary" title="New Scenario">
            <span>+ New</span>
          </button>
        </div>
      </div>
      <div class="scenario-list">
        ${scenarios.map(s => `
          <div class="scenario-item ${s.id === activeId ? 'active' : ''}" data-id="${s.id}">
            <div class="scenario-item-info">
              <span class="scenario-name">${s.name}</span>
              <span class="scenario-meta">${s.areas.length} areas · ${s.paths.length} paths</span>
            </div>
            <div class="scenario-item-actions">
              <button class="btn-icon btn-clone" data-id="${s.id}" title="Duplicate">⧉</button>
              <button class="btn-icon btn-delete" data-id="${s.id}" title="Delete">✕</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="panel-section">
        <h3><span class="icon">📦</span> Prebuilt Templates</h3>
        <div class="template-grid">
          <button class="template-btn" data-template="railway">🚂 Railway</button>
          <button class="template-btn" data-template="festival">🎪 Festival</button>
          <button class="template-btn" data-template="stadium">🏟️ Stadium</button>
          <button class="template-btn" data-template="airport">✈️ Airport</button>
        </div>
      </div>
      <div class="panel-section">
        <h3><span class="icon">🔌</span> Backend Connection</h3>
        <div class="backend-card ${backendStatus.connected ? 'connected' : 'disconnected'}">
          <div class="backend-card-header">
            <span class="status-dot ${backendStatus.connected ? 'green' : 'orange pulse'}"></span>
            <span class="backend-card-title">${backendStatus.connected ? 'CSRNet FastAPI Connected' : 'Backend Disconnected'}</span>
          </div>
          <div class="backend-card-body">
            ${backendStatus.connected ? `
              <div class="backend-detail"><span>Inference:</span> <strong>PyTorch CSRNet</strong></div>
              <div class="backend-detail"><span>Device:</span> <strong>${backendStatus.device?.toUpperCase() || 'CPU'}</strong></div>
              <div class="backend-detail"><span>Weights:</span> <strong>${backendStatus.weightsLoaded ? 'Loaded' : 'Random'}</strong></div>
            ` : `
              <p class="backend-warning">Mode: <strong>Simulation (Synthetic Counts)</strong></p>
              <p class="backend-hint">To enable real CSRNet crowd counting, run:</p>
              <code class="backend-cmd">python backend/server.py</code>
            `}
          </div>
          <button id="btn-retry-backend" class="btn btn-sm btn-secondary btn-block">
            🔄 Retry Connection
          </button>
        </div>
      </div>
    `;

    this._bindEvents();
  }

  _bindEvents() {
    // Select scenario
    this.container.querySelectorAll('.scenario-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-icon')) return;
        stateManager.setActiveScenario(el.dataset.id);
      });
    });

    // New scenario
    this.container.querySelector('#btn-new-scenario')?.addEventListener('click', () => {
      const name = prompt('Scenario name:', 'New Scenario');
      if (!name) return;
      const scenario = createScenario({ name });
      stateManager.addScenario(scenario);
      stateManager.setActiveScenario(scenario.id);
    });

    // Clone
    this.container.querySelectorAll('.btn-clone').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const orig = stateManager.state.scenarios.find(s => s.id === id);
        if (orig) {
          const clone = cloneScenario(orig);
          stateManager.addScenario(clone);
          stateManager.setActiveScenario(clone.id);
        }
      });
    });

    // Delete
    this.container.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Delete this scenario?')) {
          stateManager.removeScenario(btn.dataset.id);
        }
      });
    });

    // Templates
    this.container.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const templates = getPrebuiltScenarios();
        const map = { railway: 0, festival: 1, stadium: 2, airport: 3 };
        const idx = map[btn.dataset.template];
        if (idx !== undefined && templates[idx]) {
          const scenario = templates[idx];
          stateManager.addScenario(scenario);
          stateManager.setActiveScenario(scenario.id);
        }
      });
    });

    // Retry Backend Connection
    const retryBtn = this.container.querySelector('#btn-retry-backend');
    if (retryBtn) {
      retryBtn.addEventListener('click', async () => {
        retryBtn.disabled = true;
        retryBtn.innerHTML = '⌛ Checking...';
        await crowdCounter.checkBackend();
      });
    }
  }
}

