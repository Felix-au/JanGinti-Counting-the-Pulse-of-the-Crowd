/**
 * AreaEditor — Right panel for editing area properties and managing rules.
 */
import { stateManager } from '../core/StateManager.js';
import { createArea, createPath, createRule } from '../core/Scenario.js';
import { crowdCounter } from '../inference/CrowdCounter.js';

export class AreaEditor {
  constructor(container) {
    this.container = container;
    this._render();
    stateManager.on('selectionChanged', () => this._render());
    stateManager.on('scenarioChanged', () => this._render());
    stateManager.on('areaCountUpdated', () => this._render());
    stateManager.on('pathsUpdated', () => this._render());
  }

  _getSelectedArea() {
    const scenario = stateManager.getActiveScenario();
    if (!scenario || !stateManager.state.selectedAreaId) return null;
    return scenario.areas.find(a => a.id === stateManager.state.selectedAreaId) || null;
  }

  _getSelectedPath() {
    const scenario = stateManager.getActiveScenario();
    if (!scenario || !stateManager.state.selectedPathId) return null;
    return scenario.paths.find(p => p.id === stateManager.state.selectedPathId) || null;
  }

  _render() {
    const area = this._getSelectedArea();
    const path = this._getSelectedPath();
    const scenario = stateManager.getActiveScenario();

    if (!scenario) {
      this.container.innerHTML = `
        <div class="panel-header"><h2><span class="icon">📍</span> Inspector</h2></div>
        <div class="empty-state">
          <p>Select a scenario from the left panel to get started</p>
        </div>
      `;
      return;
    }

    if (area) {
      this._renderAreaEditor(area, scenario);
    } else if (path) {
      this._renderPathEditor(path, scenario);
    } else {
      this._renderScenarioOverview(scenario);
    }
  }

  _renderScenarioOverview(scenario) {
    const totalPeople = scenario.areas.reduce((s, a) => s + a.currentCount, 0);
    const openPaths = scenario.paths.filter(p => p.isOpen).length;
    const monitoredAreas = scenario.areas.filter(a => a.monitored).length;

    this.container.innerHTML = `
      <div class="panel-header"><h2><span class="icon">📊</span> Overview</h2></div>
      <div class="panel-body">
        <div class="stat-grid">
          <div class="stat-card">
            <span class="stat-value">${scenario.areas.length}</span>
            <span class="stat-label">Areas</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${scenario.paths.length}</span>
            <span class="stat-label">Paths</span>
          </div>
          <div class="stat-card accent">
            <span class="stat-value">${totalPeople}</span>
            <span class="stat-label">Total People</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${openPaths}/${scenario.paths.length}</span>
            <span class="stat-label">Paths Open</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${monitoredAreas}</span>
            <span class="stat-label">Monitored</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">${scenario.rules.length}</span>
            <span class="stat-label">Rules</span>
          </div>
        </div>
        <div class="hint-box">
          <p>💡 Click on an area or pathway on the canvas to inspect and edit it</p>
          <p>Use the toolbar to add new areas and pathways</p>
        </div>
        <div class="panel-section">
          <h3>Scenario Name</h3>
          <input type="text" class="input" id="scenario-name-input" value="${scenario.name}" />
        </div>
        <div class="panel-section">
          <h3>All Rules</h3>
          ${this._renderRulesList(scenario)}
        </div>
      </div>
    `;

    this.container.querySelector('#scenario-name-input')?.addEventListener('change', (e) => {
      stateManager.updateScenario(scenario.id, { name: e.target.value });
      stateManager.emit('scenariosUpdated', stateManager.state.scenarios);
    });

    this._bindRuleActions(scenario);
  }

  _renderAreaEditor(area, scenario) {
    const areaRules = scenario.rules.filter(r => r.areaId === area.id);
    const areaPaths = scenario.paths.filter(p => p.fromAreaId === area.id || p.toAreaId === area.id);

    this.container.innerHTML = `
      <div class="panel-header">
        <h2><span class="icon">📍</span> Area: ${area.name}</h2>
        <button class="btn-icon btn-close-panel" title="Deselect">✕</button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Name</label>
          <input type="text" class="input" id="area-name" value="${area.name}" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Max Capacity</label>
            <input type="number" class="input" id="area-capacity" value="${area.maxCapacity}" min="1" />
          </div>
          <div class="form-group">
            <label>Current Count</label>
            <input type="number" class="input" id="area-count" value="${area.currentCount}" min="0" />
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="area-monitored" ${area.monitored ? 'checked' : ''} />
            <span>Monitored (allows image upload)</span>
          </label>
        </div>
        ${area.monitored ? `
        <div class="monitor-upload-section">
          <h3><span class="icon">📷</span> Upload Crowd Image</h3>
          <div class="upload-zone" id="upload-zone">
            ${area.lastImage ? `<img src="${area.lastImage}" class="preview-img" />` : `
            <div class="upload-placeholder">
              <span class="upload-icon">📸</span>
              <p>Drop image here or click to upload</p>
              <p class="upload-hint">CSRNet will estimate the crowd count</p>
            </div>`}
            <input type="file" id="image-upload" accept="image/*" style="display:none" />
          </div>
          <div id="prediction-result" class="prediction-result" style="display:none">
            <div class="prediction-loading">
              <div class="spinner"></div>
              <span>Analyzing crowd density...</span>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="panel-section">
          <div class="section-header">
            <h3>Connected Paths (${areaPaths.length})</h3>
          </div>
          <div class="path-list">
            ${areaPaths.map(p => {
              const other = scenario.areas.find(a => a.id === (p.fromAreaId === area.id ? p.toAreaId : p.fromAreaId));
              return `<div class="mini-path-item ${p.isOpen ? 'open' : 'closed'}">
                <span class="path-status-dot"></span>
                <span>${p.name} → ${other?.name || '?'}</span>
                <button class="btn-icon btn-toggle-path" data-path-id="${p.id}" title="Toggle">⇌</button>
              </div>`;
            }).join('')}
          </div>
        </div>

        <div class="panel-section">
          <div class="section-header">
            <h3>Rules (${areaRules.length})</h3>
            <button class="btn btn-sm btn-secondary" id="btn-add-rule">+ Add Rule</button>
          </div>
          ${areaRules.map(r => `
            <div class="rule-card">
              <div class="rule-type">${r.type === 'MIN_PATHS' ? '🔒 Min Paths' : '📊 Threshold'}</div>
              <div class="rule-desc">${r.description || this._autoDescribeRule(r)}</div>
              <button class="btn-icon btn-delete-rule" data-rule-id="${r.id}" title="Delete">✕</button>
            </div>
          `).join('')}
        </div>

        <div class="danger-zone">
          <button class="btn btn-sm btn-danger" id="btn-delete-area">Delete Area</button>
        </div>
      </div>
    `;

    this._bindAreaEvents(area, scenario);
  }

  _renderPathEditor(path, scenario) {
    const from = scenario.areas.find(a => a.id === path.fromAreaId);
    const to = scenario.areas.find(a => a.id === path.toAreaId);

    this.container.innerHTML = `
      <div class="panel-header">
        <h2><span class="icon">🔗</span> Path: ${path.name}</h2>
        <button class="btn-icon btn-close-panel" title="Deselect">✕</button>
      </div>
      <div class="panel-body">
        <div class="form-group">
          <label>Name</label>
          <input type="text" class="input" id="path-name" value="${path.name}" />
        </div>
        <div class="form-group">
          <label>From</label>
          <div class="info-value">${from?.name || 'Unknown'}</div>
        </div>
        <div class="form-group">
          <label>To</label>
          <div class="info-value">${to?.name || 'Unknown'}</div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Capacity</label>
            <input type="number" class="input" id="path-capacity" value="${path.capacity}" min="1" />
          </div>
          <div class="form-group">
            <label>Status</label>
            <button class="btn btn-sm ${path.isOpen ? 'btn-success' : 'btn-danger'}" id="btn-toggle-path-status">
              ${path.isOpen ? '● Open' : '✕ Closed'}
            </button>
          </div>
        </div>
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" id="path-bidirectional" ${path.bidirectional ? 'checked' : ''} />
            <span>Bidirectional</span>
          </label>
        </div>
        <div class="danger-zone">
          <button class="btn btn-sm btn-danger" id="btn-delete-path">Delete Path</button>
        </div>
      </div>
    `;

    this._bindPathEvents(path, scenario);
  }

  _bindAreaEvents(area, scenario) {
    this.container.querySelector('.btn-close-panel')?.addEventListener('click', () => stateManager.clearSelection());

    this.container.querySelector('#area-name')?.addEventListener('change', (e) => {
      area.name = e.target.value;
      stateManager.emit('scenarioUpdated', scenario);
    });

    this.container.querySelector('#area-capacity')?.addEventListener('change', (e) => {
      area.maxCapacity = parseInt(e.target.value) || 1000;
      stateManager.emit('evaluateRules', { areaId: area.id });
    });

    this.container.querySelector('#area-count')?.addEventListener('change', (e) => {
      const count = parseInt(e.target.value) || 0;
      stateManager.updateAreaCount(area.id, count);
      this._render();
    });

    this.container.querySelector('#area-monitored')?.addEventListener('change', (e) => {
      area.monitored = e.target.checked;
      this._render();
    });

    // Image upload for monitored areas
    const uploadZone = this.container.querySelector('#upload-zone');
    const fileInput = this.container.querySelector('#image-upload');
    if (uploadZone && fileInput) {
      uploadZone.addEventListener('click', () => fileInput.click());
      uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
      uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
      uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) this._handleImageUpload(e.dataTransfer.files[0], area);
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) this._handleImageUpload(e.target.files[0], area);
      });
    }

    // Toggle paths
    this.container.querySelectorAll('.btn-toggle-path').forEach(btn => {
      btn.addEventListener('click', () => {
        const path = scenario.paths.find(p => p.id === btn.dataset.pathId);
        if (path) {
          path.isOpen = !path.isOpen;
          stateManager.emit('pathsUpdated', [{ pathId: path.id, isOpen: path.isOpen }]);
          this._render();
        }
      });
    });

    // Add rule
    this.container.querySelector('#btn-add-rule')?.addEventListener('click', () => {
      this._showAddRuleDialog(area, scenario);
    });

    // Delete rules
    this.container.querySelectorAll('.btn-delete-rule').forEach(btn => {
      btn.addEventListener('click', () => {
        scenario.rules = scenario.rules.filter(r => r.id !== btn.dataset.ruleId);
        this._render();
      });
    });

    // Delete area
    this.container.querySelector('#btn-delete-area')?.addEventListener('click', () => {
      if (confirm(`Delete area "${area.name}"?`)) {
        scenario.paths = scenario.paths.filter(p => p.fromAreaId !== area.id && p.toAreaId !== area.id);
        scenario.rules = scenario.rules.filter(r => r.areaId !== area.id);
        scenario.areas = scenario.areas.filter(a => a.id !== area.id);
        stateManager.clearSelection();
        stateManager.emit('scenarioUpdated', scenario);
      }
    });
  }

  _bindPathEvents(path, scenario) {
    this.container.querySelector('.btn-close-panel')?.addEventListener('click', () => stateManager.clearSelection());

    this.container.querySelector('#path-name')?.addEventListener('change', (e) => {
      path.name = e.target.value;
      stateManager.emit('scenarioUpdated', scenario);
    });

    this.container.querySelector('#path-capacity')?.addEventListener('change', (e) => {
      path.capacity = parseInt(e.target.value) || 100;
    });

    this.container.querySelector('#btn-toggle-path-status')?.addEventListener('click', () => {
      path.isOpen = !path.isOpen;
      stateManager.emit('pathsUpdated', [{ pathId: path.id, isOpen: path.isOpen }]);
      this._render();
    });

    this.container.querySelector('#path-bidirectional')?.addEventListener('change', (e) => {
      path.bidirectional = e.target.checked;
    });

    this.container.querySelector('#btn-delete-path')?.addEventListener('click', () => {
      if (confirm(`Delete path "${path.name}"?`)) {
        scenario.paths = scenario.paths.filter(p => p.id !== path.id);
        stateManager.clearSelection();
        stateManager.emit('scenarioUpdated', scenario);
      }
    });
  }

  async _handleImageUpload(file, area) {
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      area.lastImage = e.target.result;
      this._render();
    };
    reader.readAsDataURL(file);

    // Show loading
    const resultEl = this.container.querySelector('#prediction-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div class="prediction-loading">
          <div class="spinner"></div>
          <span>Analyzing crowd density with CSRNet...</span>
        </div>
      `;
    }

    // Run prediction
    try {
      const result = await crowdCounter.predict(file);
      stateManager.updateAreaCount(area.id, result.count);

      if (resultEl) {
        resultEl.innerHTML = `
          <div class="prediction-success">
            <div class="prediction-count">${result.count}</div>
            <div class="prediction-label">Estimated People</div>
            <div class="prediction-meta">
              Confidence: ${(result.confidence * 100).toFixed(0)}% · Mode: ${result.mode}
            </div>
          </div>
        `;
      }
      this._render();
    } catch (err) {
      if (resultEl) {
        resultEl.innerHTML = `<div class="prediction-error">Error: ${err.message}</div>`;
      }
    }
  }

  _showAddRuleDialog(area, scenario) {
    const type = prompt('Rule type?\n1 = Min Paths (always keep N paths open)\n2 = Threshold (open paths based on count)', '1');
    if (!type) return;

    if (type === '1') {
      const dir = prompt('Direction? (outgoing / incoming / both)', 'outgoing');
      const min = parseInt(prompt('Minimum paths to keep open:', '1')) || 1;
      const rule = createRule({
        areaId: area.id,
        type: 'MIN_PATHS',
        direction: dir || 'outgoing',
        minPaths: min,
        description: `Always keep at least ${min} ${dir || 'outgoing'} path(s) open`,
      });
      scenario.rules.push(rule);
    } else if (type === '2') {
      const dir = prompt('Direction? (outgoing / incoming / both)', 'outgoing');
      const condCount = parseInt(prompt('How many threshold levels?', '2')) || 1;
      const conditions = [];
      for (let i = 0; i < condCount; i++) {
        const thresh = parseInt(prompt(`Level ${i + 1} threshold (count ≥):`, `${(i + 1) * 500}`)) || 500;
        const paths = parseInt(prompt(`Min paths at count ≥ ${thresh}:`, `${i + 2}`)) || 2;
        conditions.push({ threshold: thresh, minPaths: paths, direction: dir || 'outgoing' });
      }
      const rule = createRule({
        areaId: area.id,
        type: 'THRESHOLD',
        direction: dir || 'outgoing',
        conditions,
        description: conditions.map(c => `≥${c.threshold}: ${c.minPaths} ${c.direction} paths`).join(' · '),
      });
      scenario.rules.push(rule);
    }

    stateManager.emit('evaluateRules', { areaId: area.id });
    this._render();
  }

  _renderRulesList(scenario) {
    if (scenario.rules.length === 0) return '<p class="muted">No rules defined yet</p>';
    return scenario.rules.map(r => {
      const area = scenario.areas.find(a => a.id === r.areaId);
      return `<div class="rule-card">
        <div class="rule-type">${r.type === 'MIN_PATHS' ? '🔒' : '📊'} ${area?.name || '?'}</div>
        <div class="rule-desc">${r.description || this._autoDescribeRule(r)}</div>
        <button class="btn-icon btn-delete-rule-global" data-rule-id="${r.id}" title="Delete">✕</button>
      </div>`;
    }).join('');
  }

  _bindRuleActions(scenario) {
    this.container.querySelectorAll('.btn-delete-rule-global').forEach(btn => {
      btn.addEventListener('click', () => {
        scenario.rules = scenario.rules.filter(r => r.id !== btn.dataset.ruleId);
        this._render();
      });
    });
  }

  _autoDescribeRule(rule) {
    if (rule.type === 'MIN_PATHS') {
      return `Min ${rule.minPaths} ${rule.direction} paths at all times`;
    }
    if (rule.type === 'THRESHOLD') {
      return rule.conditions.map(c => `≥${c.threshold}: ${c.minPaths} paths`).join(', ');
    }
    return 'Unknown rule';
  }
}
