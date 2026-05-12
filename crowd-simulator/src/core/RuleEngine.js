/**
 * RuleEngine — Evaluates rules when crowd counts change and triggers pathway updates.
 */
import { stateManager } from './StateManager.js';

export class RuleEngine {
  constructor() {
    stateManager.on('evaluateRules', ({ areaId }) => this.evaluate(areaId));
  }

  evaluate(triggerAreaId) {
    const scenario = stateManager.getActiveScenario();
    if (!scenario) return;

    const changes = [];

    for (const rule of scenario.rules) {
      if (!rule.active) continue;
      const area = scenario.areas.find(a => a.id === rule.areaId);
      if (!area) continue;

      if (rule.type === 'MIN_PATHS') {
        changes.push(...this._evaluateMinPaths(scenario, area, rule));
      } else if (rule.type === 'THRESHOLD') {
        changes.push(...this._evaluateThreshold(scenario, area, rule));
      }
    }

    // Apply changes
    if (changes.length > 0) {
      this._applyChanges(scenario, changes);
    }

    // Update area statuses
    this._updateAreaStatuses(scenario);
  }

  _getAreaPaths(scenario, area, direction) {
    return scenario.paths.filter(p => {
      if (direction === 'outgoing') {
        return p.fromAreaId === area.id || (p.bidirectional && p.toAreaId === area.id);
      } else if (direction === 'incoming') {
        return p.toAreaId === area.id || (p.bidirectional && p.fromAreaId === area.id);
      }
      return p.fromAreaId === area.id || p.toAreaId === area.id;
    });
  }

  _evaluateMinPaths(scenario, area, rule) {
    const changes = [];
    const paths = this._getAreaPaths(scenario, area, rule.direction);
    const openPaths = paths.filter(p => p.isOpen);

    if (openPaths.length < rule.minPaths) {
      // Need to open more paths
      const closedPaths = paths.filter(p => !p.isOpen);
      const toOpen = Math.min(rule.minPaths - openPaths.length, closedPaths.length);
      for (let i = 0; i < toOpen; i++) {
        changes.push({ pathId: closedPaths[i].id, isOpen: true, reason: `Rule: Min ${rule.minPaths} ${rule.direction} paths for ${area.name}` });
      }
    }
    return changes;
  }

  _evaluateThreshold(scenario, area, rule) {
    const changes = [];
    const count = area.currentCount;

    // Sort conditions by threshold descending to apply highest matching rule
    const sorted = [...rule.conditions].sort((a, b) => b.threshold - a.threshold);

    for (const cond of sorted) {
      if (count >= cond.threshold) {
        const dir = cond.direction || rule.direction || 'outgoing';
        const paths = this._getAreaPaths(scenario, area, dir);
        const openPaths = paths.filter(p => p.isOpen);

        if (openPaths.length < cond.minPaths) {
          const closedPaths = paths.filter(p => !p.isOpen);
          const toOpen = Math.min(cond.minPaths - openPaths.length, closedPaths.length);
          for (let i = 0; i < toOpen; i++) {
            changes.push({
              pathId: closedPaths[i].id,
              isOpen: true,
              reason: `Threshold: count ${count} ≥ ${cond.threshold} → need ${cond.minPaths} ${dir} paths for ${area.name}`
            });
          }
        }
        break; // Only apply highest matching threshold
      }
    }
    return changes;
  }

  _applyChanges(scenario, changes) {
    const applied = [];
    for (const change of changes) {
      const path = scenario.paths.find(p => p.id === change.pathId);
      if (path && path.isOpen !== change.isOpen) {
        path.isOpen = change.isOpen;
        applied.push(change);
      }
    }
    if (applied.length > 0) {
      stateManager.emit('pathsUpdated', applied);
      stateManager.emit('ruleTriggered', applied);
    }
  }

  _updateAreaStatuses(scenario) {
    for (const area of scenario.areas) {
      const ratio = area.currentCount / area.maxCapacity;
      let newStatus;
      if (ratio >= 0.8) newStatus = 'critical';
      else if (ratio >= 0.5) newStatus = 'caution';
      else newStatus = 'normal';

      if (area.status !== newStatus) {
        area.status = newStatus;
        stateManager.emit('areaStatusChanged', { areaId: area.id, status: newStatus });
      }
    }
  }
}

export const ruleEngine = new RuleEngine();
