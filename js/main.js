// Точка входа. Настраивает Canvas под DPR и запускает игру.
(() => {
  const screen = document.getElementById('game-screen');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const ui = new UI(screen);
  const input = new Input(canvas);
  const world = new World();
  const lighting = new Lighting();
  const effects = new VisualEffects();
  const audio = new AudioManager();
  ui.setMuteHandler(() => audio.toggleMute(), audio.muted);
  const game = new Game({ ctx, input, ui, world, lighting, effects, audio });

  // Физический размер канваса = логическое разрешение * DPR.
  // Отрисовка всегда идёт в логических координатах через ctx.setTransform,
  // поэтому resize окна не меняет геометрию мира.
  function resize() {
    const rect = screen.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;

    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.maxDpr);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.setTransform(w / CONFIG.viewWidth, 0, 0, h / CONFIG.viewHeight, 0, 0);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(screen);
  }

  resize();
  game.start();
})();
