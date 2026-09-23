// Единая система ввода через Pointer Events — мышь и touch без отдельных физик.
// Все координаты хранятся в ЛОГИЧЕСКИХ координатах viewport (360×640).
// Преобразование логические → мировые выполняет Game через текущую камеру.
//
// Мышь:  положение курсора → направление взгляда; удержание ЛКМ → движение.
// Touch: короткий тап → направление взгляда; удержание/перетаскивание → движение.
class Input {
  constructor(canvas) {
    this.canvas = canvas;

    // pointerId -> { lx, ly, startLx, startLy, downTime, maxMove, engaged }
    this.pointers = new Map();
    this.activeId = null;        // указатель, управляющий движением
    this.pendingTap = null;      // { lx, ly }
    this.pendingMouseLook = null; // { lx, ly }

    this.onPointerDown = (e) => this.handlePointerDown(e);
    this.onPointerMove = (e) => this.handlePointerMove(e);
    this.onPointerUp = (e) => this.handlePointerUp(e, false);
    this.onPointerCancel = (e) => this.handlePointerUp(e, true);
    this.onContextMenu = (e) => e.preventDefault();

    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    // pointerup/pointercancel вешаем на window: при отсутствии setPointerCapture
    // отпускание вне canvas всё равно будет получено (обработчик идемпотентен).
    window.addEventListener('pointerup', this.onPointerUp);
    window.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('contextmenu', this.onContextMenu);
  }

  // Сброс состояния (при загрузке уровня/старте игры).
  reset() {
    this.pointers.clear();
    this.activeId = null;
    this.pendingTap = null;
    this.pendingMouseLook = null;
  }

  // Переход события в логические координаты viewport.
  toLogical(e) {
    const rect = this.canvas.getBoundingClientRect();
    const rw = Math.max(1, rect.width);
    const rh = Math.max(1, rect.height);
    return {
      lx: ((e.clientX - rect.left) / rw) * CONFIG.viewWidth,
      ly: ((e.clientY - rect.top) / rh) * CONFIG.viewHeight,
    };
  }

  handlePointerDown(e) {
    // Игнорируем не-ЛКМ у мыши (правый/средний клик).
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* поддерживается не везде — не критично */ }

    const { lx, ly } = this.toLogical(e);
    this.pointers.set(e.pointerId, {
      lx, ly, startLx: lx, startLy: ly,
      downTime: performance.now(), maxMove: 0, engaged: false,
    });
    if (this.activeId === null) this.activeId = e.pointerId;
    if (e.pointerType === 'mouse') this.pendingMouseLook = { lx, ly };
  }

  handlePointerMove(e) {
    const { lx, ly } = this.toLogical(e);
    // Мышь: курсор задаёт направление взгляда даже без нажатия.
    if (e.pointerType === 'mouse') this.pendingMouseLook = { lx, ly };

    const p = this.pointers.get(e.pointerId);
    if (!p) return;

    p.lx = lx;
    p.ly = ly;
    const moved = Math.hypot(lx - p.startLx, ly - p.startLy);
    if (moved > p.maxMove) p.maxMove = moved;
  }

  handlePointerUp(e, cancelled) {
    const p = this.pointers.get(e.pointerId);
    if (!p) return;

    const { lx, ly } = this.toLogical(e);
    // Короткий тап без движения — только направление взгляда, движение не запускается.
    if (!cancelled && !p.engaged &&
        p.maxMove <= CONFIG.tapMaxDistance &&
        performance.now() - p.downTime <= CONFIG.tapMaxTimeMs) {
      this.pendingTap = { lx, ly };
    }

    this.pointers.delete(e.pointerId);
    if (this.activeId === e.pointerId) this.activeId = null;
  }

  // Текущее движение: { active, lx, ly } — активен ли управляющий указатель и куда направлен.
  // Проверяется каждый кадр, поэтому «удержание без движения» тоже запускает движение
  // (по таймеру holdEngageMs), даже если pointermove не приходил.
  getMovement() {
    if (this.activeId === null) return { active: false, lx: 0, ly: 0 };
    const p = this.pointers.get(this.activeId);
    if (!p) return { active: false, lx: 0, ly: 0 };

    if (!p.engaged) {
      if (p.maxMove > CONFIG.tapMaxDistance ||
          performance.now() - p.downTime > CONFIG.holdEngageMs) {
        p.engaged = true;
      }
    }
    if (!p.engaged) return { active: false, lx: 0, ly: 0 };
    return { active: true, lx: p.lx, ly: p.ly };
  }

  consumeTap() {
    const t = this.pendingTap;
    this.pendingTap = null;
    return t;
  }

  consumeMouseLook() {
    const l = this.pendingMouseLook;
    this.pendingMouseLook = null;
    return l;
  }
}