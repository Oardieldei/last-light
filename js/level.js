// Загрузчик уровня: превращает ДАННЫЕ уровня в runtime-объекты текущего прохождения.
// Единый для всех уровней — движок не знает об отдельных уровнях.
//
// Важно: данные уровня (LEVELS[i]) — неизменяемый шаблон. Всё, что меняется во время
// прохождения (ресурсы и состояние монстров), живёт в объектах этого класса,
// созданных копированием. Поэтому restart/новый уровень всегда стартуют с чистого состояния.
class Level {
  constructor(data, index) {
    this.index = index; // 0-based
    this.name = data.name || `Уровень ${index + 1}`;
    this.width = data.width;
    this.height = data.height;

    this.playerStart = {
      x: data.playerStart.x,
      y: data.playerStart.y,
    };

    this.door = {
      x: data.door.x,
      y: data.door.y,
      width: data.door.width,
      height: data.door.height,
    };

    this.walls = [];
    for (const w of data.walls) {
      this.walls.push({ x: w.x, y: w.y, width: w.width, height: w.height });
    }

    // Runtime-сущности: копии данных и состояние текущей попытки.
    this.batteries = (data.batteries || []).map((b) => ({
      x: b.x, y: b.y, collected: false,
    }));
    this.candles = (data.candles || []).map((c) => ({
      x: c.x, y: c.y, active: false,
    }));
    this.traps = (data.traps || []).map((t) => ({
      x: t.x, y: t.y, width: t.width, height: t.height,
    }));
    this.monsters = (data.monsters || []).map((m) => new Monster(m.x, m.y));

    this.addBorderWalls();
  }

  // Гарантия того, что игрок не сможет покинуть мир (невидимые границы).
  addBorderWalls() {
    const t = 20; // толщина границы >= радиуса игрока
    this.walls.push(
      { x: 0, y: 0, width: this.width, height: t },
      { x: 0, y: this.height - t, width: this.width, height: t },
      { x: 0, y: 0, width: t, height: this.height },
      { x: this.width - t, y: 0, width: t, height: this.height }
    );
  }
}
