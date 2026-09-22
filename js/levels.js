// Уровни Этапа 1 — чистые данные.
// Движок единый: каждый уровень — просто объект с мировыми координатами.
// Границы мира добавляются автоматически в js/level.js, поэтому здесь они не указаны.
// Координаты не зависят от CSS-пикселей и одинаковы на всех устройствах.
const LEVELS = [
  {
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
  },
  {
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
  },
  {
    name: 'Крошечная комната',
    width: 240,
    height: 400,
    playerStart: { x: 120, y: 60 },
    door: { x: 90, y: 330, width: 60, height: 40 },
    walls: [
      { x: 20, y: 180, width: 70, height: 60 },
      { x: 150, y: 180, width: 70, height: 60 },
    ],
  },
  {
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
  },
  {
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
  },
];