// Общие константы игры.
// Логическое разрешение viewport можно менять здесь — весь код использует его единообразно.
const CONFIG = {
  // Логическое разрешение вертикального viewport (9:16).
  viewWidth: 360,
  viewHeight: 640,
  // Экранных пикселей на один world px. 1/3 показывает примерно втрое больше мира.
  cameraZoom: 1 / 3,

  // Максимальный dt на кадр (сек). Защита от «телепортов» после пауз/переключения вкладок.
  maxDt: 0.05,

  // Игрок.
  playerRadius: 10,          // радиус коллизии
  playerVisualRadius: 11,    // визуальный радиус (~22 px)
  playerSpeed: 160,          // world units/sec, постоянная скорость
  playerStopDeadzone: 4,     // если цель ближе этого значения — движение останавливается

  // Ввод (мышь + touch через Pointer Events).
  tapMaxTimeMs: 260,         // длительность «короткого тапа»
  tapMaxDistance: 12,        // максимальное смещение для тапа (логические px)
  holdEngageMs: 120,         // порог удержания после которого запускается движение

  // Верхний предел devicePixelRatio для чёткого, но не слишком дорогого канваса.
  maxDpr: 2,

  // ---------- Заряд фонаря (Этап 2) ----------
  chargeMax: 100,
  // Расход заряда в секунду ФАКТИЧЕСКОГО движения игрока (стояние ничего не тратит).
  chargeDrainPerSec: 2.75,
  // Порог фактического перемещения за кадр (world px): ниже — «игрок стоит».
  chargeMoveEpsilon: 0.001,
  // Ниже этой доли заряда (0..1) свет начинает плавно слабеть.
  lowChargeFrac: 0.30,
  // Степень «крутизны» затухания при низком заряде.
  lowChargePower: 1.5,
  // Ниже этой доли заряда появляется лёгкое мерцание яркости (без геометрии).
  flickerFrac: 0.15,

  // ---------- Освещение (Этап 2) ----------
  // Цвет полной темноты вне освещённых областей (маска закрывает мир полностью).
  lightAmbientColor: '#02040a',
  // Локальный слабый свет вокруг игрока (радиус, логические px).
  localLightRange: 60,
  // Сила вырезания локального света (0..1): чем выше, тем ярче.
  localLightMaxAlpha: 0.85,
  // Основной луч: дальность, полный угол, ослабление к дальней границе.
  beamRange: 300,
  // Минимальная дальность луча (как доля от beamRange) при заряде → 0.
  beamMinRangeFrac: 0.35,
  beamFovDeg: 60,
  // Во сколько раз луч «угасает» к дальней границе (0 — не угасает, 1 — почти гаснет).
  beamFade: 0.62,
  // Угловой эпсилон лучей вокруг вершин стен (рад) — классика ray-casting.
  occlusionEpsilon: 0.00022,

  // ---------- Этап 5: линза ----------
  lensVisualRadius: 12,
  // Допустимое отклонение входящего луча от двусторонней оптической оси.
  // ±60° оставляет широкий casual-сектор, но отсекает почти боковое попадание.
  lensAxisToleranceDeg: 60,
  // Secondary light усиливается по мере приближения игрока к линзе.
  lensSecondaryMinRange: 380,
  lensSecondaryRange: 620,
  lensSecondaryFovDeg: 100,
  lensSecondaryMinAlpha: 0.48,
  lensSecondaryMaxAlpha: 0.90,
  lensSecondaryFade: 0.68,

  // ---------- Этап 3: ресурсы и интерактивные объекты ----------
  // Сколько заряда восстанавливает одна батарейка.
  batteryChargeGain: 40,
  // Радиус автоматического подбора батарейки (world px, от центра батарейки до центра игрока).
  batteryPickupRange: 18,
  // Радиус автоматической активации свечи (world px).
  candleActivationRadius: 40,
  // Свет активной свечи: радиус (не зависит от заряда фонаря).
  candleLightRange: 140,
  // Сила вырезания тьмы свечой (0..1).
  candleLightAlpha: 0.92,
  // Тёплое аддитивное свечение свечи поверх маски (внутри её visibility polygon).
  candleGlowAlpha: 0.20,
  // Визуальные размеры объектов (world px).
  batteryVisualRadius: 7,
  candleVisualRadius: 5,

  // ---------- Этап 4: базовый монстр ----------
  monsterRadius: 10,
  monsterVisualRadius: 11,
  monsterSpeed: 120,
  // Задержка между первым попаданием primary flashlight и началом погони.
  monsterWakeDuration: 1.5,
  // Маршрут обновляется периодически и при заметном перемещении цели.
  monsterRepathSec: 0.30,
  monsterRepathDistance: 24,
  // Дополнительный зазор узлов visibility graph от углов стен.
  monsterPathPadding: 2,

  // ---------- Audio ----------
  audioMasterVolume: 1,
  audioVolumes: {
    batteryPickup: 0.55, batteryUse: 0.55, candleIgnite: 0.48,
    caught: 0.72, door: 0.65, flashlightOn: 0.42, flashlightOff: 0.38,
    footstep1: 0.30, footstep2: 0.30, heart: 1, levelComplete: 0.62, trap: 0.70,
  },
  footstepDistance: 72,
  heartbeatFarDistance: 900,
  heartbeatNearDistance: 150,
  heartbeatMinVolume: 0.12,
  heartbeatMaxVolume: 0.45,
  heartbeatFarCadence: 1.35,
  heartbeatNearCadence: 0.65,
  heartbeatMaxPlaybackRate: 1.17,
  heartbeatFadeInSec: 0.28,
  audioSmoothingSec: 0.16,
  victorySoundDelayMs: 400,
};
