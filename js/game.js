// Игровой движок: состояния, игровой цикл, уровни, победа/поражение, заряд, HUD.
// Поток данных: input -> game state -> update -> render.
// Рендер: World рисует мир, Lighting кладёт darkness-маску, HUD — DOM поверх.
class Game {
  constructor({ ctx, input, ui, world, lighting }) {
    this.ctx = ctx;
    this.input = input;
    this.ui = ui;
    this.world = world;
    this.lighting = lighting;

    this.STATE = {
      MENU: 'MENU',
      PLAYING: 'PLAYING',
      LEVEL_COMPLETE: 'LEVEL_COMPLETE',
      LEVEL_FAILED: 'LEVEL_FAILED',
      GAME_COMPLETE: 'GAME_COMPLETE',
    };
    this.state = this.STATE.MENU;

    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.charge = CONFIG.chargeMax;
    this.batteryInventory = 0;
    this._hudSignature = '';

    this.viewWidth = CONFIG.viewWidth;
    this.viewHeight = CONFIG.viewHeight;
    this.timeMs = 0;
    this.lastFrameTime = performance.now();

    this.onKeyDown = (e) => this.handleKey(e);
    window.addEventListener('keydown', this.onKeyDown);
    this.ui.setBatteryHandler(() => this.useBattery());
  }

  // ---------- Управление состояниями ----------

  setState(state) {
    this.state = state;
  }

  startGame() {
    this.loadLevel(0);
    this.setState(this.STATE.PLAYING);
  }

  goToMenu() {
    this.setState(this.STATE.MENU);
    this.ui.showMenu({ onStart: () => this.startGame() });
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = new Level(LEVELS[index], index);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.charge = CONFIG.chargeMax; // новый уровень — полный заряд
    this.batteryInventory = 0;
    this._hudSignature = '';
    this.world.setLevel(this.level);
    this.world.follow(this.player.x, this.player.y, this.viewWidth, this.viewHeight);
    this.ui.hideAll(); // прячем оверлеи (меню, результат уровня) при загрузке любого уровня
    this.input.reset();
    this.ui.setHUD(index + 1, LEVELS.length, this.charge, this.batteryInventory);
    this.ui.showHUD(true);
  }

  restartLevel() {
    this.loadLevel(this.levelIndex);
    this.setState(this.STATE.PLAYING);
  }

  nextLevel() {
    if (this.levelIndex >= LEVELS.length - 1) {
      // Последний уровень пройден.
      this.setState(this.STATE.GAME_COMPLETE);
      this.ui.showGameComplete({
        onPlayAgain: () => this.startGame(),
        onMenu: () => this.goToMenu(),
      });
    } else {
      this.loadLevel(this.levelIndex + 1);
      this.setState(this.STATE.PLAYING);
    }
  }

  finishLevel() {
    this.setState(this.STATE.LEVEL_COMPLETE);
    const isLast = this.levelIndex >= LEVELS.length - 1;
    this.ui.showLevelComplete({
      number: this.levelIndex + 1,
      isLast,
      onNext: () => this.nextLevel(),
    });
  }

  failLevel(reason) {
    // Этап 1: травмы/ловушки. Этап 2: «Фонарь погас» (заряд 0).
    this.setState(this.STATE.LEVEL_FAILED);
    this.ui.showLevelFailed({
      number: this.levelIndex + 1,
      reason: reason || '',
      onRetry: () => this.restartLevel(),
    });
  }

  useBattery() {
    if (this.state !== this.STATE.PLAYING ||
        this.batteryInventory <= 0 || this.charge >= CONFIG.chargeMax) return;
    this.batteryInventory -= 1;
    this.charge = Math.min(CONFIG.chargeMax, this.charge + CONFIG.batteryChargeGain);
    this._syncHUD();
  }

  // ---------- Обновление ----------

  update(dt) {
    if (this.state !== this.STATE.PLAYING) return;
    const player = this.player;
    const world = this.world;

    // Взгляд: курсор мыши (без нажатия) или короткий тап.
    const mouseLook = this.input.consumeMouseLook();
    if (mouseLook) {
      const w = world.logicalToWorld(mouseLook.lx, mouseLook.ly, this.viewWidth, this.viewHeight);
      player.setLookAtWorld(w.x, w.y);
    }
    const tap = this.input.consumeTap();
    if (tap) {
      const w = world.logicalToWorld(tap.lx, tap.ly, this.viewWidth, this.viewHeight);
      player.setLookAtWorld(w.x, w.y);
    }

    // Движение: к мировому аналогу удерживаемого курсора/пальца.
    const mv = this.input.getMovement();
    if (mv.active) {
      const w = world.logicalToWorld(mv.lx, mv.ly, this.viewWidth, this.viewHeight);
      const dx = w.x - player.x;
      const dy = w.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > CONFIG.playerStopDeadzone) {
        player.setMovement(dx / dist, dy / dist);
      } else {
        player.setMovement(0, 0);
      }
    } else {
      player.setMovement(0, 0);
    }

    // Замер фактического перемещения (в мировых координатах, до physics).
    const prevX = player.x;
    const prevY = player.y;
    player.update(dt, this.level.walls);

    // Заряд: расходуется ТОЛЬКО при фактическом перемещении (по dt, не по FPS).
    // Если игрок упёрся в стену и не сдвинулся — заряд не тратится.
    const moved = Math.hypot(player.x - prevX, player.y - prevY);
    if (moved > CONFIG.chargeMoveEpsilon) {
      this.charge = Math.max(0, this.charge - dt * CONFIG.chargeDrainPerSec);

      // Батарейки подбираются автоматически, но заряд восстанавливается только
      // после явного использования через HUD (или клавишей B).
      for (const battery of this.level.batteries) {
        if (!battery.collected &&
            Math.hypot(player.x - battery.x, player.y - battery.y) <= CONFIG.batteryPickupRange) {
          battery.collected = true;
          this.batteryInventory += 1;
        }
      }
    }

    // Свеча активируется один раз и остаётся активной до перезапуска уровня.
    for (const candle of this.level.candles) {
      if (!candle.active &&
          Math.hypot(player.x - candle.x, player.y - candle.y) <= CONFIG.candleActivationRadius) {
        candle.active = true;
      }
    }
    this._syncHUD();

    if (this.charge <= 0) {
      this.charge = 0;
      this.failLevel('Фонарь погас');
      return;
    }


    // Любая причина поражения проверяется до двери: failure всегда важнее victory.
    for (const trap of this.level.traps) {
      if (Collision.circleRectOverlap(player.x, player.y, player.radius, trap)) {
        this.failLevel('Вы попались');
        return;
      }
    }

    // Камера следует за игроком (мир -> камера, физика не меняется).
    world.follow(player.x, player.y, this.viewWidth, this.viewHeight);

    // Дверь — цель уровня.
    if (Collision.circleRectOverlap(player.x, player.y, player.radius, this.level.door)) {
      this.finishLevel();
    }
  }

  // Обновление HUD-заряда с порогом: не трогаем DOM каждый кадр.
  _syncHUD() {
    const shown = Math.floor(this.charge);
    const signature = `${shown}:${this.batteryInventory}`;
    if (signature !== this._hudSignature) {
      this._hudSignature = signature;
      this.ui.setHUD(
        this.levelIndex + 1, LEVELS.length, this.charge, this.batteryInventory
      );
    }
  }

  render() {
    this.world.render(this.ctx, this.player, this.viewWidth, this.viewHeight, this.timeMs);
    // Darkness-маска поверх мира. HUD — DOM, не затемняется.
    this.lighting.render(
      this.ctx, this.level, this.player, this.world.camera,
      this.charge, this.viewWidth, this.viewHeight, this.timeMs
    );
  }

  // ---------- Игровой цикл ----------

  loop(nowMs) {
    // dt в секундах; clamp защищает от больших скачков после пауз/переключения вкладок,
    // нижняя граница 0 — от отрицательных значений при скачке системных часов.
    const rawDt = (nowMs - this.lastFrameTime) / 1000;
    const dt = Math.max(0, Math.min(rawDt, CONFIG.maxDt));
    this.lastFrameTime = nowMs;
    this.timeMs = nowMs;

    this.update(dt);
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }

  start() {
    this.goToMenu();
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---------- Клавиатура (управление состоянием) ----------

  handleKey(e) {
    // e.code — физический код клавиши (не зависит от раскладки), fallback на e.key.
    const key = (e.code || e.key || '').toUpperCase();
    let handled = true;

    switch (this.state) {
      case this.STATE.MENU:
        if (key === 'ENTER' || key === 'SPACE' || key === ' ') this.startGame();
        else handled = false;
        break;

      case this.STATE.PLAYING:
        if (key === 'KEYR' || key === 'R' || key === 'К') this.restartLevel();
        else if (key === 'KEYB' || key === 'B' || key === 'И') {
          // Одно физическое нажатие использует не более одной батарейки.
          if (!e.repeat) this.useBattery();
        }
        else if (key === 'ESCAPE') this.goToMenu();
        else handled = false;
        break;

      case this.STATE.LEVEL_COMPLETE:
        if (key === 'ENTER' || key === 'SPACE' || key === ' ') this.nextLevel();
        else handled = false;
        break;

      case this.STATE.LEVEL_FAILED:
        if (key === 'ENTER' || key === 'SPACE' || key === ' ' ||
            key === 'KEYR' || key === 'R' || key === 'К') this.restartLevel();
        else handled = false;
        break;

      case this.STATE.GAME_COMPLETE:
        if (key === 'ENTER' || key === 'SPACE' || key === ' ') this.startGame();
        else handled = false;
        break;

      default:
        handled = false;
    }

    if (handled) e.preventDefault();
  }
}
