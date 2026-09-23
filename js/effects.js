// Небольшой слой чисто визуальных реакций. Частицы живут отдельно от Level и
// никогда не участвуют в коллизиях, освещении или других gameplay-проверках.
class VisualEffects {
  constructor() {
    this.particles = [];
    this.rings = [];
    this.flash = null;
  }

  reset() {
    this.particles.length = 0;
    this.rings.length = 0;
    this.flash = null;
  }

  burst(x, y, color, count = 8, speed = 30) {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI * 2 * i / count + (i % 2) * 0.18;
      this.particles.push({
        x, y, vx: Math.cos(angle) * speed * (0.65 + (i % 3) * 0.18),
        vy: Math.sin(angle) * speed * (0.65 + (i % 3) * 0.18),
        age: 0, life: 0.48 + (i % 3) * 0.08, color,
      });
    }
    // Защита от быстрого многократного входа/выхода из луча линзы.
    if (this.particles.length > 160) this.particles.splice(0, this.particles.length - 160);
  }

  ring(x, y, color, radius = 28, life = 0.55) {
    this.rings.push({ x, y, color, radius, age: 0, life });
    if (this.rings.length > 32) this.rings.splice(0, this.rings.length - 32);
  }

  screenFlash(color, alpha = 0.22, life = 0.45) {
    this.flash = { color, alpha, age: 0, life };
  }

  update(dt) {
    for (const p of this.particles) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.pow(0.05, dt); p.vy *= Math.pow(0.05, dt);
    }
    for (const r of this.rings) r.age += dt;
    if (this.flash) this.flash.age += dt;
    this.particles = this.particles.filter((p) => p.age < p.life);
    this.rings = this.rings.filter((r) => r.age < r.life);
    if (this.flash && this.flash.age >= this.flash.life) this.flash = null;
  }

  renderWorld(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const ring of this.rings) {
      const t = ring.age / ring.life;
      ctx.globalAlpha = (1 - t) * 0.75;
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, 5 + ring.radius * t, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const p of this.particles) {
      const t = p.age / p.life;
      ctx.globalAlpha = (1 - t) * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.2 + (1 - t) * 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderOverlay(ctx, viewW, viewH) {
    if (!this.flash) return;
    const t = this.flash.age / this.flash.life;
    ctx.save();
    ctx.globalAlpha = this.flash.alpha * (1 - t) * (1 - t);
    ctx.fillStyle = this.flash.color;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
  }
}
