// Мир: камера + отрисовка.
// Камера — единственное место преобразования world → screen, она НЕ меняет
// мировую геометрию/физику. Если мир меньше viewport — камера центрируется.
class World {
  constructor() {
    this.level = null;
    this.camera = { x: 0, y: 0 };
  }

  setLevel(level) {
    this.level = level;
  }

  // Слежение за точкой (игроком): камера не выходит за границы мира,
  // а если мир меньше viewport по оси — центрируется на нём.
  follow(targetX, targetY, viewW, viewH) {
    const l = this.level;
    this.camera.x = this.clampCentered(viewW / 2, l.width - viewW / 2, targetX);
    this.camera.y = this.clampCentered(viewH / 2, l.height - viewH / 2, targetY);
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
      x: this.camera.x + lx - viewW / 2,
      y: this.camera.y + ly - viewH / 2,
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
    ctx.translate(viewW / 2 - cam.x, viewH / 2 - cam.y);

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
}