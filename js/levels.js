// 30 статических immutable-шаблонов плотной кампании.
// Размер каждой карты соответствует её содержимому; координаты заданы в world-space.
const LEVELS = [
  {
    // 1. Первый свет: короткая петля вокруг центральной перегородки.
    name: 'Первый свет',
    width: 1250,
    height: 2050,
    playerStart: { x: 110, y: 110 },
    door: { x: 1030, y: 1864, width: 110, height: 76 },
    walls: [
      { x: 0, y: 861, width: 475, height: 51 },
      { x: 775, y: 861, width: 475, height: 51 },
      { x: 612, y: 1230, width: 42, height: 574 },
      { x: 150, y: 1435, width: 250, height: 51 },
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
    // 2. Ориентир: две освещённые комнаты.
    name: 'Ориентир',
    width: 1300,
    height: 2000,
    playerStart: { x: 1190, y: 110 },
    door: { x: 110, y: 1814, width: 110, height: 76 },
    walls: [
      { x: 624, y: 0, width: 42, height: 560 },
      { x: 624, y: 860, width: 42, height: 500 },
      { x: 624, y: 1480, width: 42, height: 280 },
      { x: 234, y: 1120, width: 390, height: 50 },
      { x: 656, y: 560, width: 364, height: 50 },
      { x: 910, y: 1440, width: 234, height: 50 },
    ],
    batteries: [
    ],
    candles: [
      { x: 689, y: 1460 },
      { x: 858, y: 320 },
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 3. Запас света: батарея на маршруте и боковой карман.
    name: 'Запас света',
    width: 1350,
    height: 2050,
    playerStart: { x: 110, y: 1940 },
    door: { x: 1130, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 676, width: 837, height: 51 },
      { x: 1053, y: 676, width: 297, height: 51 },
      { x: 297, y: 1374, width: 1053, height: 51 },
      { x: 608, y: 922, width: 42, height: 410 },
      { x: 972, y: 1681, width: 216, height: 51 },
    ],
    batteries: [
      { x: 189, y: 1722 },
      { x: 540, y: 1271 },
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
    // 4. Осторожный шаг: две безопасные линии обхода ловушек.
    name: 'Осторожный шаг',
    width: 1350,
    height: 2000,
    playerStart: { x: 1240, y: 1890 },
    door: { x: 110, y: 110, width: 110, height: 76 },
    walls: [
      { x: 432, y: 0, width: 42, height: 680 },
      { x: 432, y: 1100, width: 42, height: 900 },
      { x: 918, y: 360, width: 42, height: 720 },
      { x: 918, y: 1500, width: 42, height: 500 },
      { x: 466, y: 940, width: 270, height: 50 },
      { x: 162, y: 1440, width: 243, height: 50 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 337, y: 973, width: 54, height: 54 },
      { x: 1161, y: 1653, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 5. Кто-то в темноте: ранняя боковая угроза и круговой отход.
    name: 'Кто-то в темноте',
    width: 1400,
    height: 2050,
    playerStart: { x: 110, y: 1025 },
    door: { x: 1180, y: 1476, width: 110, height: 76 },
    walls: [
      { x: 0, y: 615, width: 616, height: 51 },
      { x: 868, y: 615, width: 532, height: 51 },
      { x: 350, y: 1353, width: 700, height: 51 },
      { x: 616, y: 615, width: 42, height: 410 },
      { x: 868, y: 984, width: 42, height: 369 },
      { x: 1008, y: 1681, width: 224, height: 51 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 742, y: 554 },
    ],
    lenses: [
    ],
  },
  {
    // 6. Взгляд дальше: линза раскрывает батарею в соседней зоне.
    name: 'Взгляд дальше',
    width: 1450,
    height: 2050,
    playerStart: { x: 725, y: 1940 },
    door: { x: 110, y: 260, width: 110, height: 76 },
    walls: [
      { x: 0, y: 554, width: 841, height: 51 },
      { x: 1044, y: 554, width: 406, height: 51 },
      { x: 406, y: 1107, width: 1044, height: 51 },
      { x: 0, y: 1599, width: 841, height: 51 },
      { x: 1044, y: 1599, width: 406, height: 51 },
    ],
    batteries: [
      { x: 975, y: 718 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
      { x: 725, y: 718, angle: 0 },
    ],
  },
  {
    // 7. Два пути: короткая и ресурсная ветки.
    name: 'Два пути',
    width: 1450,
    height: 2100,
    playerStart: { x: 725, y: 110 },
    door: { x: 1230, y: 1230, width: 110, height: 76 },
    walls: [
      { x: 0, y: 882, width: 551, height: 52 },
      { x: 899, y: 882, width: 551, height: 52 },
      { x: 710, y: 1260, width: 42, height: 588 },
      { x: 174, y: 1470, width: 290, height: 52 },
    ],
    batteries: [
      { x: 1276, y: 1533 },
      { x: 768, y: 1050 },
    ],
    candles: [
      { x: 392, y: 1050 },
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 8. Безопасный обход: три ловушки между освещёнными островками.
    name: 'Безопасный обход',
    width: 1500,
    height: 2050,
    playerStart: { x: 110, y: 1537 },
    door: { x: 1280, y: 110, width: 110, height: 76 },
    walls: [
      { x: 720, y: 0, width: 42, height: 574 },
      { x: 720, y: 882, width: 42, height: 512 },
      { x: 720, y: 1517, width: 42, height: 287 },
      { x: 270, y: 1148, width: 450, height: 51 },
      { x: 758, y: 574, width: 420, height: 51 },
      { x: 1050, y: 1476, width: 270, height: 51 },
    ],
    batteries: [
    ],
    candles: [
      { x: 210, y: 1271 },
      { x: 795, y: 1496 },
    ],
    traps: [
      { x: 963, y: 1695, width: 54, height: 54 },
      { x: 573, y: 1695, width: 54, height: 54 },
      { x: 1293, y: 998, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 9. Разбудить или обойти: рискованный центр и тихий внешний обход.
    name: 'Разбудить или обойти',
    width: 1500,
    height: 2150,
    playerStart: { x: 110, y: 110 },
    door: { x: 1280, y: 1964, width: 110, height: 76 },
    walls: [
      { x: 0, y: 710, width: 930, height: 54 },
      { x: 1170, y: 710, width: 330, height: 54 },
      { x: 330, y: 1440, width: 1170, height: 54 },
      { x: 675, y: 968, width: 42, height: 430 },
      { x: 1080, y: 1763, width: 240, height: 54 },
    ],
    batteries: [
      { x: 600, y: 580 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 210, y: 1806 },
    ],
    lenses: [
    ],
  },
  {
    // 10. Через стекло: линза заранее показывает trap.
    name: 'Через стекло',
    width: 1550,
    height: 2100,
    playerStart: { x: 1440, y: 110 },
    door: { x: 110, y: 1914, width: 110, height: 76 },
    walls: [
      { x: 496, y: 0, width: 42, height: 714 },
      { x: 496, y: 1155, width: 42, height: 945 },
      { x: 1054, y: 378, width: 42, height: 756 },
      { x: 1054, y: 1575, width: 42, height: 525 },
      { x: 535, y: 987, width: 310, height: 52 },
      { x: 186, y: 1512, width: 279, height: 52 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 748, y: 1861, width: 54, height: 54 },
      { x: 996, y: 771, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 775, y: 1638, angle: Math.PI / 2 },
    ],
  },
  {
    // 11. Тёмные комнаты: связанные тёмные комнаты.
    name: 'Тёмные комнаты',
    width: 1600,
    height: 2200,
    playerStart: { x: 110, y: 2090 },
    door: { x: 1380, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 660, width: 704, height: 55 },
      { x: 992, y: 660, width: 608, height: 55 },
      { x: 400, y: 1452, width: 800, height: 55 },
      { x: 704, y: 660, width: 42, height: 440 },
      { x: 992, y: 1056, width: 42, height: 396 },
      { x: 1152, y: 1804, width: 256, height: 55 },
    ],
    batteries: [
      { x: 224, y: 352 },
      { x: 1056, y: 836 },
    ],
    candles: [
      { x: 848, y: 1100 },
      { x: 1056, y: 594 },
    ],
    traps: [
      { x: 1237, y: 809, width: 54, height: 54 },
      { x: 197, y: 1821, width: 54, height: 54 },
      { x: 197, y: 1579, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 12. Нежелательная встреча: опасная комната с наружным обходом.
    name: 'Нежелательная встреча',
    width: 1600,
    height: 2250,
    playerStart: { x: 1490, y: 2140 },
    door: { x: 500, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 608, width: 928, height: 56 },
      { x: 1152, y: 608, width: 448, height: 56 },
      { x: 448, y: 1215, width: 1152, height: 56 },
      { x: 0, y: 1755, width: 928, height: 56 },
      { x: 1152, y: 1755, width: 448, height: 56 },
    ],
    batteries: [
    ],
    candles: [
      { x: 224, y: 855 },
      { x: 1408, y: 360 },
    ],
    traps: [
      { x: 1029, y: 828, width: 54, height: 54 },
      { x: 197, y: 333, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1264, y: 1125 },
    ],
    lenses: [
    ],
  },
  {
    // 13. Дальний взгляд: две независимые оптические линии.
    name: 'Дальний взгляд',
    width: 1650,
    height: 2200,
    playerStart: { x: 110, y: 1100 },
    door: { x: 1430, y: 1584, width: 110, height: 76 },
    walls: [
      { x: 0, y: 924, width: 627, height: 55 },
      { x: 1023, y: 924, width: 627, height: 55 },
      { x: 808, y: 1320, width: 42, height: 616 },
      { x: 198, y: 1540, width: 330, height: 55 },
    ],
    batteries: [
      { x: 778, y: 1100 },
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
    ],
    lenses: [
      { x: 528, y: 1100, angle: 0 },
      { x: 528, y: 484, angle: Math.PI / 2 },
    ],
  },
  {
    // 14. Цена короткого пути: короткий путь у монстра и длинная петля.
    name: 'Цена короткого пути',
    width: 1600,
    height: 2300,
    playerStart: { x: 800, y: 2190 },
    door: { x: 110, y: 260, width: 110, height: 76 },
    walls: [
      { x: 768, y: 0, width: 42, height: 644 },
      { x: 768, y: 989, width: 42, height: 575 },
      { x: 768, y: 1702, width: 42, height: 322 },
      { x: 288, y: 1288, width: 480, height: 58 },
      { x: 808, y: 644, width: 448, height: 58 },
      { x: 1120, y: 1656, width: 288, height: 58 },
    ],
    batteries: [
      { x: 224, y: 368 },
    ],
    candles: [
    ],
    traps: [
      { x: 405, y: 1905, width: 54, height: 54 },
      { x: 1237, y: 341, width: 54, height: 54 },
    ],
    monsters: [
      { x: 432, y: 1426 },
    ],
    lenses: [
    ],
  },
  {
    // 15. Первая комбинация: линза безопасно показывает монстра.
    name: 'Первая комбинация',
    width: 1650,
    height: 2250,
    playerStart: { x: 825, y: 110 },
    door: { x: 1430, y: 1305, width: 110, height: 76 },
    walls: [
      { x: 0, y: 742, width: 1023, height: 56 },
      { x: 1287, y: 742, width: 363, height: 56 },
      { x: 363, y: 1508, width: 1287, height: 56 },
      { x: 742, y: 1012, width: 42, height: 450 },
      { x: 1188, y: 1845, width: 264, height: 56 },
    ],
    batteries: [
    ],
    candles: [
      { x: 231, y: 360 },
      { x: 660, y: 360 },
    ],
    traps: [
    ],
    monsters: [
      { x: 1122, y: 745 },
    ],
    lenses: [
      { x: 1122, y: 495, angle: Math.PI / 2 },
    ],
  },
  {
    // 16. Развилка: три соединённых маршрута.
    name: 'Развилка',
    width: 1700,
    height: 2350,
    playerStart: { x: 110, y: 1762 },
    door: { x: 1480, y: 110, width: 110, height: 76 },
    walls: [
      { x: 544, y: 0, width: 42, height: 799 },
      { x: 544, y: 1292, width: 42, height: 1058 },
      { x: 1156, y: 423, width: 42, height: 846 },
      { x: 1156, y: 1762, width: 42, height: 588 },
      { x: 586, y: 1104, width: 340, height: 59 },
      { x: 204, y: 1692, width: 306, height: 59 },
    ],
    batteries: [
      { x: 901, y: 634 },
      { x: 1122, y: 1175 },
    ],
    candles: [
      { x: 238, y: 376 },
      { x: 680, y: 893 },
    ],
    traps: [
      { x: 432, y: 1947, width: 54, height: 54 },
      { x: 1469, y: 349, width: 54, height: 54 },
      { x: 1095, y: 607, width: 54, height: 54 },
    ],
    monsters: [
      { x: 459, y: 893 },
    ],
    lenses: [
    ],
  },
  {
    // 17. Что за стеной: полезная и пустая линзы.
    name: 'Что за стеной',
    width: 1700,
    height: 2300,
    playerStart: { x: 110, y: 110 },
    door: { x: 1480, y: 2114, width: 110, height: 76 },
    walls: [
      { x: 0, y: 690, width: 748, height: 58 },
      { x: 1054, y: 690, width: 646, height: 58 },
      { x: 425, y: 1518, width: 850, height: 58 },
      { x: 748, y: 690, width: 42, height: 460 },
      { x: 1054, y: 1104, width: 42, height: 414 },
      { x: 1224, y: 1886, width: 272, height: 58 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 1379, y: 479, width: 54, height: 54 },
      { x: 1095, y: 1652, width: 54, height: 54 },
      { x: 1469, y: 1123, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 1156, y: 506, angle: 0 },
      { x: 306, y: 1794, angle: Math.PI / 2 },
    ],
  },
  {
    // 18. Свет и риск: две разнесённые зоны угрозы.
    name: 'Свет и риск',
    width: 1750,
    height: 2350,
    playerStart: { x: 1640, y: 110 },
    door: { x: 750, y: 2164, width: 110, height: 76 },
    walls: [
      { x: 0, y: 634, width: 1015, height: 59 },
      { x: 1260, y: 634, width: 490, height: 59 },
      { x: 490, y: 1269, width: 1260, height: 59 },
      { x: 0, y: 1833, width: 1015, height: 59 },
      { x: 1260, y: 1833, width: 490, height: 59 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
    ],
    monsters: [
      { x: 245, y: 893 },
      { x: 928, y: 1175 },
    ],
    lenses: [
    ],
  },
  {
    // 19. Экономия: ресурсная петля с возвратом.
    name: 'Экономия',
    width: 1750,
    height: 2400,
    playerStart: { x: 110, y: 2290 },
    door: { x: 1530, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 1008, width: 665, height: 60 },
      { x: 1085, y: 1008, width: 665, height: 60 },
      { x: 858, y: 1440, width: 44, height: 672 },
      { x: 210, y: 1680, width: 350, height: 60 },
    ],
    batteries: [
      { x: 1155, y: 1200 },
      { x: 245, y: 912 },
      { x: 245, y: 2016 },
    ],
    candles: [
      { x: 1382, y: 648 },
      { x: 1155, y: 1752 },
    ],
    traps: [
      { x: 1513, y: 1461, width: 54, height: 54 },
      { x: 1128, y: 1989, width: 54, height: 54 },
      { x: 901, y: 885, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
    ],
  },
  {
    // 20. Разведка: оптическая разведка опасной комнаты.
    name: 'Разведка',
    width: 1800,
    height: 2350,
    playerStart: { x: 1690, y: 2240 },
    door: { x: 110, y: 110, width: 110, height: 76 },
    walls: [
      { x: 864, y: 0, width: 45, height: 658 },
      { x: 864, y: 1010, width: 45, height: 588 },
      { x: 864, y: 1739, width: 45, height: 329 },
      { x: 324, y: 1316, width: 540, height: 59 },
      { x: 909, y: 658, width: 504, height: 59 },
      { x: 1260, y: 1692, width: 324, height: 59 },
    ],
    batteries: [
    ],
    candles: [
    ],
    traps: [
      { x: 1161, y: 1947, width: 54, height: 54 },
      { x: 1161, y: 866, width: 54, height: 54 },
      { x: 1395, y: 349, width: 54, height: 54 },
    ],
    monsters: [
      { x: 324, y: 1072 },
    ],
    lenses: [
      { x: 1476, y: 1528, angle: 0 },
      { x: 324, y: 822, angle: Math.PI / 2 },
    ],
  },
  {
    // 21. Преследование: три независимые области преследования.
    name: 'Преследование',
    width: 1850,
    height: 2450,
    playerStart: { x: 110, y: 1225 },
    door: { x: 1630, y: 1764, width: 110, height: 76 },
    walls: [
      { x: 0, y: 808, width: 1147, height: 61 },
      { x: 1443, y: 808, width: 407, height: 61 },
      { x: 407, y: 1642, width: 1443, height: 61 },
      { x: 832, y: 1102, width: 46, height: 490 },
      { x: 1332, y: 2009, width: 296, height: 61 },
    ],
    batteries: [
      { x: 740, y: 931 },
      { x: 259, y: 1788 },
    ],
    candles: [
      { x: 980, y: 392 },
    ],
    traps: [
    ],
    monsters: [
      { x: 500, y: 1519 },
      { x: 500, y: 662 },
      { x: 740, y: 392 },
    ],
    lenses: [
    ],
  },
  {
    // 22. Освещённые острова: цепочка освещённых ориентиров.
    name: 'Освещённые острова',
    width: 1850,
    height: 2500,
    playerStart: { x: 925, y: 2390 },
    door: { x: 110, y: 260, width: 110, height: 76 },
    walls: [
      { x: 592, y: 0, width: 46, height: 850 },
      { x: 592, y: 1375, width: 46, height: 1125 },
      { x: 1258, y: 450, width: 46, height: 900 },
      { x: 1258, y: 1875, width: 46, height: 625 },
      { x: 638, y: 1175, width: 370, height: 62 },
      { x: 222, y: 1800, width: 333, height: 62 },
    ],
    batteries: [
      { x: 500, y: 1550 },
      { x: 1628, y: 950 },
    ],
    candles: [
      { x: 1628, y: 1550 },
      { x: 740, y: 2100 },
      { x: 1462, y: 1250 },
      { x: 1462, y: 950 },
    ],
    traps: [
      { x: 713, y: 648, width: 54, height: 54 },
      { x: 1194, y: 1523, width: 54, height: 54 },
    ],
    monsters: [
      { x: 259, y: 1250 },
      { x: 259, y: 2100 },
    ],
    lenses: [
    ],
  },
  {
    // 23. Оптический маршрут: три обзорные точки без цепочки.
    name: 'Оптический маршрут',
    width: 1800,
    height: 2450,
    playerStart: { x: 900, y: 110 },
    door: { x: 1580, y: 1405, width: 110, height: 76 },
    walls: [
      { x: 0, y: 735, width: 792, height: 61 },
      { x: 1116, y: 735, width: 684, height: 61 },
      { x: 450, y: 1617, width: 900, height: 61 },
      { x: 792, y: 735, width: 45, height: 490 },
      { x: 1116, y: 1176, width: 45, height: 441 },
      { x: 1296, y: 2009, width: 288, height: 61 },
    ],
    batteries: [
      { x: 900, y: 789 },
      { x: 1476, y: 1475 },
    ],
    candles: [
      { x: 486, y: 392 },
    ],
    traps: [
      { x: 799, y: 1884, width: 54, height: 54 },
    ],
    monsters: [
    ],
    lenses: [
      { x: 900, y: 539, angle: Math.PI / 2 },
      { x: 1476, y: 1225, angle: Math.PI / 2 },
      { x: 576, y: 1911, angle: 0 },
    ],
  },
  {
    // 24. Выбор риска: короткий риск и длинный ресурсный путь.
    name: 'Выбор риска',
    width: 1900,
    height: 2500,
    playerStart: { x: 110, y: 1875 },
    door: { x: 1680, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 675, width: 1102, height: 62 },
      { x: 1368, y: 675, width: 532, height: 62 },
      { x: 532, y: 1350, width: 1368, height: 62 },
      { x: 0, y: 1950, width: 1102, height: 62 },
      { x: 1368, y: 1950, width: 532, height: 62 },
    ],
    batteries: [
      { x: 1672, y: 1550 },
      { x: 1007, y: 1250 },
    ],
    candles: [
    ],
    traps: [
      { x: 733, y: 923, width: 54, height: 54 },
      { x: 1645, y: 2073, width: 54, height: 54 },
      { x: 980, y: 1523, width: 54, height: 54 },
      { x: 486, y: 2073, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1672, y: 950 },
      { x: 1501, y: 1825 },
    ],
    lenses: [
    ],
  },
  {
    // 25. Тёмный зал: открытый зал с островами стен.
    name: 'Тёмный зал',
    width: 1950,
    height: 2500,
    playerStart: { x: 110, y: 110 },
    door: { x: 1730, y: 2314, width: 110, height: 76 },
    walls: [
      { x: 0, y: 1050, width: 741, height: 62 },
      { x: 1209, y: 1050, width: 741, height: 62 },
      { x: 956, y: 1500, width: 49, height: 700 },
      { x: 234, y: 1750, width: 390, height: 62 },
    ],
    batteries: [
      { x: 1034, y: 950 },
      { x: 1540, y: 950 },
    ],
    candles: [
      { x: 526, y: 400 },
      { x: 1034, y: 675 },
    ],
    traps: [
      { x: 753, y: 1798, width: 54, height: 54 },
      { x: 246, y: 1223, width: 54, height: 54 },
    ],
    monsters: [
      { x: 273, y: 1550 },
      { x: 780, y: 950 },
      { x: 1287, y: 1250 },
    ],
    lenses: [
    ],
  },
  {
    // 26. Сначала посмотри: линзы перед опасной развилкой.
    name: 'Сначала посмотри',
    width: 1900,
    height: 2550,
    playerStart: { x: 1790, y: 110 },
    door: { x: 110, y: 2364, width: 110, height: 76 },
    walls: [
      { x: 912, y: 0, width: 48, height: 714 },
      { x: 912, y: 1096, width: 48, height: 638 },
      { x: 912, y: 1887, width: 48, height: 357 },
      { x: 342, y: 1428, width: 570, height: 64 },
      { x: 960, y: 714, width: 532, height: 64 },
      { x: 1330, y: 1836, width: 342, height: 64 },
    ],
    batteries: [
      { x: 266, y: 1275 },
      { x: 513, y: 408 },
    ],
    candles: [
      { x: 1501, y: 1275 },
    ],
    traps: [
      { x: 1645, y: 661, width: 54, height: 54 },
      { x: 980, y: 2115, width: 54, height: 54 },
      { x: 1474, y: 381, width: 54, height: 54 },
    ],
    monsters: [
      { x: 608, y: 2239 },
      { x: 1200, y: 892 },
    ],
    lenses: [
      { x: 608, y: 1989, angle: Math.PI / 2 },
      { x: 950, y: 892, angle: 0 },
    ],
  },
  {
    // 27. Остаток заряда: исследовательская петля с тремя батареями.
    name: 'Остаток заряда',
    width: 1950,
    height: 2600,
    playerStart: { x: 110, y: 2490 },
    door: { x: 1730, y: 110, width: 110, height: 76 },
    walls: [
      { x: 0, y: 858, width: 1209, height: 65 },
      { x: 1521, y: 858, width: 429, height: 65 },
      { x: 429, y: 1742, width: 1521, height: 65 },
      { x: 878, y: 1170, width: 49, height: 520 },
      { x: 1404, y: 2132, width: 312, height: 65 },
    ],
    batteries: [
      { x: 273, y: 1898 },
      { x: 780, y: 1612 },
      { x: 1716, y: 1300 },
    ],
    candles: [
      { x: 780, y: 2184 },
      { x: 780, y: 1300 },
    ],
    traps: [
      { x: 1007, y: 1871, width: 54, height: 54 },
      { x: 1513, y: 675, width: 54, height: 54 },
      { x: 1007, y: 1585, width: 54, height: 54 },
    ],
    monsters: [
      { x: 526, y: 702 },
    ],
    lenses: [
    ],
  },
  {
    // 28. Три угрозы: три разделённые геометрией угрозы.
    name: 'Три угрозы',
    width: 2000,
    height: 2600,
    playerStart: { x: 1890, y: 2490 },
    door: { x: 110, y: 110, width: 110, height: 76 },
    walls: [
      { x: 640, y: 0, width: 50, height: 884 },
      { x: 640, y: 1430, width: 50, height: 1170 },
      { x: 1360, y: 468, width: 50, height: 936 },
      { x: 1360, y: 1950, width: 50, height: 650 },
      { x: 690, y: 1222, width: 400, height: 65 },
      { x: 240, y: 1872, width: 360, height: 65 },
    ],
    batteries: [
      { x: 280, y: 416 },
      { x: 1060, y: 1612 },
    ],
    candles: [
      { x: 1580, y: 416 },
      { x: 1320, y: 1612 },
      { x: 1320, y: 1898 },
    ],
    traps: [
      { x: 773, y: 2157, width: 54, height: 54 },
      { x: 1553, y: 2157, width: 54, height: 54 },
      { x: 513, y: 389, width: 54, height: 54 },
      { x: 1293, y: 2157, width: 54, height: 54 },
    ],
    monsters: [
      { x: 540, y: 702 },
      { x: 280, y: 1612 },
      { x: 1060, y: 2184 },
    ],
    lenses: [
    ],
  },
  {
    // 29. Последняя разведка: последняя разведка нескольких маршрутов.
    name: 'Последняя разведка',
    width: 2000,
    height: 2650,
    playerStart: { x: 110, y: 1325 },
    door: { x: 1780, y: 1908, width: 110, height: 76 },
    walls: [
      { x: 0, y: 795, width: 880, height: 66 },
      { x: 1240, y: 795, width: 760, height: 66 },
      { x: 500, y: 1749, width: 1000, height: 66 },
      { x: 880, y: 795, width: 50, height: 530 },
      { x: 1240, y: 1272, width: 50, height: 477 },
      { x: 1440, y: 2173, width: 320, height: 66 },
    ],
    batteries: [
      { x: 610, y: 583 },
      { x: 540, y: 1934 },
    ],
    candles: [
      { x: 1060, y: 1934 },
    ],
    traps: [
      { x: 1293, y: 397, width: 54, height: 54 },
      { x: 1733, y: 397, width: 54, height: 54 },
      { x: 513, y: 1616, width: 54, height: 54 },
      { x: 513, y: 2199, width: 54, height: 54 },
    ],
    monsters: [
      { x: 360, y: 1575 },
      { x: 1640, y: 1972 },
    ],
    lenses: [
      { x: 360, y: 1325, angle: Math.PI / 2 },
      { x: 1640, y: 1722, angle: Math.PI / 2 },
      { x: 360, y: 583, angle: 0 },
    ],
  },
  {
    // 30. Последний огонёк: финальная сеть комнат и обходов.
    name: 'Последний огонёк',
    width: 2100,
    height: 2700,
    playerStart: { x: 1050, y: 2590 },
    door: { x: 110, y: 260, width: 110, height: 76 },
    walls: [
      { x: 0, y: 729, width: 1218, height: 68 },
      { x: 1512, y: 729, width: 588, height: 68 },
      { x: 588, y: 1458, width: 1512, height: 68 },
      { x: 0, y: 2106, width: 1218, height: 68 },
      { x: 1512, y: 2106, width: 588, height: 68 },
    ],
    batteries: [
      { x: 567, y: 432 },
      { x: 1386, y: 1026 },
      { x: 567, y: 2268 },
    ],
    candles: [
      { x: 567, y: 1026 },
      { x: 294, y: 432 },
      { x: 840, y: 1350 },
    ],
    traps: [
      { x: 1821, y: 405, width: 54, height: 54 },
      { x: 1359, y: 2241, width: 54, height: 54 },
      { x: 540, y: 1647, width: 54, height: 54 },
      { x: 1086, y: 999, width: 54, height: 54 },
      { x: 813, y: 999, width: 54, height: 54 },
    ],
    monsters: [
      { x: 1428, y: 844 },
      { x: 628, y: 1350 },
      { x: 922, y: 1755 },
    ],
    lenses: [
      { x: 1428, y: 594, angle: Math.PI / 2 },
      { x: 378, y: 1350, angle: 0 },
      { x: 672, y: 1755, angle: 0 },
    ],
  },
];

// Шаблоны — read-only данные кампании. Runtime всегда создаётся копированием в Level.
for (const level of LEVELS) {
  Object.freeze(level.playerStart);
  Object.freeze(level.door);
  for (const collection of [
    level.walls, level.batteries, level.candles, level.traps, level.monsters, level.lenses,
  ]) {
    for (const item of collection) Object.freeze(item);
    Object.freeze(collection);
  }
  Object.freeze(level);
}
Object.freeze(LEVELS);
