// Игрок. Хранит только игровое состояние — никаких ссылок на Canvas/отрисовку.
// Направление взгляда и вектор движения разделены архитектурно:
//  - lookDirection — куда «смотрит» игрок (подготовка к фонарю);
//  - movementInput — куда игрок сейчас движется (нормированный вектор или (0,0)).
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = CONFIG.playerRadius;
    this.speed = CONFIG.playerSpeed;
    this.lookDirection = { x: 0, y: 1 };
    this.movementInput = { x: 0, y: 0 };
  }

  // Задать направление взгляда на мировую точку.
  setLookAtWorld(wx, wy) {
    const dx = wx - this.x;
    const dy = wy - this.y;
    const len = Math.hypot(dx, dy) || 1;
    this.lookDirection.x = dx / len;
    this.lookDirection.y = dy / len;
  }

  // Задать вектор движения (будет нормирован при применении).
  setMovement(x, y) {
    this.movementInput.x = x;
    this.movementInput.y = y;
  }

  // Движение с коллизиями. dt в секундах, walls — массив прямоугольников.
  update(dt, walls) {
    let mx = this.movementInput.x;
    let my = this.movementInput.y;
    const len = Math.hypot(mx, my);
    if (len > 1e-9) {
      mx /= len;
      my /= len;
    } else {
      mx = 0;
      my = 0;
    }

    const res = Collision.resolveWalls(
      this.x, this.y, walls, this.radius,
      mx * this.speed * dt,
      my * this.speed * dt
    );
    this.x = res.x;
    this.y = res.y;
  }
}