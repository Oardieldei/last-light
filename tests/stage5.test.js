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
  'js/config.js', 'js/levels.js', 'js/collision.js', 'js/monster.js', 'js/level.js',
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
const LEVELS = get('LEVELS');

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

  // Заметное смещение (около 27° от оси) входит в широкий activation sector.
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 300, y: 400, lookDirection: { x: 1, y: 0.5 } }).length, 1);
  // Почти боковое положение (около 70°) по-прежнему отклоняется.
  assert.strictEqual(secondaryFor(lighting, level,
    { x: 465, y: 404, lookDirection: { x: 35, y: 96 } }).length, 0);
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

// Distance response is smooth: near lenses produce a longer and brighter diffuse
// field, while maximum-distance activation remains useful.
{
  const lighting = new Lighting();
  const level = levelWith([], [{
    x: 500, y: 500, angle: 0, radius: 12,
    range: CONFIG.lensSecondaryRange, fovDeg: CONFIG.lensSecondaryFovDeg,
  }]);
  const near = secondaryFor(lighting, level,
    { x: 440, y: 500, lookDirection: { x: 1, y: 0 } })[0];
  const far = secondaryFor(lighting, level,
    { x: 220, y: 500, lookDirection: { x: 1, y: 0 } })[0];
  assert(near && far);
  assert(near.range > far.range);
  assert(near.alpha > far.alpha);
  assert(near.strength > far.strength);
  assert(far.range >= CONFIG.lensSecondaryMinRange);
  assert(far.alpha >= CONFIG.lensSecondaryMinAlpha);
  assert.strictEqual(near.layers.length, 3);
  assert(near.points.length >= 2);

  const offsetAngle = 55 * Math.PI / 180;
  const offset = secondaryFor(lighting, level, {
    x: 500 - Math.cos(offsetAngle) * 60,
    y: 500 - Math.sin(offsetAngle) * 60,
    lookDirection: { x: Math.cos(offsetAngle), y: Math.sin(offsetAngle) },
  })[0];
  assert(offset, 'a substantial 55-degree offset must remain usable');
  assert(near.alignment > offset.alignment);
  assert(near.range > offset.range, 'straight incidence must be strongest');
}

// Regression: the gameplay aperture must match the visibly rendered lens. At 200
// units this beam edge touches the outer glass but misses the old 35%-radius core.
{
  const lighting = new Lighting();
  const level = levelWith();
  const edgeAngle = 31.5 * Math.PI / 180;
  const player = {
    x: 300, y: 500,
    lookDirection: { x: Math.cos(edgeAngle), y: Math.sin(edgeAngle) },
  };
  assert.strictEqual(secondaryFor(lighting, level, player).length, 1,
    'visible primary-beam contact must activate the full lens aperture');
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

// A full-width blocker also clips every layer of the new 100° diffuse field.
{
  const lighting = new Lighting();
  const level = levelWith([{ x: 600, y: 20, width: 10, height: 960 }], [{
    x: 500, y: 500, angle: 0, radius: 12,
    range: CONFIG.lensSecondaryRange, fovDeg: CONFIG.lensSecondaryFovDeg,
  }]);
  const [light] = secondaryFor(lighting, level,
    { x: 300, y: 500, lookDirection: { x: 1, y: 0 } });
  assert(light);
  assert(light.layers.every((layer) =>
    layer.points.every((point) => point.x <= 610 + 1e-6)));
}

// Real campaign regression: tutorial lenses and representative late lenses activate
// from both axial sides, reject side incidence/turned-away beams, and reveal their
// deliberately placed object through secondary-only geometry.
{
  const lighting = new Lighting();
  for (const number of [6, 10, 15, 23, 26, 30]) {
    const level = new Level(LEVELS[number - 1], number - 1);
    const lens = level.lenses[0];
    const axis = { x: Math.cos(lens.angle), y: Math.sin(lens.angle) };
    for (const side of [-1, 1]) {
      const player = {
        x: lens.x - axis.x * side * 160,
        y: lens.y - axis.y * side * 160,
        lookDirection: { x: axis.x * side, y: axis.y * side },
      };
      assert.strictEqual(secondaryFor(lighting, level, player).length, 1,
        `campaign level ${number}: lens must work from side ${side}`);
    }

    const upstream = {
      x: lens.x - axis.x * 160,
      y: lens.y - axis.y * 160,
      lookDirection: { x: axis.x, y: axis.y },
    };
    const [secondary] = secondaryFor(lighting, level, upstream);
    assert(secondary && secondary.points.length >= 2,
      `campaign level ${number}: secondary polygon must be visible`);
    const secondaryPolygon = [
      { x: secondary.ox, y: secondary.oy }, ...secondary.points,
    ];
    const targets = [
      ...level.batteries, ...level.candles, ...level.monsters,
      ...level.traps.map((trap) => ({
        x: trap.x + trap.width / 2, y: trap.y + trap.height / 2,
      })),
    ];
    assert(targets.some((target) => lighting.pointInPolygon(
      target.x, target.y, secondaryPolygon
    )), `campaign level ${number}: first lens must reveal its planned object`);

    const turnedAway = {
      ...upstream,
      lookDirection: { x: -axis.x, y: -axis.y },
    };
    assert.strictEqual(secondaryFor(lighting, level, turnedAway).length, 0,
      `campaign level ${number}: turning away must remove secondary light`);
    const sidePlayer = {
      x: lens.x - axis.y * 160,
      y: lens.y + axis.x * 160,
      lookDirection: { x: axis.y, y: -axis.x },
    };
    assert.strictEqual(secondaryFor(lighting, level, sidePlayer).length, 0,
      `campaign level ${number}: side incidence must not activate lens`);

    const offsetAngle = lens.angle + 35 * Math.PI / 180;
    const offsetPlayer = {
      x: lens.x - Math.cos(offsetAngle) * 160,
      y: lens.y - Math.sin(offsetAngle) * 160,
      lookDirection: { x: Math.cos(offsetAngle), y: Math.sin(offsetAngle) },
    };
    assert.strictEqual(secondaryFor(lighting, level, offsetPlayer).length, 1,
      `campaign level ${number}: broad off-axis approach must remain usable`);
  }

  // A lens is not cover: move inside normal primary range on level 15 and the monster
  // directly behind the lens is still a primary hit.
  const level15 = new Level(LEVELS[14], 14);
  const lens = level15.lenses[0];
  const monster = level15.monsters[0];
  const axis = { x: Math.cos(lens.angle), y: Math.sin(lens.angle) };
  const closePlayer = {
    x: lens.x - axis.x * 40,
    y: lens.y - axis.y * 40,
    lookDirection: axis,
  };
  assert.strictEqual(lighting.isCircleInDirectionalFlashlight(
    level15, closePlayer, CONFIG.chargeMax, 0,
    monster.x, monster.y, CONFIG.monsterVisualRadius
  ), true, 'campaign lens must not shield a monster from direct primary light');

  const scoutingPlayer = {
    x: lens.x - axis.x * 160,
    y: lens.y - axis.y * 160,
    lookDirection: axis,
  };
  const [scoutingLight] = secondaryFor(lighting, level15, scoutingPlayer);
  assert(lighting.pointInPolygon(monster.x, monster.y, [
    { x: scoutingLight.ox, y: scoutingLight.oy }, ...scoutingLight.points,
  ]), 'level 15 monster must be visible in secondary light');
  assert.strictEqual(lighting.isCircleInDirectionalFlashlight(
    level15, scoutingPlayer, CONFIG.chargeMax, 0,
    monster.x, monster.y, CONFIG.monsterVisualRadius
  ), false, 'secondary-only monster must not be a primary activation hit');
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
