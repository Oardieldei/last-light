// Изолированный слой presentation-аудио. Он только получает уже свершившиеся
// gameplay-события/состояния и никогда не определяет их порядок или тайминги.
class AudioManager {
  constructor({ storage = window.localStorage, AudioClass = window.Audio } = {}) {
    this.storage = storage;
    this.AudioClass = AudioClass;
    this.muted = this._readMuted();
    this.unlocked = false;
    this.pendingVictory = null;
    this.footstepDistance = 0;
    this.nextFootstep = 0;
    this.heartbeatActive = false;
    this.heartbeatElapsed = 0;
    this.heartbeatVolume = 0;
    this.heartbeatRate = 1;
    this.startupPhase = 'off';

    const files = {
      batteryPickup: 'battery-pickup.mp3', batteryUse: 'battery-use.mp3',
      candleIgnite: 'candle-ignite.mp3', caught: 'caught.mp3', door: 'door.mp3',
      flashlightOff: 'flashlight-click-turn-off.mp3',
      flashlightOn: 'flashlight-click-turn-on.mp3', footstep1: 'footstep-1.mp3',
      footstep2: 'footstep-2.mp3', heart: 'heart.mp3',
      levelComplete: 'level-complete.mp3', trap: 'trap.mp3',
    };
    this.sounds = {};
    for (const [name, file] of Object.entries(files)) {
      const audio = new this.AudioClass(`sounds/${file}`);
      audio.preload = 'auto';
      audio.volume = 0;
      if (audio.load) audio.load();
      this.sounds[name] = audio;
    }

    this._unlock = () => this.unlock();
    document.addEventListener('pointerdown', this._unlock, { passive: true, once: true });
    document.addEventListener('keydown', this._unlock, { passive: true, once: true });
  }

  _readMuted() {
    try { return this.storage.getItem('last-light-muted') === 'true'; } catch (_) { return false; }
  }

  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    // Одного логического флага недостаточно для Safari/iOS: каждый media element
    // должен получить play() непосредственно внутри user gesture. Прайминг беззвучен
    // и не является очередью gameplay-событий.
    for (const audio of Object.values(this.sounds)) {
      const generation = audio._audioPlayGeneration || 0;
      audio.muted = true;
      const promise = audio.play();
      const finish = () => {
        // Не останавливаем реальный SFX, если он успел стартовать после прайминга.
        if ((audio._audioPlayGeneration || 0) !== generation) return;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      };
      if (promise && promise.then) promise.then(finish, finish);
      else finish();
    }
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    try { this.storage.setItem('last-light-muted', String(this.muted)); } catch (_) {}
    if (this.muted) this.stopAll();
    return this.muted;
  }

  toggleMute() { return this.setMuted(!this.muted); }

  _volume(name, scale = 1) {
    return Math.max(0, Math.min(1,
      CONFIG.audioMasterVolume * CONFIG.audioVolumes[name] * scale));
  }

  play(name, { volume = 1, rate = 1 } = {}) {
    if (this.muted || !this.unlocked) return false;
    const audio = this.sounds[name];
    if (!audio) return false;
    audio._audioPlayGeneration = (audio._audioPlayGeneration || 0) + 1;
    audio.muted = false;
    audio.pause();
    audio.currentTime = 0;
    audio.playbackRate = rate;
    audio.volume = this._volume(name, volume);
    const promise = audio.play();
    if (promise && promise.catch) promise.catch(() => {});
    return true;
  }

  stop(name) {
    const audio = this.sounds[name];
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  }

  stopAll() {
    for (const name of Object.keys(this.sounds)) this.stop(name);
    this.cancelVictory();
    this._resetContinuous();
  }

  _resetContinuous() {
    this.footstepDistance = 0;
    this.heartbeatActive = false;
    this.heartbeatElapsed = 0;
    this.heartbeatVolume = 0;
    this.heartbeatRate = 1;
  }

  resetLevel() {
    this.stopAll();
    this.startupPhase = 'off';
    this.nextFootstep = 0;
  }

  leaveGameplay() {
    this.stop('heart');
    this.stop('footstep1');
    this.stop('footstep2');
    this._resetContinuous();
  }

  updateFootsteps(distance) {
    if (!(distance > CONFIG.chargeMoveEpsilon)) {
      // Не переносим почти завершённый шаг через долгую остановку.
      this.footstepDistance = Math.min(this.footstepDistance, CONFIG.footstepDistance * 0.5);
      return;
    }
    this.footstepDistance += distance;
    while (this.footstepDistance >= CONFIG.footstepDistance) {
      this.footstepDistance -= CONFIG.footstepDistance;
      this.play(this.nextFootstep++ % 2 ? 'footstep2' : 'footstep1');
    }
  }

  updateHeartbeat(dt, player, monsters) {
    const threats = monsters.filter((monster) => monster.waking || monster.active);
    if (!threats.length || this.muted) {
      if (this.heartbeatActive) this.stop('heart');
      this.heartbeatActive = false;
      this.heartbeatElapsed = 0;
      this.heartbeatVolume = 0;
      return;
    }
    const distance = Math.min(...threats.map((monster) =>
      Math.hypot(monster.x - player.x, monster.y - player.y)));
    const linear = Math.max(0, Math.min(1,
      (CONFIG.heartbeatFarDistance - distance) /
      (CONFIG.heartbeatFarDistance - CONFIG.heartbeatNearDistance)));
    const danger = linear * linear * (3 - 2 * linear);
    const targetVolume = CONFIG.heartbeatMinVolume +
      (CONFIG.heartbeatMaxVolume - CONFIG.heartbeatMinVolume) * danger;
    const targetRate = 1 + (CONFIG.heartbeatMaxPlaybackRate - 1) * danger;
    const targetCadence = CONFIG.heartbeatFarCadence +
      (CONFIG.heartbeatNearCadence - CONFIG.heartbeatFarCadence) * danger;
    const firstFrame = !this.heartbeatActive;
    if (firstFrame) {
      this.heartbeatActive = true;
      this.heartbeatElapsed = targetCadence; // первый удар начинается сразу, но с fade-in
      this.heartbeatVolume = 0;
    }
    const tau = firstFrame ? CONFIG.heartbeatFadeInSec : CONFIG.audioSmoothingSec;
    const blend = 1 - Math.exp(-dt / Math.max(0.001, tau));
    this.heartbeatVolume += (targetVolume - this.heartbeatVolume) * blend;
    this.heartbeatRate += (targetRate - this.heartbeatRate) * blend;
    this.heartbeatElapsed += dt;
    const heart = this.sounds.heart;
    const duration = Number.isFinite(heart.duration) ? heart.duration / this.heartbeatRate : 0;
    const cadence = Math.max(targetCadence, duration + 0.04);
    if (this.heartbeatElapsed >= cadence && (heart.paused || heart.ended)) {
      this.heartbeatElapsed %= cadence;
      this.play('heart', { volume: this.heartbeatVolume, rate: this.heartbeatRate });
    } else if (!heart.paused) {
      heart.volume = this._volume('heart', this.heartbeatVolume);
      heart.playbackRate = this.heartbeatRate;
    }
  }

  updateStartup(phase) {
    if (phase === this.startupPhase) return;
    this.startupPhase = phase;
    // Карта позволяет убирать отдельные presentation-clicks, не меняя visuals.
    const clicks = { flash1: 'flashlightOn', off1: 'flashlightOff', flash2: 'flashlightOn',
      off2: 'flashlightOff', ramp: 'flashlightOn' };
    if (clicks[phase]) this.play(clicks[phase]);
  }

  playVictory() {
    this.stopAll();
    this.play('door');
    this.pendingVictory = setTimeout(() => {
      this.pendingVictory = null;
      this.play('levelComplete');
    }, CONFIG.victorySoundDelayMs);
  }

  cancelVictory() {
    if (this.pendingVictory !== null) clearTimeout(this.pendingVictory);
    this.pendingVictory = null;
  }
}
