// Базовый монстр Этапа 4. До активации неподвижен; после неё преследует игрока.
// Навигация: прямой путь, если он свободен, иначе компактный visibility graph
// по углам стен, расширенных на физический радиус монстра.
class Monster {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;
    this.radius = CONFIG.monsterRadius;
    this.speed = CONFIG.monsterSpeed;
    this.active = false;

    this.path = [];
    this.pathIndex = 0;
    this.repathIn = 0;
    this.lastTargetX = NaN;
    this.lastTargetY = NaN;
  }

  activate() {
    if (this.active) return;
    this.active = true;
    this.repathIn = 0;
  }

  update(dt, level, player) {
    if (!this.active || dt <= 0) return;

    this.repathIn -= dt;
    const targetMoved = !Number.isFinite(this.lastTargetX) ||
      Math.hypot(player.x - this.lastTargetX, player.y - this.lastTargetY) >=
        CONFIG.monsterRepathDistance;
    if (this.repathIn <= 0 || targetMoved || this.pathIndex >= this.path.length) {
      this.path = this.findPath(level, player.x, player.y);
      this.pathIndex = 0;
      this.repathIn = CONFIG.monsterRepathSec;
      this.lastTargetX = player.x;
      this.lastTargetY = player.y;
    }

    let remaining = this.speed * dt;
    while (remaining > 1e-6 && this.pathIndex < this.path.length) {
      const target = this.path[this.pathIndex];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.5) {
        this.pathIndex += 1;
        continue;
      }

      const step = Math.min(remaining, dist);
      const result = Collision.resolveWalls(
        this.x, this.y, level.walls, this.radius,
        dx / dist * step, dy / dist * step
      );
      const moved = Math.hypot(result.x - this.x, result.y - this.y);
      this.x = result.x;
      this.y = result.y;
      remaining -= moved;

      if (moved < 1e-5) {
        // Геометрия изменилась или waypoint оказался недостижимым: перестроить путь.
        this.repathIn = 0;
        break;
      }
      if (step >= dist - 1e-6) this.pathIndex += 1;
    }
  }

  // Точное пересечение отрезка с прямоугольником стены, расширенным на радиус.
  // Небольшое сжатие сохраняет допустимым касание самой границы — так же, как
  // строгие сравнения в Collision.pointHitsAnyWall().
  segmentHitsExpandedWall(ax, ay, bx, by, wall) {
    const epsilon = 1e-7;
    const minX = wall.x - this.radius + epsilon;
    const maxX = wall.x + wall.width + this.radius - epsilon;
    const minY = wall.y - this.radius + epsilon;
    const maxY = wall.y + wall.height + this.radius - epsilon;
    const dx = bx - ax;
    const dy = by - ay;
    let enter = 0;
    let exit = 1;

    for (const [origin, delta, min, max] of [
      [ax, dx, minX, maxX],
      [ay, dy, minY, maxY],
    ]) {
      if (Math.abs(delta) < 1e-12) {
        if (origin < min || origin > max) return false;
        continue;
      }
      let near = (min - origin) / delta;
      let far = (max - origin) / delta;
      if (near > far) [near, far] = [far, near];
      enter = Math.max(enter, near);
      exit = Math.min(exit, far);
      if (enter > exit) return false;
    }
    return exit >= 0 && enter <= 1;
  }

  segmentClear(ax, ay, bx, by, walls) {
    for (const wall of walls) {
      if (this.segmentHitsExpandedWall(ax, ay, bx, by, wall)) return false;
    }
    return true;
  }

  navigationCorners(level) {
    const clearance = this.radius + CONFIG.monsterPathPadding;
    const nodes = [];
    const seen = new Set();
    for (const wall of level.walls) {
      const corners = [
        { x: wall.x - clearance, y: wall.y - clearance },
        { x: wall.x + wall.width + clearance, y: wall.y - clearance },
        { x: wall.x + wall.width + clearance, y: wall.y + wall.height + clearance },
        { x: wall.x - clearance, y: wall.y + wall.height + clearance },
      ];
      for (const point of corners) {
        if (point.x < this.radius || point.x > level.width - this.radius ||
            point.y < this.radius || point.y > level.height - this.radius ||
            Collision.pointHitsAnyWall(point.x, point.y, level.walls, this.radius)) continue;
        const key = `${point.x},${point.y}`;
        if (!seen.has(key)) {
          seen.add(key);
          nodes.push(point);
        }
      }
    }
    return nodes;
  }

  findPath(level, targetX, targetY) {
    if (this.segmentClear(this.x, this.y, targetX, targetY, level.walls)) {
      return [{ x: targetX, y: targetY }];
    }

    const nodes = [
      { x: this.x, y: this.y },
      { x: targetX, y: targetY },
      ...this.navigationCorners(level),
    ];
    const count = nodes.length;
    const distances = new Array(count).fill(Infinity);
    const previous = new Array(count).fill(-1);
    const visited = new Array(count).fill(false);
    distances[0] = 0;

    // Dijkstra по visibility graph; уровни малы, поэтому граф строится по требованию.
    for (let pass = 0; pass < count; pass++) {
      let current = -1;
      for (let i = 0; i < count; i++) {
        if (!visited[i] && (current < 0 || distances[i] < distances[current])) current = i;
      }
      if (current < 0 || !Number.isFinite(distances[current]) || current === 1) break;
      visited[current] = true;
      for (let next = 1; next < count; next++) {
        if (visited[next] || !this.segmentClear(
          nodes[current].x, nodes[current].y, nodes[next].x, nodes[next].y, level.walls
        )) continue;
        const candidate = distances[current] + Math.hypot(
          nodes[next].x - nodes[current].x, nodes[next].y - nodes[current].y
        );
        if (candidate < distances[next]) {
          distances[next] = candidate;
          previous[next] = current;
        }
      }
    }

    if (!Number.isFinite(distances[1])) return [];
    const path = [];
    for (let at = 1; at > 0; at = previous[at]) path.push(nodes[at]);
    path.reverse();
    return path;
  }
}
