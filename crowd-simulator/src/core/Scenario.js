/**
 * Scenario — Data model factories for the crowd simulator.
 */

let _idCounter = Date.now();
export function genId() {
  return (++_idCounter).toString(36);
}

export function createScenario({ name = 'Untitled Scenario', description = '', areas = [], paths = [], rules = [] } = {}) {
  return {
    id: genId(),
    name,
    description,
    areas: areas.map(a => ({ ...createArea(), ...a })),
    paths: paths.map(p => ({ ...createPath(), ...p })),
    rules: rules.map(r => ({ ...createRule(), ...r })),
    createdAt: Date.now(),
  };
}

export function createArea({
  name = 'New Area',
  x = 400,
  y = 300,
  width = 160,
  height = 100,
  monitored = false,
  currentCount = 0,
  maxCapacity = 1000,
  color = null,
} = {}) {
  return {
    id: genId(),
    name,
    x, y, width, height,
    monitored,
    currentCount,
    maxCapacity,
    color,
    status: 'normal', // 'normal' | 'caution' | 'critical'
    lastImage: null,
  };
}

export function createPath({
  fromAreaId = null,
  toAreaId = null,
  name = 'Path',
  capacity = 100,
  isOpen = true,
  bidirectional = true,
} = {}) {
  return {
    id: genId(),
    fromAreaId,
    toAreaId,
    name,
    capacity,
    isOpen,
    bidirectional,
    animationPhase: 0,
  };
}

export function createRule({
  areaId = null,
  type = 'MIN_PATHS',
  direction = 'outgoing',
  minPaths = 1,
  conditions = [],
  description = '',
} = {}) {
  return {
    id: genId(),
    areaId,
    type,       // 'MIN_PATHS' | 'THRESHOLD'
    direction,  // 'outgoing' | 'incoming' | 'both'
    minPaths,   // for MIN_PATHS type
    conditions, // for THRESHOLD type: [{ threshold, minPaths, direction }]
    description,
    active: true,
  };
}

export function cloneScenario(scenario, newName) {
  const clone = JSON.parse(JSON.stringify(scenario));
  clone.id = genId();
  clone.name = newName || `${scenario.name} (Copy)`;
  clone.createdAt = Date.now();
  // Re-generate IDs for all internal objects and fix references
  const idMap = {};
  clone.areas.forEach(a => {
    const old = a.id;
    a.id = genId();
    idMap[old] = a.id;
  });
  clone.paths.forEach(p => {
    p.id = genId();
    if (idMap[p.fromAreaId]) p.fromAreaId = idMap[p.fromAreaId];
    if (idMap[p.toAreaId]) p.toAreaId = idMap[p.toAreaId];
  });
  clone.rules.forEach(r => {
    r.id = genId();
    if (idMap[r.areaId]) r.areaId = idMap[r.areaId];
  });
  return clone;
}
