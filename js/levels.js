// Уровни — чистые ДАННЫЕ (шаблон). Движок единый: каждый уровень — объект с мировыми
// координатами. Границы мира добавляются в js/level.js, runtime-состояния (подобрана ли
// батарейка, активна ли свеча) создаются там же клонированием — эти данные НЕ мутируют.
const LEVELS = [
  {
    // Уровень 1: одна батарейка и одна свеча, без ловушек.
    name: 'Пробуждение',
    width: 720,
    height: 1280,
    playerStart: { x: 360, y: 100 },
    door: { x: 300, y: 1170, width: 120, height: 80 },
    walls: [
      { x: 120, y: 320, width: 60, height: 60 },
      { x: 540, y: 320, width: 60, height: 60 },
      { x: 330, y: 520, width: 60, height: 240 },
      { x: 150, y: 820, width: 200, height: 40 },
      { x: 60, y: 1050, width: 60, height: 60 },
    ],
    batteries: [
      { x: 200, y: 320 },
    ],
    candles: [
      { x: 520, y: 900 },
    ],
    traps: [],
  },
  {
    // Уровень 2: две батарейки и свеча.
    name: 'Коридор',
    width: 760,
    height: 1700,
    playerStart: { x: 380, y: 120 },
    door: { x: 450, y: 1580, width: 180, height: 70 },
    walls: [
      { x: 0, y: 420, width: 380, height: 40 },
      { x: 380, y: 820, width: 380, height: 40 },
      { x: 0, y: 1220, width: 380, height: 40 },
      { x: 620, y: 1250, width: 40, height: 200 },
      { x: 140, y: 1250, width: 40, height: 200 },
    ],
    batteries: [
      { x: 620, y: 200 },
      { x: 200, y: 900 },
    ],
    candles: [
      { x: 560, y: 1400 },
    ],
    traps: [],
  },
  {
    // Уровень 3: свеча в проёме между двумя стенами — проверка occlusion света свечи.
    name: 'Крошечная комната',
    width: 240,
    height: 400,
    playerStart: { x: 120, y: 60 },
    door: { x: 90, y: 330, width: 60, height: 40 },
    walls: [
      { x: 20, y: 180, width: 70, height: 60 },
      { x: 150, y: 180, width: 70, height: 60 },
    ],
    batteries: [
      { x: 120, y: 130 },
    ],
    candles: [
      { x: 120, y: 210 },
    ],
    traps: [],
  },
  {
    // Уровень 4: ловушка в проходе, батарейка и свеча.
    name: 'Лабиринт',
    width: 1080,
    height: 1560,
    playerStart: { x: 540, y: 120 },
    door: { x: 460, y: 1470, width: 160, height: 60 },
    walls: [
      { x: 0, y: 260, width: 480, height: 40 },
      { x: 600, y: 260, width: 480, height: 40 },
      { x: 600, y: 700, width: 480, height: 40 },
      { x: 180, y: 300, width: 36, height: 400 },
      { x: 720, y: 300, width: 36, height: 400 },
      { x: 520, y: 740, width: 36, height: 400 },
      { x: 260, y: 740, width: 36, height: 400 },
      { x: 0, y: 1140, width: 480, height: 40 },
    ],
    batteries: [
      { x: 380, y: 1300 },
    ],
    candles: [
      { x: 800, y: 1300 },
    ],
    traps: [
      { x: 520, y: 290, width: 44, height: 34 },
    ],
  },
  {
    // Уровень 5: комбинация — две батарейки, две свечи, две ловушки.
    name: 'Финал',
    width: 900,
    height: 1300,
    playerStart: { x: 450, y: 140 },
    door: { x: 350, y: 1200, width: 200, height: 60 },
    walls: [
      { x: 0, y: 320, width: 320, height: 36 },
      { x: 520, y: 320, width: 380, height: 36 },
      { x: 380, y: 356, width: 36, height: 420 },
      { x: 120, y: 600, width: 60, height: 60 },
      { x: 720, y: 600, width: 60, height: 60 },
      { x: 0, y: 840, width: 320, height: 36 },
      { x: 520, y: 840, width: 380, height: 36 },
      { x: 200, y: 1080, width: 200, height: 40 },
      { x: 520, y: 1080, width: 200, height: 40 },
    ],
    batteries: [
      { x: 250, y: 450 },
      { x: 830, y: 1000 },
    ],
    candles: [
      { x: 450, y: 620 },
      { x: 150, y: 950 },
    ],
    traps: [
      { x: 430, y: 400, width: 30, height: 30 },
      { x: 700, y: 950, width: 40, height: 30 },
    ],
  },
];