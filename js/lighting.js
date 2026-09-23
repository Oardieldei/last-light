// Система освещения (Этап 2): темнота, локальный свет игрока, направленный луч,
// окклюзия света стенами (visibility polygon) и заряд.
//
// Pipeline рендера:
//   1) World.render(...)     — рисует мир как обычно;
//   2) Lighting.render(...)  — поверх мира ложит darkness-маску;
//   3) HUD (DOM)             — не затемняется (не часть канваса).
//
// Вся геометрия света считается в МИРОВЫХ координатах (не зависит от камеры/DPR).
// Маска — off-screen canvas ЛОГИЧЕСКОГО размера 360×640, поэтому resize/DPR
// не меняют ни геометрию теней, ни дальность/угол фонаря.

const DEBUG_LIGHTING = false; // отладочная визуализация (false — в игре ничего технического)

const DEG2RAD = Math.PI / 180;

class Lighting {
  constructor() {
    // off-screen маска в логических координатах viewport (360×640).
    this.mask = document.createElement('canvas');
    this.mask.width = CONFIG.viewWidth;
    this.mask.height = CONFIG.viewHeight;
    this.maskCtx = this.mask.getContext('2d');

    // Кэш сегментов/вершин стен для текущего уровня.
    this._segCache = null; // { level, segments, vertices }
  }

  // ---------------------------------------------------------------- геометрия

  // Превращает прямоугольники стен в сегменты рёбер + уникальные вершины.
  collectSegments(level) {
    if (this._segCache && this._segCache.level === level) return this._segCache;
    const segments = [];
    const seen = new Set();
    const vertices = [];
    for (const w of level.walls) {
      const x1 = w.x, y1 = w.y;
      const x2 = w.x + w.width, y2 = w.y + w.height;
      const edges = [
        { ax: x1, ay: y1, bx: x2, by: y1 }, // верх
        { ax: x2, ay: y1, bx: x2, by: y2 }, // право
        { ax: x1, ay: y2, bx: x2, by: y2 }, // низ
        { ax: x1, ay: y1, bx: x1, by: y2 }, // лево
      ];
      for (const e of edges) segments.push(e);
      for (const [vx, vy] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) {
        const key = `${Math.round(vx * 10)},${Math.round(vy * 10)}`;
        if (!seen.has(key)) {
          seen.add(key);
          vertices.push({ x: vx, y: vy });
        }
      }
    }
    this._segCache = { level, segments, vertices, walls: level.walls };
    return this._segCache;
  }

  // Луч стартует из стены? (вырожденный случай: игрок ровно на кромке/углу/внутри).
  // Проба точкой чуть впереди по лучу: если она внутри стены — свет по этому
  // направлению не должен идти, иначе получилась бы щель сквозь стену.
  originBlocked(walls, ox, oy, angle) {
    const probe = 0.05;
    const px = ox + Math.cos(angle) * probe;
    const py = oy + Math.sin(angle) * probe;
    for (let i = 0; i < walls.length; i++) {
      const w = walls[i];
      if (px > w.x && px < w.x + w.width && py > w.y && py < w.y + w.height) return true;
    }
    return false;
  }

  // Параметр t пересечения луча (origin + t*dir, t >= 0) с сегментом (p0->p1).
  // Возвращает t или null (нет пересечения/параллельны).
  raySegmentT(ox, oy, dx, dy, ax, ay, bx, by) {
    const sx = bx - ax;
    const sy = by - ay;
    const cross = dx * sy - dy * sx;
    if (Math.abs(cross) < 1e-12) return null; // параллельны
    const t = ((ax - ox) * sy - (ay - oy) * sx) / cross;
    if (t < 0) return null;
    const u = ((ax - ox) * dy - (ay - oy) * dx) / cross;
    if (u < 0 || u > 1) return null;
    return t;
  }
// Ближайшее пересечение луча с сегментами стен, ограниченное maxDist.
  // Возвращает точку и дистанцию; при некорректных входных данных — вырожденный
  // результат (свет не строится), чтобы NaN/Infinity не попали в геометрию полигона.
  nearestIntersection(ox, oy, angle, maxDist, segments) {
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    if (!Number.isFinite(dx) || !Number.isFinite(dy) ||
        !Number.isFinite(ox) || !Number.isFinite(oy) ||
        !Number.isFinite(maxDist) || maxDist <= 0) {
      return { x: ox, y: oy, dist: 0 };
    }
    let best = maxDist;
    for (let i = 0; i < segments.length; i++) {
      const s = segments[i];
      const t = this.raySegmentT(ox, oy, dx, dy, s.ax, s.ay, s.bx, s.by);
      // t > 1e-3: игрок может касаться стены — нулевые пересечения игнорируем,
      // чтобы свет у ног не схлопывался в ноль.
      if (t !== null && t > 1e-3 && t < best) best = t;
    }
    return { x: ox + dx * best, y: oy + dy * best, dist: best };
  }

  // Нормализация угла в (-PI, PI].
  // O(1) и безопасна для не-конечных значений: при while-цикле значение Infinity
  // привело бы к вечному циклу (зависание игры).
  wrapAngle(a) {
    if (!Number.isFinite(a)) return 0;
    a %= Math.PI * 2;
    if (a > Math.PI) a -= Math.PI * 2;
    else if (a <= -Math.PI) a += Math.PI * 2;
    return a;
  }

  // Visibility polygon направленного света: fovDeg (360 = круг) и окклюзия стенами.
  // Возвращает контур видимых мировых точек:
  //  - fovDeg = 360 -> замкнутый контур (локальный свет);
  //  - иначе        -> веер, вершина которого в origin (луч фонаря).
  visibilityPolygon(level, ox, oy, lookAngle, fovDeg, range) {
    const { segments, vertices, walls } = this.collectSegments(level);
    const full = fovDeg >= 360;
    const half = (fovDeg * DEG2RAD) / 2;
    const eps = CONFIG.occlusionEpsilon;

    // Направления лучей: к каждой вершине (+/- eps), плюс границы FOV.
    const dirs = [];
    const dirSet = new Set();
    const pushDir = (a) => {
      const key = Math.round(a * 1e9);
      if (!dirSet.has(key)) {
        dirSet.add(key);
        dirs.push(a);
      }
    };
    for (const v of vertices) {
      const dx = v.x - ox;
      const dy = v.y - oy;
      if ((dx * dx + dy * dy) < 1e-4) continue; // вершина совпадает с игроком
      const a = Math.atan2(dy, dx);
      const rel = Math.abs(this.wrapAngle(a - lookAngle));
      if (full || rel <= half) {
        pushDir(a - eps);
        pushDir(a + eps);
      }
    }
    if (!full) {
      pushDir(lookAngle - half);
      pushDir(lookAngle + half);
    }
    if (dirs.length === 0) {
      // Пустых миров не бывает (бордеры есть), но подстрахуемся.
      for (let i = 0; i < 24; i++) pushDir(lookAngle - half + (fovDeg * DEG2RAD) * i / 24);
    }

    // Точки: ближайшее пересечение луча со стеной (или maxDist).
    const pts = [];
    for (const a of dirs) {
      if (!Number.isFinite(a)) continue; // защита от не-конечных направлений
      const inter = this.originBlocked(walls, ox, oy, a)
        ? { x: ox, y: oy } // луч стартует из стены — свет не идёт
        : this.nearestIntersection(ox, oy, a, range, segments);
      pts.push({ x: inter.x, y: inter.y, angle: a, rel: this.wrapAngle(a - lookAngle) });
    }
    pts.sort((p, q) => p.rel - q.rel);

    // Заполнение угловых разрывов: контур не должен «срезать» открытое пространство
    // между редкими вершинами (иначе в открытом месте дальняя зона не освещалась бы).
    // Для кольца (360°) замыкающий разрыв тоже заполняется, для веера — только внутри FOV.
    const stepMax = 0.4; // рад
    const filled = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      filled.push({ x: pts[i].x, y: pts[i].y });
      let a2;
      if (i + 1 < n) a2 = pts[i + 1].rel;
      else if (full) a2 = pts[0].rel + Math.PI * 2;
      else break; // последний разрыв веера лежит вне FOV — заполнять не нужно
      const gap = a2 - pts[i].rel;
      if (gap > stepMax) {
        const count = Math.ceil(gap / stepMax);
        for (let k = 1; k < count; k++) {
          const ang = lookAngle + pts[i].rel + gap * (k / count);
          const inter = this.originBlocked(walls, ox, oy, ang)
            ? { x: ox, y: oy }
            : this.nearestIntersection(ox, oy, ang, range, segments);
          filled.push({ x: inter.x, y: inter.y });
        }
      }
    }
    return filled;
  }

  // ---------------------------------------------------------------- заряд

  // Плавный множитель яркости (1 = нормально) от заряда.
  // Выше lowChargeFrac — 1; ниже — плавно убывает; ниже flickerFrac — лёгкое мерцание.
  dimForCharge(charge, timeMs) {
    let raw = charge / CONFIG.chargeMax;
    if (Number.isNaN(raw)) raw = 0;              // некорректный заряд -> «погас»
    const frac = Math.max(0, Math.min(1, raw));  // ±Infinity корректно зажимается в [0,1]
    const t = Number.isFinite(timeMs) ? timeMs : 0;
    let dim = 1;
    if (frac < CONFIG.lowChargeFrac) {
      dim = Math.pow(frac / CONFIG.lowChargeFrac, CONFIG.lowChargePower);
    }
    if (frac < CONFIG.flickerFrac) {
      dim *= 0.96 + 0.04 * Math.sin(t * 0.004);
    }
    return dim;
  }

  // Эффективная дальность луча с учётом заряда.
  beamRangeForCharge(charge, timeMs) {
    const dim = this.dimForCharge(charge, timeMs);
    return CONFIG.beamRange * (CONFIG.beamMinRangeFrac + (1 - CONFIG.beamMinRangeFrac) * dim);
  }

  // Единственный источник geometry основного фонаря для render и gameplay-проверок.
  directionalFlashlight(level, player, charge, timeMs) {
    const lookAngle = Math.atan2(player.lookDirection.y, player.lookDirection.x);
    const range = this.beamRangeForCharge(charge, timeMs);
    return {
      lookAngle,
      range,
      points: this.visibilityPolygon(
        level, player.x, player.y, lookAngle, CONFIG.beamFovDeg, range
      ),
    };
  }

  pointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[j];
      const b = polygon[i];
      const cross = (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x);
      if (Math.abs(cross) < 1e-7 &&
          x >= Math.min(a.x, b.x) - 1e-7 && x <= Math.max(a.x, b.x) + 1e-7 &&
          y >= Math.min(a.y, b.y) - 1e-7 && y <= Math.max(a.y, b.y) + 1e-7) return true;
      const crosses = ((b.y > y) !== (a.y > y)) &&
        x < (a.x - b.x) * (y - b.y) / (a.y - b.y) + b.x;
      if (crosses) inside = !inside;
    }
    return inside;
  }

  circleIntersectsPolygon(x, y, radius, polygon) {
    if (polygon.length < 3) return false;
    if (this.pointInPolygon(x, y, polygon)) return true;
    const radiusSq = radius * radius;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[j];
      const b = polygon[i];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSq = dx * dx + dy * dy;
      const t = lengthSq > 0
        ? Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / lengthSq))
        : 0;
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      if ((x - px) ** 2 + (y - py) ** 2 <= radiusSq) return true;
    }
    return false;
  }

  isPointInDirectionalFlashlight(level, player, charge, timeMs, x, y) {
    if (charge <= 0) return false;
    const beam = this.directionalFlashlight(level, player, charge, timeMs);
    return this.pointInPolygon(x, y, [
      { x: player.x, y: player.y },
      ...beam.points,
    ]);
  }

  isCircleInDirectionalFlashlight(level, player, charge, timeMs, x, y, radius) {
    if (charge <= 0) return false;
    const beam = this.directionalFlashlight(level, player, charge, timeMs);
    return this.circleIntersectsPolygon(x, y, radius, [
      { x: player.x, y: player.y },
      ...beam.points,
    ]);
  }

  // Линза должна одновременно лежать в реальном occluded polygon фонаря и принимать
  // свет почти вдоль своей двусторонней оси. Результат не записывается в runtime.
  lensSecondaryLights(level, player, charge, timeMs, flashlight) {
    if (charge <= 0) return [];
    const primaryPoly = [{ x: player.x, y: player.y }, ...flashlight.points];
    const tolerance = CONFIG.lensAxisToleranceDeg * DEG2RAD;
    const lights = [];
    for (const lens of level.lenses) {
      // Gameplay aperture совпадает с видимым размером линзы. Прежние 35% радиуса
      // превращались при zoom=1/3 примерно в один screen pixel: визуально луч уже
      // касался стекла, но gameplay-проверка считала промах. Polygon по-прежнему
      // является реальной occluded-геометрией primary flashlight.
      if (!this.circleIntersectsPolygon(
        lens.x, lens.y, lens.radius, primaryPoly
      )) continue;
      const incomingAngle = Math.atan2(lens.y - player.y, lens.x - player.x);
      const axisDelta = Math.abs(this.wrapAngle(incomingAngle - lens.angle));
      const axialDelta = Math.min(axisDelta, Math.abs(Math.PI - axisDelta));
      if (axialDelta > tolerance) continue;

      // Продолжение хода луча: выбираем направление оси, смотрящее от игрока.
      const ax = Math.cos(lens.angle), ay = Math.sin(lens.angle);
      const sign = (lens.x - player.x) * ax + (lens.y - player.y) * ay >= 0 ? 1 : -1;
      const angle = lens.angle + (sign < 0 ? Math.PI : 0);
      // Старт строго в центре линзы: заметный offset мог перенести origin за
      // тонкую/близкую стену и тем самым позволить secondary light перепрыгнуть её.
      const ox = lens.x;
      const oy = lens.y;
      lights.push({
        lens, ox, oy, angle, range: lens.range,
        points: this.visibilityPolygon(level, ox, oy, angle, lens.fovDeg, lens.range),
      });
    }
    return lights;
  }
// ---------------------------------------------------------------- отрисовка

  // world -> logical viewport: тот же zoom и центр камеры, что использует World.
  toViewport(sx, sy, cam, viewW, viewH) {
    return {
      x: (sx - cam.x) * cam.zoom + viewW / 2,
      y: (sy - cam.y) * cam.zoom + viewH / 2,
    };
  }

  render(ctx, level, player, camera, charge, viewW, viewH, timeMs) {
    if (!level || !player) return;
    const dim = this.dimForCharge(charge, timeMs);

    const localRange = CONFIG.localLightRange;
    const localAlpha = CONFIG.localLightMaxAlpha * (0.72 + 0.28 * dim);
    const flashlight = this.directionalFlashlight(level, player, charge, timeMs);
    const beamRange = flashlight.range;
    const beamAlpha = 0.40 + 0.60 * dim;
    const lensLights = this.lensSecondaryLights(level, player, charge, timeMs, flashlight);

    const ox = player.x, oy = player.y;
    const lookAngle = flashlight.lookAngle;

    // Геометрия света (в мировых координатах — стабильна при resize/DPR).
    const localPoly = this.visibilityPolygon(level, ox, oy, lookAngle, 360, localRange);
    const beamPoly = flashlight.points;
    // Неактивные свечи не запускают ray casting. Каждый активный источник использует
    // ту же visibility geometry, что и локальный свет игрока.
    const candleLights = [];
    for (const candle of level.candles) {
      if (!candle.active) continue;
      candleLights.push({
        candle,
        poly: this.visibilityPolygon(
          level, candle.x, candle.y, 0, 360, CONFIG.candleLightRange
        ),
      });
    }

    const mask = this.mask;
    const mc = this.maskCtx;

    // 1) Полная тьма во всём viewport.
    mc.save();
    mc.setTransform(1, 0, 0, 1, 0, 0);
    mc.globalCompositeOperation = 'source-over';
    mc.fillStyle = CONFIG.lightAmbientColor;
    mc.fillRect(0, 0, viewW, viewH);

    // 2) Вырезаем свет (destination-out): где маска прозрачна — там мир виден.
    mc.globalCompositeOperation = 'destination-out';
    this.fillLocalLight(mc, localPoly, camera, viewW, viewH, ox, oy, localRange, localAlpha);
    this.fillBeam(mc, beamPoly, camera, viewW, viewH, ox, oy, beamRange, beamAlpha);
    for (const light of lensLights) {
      this.fillBeam(mc, light.points, camera, viewW, viewH,
        light.ox, light.oy, light.range, CONFIG.lensSecondaryAlpha * dim);
    }
    for (const light of candleLights) {
      this.fillLocalLight(
        mc, light.poly, camera, viewW, viewH,
        light.candle.x, light.candle.y, CONFIG.candleLightRange, CONFIG.candleLightAlpha
      );
    }

    // 3) Мягкость: затухание луча к дальней границе (внутри полигона луча).
    mc.globalCompositeOperation = 'source-over';
    this.fadeBeam(mc, beamPoly, camera, viewW, viewH, ox, oy, beamRange, CONFIG.beamFade * (0.5 + 0.5 * dim));
    for (const light of lensLights) {
      this.fadeBeam(mc, light.points, camera, viewW, viewH,
        light.ox, light.oy, light.range, CONFIG.lensSecondaryFade);
    }
    mc.restore();

    // 4) Перенос маски на основной канвас (в логических координатах).
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(mask, 0, 0, viewW, viewH);
    ctx.restore();

    // Лёгкий тёплый оттенок рисуется только внутри того же occluded polygon.
    for (const light of candleLights) {
      this.drawCandleGlow(ctx, light.poly, camera, viewW, viewH, light.candle);
    }

    if (DEBUG_LIGHTING) this.debugDraw(ctx, level, camera, viewW, viewH, ox, oy, lookAngle, localPoly, beamPoly, beamRange);
  }

  // Мягкий локальный свет: окклюдированный полигон + радиальный градиент.
  fillLocalLight(mc, poly, cam, viewW, viewH, ox, oy, range, alpha) {
    if (poly.length < 3) return;
    const c = this.toViewport(ox, oy, cam, viewW, viewH);
    this.beginPolygonPath(mc, poly, cam, viewW, viewH, true);
    const grad = mc.createRadialGradient(c.x, c.y, 0, c.x, c.y, range * cam.zoom);
    grad.addColorStop(0.0, `rgba(0,0,0,${alpha.toFixed(3)})`);
    grad.addColorStop(0.8, `rgba(0,0,0,${(alpha * 0.55).toFixed(3)})`);
    grad.addColorStop(1.0, 'rgba(0,0,0,0)');
    mc.fillStyle = grad;
    mc.fill();
  }

  // Веер луча: вершина в origin, сплошная заливка (жёсткая маска внутри луча).
  fillBeam(mc, poly, cam, viewW, viewH, ox, oy, range, alpha) {
    if (poly.length < 2) return;
    const c = this.toViewport(ox, oy, cam, viewW, viewH);
    mc.beginPath();
    mc.moveTo(c.x, c.y);
    for (const p of poly) {
      const v = this.toViewport(p.x, p.y, cam, viewW, viewH);
      mc.lineTo(v.x, v.y);
    }
    mc.closePath();
    mc.fillStyle = `rgba(0,0,0,${alpha.toFixed(3)})`;
    mc.fill();
  }

  drawCandleGlow(ctx, poly, cam, viewW, viewH, candle) {
    if (poly.length < 3) return;
    const c = this.toViewport(candle.x, candle.y, cam, viewW, viewH);
    ctx.save();
    this.beginPolygonPath(ctx, poly, cam, viewW, viewH, true);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const grad = ctx.createRadialGradient(
      c.x, c.y, 0, c.x, c.y, CONFIG.candleLightRange * cam.zoom
    );
    grad.addColorStop(0, `rgba(255,176,70,${CONFIG.candleGlowAlpha})`);
    grad.addColorStop(0.55, `rgba(255,132,45,${(CONFIG.candleGlowAlpha * 0.38).toFixed(3)})`);
    grad.addColorStop(1, 'rgba(255,110,35,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(
      c.x - CONFIG.candleLightRange * cam.zoom,
      c.y - CONFIG.candleLightRange * cam.zoom,
      CONFIG.candleLightRange * 2 * cam.zoom,
      CONFIG.candleLightRange * 2 * cam.zoom
    );
    ctx.restore();
  }

  // Градиентное затухание луча по дальности. Рисуется поверх маски,
  // поэтому применяется только внутри луча и не пересекает стены.
  fadeBeam(mc, poly, cam, viewW, viewH, ox, oy, range, fade) {
    if (!poly.length) return;
    const c = this.toViewport(ox, oy, cam, viewW, viewH);
    // В отличие от кругового visibility polygon, направленный contour не содержит
    // origin. Добавляем его явно, иначе fill замыкал только дальнюю хорду веера.
    mc.beginPath();
    mc.moveTo(c.x, c.y);
    for (const p of poly) {
      const v = this.toViewport(p.x, p.y, cam, viewW, viewH);
      mc.lineTo(v.x, v.y);
    }
    mc.closePath();
    const grad = mc.createRadialGradient(c.x, c.y, 0, c.x, c.y, range * cam.zoom);
    grad.addColorStop(0.0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.6, `rgba(0,0,0,${(fade * 0.4).toFixed(3)})`);
    grad.addColorStop(1.0, `rgba(0,0,0,${fade.toFixed(3)})`);
    mc.fillStyle = grad;
    mc.fill();
  }

  beginPolygonPath(mc, poly, cam, viewW, viewH, closed) {
    mc.beginPath();
    const p0 = this.toViewport(poly[0].x, poly[0].y, cam, viewW, viewH);
    mc.moveTo(p0.x, p0.y);
    for (let i = 1; i < poly.length; i++) {
      const v = this.toViewport(poly[i].x, poly[i].y, cam, viewW, viewH);
      mc.lineTo(v.x, v.y);
    }
    if (closed) mc.closePath();
  }

  // ---------------------------------------------------------------- debug

  debugDraw(ctx, level, cam, viewW, viewH, ox, oy, lookAngle, localPoly, beamPoly, beamRange) {
    const { vertices } = this.collectSegments(level);
    ctx.save();
    ctx.lineWidth = 1;

    // Контуры видимых областей.
    ctx.strokeStyle = 'rgba(0,255,255,0.4)';
    ctx.beginPath();
    for (const p of beamPoly) {
      const v = this.toViewport(p.x, p.y, cam, viewW, viewH);
      ctx.lineTo(v.x, v.y);
    }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,120,0,0.4)';
    ctx.beginPath();
    for (const p of localPoly) {
      const v = this.toViewport(p.x, p.y, cam, viewW, viewH);
      ctx.lineTo(v.x, v.y);
    }
    ctx.stroke();

    // Границы FOV.
    const c = this.toViewport(ox, oy, cam, viewW, viewH);
    ctx.strokeStyle = 'rgba(0,255,255,0.35)';
    for (const s of [-1, 1]) {
      const a = lookAngle + s * (CONFIG.beamFovDeg / 2) * DEG2RAD;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x + Math.cos(a) * beamRange, c.y + Math.sin(a) * beamRange);
      ctx.stroke();
    }

    // Вершины стен.
    ctx.fillStyle = 'rgba(255,0,255,0.5)';
    for (const v of vertices) {
      const p = this.toViewport(v.x, v.y, cam, viewW, viewH);
      ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    }
    ctx.restore();
  }
}
