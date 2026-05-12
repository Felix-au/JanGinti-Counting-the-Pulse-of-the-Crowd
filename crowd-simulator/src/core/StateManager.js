/**
 * StateManager — Central reactive state + event bus for the crowd simulator.
 * All modules communicate through this singleton.
 */
export class StateManager {
  constructor() {
    this.state = {
      scenarios: [],
      activeScenarioId: null,
      selectedAreaId: null,
      selectedPathId: null,
      editMode: 'select', // 'select' | 'addArea' | 'addPath' | 'delete'
      pathDrawing: null,   // { fromAreaId } when in addPath mode and first area clicked
      simulationRunning: false,
      zoom: 1,
      panOffset: { x: 0, y: 0 },
    };
    this._listeners = {};
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => cb(data));
    }
  }

  getActiveScenario() {
    return this.state.scenarios.find(s => s.id === this.state.activeScenarioId) || null;
  }

  setActiveScenario(id) {
    this.state.activeScenarioId = id;
    this.state.selectedAreaId = null;
    this.state.selectedPathId = null;
    this.state.pathDrawing = null;
    this.emit('scenarioChanged', this.getActiveScenario());
  }

  addScenario(scenario) {
    this.state.scenarios.push(scenario);
    this.emit('scenariosUpdated', this.state.scenarios);
  }

  removeScenario(id) {
    this.state.scenarios = this.state.scenarios.filter(s => s.id !== id);
    if (this.state.activeScenarioId === id) {
      this.state.activeScenarioId = this.state.scenarios[0]?.id || null;
    }
    this.emit('scenariosUpdated', this.state.scenarios);
    this.emit('scenarioChanged', this.getActiveScenario());
  }

  updateScenario(id, updates) {
    const scenario = this.state.scenarios.find(s => s.id === id);
    if (scenario) {
      Object.assign(scenario, updates);
      this.emit('scenarioUpdated', scenario);
    }
  }

  setEditMode(mode) {
    this.state.editMode = mode;
    this.state.pathDrawing = null;
    this.emit('editModeChanged', mode);
  }

  selectArea(id) {
    this.state.selectedAreaId = id;
    this.state.selectedPathId = null;
    this.emit('selectionChanged', { type: 'area', id });
  }

  selectPath(id) {
    this.state.selectedPathId = id;
    this.state.selectedAreaId = null;
    this.emit('selectionChanged', { type: 'path', id });
  }

  clearSelection() {
    this.state.selectedAreaId = null;
    this.state.selectedPathId = null;
    this.emit('selectionChanged', null);
  }

  updateAreaCount(areaId, count) {
    const scenario = this.getActiveScenario();
    if (!scenario) return;
    const area = scenario.areas.find(a => a.id === areaId);
    if (area) {
      area.currentCount = count;
      this.emit('areaCountUpdated', { areaId, count });
      this.emit('evaluateRules', { areaId });
    }
  }
}

// Singleton
export const stateManager = new StateManager();
