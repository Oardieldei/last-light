const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = {
  document: { createElement: () => ({ getContext: () => ({}) }) },
};
vm.createContext(context);
vm.runInContext(fs.readFileSync('js/config.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/levels.js', 'utf8'), context);
const CONFIG = vm.runInContext('CONFIG', context);
const LEVELS = vm.runInContext('LEVELS', context);

assert.strictEqual(LEVELS.length, 30, 'campaign must contain exactly 30 levels');
assert.deepStrictEqual(Array.from(LEVELS, (level) => level.name), [
  'Первый свет', 'Ориентир', 'Запас света', 'Осторожный шаг',
  'Кто-то в темноте', 'Взгляд дальше', 'Два пути', 'Безопасный обход',
  'Разбудить или обойти', 'Через стекло', 'Тёмные комнаты',
  'Нежелательная встреча', 'Дальний взгляд', 'Цена короткого пути',
  'Первая комбинация', 'Развилка', 'Что за стеной', 'Свет и риск',
  'Экономия', 'Разведка', 'Преследование', 'Освещённые острова',
  'Оптический маршрут', 'Выбор риска', 'Тёмный зал', 'Сначала посмотри',
  'Остаток заряда', 'Три угрозы', 'Последняя разведка', 'Последний огонёк',
]);
const countsAt = (number) => {
  const level = LEVELS[number - 1];
  return [level.batteries.length, level.candles.length, level.traps.length,
    level.monsters.length, level.lenses.length];
};
assert.deepStrictEqual(countsAt(1), [0, 0, 0, 0, 0]);
assert.deepStrictEqual(countsAt(2), [0, 2, 0, 0, 0]);
assert.deepStrictEqual(countsAt(3), [2, 0, 0, 0, 0]);
assert.deepStrictEqual(countsAt(4), [0, 0, 2, 0, 0]);
assert.deepStrictEqual(countsAt(5), [0, 0, 0, 1, 0]);
assert.deepStrictEqual(countsAt(6), [1, 0, 0, 0, 1]);
assert.deepStrictEqual(countsAt(11), [2, 2, 3, 0, 0]);
assert.deepStrictEqual(countsAt(13), [1, 0, 0, 0, 2]);
assert.deepStrictEqual(countsAt(18), [0, 0, 0, 2, 0]);
assert.deepStrictEqual(countsAt(23), [2, 1, 1, 0, 3]);
assert.deepStrictEqual(countsAt(30), [3, 3, 5, 3, 3]);

const pointInExpandedRect = (x, y, rect, pad) =>
  x > rect.x - pad && x < rect.x + rect.width + pad &&
  y > rect.y - pad && y < rect.y + rect.height + pad;

function validateReachability(level, targets) {
  const cell = 30;
  const cols = Math.ceil(level.width / cell);
  const rows = Math.ceil(level.height / cell);
  const blocked = (col, row) => {
    const x = (col + 0.5) * cell;
    const y = (row + 0.5) * cell;
    if (x < CONFIG.playerRadius || y < CONFIG.playerRadius ||
        x > level.width - CONFIG.playerRadius || y > level.height - CONFIG.playerRadius) return true;
    return level.walls.some((wall) => pointInExpandedRect(x, y, wall, CONFIG.playerRadius));
  };
  const toCell = ({ x, y }) => [
    Math.max(0, Math.min(cols - 1, Math.floor(x / cell))),
    Math.max(0, Math.min(rows - 1, Math.floor(y / cell))),
  ];
  const [startCol, startRow] = toCell(level.playerStart);
  assert(!blocked(startCol, startRow), `${level.name}: start grid cell blocked`);
  const queue = [[startCol, startRow]];
  const distance = new Int32Array(cols * rows);
  distance.fill(-1);
  distance[startRow * cols + startCol] = 0;
  for (let head = 0; head < queue.length; head++) {
    const [col, row] = queue[head];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows || blocked(nc, nr)) continue;
      const index = nr * cols + nc;
      if (distance[index] >= 0) continue;
      distance[index] = distance[row * cols + col] + 1;
      queue.push([nc, nr]);
    }
  }
  for (const target of targets) {
    const [col, row] = toCell(target);
    assert(distance[row * cols + col] >= 0,
      `${level.name}: unreachable ${target.kind} at ${target.x},${target.y}`);
  }
  const doorCell = toCell({
    x: level.door.x + level.door.width / 2,
    y: level.door.y + level.door.height / 2,
  });
  return distance[doorCell[1] * cols + doorCell[0]] * cell;
}

const routeLengths = [];
LEVELS.forEach((level, index) => {
  const label = `level ${index + 1} (${level.name})`;
  assert(level.width >= 1500 && level.height >= 2200, `${label}: map too small`);
  assert(level.width <= 2700 && level.height <= 3700, `${label}: map unexpectedly huge`);
  assert(level.playerStart.x > 20 && level.playerStart.x < level.width - 20 &&
    level.playerStart.y > 20 && level.playerStart.y < level.height - 20, `${label}: start out of bounds`);
  assert(level.door.x >= 20 && level.door.y >= 20 &&
    level.door.x + level.door.width <= level.width - 20 &&
    level.door.y + level.door.height <= level.height - 20, `${label}: door out of bounds`);
  assert(Math.hypot(level.playerStart.x - (level.door.x + level.door.width / 2),
    level.playerStart.y - (level.door.y + level.door.height / 2)) > 1200,
  `${label}: start and door too close`);
  assert(level.monsters.length <= 3 && level.lenses.length <= 3 &&
    level.batteries.length <= 3 && level.candles.length <= 4 && level.traps.length <= 5,
  `${label}: object density exceeds campaign limits`);

  const points = [
    { ...level.playerStart, kind: 'start', pad: CONFIG.playerRadius },
    ...level.batteries.map((item) => ({ ...item, kind: 'battery', pad: 10 })),
    ...level.candles.map((item) => ({ ...item, kind: 'candle', pad: 10 })),
    ...level.monsters.map((item) => ({ ...item, kind: 'monster', pad: CONFIG.monsterRadius })),
    ...level.lenses.map((item) => ({ ...item, kind: 'lens', pad: 60 })),
  ];
  for (const point of points) {
    assert(point.x > point.pad && point.x < level.width - point.pad &&
      point.y > point.pad && point.y < level.height - point.pad,
    `${label}: ${point.kind} outside safe bounds`);
    assert(!level.walls.some((wall) => pointInExpandedRect(point.x, point.y, wall, point.pad)),
      `${label}: ${point.kind} overlaps/is too close to wall`);
  }
  for (const trap of level.traps) {
    assert(trap.x >= 20 && trap.y >= 20 &&
      trap.x + trap.width <= level.width - 20 && trap.y + trap.height <= level.height - 20,
    `${label}: trap out of bounds`);
    assert(!level.walls.some((wall) =>
      trap.x < wall.x + wall.width && trap.x + trap.width > wall.x &&
      trap.y < wall.y + wall.height && trap.y + trap.height > wall.y),
    `${label}: trap overlaps wall`);
  }
  const objectPoints = points.filter((point) => point.kind !== 'start');
  for (let a = 0; a < objectPoints.length; a++) {
    for (let b = a + 1; b < objectPoints.length; b++) {
      assert(Math.hypot(objectPoints[a].x - objectPoints[b].x,
        objectPoints[a].y - objectPoints[b].y) >= 32,
      `${label}: ${objectPoints[a].kind} overlaps ${objectPoints[b].kind}`);
    }
    for (const trap of level.traps) {
      assert(!pointInExpandedRect(objectPoints[a].x, objectPoints[a].y, trap, 14),
        `${label}: ${objectPoints[a].kind} overlaps trap`);
    }
  }
  const targets = [
    { x: level.door.x + level.door.width / 2,
      y: level.door.y + level.door.height / 2, kind: 'door' },
    ...points.filter((point) => point.kind !== 'start'),
  ];
  const routeLength = validateReachability(level, targets);
  assert(routeLength > 0, `${label}: door unreachable`);
  routeLengths.push(routeLength);
});

// Full charge gives 40 seconds of actual motion. Early ideal routes keep a generous
// reserve; longer maps may need resources, but never every battery on their ideal route.
const fullChargeDistance = CONFIG.playerSpeed * CONFIG.chargeMax / CONFIG.chargeDrainPerSec;
console.log('Ideal route lengths:', routeLengths.join(', '));
assert(routeLengths.slice(0, 6).every((length) => length < fullChargeDistance * 0.72),
  'early levels need more no-battery reserve');
assert(routeLengths.every((length, index) => {
  const batteriesThatMayBeRequired = Math.max(0, LEVELS[index].batteries.length - 1);
  return length < fullChargeDistance +
    batteriesThatMayBeRequired * CONFIG.batteryChargeGain / CONFIG.chargeDrainPerSec *
      CONFIG.playerSpeed;
}), 'an ideal route must leave at least one battery optional');

// Balance pass with a modest 12% route/exploration allowance. Enumerate short
// battery orders, apply charge per leg, respect the 100 cap, and leave one pickup unused.
function gridDistance(level, from, to, blockers = level.walls) {
  const cell = 30;
  const cols = Math.ceil(level.width / cell);
  const rows = Math.ceil(level.height / cell);
  const toCell = (point) => [Math.floor(point.x / cell), Math.floor(point.y / cell)];
  const [startCol, startRow] = toCell(from);
  const [targetCol, targetRow] = toCell(to);
  const distance = new Int32Array(cols * rows);
  distance.fill(-1);
  distance[startRow * cols + startCol] = 0;
  const queue = [[startCol, startRow]];
  for (let head = 0; head < queue.length; head++) {
    const [col, row] = queue[head];
    if (col === targetCol && row === targetRow) return distance[row * cols + col] * cell;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nr < 0 || nc >= cols || nr >= rows) continue;
      const x = (nc + 0.5) * cell, y = (nr + 0.5) * cell;
      if (blockers.some((wall) =>
        pointInExpandedRect(x, y, wall, CONFIG.playerRadius))) continue;
      const key = nr * cols + nc;
      if (distance[key] >= 0) continue;
      distance[key] = distance[row * cols + col] + 1;
      queue.push([nc, nr]);
    }
  }
  return Infinity;
}

function batteryOrders(count) {
  const result = [[]];
  const build = (prefix, unused, length) => {
    if (prefix.length === length) {
      result.push(prefix);
      return;
    }
    unused.forEach((value, index) => build(
      [...prefix, value], unused.filter((_, other) => other !== index), length
    ));
  };
  const indexes = Array.from({ length: count }, (_, index) => index + 1);
  for (let length = 1; length <= count; length++) build([], indexes, length);
  return result;
}

const explorationFactor = 1.12;
LEVELS.forEach((level, index) => {
  const door = {
    x: level.door.x + level.door.width / 2,
    y: level.door.y + level.door.height / 2,
  };
  const nodes = [level.playerStart, ...level.batteries, door];
  assert(Number.isFinite(gridDistance(
    level, level.playerStart, door, [...level.walls, ...level.traps]
  )), `level ${index + 1} (${level.name}): traps block every route`);
  const distances = nodes.map((from) => nodes.map((to) => gridDistance(level, from, to)));
  let feasible = false;
  for (const order of batteryOrders(level.batteries.length)) {
    if (level.batteries.length > 0 && order.length === level.batteries.length) continue;
    let charge = CONFIG.chargeMax;
    let current = 0;
    let valid = true;
    for (const next of [...order, nodes.length - 1]) {
      const travel = distances[current][next] * explorationFactor;
      charge -= travel / CONFIG.playerSpeed * CONFIG.chargeDrainPerSec;
      if (charge < 0) {
        valid = false;
        break;
      }
      if (next < nodes.length - 1) {
        charge = Math.min(CONFIG.chargeMax, charge + CONFIG.batteryChargeGain);
      }
      current = next;
    }
    if (valid) feasible = true;
  }
  assert(feasible,
    `level ${index + 1} (${level.name}): no buffered route leaving a battery optional`);
});

console.log(`Validated 30 levels; ideal routes ${Math.min(...routeLengths)}-${Math.max(...routeLengths)} world units; full-charge travel ${fullChargeDistance}.`);

// Constructing and mutating runtime levels must never alter campaign templates.
vm.runInContext(fs.readFileSync('js/collision.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/monster.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/level.js', 'utf8'), context);
vm.runInContext(fs.readFileSync('js/lighting.js', 'utf8'), context);
const Level = vm.runInContext('Level', context);
const Lighting = vm.runInContext('Lighting', context);
const templatesBefore = JSON.stringify(LEVELS);
LEVELS.forEach((template, index) => {
  const runtime = new Level(template, index);
  const otherRuntime = new Level(template, index);
  if (runtime.batteries[0]) runtime.batteries[0].collected = true;
  if (runtime.candles[0]) runtime.candles[0].active = true;
  if (runtime.monsters[0]) runtime.monsters[0].activate();
  if (runtime.lenses[0]) runtime.lenses[0].x += 1;
  if (runtime.traps[0]) runtime.traps[0].x += 1;
  runtime.walls[0].x += 1;
  runtime.door.x += 1;
  if (runtime.batteries[0]) assert.strictEqual(otherRuntime.batteries[0].collected, false);
  if (runtime.candles[0]) assert.strictEqual(otherRuntime.candles[0].active, false);
  if (runtime.monsters[0]) assert.strictEqual(otherRuntime.monsters[0].waking, false);
  if (runtime.lenses[0]) assert.notStrictEqual(runtime.lenses[0].x, otherRuntime.lenses[0].x);
  assert.notStrictEqual(runtime.walls[0].x, otherRuntime.walls[0].x);
  assert.notStrictEqual(runtime.door.x, otherRuntime.door.x);
  if (runtime.traps[0]) assert.notStrictEqual(runtime.traps[0].x, otherRuntime.traps[0].x);
});
assert.strictEqual(JSON.stringify(LEVELS), templatesBefore,
  'runtime construction/state must not mutate immutable templates');

// Every lens must be usable from both axial sides at ordinary primary range, and
// neither secondary center ray may be swallowed by an adjacent wall.
const lighting = new Lighting();
let lensCount = 0;
LEVELS.forEach((template, index) => {
  const level = new Level(template, index);
  for (const lens of level.lenses) {
    lensCount += 1;
    const axisX = Math.cos(lens.angle), axisY = Math.sin(lens.angle);
    const segments = lighting.collectSegments(level).segments;
    for (const sign of [-1, 1]) {
      const player = {
        x: lens.x - axisX * sign * 160,
        y: lens.y - axisY * sign * 160,
        lookDirection: { x: axisX * sign, y: axisY * sign },
      };
      assert(!level.walls.some((wall) =>
        pointInExpandedRect(player.x, player.y, wall, CONFIG.playerRadius)),
      `level ${index + 1}: lens axial approach blocked`);
      const flashlight = lighting.directionalFlashlight(
        level, player, CONFIG.chargeMax, 0
      );
      assert.strictEqual(lighting.lensSecondaryLights(
        level, player, CONFIG.chargeMax, 0, flashlight
      ).length, 1, `level ${index + 1}: lens cannot activate from both sides`);
      const direction = lens.angle + (sign < 0 ? Math.PI : 0);
      assert(lighting.nearestIntersection(
        lens.x, lens.y, direction, lens.range, segments
      ).dist >= 180, `level ${index + 1}: secondary light immediately hits a wall`);
    }
  }
  const spawnPlayer = {
    x: level.playerStart.x, y: level.playerStart.y,
    lookDirection: { x: 0, y: 1 },
  };
  for (const monster of level.monsters) {
    assert(!lighting.isCircleInDirectionalFlashlight(
      level, spawnPlayer, CONFIG.chargeMax, 0,
      monster.x, monster.y, CONFIG.monsterVisualRadius
    ), `level ${index + 1}: monster wakes in the default spawn beam`);
    assert(!level.walls.some((wall) =>
      pointInExpandedRect(monster.x, monster.y, wall, 80)),
    `level ${index + 1}: monster lacks pursuit space`);
    assert(monster.findPath(level, level.playerStart.x, level.playerStart.y).length > 0,
      `level ${index + 1}: monster cannot path to spawn`);
  }
});
assert(lensCount >= 20, 'lens campaign coverage unexpectedly changed');
