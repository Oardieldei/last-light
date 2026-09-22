// UI: HUD и оверлеи состояний — обычный DOM поверх Canvas.
// Не зависит от разрешения: всё позиционируется в % от игрового экрана.
class UI {
  constructor(root) {
    this.el = (id) => root.querySelector('#' + id);

    this.hud = this.el('hud');
    this.hudLevel = this.el('hud-level');
    this.hudBatteryText = this.el('hud-battery-text');
    this.batteryFill = this.el('battery-fill');

    this.overlays = {
      menu: this.el('overlay-menu'),
      levelComplete: this.el('overlay-level-complete'),
      levelFailed: this.el('overlay-level-failed'),
      gameComplete: this.el('overlay-game-complete'),
    };

    this.btnStart = this.el('btn-start');
    this.btnLevelCompleteNext = this.el('btn-level-complete-next');
    this.btnLevelFailedRetry = this.el('btn-level-failed-retry');
    this.btnGameCompleteAgain = this.el('btn-game-complete-again');
    this.btnGameCompleteMenu = this.el('btn-game-complete-menu');
  }

  // После клика по кнопке убираем фокус, чтобы Enter/Space не срабатывали дважды.
  _wire(btn, cb) {
    btn.onclick = () => {
      btn.blur();
      cb();
    };
  }

  setHUD(levelNumber, totalLevels, charge) {
    this.hudLevel.textContent = `Уровень ${levelNumber} / ${totalLevels}`;
    const clamped = Math.max(0, Math.min(CONFIG.chargeMax, charge));
    this.hudBatteryText.textContent = `Фонарь: ${Math.round(clamped)}/${CONFIG.chargeMax}`;
    this.batteryFill.style.width = (clamped / CONFIG.chargeMax) * 100 + '%';
  }

  showHUD(show) {
    this.hud.classList.toggle('hidden', !show);
  }

  hideAll() {
    for (const key in this.overlays) this.overlays[key].classList.add('hidden');
  }

  showMenu({ onStart }) {
    this.hideAll();
    this.showHUD(false);
    this.overlays.menu.classList.remove('hidden');
    this._wire(this.btnStart, onStart);
  }

  showLevelComplete({ number, isLast, onNext }) {
    this.hideAll();
    this.showHUD(true);
    this.el('level-complete-title').textContent = `Уровень ${number} пройден!`;
    this.btnLevelCompleteNext.textContent = isLast ? 'Завершить' : 'Следующий уровень';
    this.overlays.levelComplete.classList.remove('hidden');
    this._wire(this.btnLevelCompleteNext, onNext);
  }

  showLevelFailed({ number, reason, onRetry }) {
    this.hideAll();
    this.showHUD(true);
    this.el('level-failed-title').textContent = `Уровень ${number}: провал`;
    this.el('level-failed-reason').textContent =
      (reason && reason.length) ? reason : 'Причины провала появятся на следующих этапах.';
    this.overlays.levelFailed.classList.remove('hidden');
    this._wire(this.btnLevelFailedRetry, onRetry);
  }

  showGameComplete({ onPlayAgain, onMenu }) {
    this.hideAll();
    this.showHUD(false);
    this.overlays.gameComplete.classList.remove('hidden');
    this._wire(this.btnGameCompleteAgain, onPlayAgain);
    this._wire(this.btnGameCompleteMenu, onMenu);
  }
}