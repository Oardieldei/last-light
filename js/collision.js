// Простая система коллизий: игрок-окружность против прямоугольных стен.
// Метод: каждая стена «раздувается» на радиус игрока, игрок считается точкой.
// Разрешение движения по осям X и Y по отдельности даёт естественное скольжение вдоль стен
// (диагональное движение не залипает) — без сложной физики.
const Collision = {
  // Точка внутри прямоугольника (включая границу).
  pointInRect(x, y, r) {
    return x >= r.x && x <= r.x + r.width && y >= r.y && y <= r.y + r.height;
  },

  // Пересечение окружности (cx, cy, r) с прямоугольником.
  circleRectOverlap(cx, cy, r, rect) {
    const nearestX = Math.max(rect.x, Math.min(cx, rect.x + rect.width));
    const nearestY = Math.max(rect.y, Math.min(cy, rect.y + rect.height));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= r * r;
  },

  // Разрешение движения: применяем dx по X, затем dy по Y.
  // Возвращает новую позицию { x, y }.
  resolveWalls(x, y, walls, playerRadius, dx, dy) {
    const targetX = x + dx;
    if (!this.pointHitsAnyWall(targetX, y, walls, playerRadius)) x = targetX;
    const targetY = y + dy;
    if (!this.pointHitsAnyWall(x, targetY, walls, playerRadius)) y = targetY;
    return { x, y };
  },

  // Попадает ли точка в любую из «раздутых» стен.
  pointHitsAnyWall(px, py, walls, r) {
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (px > w.x - r && px < w.x + w.width + r &&
          py > w.y - r && py < w.y + w.height + r) {
        return true;
      }
    }
    return false;
  },
};