/**
 * ScenarioPanel — Left sidebar for scenario selection, creation, and editing.
 */
import { stateManager } from '../core/StateManager.js';
import { createScenario, cloneScenario } from '../core/Scenario.js';
import { getPrebuiltScenarios } from '../data/prebuiltScenarios.js';
import { crowdCounter } from '../inference/CrowdCounter.js';
import { Modal } from './Modal.js';

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
          <button id="btn-export-scenario" class="btn btn-sm btn-secondary" title="Export JSON">
            <span>📥 Export</span>
          </button>
          <button id="btn-import-scenario" class="btn btn-sm btn-secondary" title="Import JSON">
            <span>📤 Import</span>
          </button>
          <button id="btn-new-scenario" class="btn btn-sm btn-primary" title="New Scenario">
            <span>+ New</span>
          </button>
          <input type="file" id="import-json-input" accept=".json" style="display:none" />
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
    this.container.querySelector('#btn-new-scenario')?.addEventListener('click', async () => {
      const name = await Modal.prompt({ title: 'New Scenario', message: 'Enter scenario name:', defaultValue: 'New Scenario' });
      if (!name) return;
      const scenario = createScenario({ name });
      stateManager.addScenario(scenario);
      stateManager.setActiveScenario(scenario.id);
    });

    // Export Scenario JSON
    this.container.querySelector('#btn-export-scenario')?.addEventListener('click', () => {
      const scenario = stateManager.getActiveScenario();
      if (!scenario) return Modal.alert({ title: 'Export Failed', message: 'No active scenario to export.', icon: '⚠️' });
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(scenario, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute('href', dataStr);
      anchor.setAttribute('download', `${scenario.name.toLowerCase().replace(/\s+/g, '-')}-scenario.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });

    // Import Scenario JSON
    const importInput = this.container.querySelector('#import-json-input');
    this.container.querySelector('#btn-import-scenario')?.addEventListener('click', () => importInput?.click());
    importInput?.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (!parsed.name || !Array.isArray(parsed.areas)) throw new Error('Invalid scenario JSON structure');
          const scenario = createScenario({
            name: `${parsed.name} (Imported)`,
            areas: parsed.areas || [],
            paths: parsed.paths || [],
            rules: parsed.rules || [],
          });
          stateManager.addScenario(scenario);
          stateManager.setActiveScenario(scenario.id);
        } catch (err) {
          Modal.alert({ title: 'Import Failed', message: err.message, icon: '❌' });
        }
      };
      reader.readAsText(file);
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
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await Modal.confirm({ title: 'Delete Scenario', message: 'Delete this scenario permanently?', confirmText: 'Delete', danger: true });
        if (confirmed) {
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


