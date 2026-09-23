// Мир: камера + отрисовка.
// Камера — единственное место преобразования world → screen, она НЕ меняет
// мировую геометрию/физику. Если мир меньше viewport — камера центрируется.
class World {
  constructor() {
    this.level = null;
    this.camera = { x: 0, y: 0, zoom: CONFIG.cameraZoom };
  }

  setLevel(level) {
    this.level = level;
  }

  // Слежение за точкой (игроком): камера не выходит за границы мира,
  // а если мир меньше viewport по оси — центрируется на нём.
  follow(targetX, targetY, viewW, viewH) {
    const l = this.level;
    const visibleW = viewW / this.camera.zoom;
    const visibleH = viewH / this.camera.zoom;
    this.camera.x = this.clampCentered(visibleW / 2, l.width - visibleW / 2, targetX);
    this.camera.y = this.clampCentered(visibleH / 2, l.height - visibleH / 2, targetY);
  }

  clampCentered(min, max, value) {
    if (min > max) return (min + max) / 2; // мир меньше viewport -> центр
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  // Логические координаты viewport -> мировые координаты (для ввода).
  logicalToWorld(lx, ly, viewW, viewH) {
    return {
      x: this.camera.x + (lx - viewW / 2) / this.camera.zoom,
      y: this.camera.y + (ly - viewH / 2) / this.camera.zoom,
    };
  }

  render(ctx, player, viewW, viewH, timeMs, presentation = {}) {
    // Фон всего viewport (виден, если мир меньше viewport или уровень ещё не загружен).
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, viewW, viewH);

    const level = this.level;
    if (!level) return; // состояние MENU до старта игры

    const cam = this.camera;
    const visibleHalfW = viewW / cam.zoom / 2;
    const visibleHalfH = viewH / cam.zoom / 2;
    const visible = {
      left: cam.x - visibleHalfW, right: cam.x + visibleHalfW,
      top: cam.y - visibleHalfH, bottom: cam.y + visibleHalfH,
    };
    const rectVisible = (item, padding = 0) => {
      const width = item.width || 0;
      const height = item.height || 0;
      return item.x + width >= visible.left - padding && item.x <= visible.right + padding &&
        item.y + height >= visible.top - padding && item.y <= visible.bottom + padding;
    };

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // Пол уровня.
    ctx.fillStyle = '#0d141d';
    ctx.fillRect(0, 0, level.width, level.height);

    // Редкие швы и короткие царапины дают полу фактуру без внешних ассетов.
    ctx.strokeStyle = 'rgba(135, 155, 175, 0.055)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const gridLeft = Math.max(60, Math.floor(visible.left / 60) * 60);
    const gridTop = Math.max(60, Math.floor(visible.top / 60) * 60);
    for (let gx = gridLeft; gx < Math.min(level.width, visible.right + 60); gx += 60) {
      ctx.moveTo(gx, Math.max(0, visible.top));
      ctx.lineTo(gx, Math.min(level.height, visible.bottom));
    }
    for (let gy = gridTop; gy < Math.min(level.height, visible.bottom + 60); gy += 60) {
      ctx.moveTo(Math.max(0, visible.left), gy);
      ctx.lineTo(Math.min(level.width, visible.right), gy);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(190, 205, 215, 0.035)';
    const firstY = Math.max(35, 35 + Math.floor((visible.top - 35) / 97) * 97);
    for (let y = firstY; y < Math.min(level.height, visible.bottom + 97); y += 97) {
      const offset = 27 + (y % 3) * 13;
      const firstX = Math.max(offset, offset + Math.floor((visible.left - offset) / 143) * 143);
      for (let x = firstX; x < Math.min(level.width, visible.right + 143); x += 143) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16, y + 3); ctx.stroke();
      }
    }

    // Стены (включая добавленные границы мира).
    for (const w of level.walls) if (rectVisible(w, 4)) this.drawWall(ctx, w);

    // Ловушки — «пол» уровня, рисуются под остальными объектами.
    for (const t of level.traps) if (rectVisible(t, 4)) this.drawTrap(ctx, t);

    // Дверь.
    if (rectVisible(level.door, 8)) this.drawDoor(ctx, level.door, timeMs);

    // Свечи (неактивные — просто объект; активные — с пламенем).
    for (const c of level.candles) if (rectVisible(c, 20)) this.drawCandle(ctx, c, timeMs);

    // Батарейки — только не подобранные.
    for (const b of level.batteries) {
      if (!b.collected && rectVisible(b, 15)) this.drawBattery(ctx, b, timeMs);
    }

    for (const lens of level.lenses) if (rectVisible(lens, lens.radius + 6)) this.drawLens(
      ctx, lens, presentation.activeLenses && presentation.activeLenses.has(lens), timeMs
    );

    // Монстры остаются world objects и затемняются общей Lighting-маской.
    for (const monster of level.monsters) if (rectVisible(monster, 20)) {
      this.drawMonster(ctx, monster, timeMs);
    }

    // Игрок.
    this.drawPlayer(ctx, player, presentation.playerMotion || null);

    if (presentation.effects) presentation.effects.renderWorld(ctx);

    ctx.restore();
  }

  drawWall(ctx, w) {
    const gradient = ctx.createLinearGradient(w.x, w.y, w.x, w.y + Math.min(w.height, 30));
    gradient.addColorStop(0, '#526075');
    gradient.addColorStop(0.18, '#3b485a');
    gradient.addColorStop(1, '#293441');
    ctx.fillStyle = gradient;
    ctx.fillRect(w.x, w.y, w.width, w.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'; // верхняя грань
    ctx.fillRect(w.x, w.y, w.width, 3);
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(w.x + 0.5, w.y + 0.5, w.width - 1, w.height - 1);
  }

  drawDoor(ctx, door, timeMs) {
    const pulse = 0.7 + 0.3 * Math.sin(timeMs / 350);
    ctx.fillStyle = 'rgba(40, 180, 120, 0.10)';
    ctx.fillRect(door.x, door.y, door.width, door.height);
    ctx.strokeStyle = `rgba(70, 235, 160, ${pulse.toFixed(3)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(door.x + 1.5, door.y + 1.5, door.width - 3, door.height - 3);

    // Ступени-стрелки вглубь двери.
    ctx.strokeStyle = 'rgba(70, 235, 160, 0.55)';
    ctx.lineWidth = 2;
    const step = door.height / 4;
    for (let i = 1; i < 4; i++) {
      const sy = door.y + step * i;
      ctx.beginPath();
      ctx.moveTo(door.x + 10, sy);
      ctx.lineTo(door.x + door.width - 10, sy);
      ctx.stroke();
    }
  }

  drawPlayer(ctx, player, motion) {
    const r = CONFIG.playerVisualRadius;
    const angle = Math.atan2(player.lookDirection.y, player.lookDirection.x);
    const step = motion && motion.moving ? Math.sin(motion.walkPhase) * 3.2 : 0;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.lineCap = 'round';
    // Ноги и руки видны сверху по сторонам компактного тела.
    ctx.strokeStyle = '#566271'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-3, 5); ctx.lineTo(-4 - step, 12);
    ctx.moveTo(3, 5); ctx.lineTo(4 + step, 12);
    ctx.moveTo(-5, -1); ctx.lineTo(-9, 5 + step * 0.35);
    ctx.moveTo(5, -1); ctx.lineTo(9, 3 - step * 0.35); ctx.stroke();
    ctx.fillStyle = '#d9a64d';
    ctx.beginPath(); ctx.ellipse(0, 2, r * 0.58, r * 0.78, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e8c59c'; ctx.strokeStyle = '#6c5848'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(0, -7, 5.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // Маленький фонарь в правой руке всегда совпадает с lookDirection.
    ctx.fillStyle = '#bcc6cc';
    ctx.fillRect(7, -8, 4, 9);
    ctx.fillStyle = '#fff0a8'; ctx.fillRect(6.5, -9.5, 5, 2.5);
    ctx.restore();
  }

  drawBattery(ctx, battery, timeMs) {
    const r = CONFIG.batteryVisualRadius;
    const pulse = 0.82 + 0.18 * Math.sin(timeMs / 260);
    ctx.save();
    ctx.translate(battery.x, battery.y);

    ctx.fillStyle = `rgba(255, 210, 70, ${(0.12 * pulse).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, r + 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e8b83f';
    ctx.strokeStyle = '#6f5317';
    ctx.lineWidth = 1.5;
    ctx.fillRect(-r, -r * 0.72, r * 2, r * 1.44);
    ctx.strokeRect(-r, -r * 0.72, r * 2, r * 1.44);
    ctx.fillStyle = '#f7d568';
    ctx.fillRect(r, -r * 0.28, 2.5, r * 0.56);

    ctx.strokeStyle = '#5c4518';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-r * 0.58, 0);
    ctx.lineTo(-r * 0.16, 0);
    ctx.moveTo(r * 0.22, 0);
    ctx.lineTo(r * 0.66, 0);
    ctx.moveTo(r * 0.44, -r * 0.22);
    ctx.lineTo(r * 0.44, r * 0.22);
    ctx.stroke();
    ctx.restore();
  }

  drawCandle(ctx, candle, timeMs) {
    const r = CONFIG.candleVisualRadius;
    ctx.save();
    ctx.translate(candle.x, candle.y);

    ctx.fillStyle = candle.active ? '#f1d6a0' : '#8b8274';
    ctx.strokeStyle = candle.active ? '#8d642d' : '#48443f';
    ctx.lineWidth = 1;
    ctx.fillRect(-r, -r, r * 2, r * 2.5);
    ctx.strokeRect(-r, -r, r * 2, r * 2.5);

    ctx.strokeStyle = '#33281c';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, -r - 3);
    ctx.stroke();

    if (candle.active) {
      const flicker = Math.sin(timeMs * 0.018 + candle.x * 0.1) * 0.7;
      ctx.fillStyle = 'rgba(255, 180, 45, 0.18)';
      ctx.beginPath();
      ctx.arc(0, -r - 5, r + 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffbd3e';
      ctx.beginPath();
      ctx.ellipse(flicker * 0.35, -r - 5, 2.5, 5 + flicker, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff1a8';
      ctx.beginPath();
      ctx.ellipse(0, -r - 4.5, 1, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawTrap(ctx, trap) {
    ctx.save();
    ctx.fillStyle = 'rgba(105, 38, 38, 0.38)';
    ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
    ctx.strokeStyle = '#8f4545';
    ctx.lineWidth = 1;
    ctx.strokeRect(trap.x + 0.5, trap.y + 0.5, trap.width - 1, trap.height - 1);

    const spikeWidth = 10;
    ctx.fillStyle = '#b8aaa0';
    ctx.strokeStyle = '#514945';
    for (let x = trap.x + 2; x < trap.x + trap.width - 2; x += spikeWidth) {
      ctx.beginPath();
      ctx.moveTo(x, trap.y + trap.height - 3);
      ctx.lineTo(Math.min(x + spikeWidth / 2, trap.x + trap.width - 2), trap.y + 4);
      ctx.lineTo(Math.min(x + spikeWidth, trap.x + trap.width - 2), trap.y + trap.height - 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }

  drawMonster(ctx, monster, timeMs) {
    const r = CONFIG.monsterVisualRadius;
    const progress = monster.waking
      ? 1 - monster.wakeRemaining / CONFIG.monsterWakeDuration
      : monster.active ? 1 : 0;
    const float = monster.active ? Math.sin(timeMs / 260 + monster.startX) * 1.5 : 0;
    const breathe = 1 + (monster.active ? 0.035 * Math.sin(timeMs / 180) : 0);
    ctx.save();
    ctx.translate(monster.x, monster.y + float);
    if (!monster.active && !monster.waking) {
      ctx.scale(1.35, 0.55);
      const stain = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
      stain.addColorStop(0, 'rgba(32,27,42,.68)'); stain.addColorStop(1, 'rgba(25,22,32,0)');
      ctx.fillStyle = stain; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }
    ctx.scale(breathe * (0.7 + progress * 0.3), 0.35 + progress * 0.65);
    ctx.globalAlpha = 0.45 + progress * 0.5;
    ctx.fillStyle = '#a9b8c8'; ctx.strokeStyle = 'rgba(215,232,239,.75)'; ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-r, 5); ctx.quadraticCurveTo(-r - 1, -r, 0, -r - 2);
    ctx.quadraticCurveTo(r + 1, -r, r, 5);
    ctx.lineTo(r * .7, r); ctx.lineTo(r * .2, r * .65);
    ctx.lineTo(-r * .25, r); ctx.lineTo(-r * .7, r * .65); ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#27313c';
    for (const sx of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(sx * r * .32, -r * .22, 1.5, 2.2, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  drawLens(ctx, lens, active, timeMs) {
    const r = lens.radius;
    ctx.save();
    ctx.translate(lens.x, lens.y);
    ctx.rotate(lens.angle);
    const pulse = active ? 0.72 + 0.28 * Math.sin(timeMs / 100) : 0.35;
    ctx.fillStyle = `rgba(92, 202, 235, ${pulse.toFixed(3)})`;
    ctx.strokeStyle = active ? '#e3fbff' : '#83cbd9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.38, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (active) {
      ctx.strokeStyle = 'rgba(145,235,255,.45)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, r * .62, r + 5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(210, 248, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, 0);
    ctx.lineTo(r * 0.75, 0);
    ctx.stroke();
    ctx.restore();
  }
}
