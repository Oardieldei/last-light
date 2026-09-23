const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const sandbox = {
  console,
  performance: { now: () => 0 },
  window: { addEventListener() {} },
  document: {
    createElement() {
      return { getContext: () => ({}) };
    },
  },
};
vm.createContext(sandbox);
for (const file of [
  'js/config.js', 'js/collision.js', 'js/monster.js', 'js/level.js',
  'js/lighting.js', 'js/world.js', 'js/game.js',
]) {
  vm.runInContext(`${fs.readFileSync(file, 'utf8')}\n`, sandbox, { filename: file });
}
const get = (expression) => vm.runInContext(expression, sandbox);
const CONFIG = get('CONFIG');
const Lighting = get('Lighting');
const World = get('World');
const Level = get('Level');
const Game = get('Game');

function levelWith(walls = [], lenses = [{
  x: 500, y: 500, angle: 0, radius: 12, range: 400, fovDeg: 34,
}]) {
  return {
    width: 1000,
    height: 1000,
    walls: [
      ...walls,
      { x: 0, y: 0, width: 1000, height: 10 },
      { x: 0, y: 990, width: 1000, height: 10 },
      { x: 0, y: 0, width: 10, height: 1000 },
      { x: 990, y: 0, width: 10, height: 1000 },
    ],
    lenses,
  };
}

function secondaryFor(lighting, level, player, charge = CONFIG.chargeMax) {
  const flashlight = lighting.directionalFlashlight(level, player, charge, 0);
  return lighting.lensSecondaryLights(level, player, charge, 0, flashlight);
}

// Camera: inverse transforms, bounds, and centering of a world smaller than view.
{
  const world = new World();
  world.setLevel({ width: 3000, height: 3000 });
  world.follow(1500, 1500, CONFIG.viewWidth, CONFIG.viewHeight);
  const center = world.logicalToWorld(CONFIG.viewWidth / 2, CONFIG.viewHeight / 2,
    CONFIG.viewWidth, CONFIG.viewHeight);
  assert.strictEqual(center.x, 1500);
  assert.strictEqual(center.y, 1500);
  const right = world.logicalToWorld(CONFIG.viewWidth, CONFIG.viewHeight / 2,
    CONFIG.viewWidth, CONFIG.viewHeight);
  assert.strictEqual(right.x - center.x, CONFIG.viewWidth / 2 / CONFIG.cameraZoom);
  const lighting = new Lighting();
  const projected = lighting.toViewport(right.x, right.y, world.camera,
    CONFIG.viewWidth, CONFIG.viewHeight);
  assert.strictEqual(projected.x, CONFIG.viewWidth);
  assert.strictEqual(projected.y, CONFIG.viewHeight / 2);
  world.follow(0, 3000, CONFIG.viewWidth, CONFIG.viewHeight);
  assert.strictEqual(world.camera.x, CONFIG.viewWidth / 2 / CONFIG.cameraZoom);
  assert.strictEqual(world.camera.y,
    3000 - CONFIG.viewHeight / 2 / CONFIG.cameraZoom);

  world.setLevel({ width: 240, height: 400 });
  world.follow(20, 20, CONFIG.viewWidth, CONFIG.viewHeight);
  assert.strictEqual(world.camera.x, 120);
  assert.strictEqual(world.camera.y, 200);
}

// Lens: both sides, angle/FOV/range/charge, primary occlusion, and independent lenses.
{
  const lighting = new Lighting();
  let level = levelWith();
  let player = { x: 300, y: 500, lookDirection: { x: 1, y: 0 } };
  let lights = secondaryFor(lighting, level, player);
  assert.strictEqual(lights.length, 1);
  assert.strictEqual(lights[0].ox, 500);
  assert(Math.cos(lights[0].angle) > 0.99);

  player = { x: 700, y: 500, lookDirection: { x: -1, y: 0 } };
  lights = secondaryFor(lighting, level, player);
  assert.strictEqual(lights.length, 1);
  assert(Math.cos(lights[0].angle) < -0.99);

  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 400, lookDirection: { x: 1, y: 1 } }).length, 0);
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 100, y: 500, lookDirection: { x: 1, y: 0 } }).length, 0);
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } }, 0).length, 0);
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } }, 0.01).length, 0);

  level = levelWith([{ x: 395, y: 450, width: 10, height: 100 }]);
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } }).length, 0);

  level = levelWith([], [
    { x: 500, y: 500, angle: 0, radius: 12, range: 400, fovDeg: 34 },
    { x: 500, y: 700, angle: 0, radius: 12, range: 400, fovDeg: 34 },
  ]);
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } }).length, 1);
}

// A wall immediately after the lens, including a wall thinner than the old output
// offset, must stop every ray rather than being skipped by the secondary origin.
{
  const lighting = new Lighting();
  const level = levelWith([{ x: 501, y: 450, width: 2, height: 100 }]);
  const [light] = secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } });
  assert(light);
  assert(light.points.every((point) => point.x <= 503 + 1e-6));
}

// Level templates/runtime copies are independent and carry no activation state.
{
  const template = {
    name: 'test', width: 800, height: 800,
    playerStart: { x: 100, y: 100 },
    door: { x: 700, y: 700, width: 40, height: 40 },
    walls: [], lenses: [{ x: 300, y: 300, angle: 0 }],
  };
  const a = new Level(template, 0);
  const b = new Level(template, 0);
  a.lenses[0].x = 1;
  assert.strictEqual(b.lenses[0].x, 300);
  assert.strictEqual(template.lenses[0].x, 300);
  assert.strictEqual('active' in a.lenses[0], false);
}

// Game activation asks only for the primary directional flashlight. Local, candle,
// and lens light never enter this update path; every primary-hit monster activates.
{
  const lighting = new Lighting();
  const geometryLevel = levelWith([], [{
    x: 400, y: 500, angle: 0, radius: 12, range: 500, fovDeg: 34,
  }]);
  const player = { x: 300, y: 500, lookDirection: { x: 1, y: 0 } };
  // Lens is not an occluder/protector: a monster directly behind it in primary range hits.
  assert.strictEqual(lighting.isCircleInDirectionalFlashlight(
    geometryLevel, player, 100, 0, 500, 500, 10
  ), true);
  // A monster beyond primary range can be inside secondary light but is not a primary hit.
  assert.strictEqual(lighting.isCircleInDirectionalFlashlight(
    geometryLevel, player, 100, 0, 700, 500, 10
  ), false);

  let primaryChecks = 0;
  const monsters = [0, 1, 2].map((index) => ({
    x: 500 + index * 20, y: 500, radius: 10, active: false,
    activate() { this.active = true; }, update() {},
  }));
  const game = Object.create(Game.prototype);
  Object.assign(game, {
    STATE: { PLAYING: 'PLAYING' }, state: 'PLAYING',
    player: { x: 100, y: 100, radius: 10, update() {}, setMovement() {}, setLookAtWorld() {} },
    level: { walls: [], batteries: [], candles: [], traps: [], monsters,
      door: { x: 900, y: 900, width: 20, height: 20 } },
    input: { consumeMouseLook: () => null, consumeTap: () => null,
      getMovement: () => ({ active: false }) },
    lighting: { isCircleInDirectionalFlashlight: () => (++primaryChecks !== 2) },
    world: { follow() {}, logicalToWorld() {} }, ui: {}, charge: 100,
    batteryInventory: 0, timeMs: 0, viewWidth: 360, viewHeight: 640,
    _syncHUD() {}, failLevel() { throw new Error('unexpected failure'); }, finishLevel() {},
  });
  game.update(0);
  assert.strictEqual(primaryChecks, 3);
  assert.deepStrictEqual(monsters.map((monster) => monster.active), [true, false, true]);
}

console.log('Stage 5 regression tests passed');
