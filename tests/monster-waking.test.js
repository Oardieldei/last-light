const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

const context = {
  performance: { now: () => 0 },
  window: { addEventListener() {} },
};
vm.createContext(context);
for (const file of ['js/config.js', 'js/collision.js', 'js/monster.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), context);
}
const CONFIG = vm.runInContext('CONFIG', context);
const Monster = vm.runInContext('Monster', context);
const monster = new Monster(100, 100);
const level = { width: 1000, height: 1000, walls: [] };
const player = { x: 500, y: 100 };

monster.activate();
assert.strictEqual(monster.waking, true);
assert.strictEqual(monster.active, false);
monster.activate(); // repeated primary-light frames must not restart the countdown
monster.update(1.0, level, player);
assert.strictEqual(monster.x, 100);
assert.strictEqual(monster.wakeRemaining, 0.5);
monster.activate();
assert.strictEqual(monster.wakeRemaining, 0.5);
monster.update(0.49, level, player);
assert.strictEqual(monster.active, false);
monster.update(0.01, level, player);
assert.strictEqual(monster.waking, false);
assert.strictEqual(monster.active, true);
assert.strictEqual(monster.x, 100, 'transition frame must not shorten warning time');
monster.update(0.1, level, player);
assert(monster.x > 100, 'active monster must resume existing pursuit');
assert.strictEqual(CONFIG.monsterWakeDuration, 1.5);

const restarted = new Monster(100, 100);
assert.strictEqual(restarted.waking, false);
assert.strictEqual(restarted.active, false);
assert.strictEqual(restarted.wakeRemaining, 0);
// Waking contact deliberately keeps the warning safe; collision becomes lethal only
// when the same monster reaches active at the end of the countdown.
vm.runInContext(fs.readFileSync('js/game.js', 'utf8'), context);
const Game = vm.runInContext('Game', context);
const contactMonster = new Monster(100, 100);
contactMonster.activate();
contactMonster.wakeRemaining = 0.5;
let failures = 0;
const game = Object.create(Game.prototype);
Object.assign(game, {
  STATE: { PLAYING: 'PLAYING' }, state: 'PLAYING',
  player: {
    x: 100, y: 100, radius: CONFIG.playerRadius,
    update() {}, setMovement() {}, setLookAtWorld() {},
  },
  level: {
    walls: [], batteries: [], candles: [], traps: [], monsters: [contactMonster],
    door: { x: 800, y: 800, width: 50, height: 50 },
  },
  input: {
    consumeMouseLook: () => null, consumeTap: () => null,
    getMovement: () => ({ active: false }),
  },
  lighting: { isCircleInDirectionalFlashlight: () => false },
  world: { follow() {}, logicalToWorld() {} },
  charge: CONFIG.chargeMax, batteryInventory: 0, timeMs: 0,
  viewWidth: CONFIG.viewWidth, viewHeight: CONFIG.viewHeight,
  _syncHUD() {}, finishLevel() {}, failLevel() { failures += 1; },
});
game.update(0.49);
assert.strictEqual(failures, 0, 'waking contact must preserve the warning window');
game.update(0.01);
assert.strictEqual(failures, 1, 'contact becomes lethal when waking finishes');
console.log('Monster waking phase passed');
