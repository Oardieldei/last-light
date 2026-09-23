// Игровой движок: состояния, игровой цикл, уровни, победа/поражение, заряд, HUD.
// Поток данных: input -> game state -> update -> render.
// Рендер: World рисует мир, Lighting кладёт darkness-маску, HUD — DOM поверх.
class Game {
  constructor({ ctx, input, ui, world, lighting, effects = null, audio = null }) {
    this.ctx = ctx;
    this.input = input;
    this.ui = ui;
    this.world = world;
    this.lighting = lighting;
    this.effects = effects;
    this.audio = audio;

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
    this.levelVisualTime = 0;
    this.activeLenses = new Set();
    this.playerMotion = { moving: false, walkPhase: 0 };

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
    if (this.effects) this.effects.reset();
    if (this.audio) this.audio.stopAll();
    this.activeLenses.clear();
    this.setState(this.STATE.MENU);
    this.ui.showMenu({ onStart: () => this.startGame() });
  }

  loadLevel(index) {
    if (this.audio) this.audio.resetLevel();
    this.levelIndex = index;
    this.level = new Level(LEVELS[index], index);
    this.player = new Player(this.level.playerStart.x, this.level.playerStart.y);
    this.charge = CONFIG.chargeMax; // новый уровень — полный заряд
    this.batteryInventory = 0;
    this._hudSignature = '';
    this.levelVisualTime = 0;
    this.playerMotion.moving = false;
    this.playerMotion.walkPhase = 0;
    this.activeLenses.clear();
    if (this.effects) this.effects.reset();
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
      if (this.audio) this.audio.stopAll();
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
    if (this.effects) this.effects.screenFlash('#75f0b4', 0.24, 0.65);
    this.setState(this.STATE.LEVEL_COMPLETE);
    if (this.audio) this.audio.playVictory();
    const isLast = this.levelIndex >= LEVELS.length - 1;
    this.ui.showLevelComplete({
      number: this.levelIndex + 1,
      isLast,
      onNext: () => this.nextLevel(),
    });
  }

  failLevel(reason) {
    if (this.effects) {
      const caught = reason === 'Вас поймали';
      this.effects.burst(this.player.x, this.player.y, caught ? '#b9d5e4' : '#dc6b62', 14, 48);
      this.effects.screenFlash(caught ? '#9bb7c7' : '#b84038', 0.25, 0.55);
    }
    if (this.audio) {
      this.audio.stopAll();
      if (reason === 'Вас поймали') this.audio.play('caught');
      else if (reason === 'Вы попались') this.audio.play('trap');
    }
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
    if (this.audio) this.audio.play('batteryUse');
    if (this.effects) {
      this.effects.ring(this.player.x, this.player.y, '#ffe16e', 35, 0.5);
      this.effects.burst(this.player.x, this.player.y, '#ffe16e', 7, 25);
    }
    this._syncHUD();
  }

  // ---------- Обновление ----------

  update(dt) {
    if (this.effects) this.effects.update(dt);
    if (this.state !== this.STATE.PLAYING) return;
    const player = this.player;
    const world = this.world;
    if (Number.isFinite(this.levelVisualTime)) this.levelVisualTime += dt;
    if (this.audio) this.audio.updateStartup(this.flashlightStartupPhase());

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
    if (this.audio) this.audio.updateFootsteps(moved);
    if (!this.playerMotion) this.playerMotion = { moving: false, walkPhase: 0 };
    this.playerMotion.moving = moved > CONFIG.chargeMoveEpsilon;
    if (this.playerMotion.moving) this.playerMotion.walkPhase += dt * 10;
    if (moved > CONFIG.chargeMoveEpsilon) {
      this.charge = Math.max(0, this.charge - dt * CONFIG.chargeDrainPerSec);

      // Батарейки подбираются автоматически, но заряд восстанавливается только
      // после явного использования через HUD (или клавишей B).
      for (const battery of this.level.batteries) {
        if (!battery.collected &&
            Math.hypot(player.x - battery.x, player.y - battery.y) <= CONFIG.batteryPickupRange) {
          battery.collected = true;
          this.batteryInventory += 1;
          if (this.audio) this.audio.play('batteryPickup');
          if (this.effects) this.effects.burst(battery.x, battery.y, '#ffe06a', 9, 34);
        }
      }
    }

    // Свеча активируется один раз и остаётся активной до перезапуска уровня.
    for (const candle of this.level.candles) {
      if (!candle.active &&
          Math.hypot(player.x - candle.x, player.y - candle.y) <= CONFIG.candleActivationRadius) {
        candle.active = true;
        if (this.audio) this.audio.play('candleIgnite');
        if (this.effects) {
          this.effects.ring(candle.x, candle.y, '#ffad45', 28, 0.6);
          this.effects.burst(candle.x, candle.y, '#ffca62', 6, 22);
        }
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

    // Только реальная occluded-область направленного фонаря будит монстра.
    // После активации он продолжает преследование независимо от освещения.
    for (const monster of this.level.monsters) {
      const startupFinished = !Number.isFinite(this.levelVisualTime) || this.levelVisualTime >= 1;
      if (startupFinished && !monster.active && !monster.waking && this.lighting.isCircleInDirectionalFlashlight(
        this.level, player, this.charge, this.timeMs,
        monster.x, monster.y, CONFIG.monsterVisualRadius
      )) {
        monster.activate();
        if (this.effects) this.effects.ring(monster.x, monster.y, '#b9cfda', 34, 0.75);
      }
      const wasWaking = monster.waking;
      monster.update(dt, this.level, player);
      if (wasWaking && monster.active && this.effects) {
        this.effects.burst(monster.x, monster.y, '#d6edf3', 12, 38);
        this.effects.ring(monster.x, monster.y, '#e5f7fa', 40, 0.6);
      }
      if (monster.active && Math.hypot(monster.x - player.x, monster.y - player.y) <=
          monster.radius + player.radius) {
        this.failLevel('Вас поймали');
        return;
      }
    }
    if (this.audio) this.audio.updateHeartbeat(dt, player, this.level.monsters);

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
    const startupFinished = this.flashlightStartupBrightness() >= 1;
    let preparedLighting = null;
    if (this.level && this.player && startupFinished) {
      const flashlight = this.lighting.directionalFlashlight(
        this.level, this.player, this.charge, this.timeMs
      );
      const lights = this.lighting.lensSecondaryLights(
        this.level, this.player, this.charge, this.timeMs, flashlight
      );
      const nextActive = new Set(lights.map((light) => light.lens));
      preparedLighting = { flashlight, lensLights: lights };
      if (this.effects) for (const lens of nextActive) {
        if (!this.activeLenses.has(lens)) {
          this.effects.ring(lens.x, lens.y, '#9cecff', 32, 0.55);
          this.effects.burst(lens.x, lens.y, '#bcefff', 7, 24);
        }
      }
      this.activeLenses = nextActive;
    } else {
      // Startup flashes are presentation only: lenses remain visually and
      // logically inactive until the normal primary flashlight is available.
      this.activeLenses.clear();
    }
    this.world.render(this.ctx, this.player, this.viewWidth, this.viewHeight, this.timeMs, {
      effects: this.effects, activeLenses: this.activeLenses, playerMotion: this.playerMotion,
    });
    // Darkness-маска поверх мира. HUD — DOM, не затемняется.
    this.lighting.render(
      this.ctx, this.level, this.player, this.world.camera,
      this.charge, this.viewWidth, this.viewHeight, this.timeMs,
      this.flashlightStartupBrightness(), startupFinished, preparedLighting
    );
    if (this.effects) this.effects.renderOverlay(this.ctx, this.viewWidth, this.viewHeight);
  }

  // Несколько presentation-only щелчков; update не передаёт эти вспышки gameplay.
  flashlightStartupBrightness() {
    const phase = this.flashlightStartupPhase();
    const t = this.levelVisualTime;
    if (phase === 'stable') return 1;
    if (phase === 'flash1' || phase === 'flash2') return 0.72;
    if (phase === 'ramp') return (t - 0.78) / 0.22;
    return 0;
  }

  // Единый источник истины для visual startup и его звуковых отражений.
  flashlightStartupPhase() {
    const t = this.levelVisualTime;
    if (t >= 1) return 'stable';
    if (t >= 0.78) return 'ramp';
    if (t >= 0.58) return 'off2';
    if (t >= 0.44) return 'flash2';
    if (t >= 0.24) return 'off1';
    if (t >= 0.16) return 'flash1';
    return 'off';
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
