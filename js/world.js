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

  render(ctx, player, viewW, viewH, timeMs) {
    // Фон всего viewport (виден, если мир меньше viewport или уровень ещё не загружен).
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, viewW, viewH);

    const level = this.level;
    if (!level) return; // состояние MENU до старта игры

    const cam = this.camera;

    ctx.save();
    ctx.translate(viewW / 2, viewH / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.translate(-cam.x, -cam.y);

    // Пол уровня.
    ctx.fillStyle = '#0d141d';
    ctx.fillRect(0, 0, level.width, level.height);

    // Сетка пола — помогает видеть движение камеры и геометрию.
    ctx.strokeStyle = 'rgba(140, 160, 185, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 60; gx < level.width; gx += 60) {
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, level.height);
    }
    for (let gy = 60; gy < level.height; gy += 60) {
      ctx.moveTo(0, gy);
      ctx.lineTo(level.width, gy);
    }
    ctx.stroke();

    // Стены (включая добавленные границы мира).
    for (const w of level.walls) this.drawWall(ctx, w);

    // Ловушки — «пол» уровня, рисуются под остальными объектами.
    for (const t of level.traps) this.drawTrap(ctx, t);

    // Дверь.
    this.drawDoor(ctx, level.door, timeMs);

    // Свечи (неактивные — просто объект; активные — с пламенем).
    for (const c of level.candles) this.drawCandle(ctx, c, timeMs);

    // Батарейки — только не подобранные.
    for (const b of level.batteries) {
      if (!b.collected) this.drawBattery(ctx, b, timeMs);
    }

    for (const lens of level.lenses) this.drawLens(ctx, lens);

    // Монстры остаются world objects и затемняются общей Lighting-маской.
    for (const monster of level.monsters) this.drawMonster(ctx, monster, timeMs);

    // Игрок.
    this.drawPlayer(ctx, player);

    ctx.restore();
  }

  drawWall(ctx, w) {
    ctx.fillStyle = '#3a485c';
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

  drawPlayer(ctx, player) {
    const r = CONFIG.playerVisualRadius;

    // Корпус.
    ctx.beginPath();
    ctx.arc(player.x, player.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffb03a';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7c5116';
    ctx.stroke();

    // Блик.
    ctx.beginPath();
    ctx.arc(player.x - r * 0.3, player.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 240, 200, 0.65)';
    ctx.fill();

    // Указатель направления взгляда (подготовка к фонарю).
    const ldx = player.lookDirection.x;
    const ldy = player.lookDirection.y;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + ldx * (r + 9), player.y + ldy * (r + 9));
    ctx.strokeStyle = 'rgba(255, 176, 58, 0.6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
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
    const breathe = monster.active ? 1 + 0.05 * Math.sin(timeMs / 130) : 1;
    ctx.save();
    ctx.translate(monster.x, monster.y);
    ctx.scale(breathe, breathe);

    ctx.fillStyle = monster.active ? '#8f3547' : '#4d4450';
    ctx.strokeStyle = monster.active ? '#d26472' : '#746a78';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = monster.active ? '#ffd36a' : '#817887';
    for (const sx of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(sx * r * 0.35, -r * 0.18, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawLens(ctx, lens) {
    const r = lens.radius;
    ctx.save();
    ctx.translate(lens.x, lens.y);
    ctx.rotate(lens.angle);
    ctx.fillStyle = 'rgba(92, 202, 235, 0.35)';
    ctx.strokeStyle = '#9cecff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.38, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(210, 248, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.75, 0);
    ctx.lineTo(r * 0.75, 0);
    ctx.stroke();
    ctx.restore();
  }
}
