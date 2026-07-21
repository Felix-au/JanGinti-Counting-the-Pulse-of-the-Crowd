/**
 * main.js — Application entry point. Wires all modules together.
 */
import './style.css';
import { stateManager } from './src/core/StateManager.js';
import { ruleEngine } from './src/core/RuleEngine.js';
import { createArea, createPath } from './src/core/Scenario.js';
import { getPrebuiltScenarios } from './src/data/prebuiltScenarios.js';

import { AnimationEngine } from './src/canvas/AnimationEngine.js';
import { AreaRenderer } from './src/canvas/AreaRenderer.js';
import { PathwayRenderer } from './src/canvas/PathwayRenderer.js';

import { Toolbar } from './src/ui/Toolbar.js';
import { ScenarioPanel } from './src/ui/ScenarioPanel.js';
import { AreaEditor } from './src/ui/AreaEditor.js';
import { StatusBar } from './src/ui/StatusBar.js';
import { Modal } from './src/ui/Modal.js';

// ── Initialize UI Panels ──
const toolbar = new Toolbar(document.getElementById('toolbar'));
const scenarioPanel = new ScenarioPanel(document.getElementById('sidebar'));
const areaEditor = new AreaEditor(document.getElementById('inspector'));
const statusBar = new StatusBar(document.getElementById('statusbar'));

// ── Initialize Canvas ──
const canvas = document.getElementById('main-canvas');
const animEngine = new AnimationEngine(canvas);
const areaRenderer = new AreaRenderer();
const pathRenderer = new PathwayRenderer();

animEngine.addRenderer(pathRenderer);
animEngine.addRenderer(areaRenderer);
animEngine.start();

// ── Load default scenario ──
const defaults = getPrebuiltScenarios();
defaults.forEach(s => stateManager.addScenario(s));
stateManager.setActiveScenario(defaults[0].id);

// ── Canvas Interaction ──
let isDragging = false;
let dragArea = null;
let dragOffset = { x: 0, y: 0 };

canvas.addEventListener('mousedown', (e) => {
  const pos = animEngine.getCanvasCoords(e.clientX, e.clientY);
  const mode = stateManager.state.editMode;
  const scenario = stateManager.getActiveScenario();
  if (!scenario) return;

  const hitArea = areaRenderer.hitTest(pos.x, pos.y);
  const hitPath = pathRenderer.hitTest(pos.x, pos.y);

  if (mode === 'select') {
    if (hitArea) {
      stateManager.selectArea(hitArea.id);
      isDragging = true;
      dragArea = hitArea;
      dragOffset = { x: pos.x - hitArea.x, y: pos.y - hitArea.y };
    } else if (hitPath) {
      stateManager.selectPath(hitPath.id);
    } else {
      stateManager.clearSelection();
    }
  } else if (mode === 'addArea') {
    const area = createArea({
      name: `Area ${scenario.areas.length + 1}`,
      x: pos.x,
      y: pos.y,
    });
    scenario.areas.push(area);
    stateManager.selectArea(area.id);
    stateManager.emit('scenarioUpdated', scenario);
  } else if (mode === 'addPath') {
    if (hitArea) {
      if (!stateManager.state.pathDrawing) {
        stateManager.state.pathDrawing = { fromAreaId: hitArea.id };
        animEngine.addToast(`Selected "${hitArea.name}" — now click the destination area`, 'info');
      } else {
        const fromId = stateManager.state.pathDrawing.fromAreaId;
        if (fromId !== hitArea.id) {
          const fromArea = scenario.areas.find(a => a.id === fromId);
          const path = createPath({
            fromAreaId: fromId,
            toAreaId: hitArea.id,
            name: `${fromArea?.name || 'A'} → ${hitArea.name}`,
            isOpen: true,
          });
          scenario.paths.push(path);
          stateManager.selectPath(path.id);
          stateManager.emit('scenarioUpdated', scenario);
          animEngine.addToast(`Path created: ${path.name}`, 'success');
        }
        stateManager.state.pathDrawing = null;
      }
    }
  } else if (mode === 'delete') {
    if (hitArea) {
      scenario.paths = scenario.paths.filter(p => p.fromAreaId !== hitArea.id && p.toAreaId !== hitArea.id);
      scenario.rules = scenario.rules.filter(r => r.areaId !== hitArea.id);
      scenario.areas = scenario.areas.filter(a => a.id !== hitArea.id);
      stateManager.clearSelection();
      stateManager.emit('scenarioUpdated', scenario);
      animEngine.addToast(`Deleted area: ${hitArea.name}`, 'warning');
    } else if (hitPath) {
      scenario.paths = scenario.paths.filter(p => p.id !== hitPath.id);
      stateManager.clearSelection();
      stateManager.emit('scenarioUpdated', scenario);
      animEngine.addToast(`Deleted path: ${hitPath.name}`, 'warning');
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const pos = animEngine.getCanvasCoords(e.clientX, e.clientY);

  if (isDragging && dragArea) {
    dragArea.x = pos.x - dragOffset.x;
    dragArea.y = pos.y - dragOffset.y;
    return;
  }

  // Hover effect
  const hitArea = areaRenderer.hitTest(pos.x, pos.y);
  areaRenderer.hoverAreaId = hitArea?.id || null;
  canvas.style.cursor = hitArea ? 'pointer' : (
    stateManager.state.editMode === 'addArea' ? 'crosshair' : 'default'
  );
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
  dragArea = null;
});

canvas.addEventListener('mouseleave', () => {
  isDragging = false;
  dragArea = null;
  areaRenderer.hoverAreaId = null;
});

// ── Keyboard shortcuts ──
document.addEventListener('keydown', async (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key === '1') stateManager.setEditMode('select');
  if (e.key === '2') stateManager.setEditMode('addArea');
  if (e.key === '3') stateManager.setEditMode('addPath');
  if (e.key === '4') stateManager.setEditMode('delete');
  if (e.key === 'Escape') {
    stateManager.clearSelection();
    stateManager.setEditMode('select');
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return;
    if (stateManager.state.selectedAreaId) {
      const area = scenario.areas.find(a => a.id === stateManager.state.selectedAreaId);
      if (area) {
        const confirmed = await Modal.confirm({ title: 'Delete Area', message: `Delete area "${area.name}" and its associated paths?`, confirmText: 'Delete', danger: true });
        if (confirmed) {
          scenario.paths = scenario.paths.filter(p => p.fromAreaId !== area.id && p.toAreaId !== area.id);
          scenario.rules = scenario.rules.filter(r => r.areaId !== area.id);
          scenario.areas = scenario.areas.filter(a => a.id !== area.id);
          stateManager.clearSelection();
          stateManager.emit('scenarioUpdated', scenario);
        }
      }
    }
  }
});
