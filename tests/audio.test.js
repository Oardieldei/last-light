const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class FakeAudio {
  constructor(src) {
    this.src = src; this.paused = true; this.ended = false; this.duration = 0.3;
    this.currentTime = 0; this.volume = 0; this.playbackRate = 1; this.plays = 0;
  }
  load() {}
  play() { this.paused = false; this.plays += 1; return Promise.resolve(); }
  pause() { this.paused = true; }
}
const storage = {
  value: null,
  getItem() { return this.value; },
  setItem(_, value) { this.value = value; },
};
const sandbox = {
  console, Audio: FakeAudio, setTimeout, clearTimeout,
  window: { Audio: FakeAudio, localStorage: storage },
  document: { addEventListener() {} },
};
vm.createContext(sandbox);
for (const file of ['js/config.js', 'js/audio.js']) {
  vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
}
const AudioManager = vm.runInContext('AudioManager', sandbox);
const CONFIG = vm.runInContext('CONFIG', sandbox);

function manager() { const audio = new AudioManager({ storage, AudioClass: FakeAudio }); audio.unlock(); return audio; }

// Only waking/active ghosts participate, and the nearest threat controls response.
{
  const audio = manager();
  const player = { x: 0, y: 0 };
  audio.updateHeartbeat(0.05, player, [{ x: 10, y: 0, active: false, waking: false }]);
  assert.strictEqual(audio.heartbeatActive, false);
  audio.updateHeartbeat(0.05, player, [
    { x: 900, y: 0, active: true, waking: false },
    { x: 150, y: 0, active: false, waking: true },
  ]);
  assert.strictEqual(audio.heartbeatActive, true);
  assert(audio.heartbeatVolume > 0 && audio.heartbeatVolume < CONFIG.heartbeatMaxVolume,
    'first close heartbeat frame must fade in rather than jump to target volume');
  assert(audio.heartbeatRate > 1 && audio.heartbeatRate < CONFIG.heartbeatMaxPlaybackRate);
  for (let i = 0; i < 20; i++) audio.updateHeartbeat(0.05, player,
    [{ x: 150, y: 0, active: true, waking: false }]);
  const closeVolume = audio.heartbeatVolume;
  audio.sounds.heart.paused = true;
  audio.updateHeartbeat(0.2, player, [{ x: 900, y: 0, active: true, waking: false }]);
  assert(audio.heartbeatVolume < closeVolume, 'distance response must smoothly become quieter');
}

// Footsteps use resolved world distance, alternate, and standing cannot emit a step.
{
  const audio = manager();
  audio.updateFootsteps(CONFIG.footstepDistance - 1);
  assert.strictEqual(audio.sounds.footstep1.plays, 0);
  audio.updateFootsteps(2);
  assert.strictEqual(audio.sounds.footstep1.plays, 1);
  audio.updateFootsteps(CONFIG.footstepDistance);
  assert.strictEqual(audio.sounds.footstep2.plays, 1);
  for (let i = 0; i < 100; i++) audio.updateFootsteps(0);
  assert.strictEqual(audio.sounds.footstep1.plays, 1);
}

// Mute persists, immediately stops sounds, and does not replay muted events.
{
  const audio = manager();
  audio.play('door');
  audio.setMuted(true);
  assert.strictEqual(storage.value, 'true');
  assert.strictEqual(audio.sounds.door.paused, true);
  audio.play('trap');
  audio.setMuted(false);
  assert.strictEqual(audio.sounds.trap.plays, 0);
}

// Startup audio follows phase transitions and ignores repeated frames.
{
  const audio = manager();
  for (const phase of ['off', 'flash1', 'flash1', 'off1', 'flash2', 'off2', 'ramp', 'stable']) {
    audio.updateStartup(phase);
  }
  assert.strictEqual(audio.sounds.flashlightOn.plays, 3);
  assert.strictEqual(audio.sounds.flashlightOff.plays, 2);
}

console.log('audio tests passed');
