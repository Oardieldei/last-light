// 30 статических immutable-шаблонов первой полной прогрессии уровней.
// Все координаты заданы в world-space; Level создаёт отдельные runtime-копии.
const LEVELS = [
  {
    // 1. Первый свет
    name: 'Первый свет',
    width: 1600,
    height: 2300,
    playerStart: { x: 180, y: 160 },
    door: { x: 1300, y: 2160, width: 120, height: 80 },
    walls: [
      { x: 950, y: 650, width: 650, height: 50 },
      { x: 0, y: 1250, width: 650, height: 50 },
      { x: 950, y: 1850, width: 650, height: 50 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 2. Ориентир
    name: 'Ориентир',
    width: 1600,
    height: 2300,
    playerStart: { x: 180, y: 160 },
    door: { x: 1300, y: 2160, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 600, height: 50 },
      { x: 1000, y: 1250, width: 600, height: 50 },
      { x: 0, y: 1850, width: 600, height: 50 },
    ],
    batteries: [
    ],
    candles: [
      { x: 1300, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 3. Запас света
    name: 'Запас света',
    width: 1600,
    height: 2300,
    playerStart: { x: 180, y: 160 },
    door: { x: 1300, y: 2160, width: 120, height: 80 },
    walls: [
      { x: 900, y: 650, width: 700, height: 50 },
      { x: 0, y: 1250, width: 700, height: 50 },
      { x: 900, y: 1850, width: 700, height: 50 },
    ],
    batteries: [
      { x: 750, y: 900 },
      { x: 1320, y: 1080 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 4. Осторожный шаг
    name: 'Осторожный шаг',
    width: 1600,
    height: 2420,
    playerStart: { x: 180, y: 160 },
    door: { x: 1300, y: 2280, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 650, height: 50 },
      { x: 950, y: 1250, width: 650, height: 50 },
      { x: 0, y: 1850, width: 650, height: 50 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 580, y: 850, width: 54, height: 54 },
      { x: 980, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 5. Кто-то в темноте
    name: 'Кто-то в темноте',
    width: 1700,
    height: 2420,
    playerStart: { x: 180, y: 160 },
    door: { x: 1400, y: 2280, width: 120, height: 80 },
    walls: [
      { x: 1000, y: 650, width: 700, height: 50 },
      { x: 0, y: 1250, width: 700, height: 50 },
      { x: 1000, y: 1850, width: 700, height: 50 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 1280, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 6. Взгляд дальше
    name: 'Взгляд дальше',
    width: 1700,
    height: 2420,
    playerStart: { x: 180, y: 160 },
    door: { x: 1400, y: 2280, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 800, height: 50 },
      { x: 900, y: 1250, width: 800, height: 50 },
      { x: 0, y: 1850, width: 800, height: 50 },
      { x: 825, y: 760, width: 50, height: 280 },
    ],
    batteries: [
      { x: 1400, y: 1100 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
      { x: 1400, y: 900, angle: Math.PI / 2 },
    ],
  },
  {
    // 7. Два пути
    name: 'Два пути',
    width: 1700,
    height: 2540,
    playerStart: { x: 180, y: 160 },
    door: { x: 1400, y: 2400, width: 120, height: 80 },
    walls: [
      { x: 950, y: 650, width: 750, height: 50 },
      { x: 0, y: 1250, width: 750, height: 50 },
      { x: 950, y: 1850, width: 750, height: 50 },
      { x: 825, y: 760, width: 50, height: 280 },
    ],
    batteries: [
      { x: 800, y: 900 },
      { x: 900, y: 1500 },
    ],
    candles: [
      { x: 1400, y: 900 },
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 8. Безопасный обход
    name: 'Безопасный обход',
    width: 1700,
    height: 2540,
    playerStart: { x: 180, y: 160 },
    door: { x: 1400, y: 2400, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 700, height: 50 },
      { x: 1000, y: 1250, width: 700, height: 50 },
      { x: 0, y: 1850, width: 700, height: 50 },
      { x: 825, y: 760, width: 50, height: 280 },
    ],
    batteries: [
    ],
    candles: [
      { x: 1400, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 630, y: 850, width: 54, height: 54 },
      { x: 1030, y: 1080, width: 54, height: 54 },
      { x: 590, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 9. Разбудить или обойти
    name: 'Разбудить или обойти',
    width: 1800,
    height: 2540,
    playerStart: { x: 180, y: 160 },
    door: { x: 1500, y: 2400, width: 120, height: 80 },
    walls: [
      { x: 900, y: 650, width: 900, height: 50 },
      { x: 0, y: 1250, width: 900, height: 50 },
      { x: 900, y: 1850, width: 900, height: 50 },
      { x: 875, y: 760, width: 50, height: 280 },
    ],
    batteries: [
      { x: 750, y: 900 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 1380, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 10. Через стекло
    name: 'Через стекло',
    width: 1800,
    height: 2660,
    playerStart: { x: 180, y: 160 },
    door: { x: 1500, y: 2520, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 850, height: 50 },
      { x: 950, y: 1250, width: 850, height: 50 },
      { x: 0, y: 1850, width: 850, height: 50 },
      { x: 875, y: 760, width: 50, height: 280 },
      { x: 875, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 680, y: 850, width: 54, height: 54 },
      { x: 1080, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 1500, y: 900, angle: Math.PI / 2 },
    ],
  },
  {
    // 11. Тёмные комнаты
    name: 'Тёмные комнаты',
    width: 1800,
    height: 2660,
    playerStart: { x: 180, y: 160 },
    door: { x: 1500, y: 2520, width: 120, height: 80 },
    walls: [
      { x: 1000, y: 650, width: 800, height: 50 },
      { x: 0, y: 1250, width: 800, height: 50 },
      { x: 1000, y: 1850, width: 800, height: 50 },
      { x: 875, y: 760, width: 50, height: 280 },
      { x: 875, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
      { x: 850, y: 900 },
      { x: 950, y: 1500 },
    ],
    candles: [
      { x: 1500, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 680, y: 850, width: 54, height: 54 },
      { x: 1080, y: 1080, width: 54, height: 54 },
      { x: 640, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 12. Нежелательная встреча
    name: 'Нежелательная встреча',
    width: 1800,
    height: 2660,
    playerStart: { x: 180, y: 160 },
    door: { x: 1500, y: 2520, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 900, height: 50 },
      { x: 900, y: 1250, width: 900, height: 50 },
      { x: 0, y: 1850, width: 900, height: 50 },
      { x: 875, y: 760, width: 50, height: 280 },
      { x: 875, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
    ],
    candles: [
      { x: 1500, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 680, y: 850, width: 54, height: 54 },
      { x: 1080, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1380, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 13. Дальний взгляд
    name: 'Дальний взгляд',
    width: 1900,
    height: 2780,
    playerStart: { x: 180, y: 160 },
    door: { x: 1600, y: 2640, width: 120, height: 80 },
    walls: [
      { x: 950, y: 650, width: 950, height: 50 },
      { x: 0, y: 1250, width: 950, height: 50 },
      { x: 950, y: 1850, width: 950, height: 50 },
      { x: 925, y: 760, width: 50, height: 280 },
      { x: 925, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
      { x: 1600, y: 1100 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
      { x: 1600, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
    ],
  },
  {
    // 14. Цена короткого пути
    name: 'Цена короткого пути',
    width: 1900,
    height: 2780,
    playerStart: { x: 180, y: 160 },
    door: { x: 1600, y: 2640, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 900, height: 50 },
      { x: 1000, y: 1250, width: 900, height: 50 },
      { x: 0, y: 1850, width: 900, height: 50 },
      { x: 925, y: 760, width: 50, height: 280 },
      { x: 925, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
      { x: 1050, y: 900 },
    ],
    candles: [
    ],
    traps: [
      { x: 730, y: 850, width: 54, height: 54 },
      { x: 1130, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1480, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 15. Первая комбинация
    name: 'Первая комбинация',
    width: 1900,
    height: 2780,
    playerStart: { x: 180, y: 160 },
    door: { x: 1600, y: 2640, width: 120, height: 80 },
    walls: [
      { x: 900, y: 650, width: 1000, height: 50 },
      { x: 0, y: 1250, width: 1000, height: 50 },
      { x: 900, y: 1850, width: 1000, height: 50 },
      { x: 925, y: 760, width: 50, height: 280 },
      { x: 925, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
    ],
    candles: [
      { x: 1600, y: 1050 },
      { x: 300, y: 1550 },
    ],
    traps: [
    ],
    monsters: [
      { x: 1600, y: 1100 },
    ],
    lenses: [
      { x: 1600, y: 900, angle: Math.PI / 2 },
    ],
  },
  {
    // 16. Развилка
    name: 'Развилка',
    width: 1900,
    height: 2900,
    playerStart: { x: 180, y: 160 },
    door: { x: 1600, y: 2760, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 950, height: 50 },
      { x: 950, y: 1250, width: 950, height: 50 },
      { x: 0, y: 1850, width: 950, height: 50 },
      { x: 950, y: 2450, width: 950, height: 50 },
      { x: 925, y: 760, width: 50, height: 280 },
      { x: 925, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
      { x: 1100, y: 900 },
      { x: 800, y: 1500 },
    ],
    candles: [
      { x: 1600, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 730, y: 850, width: 54, height: 54 },
      { x: 1130, y: 1080, width: 54, height: 54 },
      { x: 690, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1480, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 17. Что за стеной
    name: 'Что за стеной',
    width: 2000,
    height: 2900,
    playerStart: { x: 180, y: 160 },
    door: { x: 1700, y: 2760, width: 120, height: 80 },
    walls: [
      { x: 1000, y: 650, width: 1000, height: 50 },
      { x: 0, y: 1250, width: 1000, height: 50 },
      { x: 1000, y: 1850, width: 1000, height: 50 },
      { x: 0, y: 2450, width: 1000, height: 50 },
      { x: 975, y: 760, width: 50, height: 280 },
      { x: 975, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 780, y: 850, width: 54, height: 54 },
      { x: 1180, y: 1080, width: 54, height: 54 },
      { x: 740, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 1700, y: 900, angle: Math.PI / 2 },
      // Редкая намеренно неопределённая линза: смотрит в пустой боковой карман.
      { x: 300, y: 2200, angle: 0 },
    ],
  },
  {
    // 18. Свет и риск
    name: 'Свет и риск',
    width: 2000,
    height: 2900,
    playerStart: { x: 180, y: 160 },
    door: { x: 1700, y: 2760, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1100, height: 50 },
      { x: 900, y: 1250, width: 1100, height: 50 },
      { x: 0, y: 1850, width: 1100, height: 50 },
      { x: 975, y: 760, width: 50, height: 280 },
      { x: 975, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 1580, y: 950 },
      { x: 380, y: 1550 },
    ],
    lenses: [
    ],
  },
  {
    // 19. Экономия
    name: 'Экономия',
    width: 2000,
    height: 3020,
    playerStart: { x: 180, y: 160 },
    door: { x: 1700, y: 2880, width: 120, height: 80 },
    walls: [
      { x: 950, y: 650, width: 1050, height: 50 },
      { x: 0, y: 1250, width: 1050, height: 50 },
      { x: 950, y: 1850, width: 1050, height: 50 },
      { x: 0, y: 2450, width: 1050, height: 50 },
      { x: 975, y: 760, width: 50, height: 280 },
      { x: 975, y: 1450, width: 50, height: 250 },
    ],
    batteries: [
      { x: 800, y: 900 },
      { x: 1200, y: 1500 },
      { x: 800, y: 2100 },
    ],
    candles: [
      { x: 1700, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 600, y: 850, width: 54, height: 54 },
      { x: 1180, y: 1080, width: 54, height: 54 },
      { x: 740, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 20. Разведка
    name: 'Разведка',
    width: 2000,
    height: 3020,
    playerStart: { x: 180, y: 160 },
    door: { x: 1700, y: 2880, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1000, height: 50 },
      { x: 1000, y: 1250, width: 1000, height: 50 },
      { x: 0, y: 1850, width: 1000, height: 50 },
      { x: 1000, y: 2450, width: 1000, height: 50 },
      { x: 975, y: 760, width: 50, height: 280 },
      { x: 975, y: 1450, width: 50, height: 250 },
      { x: 1220, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 780, y: 850, width: 54, height: 54 },
      { x: 1180, y: 1080, width: 54, height: 54 },
      { x: 740, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1700, y: 1100 },
    ],
    lenses: [
      { x: 1700, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
    ],
  },
  {
    // 21. Преследование
    name: 'Преследование',
    width: 2100,
    height: 3020,
    playerStart: { x: 180, y: 160 },
    door: { x: 1800, y: 2880, width: 120, height: 80 },
    walls: [
      { x: 900, y: 650, width: 1200, height: 50 },
      { x: 0, y: 1250, width: 1200, height: 50 },
      { x: 900, y: 1850, width: 1200, height: 50 },
      { x: 0, y: 2450, width: 1200, height: 50 },
      { x: 1025, y: 760, width: 50, height: 280 },
      { x: 1025, y: 1450, width: 50, height: 250 },
      { x: 1270, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 750, y: 900 },
      { x: 1350, y: 1500 },
    ],
    candles: [
      { x: 1800, y: 900 },
    ],
    traps: [
    ],
    monsters: [
      { x: 1680, y: 950 },
      { x: 380, y: 1550 },
      { x: 1680, y: 2150 },
    ],
    lenses: [
    ],
  },
  {
    // 22. Освещённые острова
    name: 'Освещённые острова',
    width: 2100,
    height: 3140,
    playerStart: { x: 180, y: 160 },
    door: { x: 1800, y: 3000, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1150, height: 50 },
      { x: 950, y: 1250, width: 1150, height: 50 },
      { x: 0, y: 1850, width: 1150, height: 50 },
      { x: 950, y: 2450, width: 1150, height: 50 },
      { x: 1025, y: 760, width: 50, height: 280 },
      { x: 1025, y: 1450, width: 50, height: 250 },
      { x: 1270, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1300, y: 900 },
      { x: 800, y: 1500 },
    ],
    candles: [
      { x: 1800, y: 900 },
      { x: 300, y: 1550 },
      { x: 1780, y: 2200 },
      { x: 320, y: 1100 },
    ],
    traps: [
      { x: 830, y: 850, width: 54, height: 54 },
      { x: 1230, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1680, y: 950 },
      { x: 380, y: 1550 },
    ],
    lenses: [
    ],
  },
  {
    // 23. Оптический маршрут
    name: 'Оптический маршрут',
    width: 2100,
    height: 3140,
    playerStart: { x: 180, y: 160 },
    door: { x: 1800, y: 3000, width: 120, height: 80 },
    walls: [
      { x: 1000, y: 650, width: 1100, height: 50 },
      { x: 0, y: 1250, width: 1100, height: 50 },
      { x: 1000, y: 1850, width: 1100, height: 50 },
      { x: 0, y: 2450, width: 1100, height: 50 },
      { x: 1025, y: 760, width: 50, height: 280 },
      { x: 1025, y: 1450, width: 50, height: 250 },
      { x: 1270, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1800, y: 1100 },
      { x: 1250, y: 1500 },
    ],
    candles: [
      { x: 300, y: 1700 },
    ],
    traps: [
      { x: 830, y: 850, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 1800, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
      { x: 1750, y: 2150, angle: Math.PI / 2 },
    ],
  },
  {
    // 24. Выбор риска
    name: 'Выбор риска',
    width: 2100,
    height: 3140,
    playerStart: { x: 180, y: 160 },
    door: { x: 1800, y: 3000, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1200, height: 50 },
      { x: 900, y: 1250, width: 1200, height: 50 },
      { x: 0, y: 1850, width: 1200, height: 50 },
      { x: 900, y: 2450, width: 1200, height: 50 },
      { x: 1025, y: 760, width: 50, height: 280 },
      { x: 1025, y: 1450, width: 50, height: 250 },
      { x: 1270, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1350, y: 900 },
      { x: 750, y: 1500 },
    ],
    candles: [
    ],
    traps: [
      { x: 830, y: 850, width: 54, height: 54 },
      { x: 1230, y: 1080, width: 54, height: 54 },
      { x: 790, y: 1500, width: 54, height: 54 },
      { x: 1260, y: 1730, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1680, y: 950 },
      { x: 380, y: 1550 },
    ],
    lenses: [
    ],
  },
  {
    // 25. Тёмный зал
    name: 'Тёмный зал',
    width: 2200,
    height: 3260,
    playerStart: { x: 180, y: 160 },
    door: { x: 1900, y: 3120, width: 120, height: 80 },
    walls: [
      { x: 950, y: 650, width: 1250, height: 50 },
      { x: 0, y: 1250, width: 1250, height: 50 },
      { x: 950, y: 1850, width: 1250, height: 50 },
      { x: 0, y: 2450, width: 1250, height: 50 },
      { x: 1075, y: 760, width: 50, height: 280 },
      { x: 1075, y: 1450, width: 50, height: 250 },
      { x: 1320, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 800, y: 900 },
      { x: 1400, y: 1500 },
    ],
    candles: [
      { x: 1900, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 880, y: 850, width: 54, height: 54 },
      { x: 1280, y: 1080, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1780, y: 950 },
      { x: 380, y: 1550 },
      { x: 1780, y: 2150 },
    ],
    lenses: [
    ],
  },
  {
    // 26. Сначала посмотри
    name: 'Сначала посмотри',
    width: 2200,
    height: 3260,
    playerStart: { x: 180, y: 160 },
    door: { x: 1900, y: 3120, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1200, height: 50 },
      { x: 1000, y: 1250, width: 1200, height: 50 },
      { x: 0, y: 1850, width: 1200, height: 50 },
      { x: 1000, y: 2450, width: 1200, height: 50 },
      { x: 1075, y: 760, width: 50, height: 280 },
      { x: 1075, y: 1450, width: 50, height: 250 },
      { x: 1320, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1350, y: 900 },
      { x: 850, y: 1500 },
    ],
    candles: [
      { x: 1900, y: 1050 },
    ],
    traps: [
      { x: 880, y: 850, width: 54, height: 54 },
      { x: 1280, y: 1080, width: 54, height: 54 },
      { x: 600, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1900, y: 1100 },
      { x: 380, y: 1550 },
    ],
    lenses: [
      { x: 1900, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
    ],
  },
  {
    // 27. Остаток заряда
    name: 'Остаток заряда',
    width: 2200,
    height: 3260,
    playerStart: { x: 180, y: 160 },
    door: { x: 1900, y: 3120, width: 120, height: 80 },
    walls: [
      { x: 900, y: 650, width: 1300, height: 50 },
      { x: 0, y: 1250, width: 1300, height: 50 },
      { x: 900, y: 1850, width: 1300, height: 50 },
      { x: 0, y: 2450, width: 1300, height: 50 },
      { x: 1075, y: 760, width: 50, height: 280 },
      { x: 1075, y: 1450, width: 50, height: 250 },
      { x: 1320, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 750, y: 900 },
      { x: 1450, y: 1500 },
      { x: 750, y: 2100 },
    ],
    candles: [
      { x: 1900, y: 900 },
      { x: 300, y: 1550 },
    ],
    traps: [
      { x: 880, y: 850, width: 54, height: 54 },
      { x: 1280, y: 1080, width: 54, height: 54 },
      { x: 840, y: 1500, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1780, y: 950 },
    ],
    lenses: [
    ],
  },
  {
    // 28. Три угрозы
    name: 'Три угрозы',
    width: 2200,
    height: 3300,
    playerStart: { x: 180, y: 160 },
    door: { x: 1900, y: 3160, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1250, height: 50 },
      { x: 950, y: 1250, width: 1250, height: 50 },
      { x: 0, y: 1850, width: 1250, height: 50 },
      { x: 950, y: 2450, width: 1250, height: 50 },
      { x: 1075, y: 760, width: 50, height: 280 },
      { x: 1075, y: 1450, width: 50, height: 250 },
      { x: 1320, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1400, y: 900 },
      { x: 800, y: 1500 },
    ],
    candles: [
      { x: 1900, y: 900 },
      { x: 300, y: 1550 },
      { x: 1880, y: 2200 },
    ],
    traps: [
      { x: 880, y: 850, width: 54, height: 54 },
      { x: 1280, y: 1080, width: 54, height: 54 },
      { x: 840, y: 1500, width: 54, height: 54 },
      { x: 1310, y: 1730, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1780, y: 950 },
      { x: 380, y: 1550 },
      { x: 1780, y: 2150 },
    ],
    lenses: [
    ],
  },
  {
    // 29. Последняя разведка
    name: 'Последняя разведка',
    width: 2300,
    height: 3300,
    playerStart: { x: 180, y: 160 },
    door: { x: 2000, y: 3160, width: 120, height: 80 },
    walls: [
      { x: 1000, y: 650, width: 1300, height: 50 },
      { x: 0, y: 1250, width: 1300, height: 50 },
      { x: 1000, y: 1850, width: 1300, height: 50 },
      { x: 0, y: 2450, width: 1300, height: 50 },
      { x: 1125, y: 760, width: 50, height: 280 },
      { x: 1125, y: 1450, width: 50, height: 250 },
      { x: 1370, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 850, y: 900 },
      { x: 1450, y: 1500 },
    ],
    candles: [
      { x: 2000, y: 1050 },
    ],
    traps: [
      { x: 930, y: 850, width: 54, height: 54 },
      { x: 1330, y: 1080, width: 54, height: 54 },
      { x: 890, y: 1500, width: 54, height: 54 },
      { x: 1360, y: 1730, width: 54, height: 54 },
    ],
    monsters: [
      { x: 2000, y: 1100 },
      { x: 380, y: 1550 },
    ],
    lenses: [
      { x: 2000, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
      { x: 1950, y: 2150, angle: Math.PI / 2 },
    ],
  },
  {
    // 30. Последний огонёк
    name: 'Последний огонёк',
    width: 2300,
    height: 3300,
    playerStart: { x: 180, y: 160 },
    door: { x: 2000, y: 3160, width: 120, height: 80 },
    walls: [
      { x: 0, y: 650, width: 1400, height: 50 },
      { x: 900, y: 1250, width: 1400, height: 50 },
      { x: 0, y: 1850, width: 1400, height: 50 },
      { x: 900, y: 2450, width: 1400, height: 50 },
      { x: 1125, y: 760, width: 50, height: 280 },
      { x: 1125, y: 1450, width: 50, height: 250 },
      { x: 1370, y: 2050, width: 50, height: 260 },
    ],
    batteries: [
      { x: 1550, y: 900 },
      { x: 750, y: 1500 },
      { x: 1550, y: 2100 },
    ],
    candles: [
      { x: 2000, y: 1050 },
      { x: 300, y: 1750 },
      { x: 1980, y: 2200 },
    ],
    traps: [
      { x: 930, y: 850, width: 54, height: 54 },
      { x: 1330, y: 1080, width: 54, height: 54 },
      { x: 890, y: 1500, width: 54, height: 54 },
      { x: 1360, y: 1730, width: 54, height: 54 },
      { x: 1150, y: 2150, width: 54, height: 54 },
    ],
    monsters: [
      { x: 2000, y: 1100 },
      { x: 380, y: 1550 },
      { x: 1880, y: 2150 },
    ],
    lenses: [
      { x: 2000, y: 900, angle: Math.PI / 2 },
      { x: 300, y: 1550, angle: Math.PI / 2 },
      { x: 1950, y: 2150, angle: Math.PI / 2 },
    ],
  },
];
