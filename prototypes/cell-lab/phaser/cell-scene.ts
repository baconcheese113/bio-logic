import { Scene, Display, GameObjects, Tweens } from 'phaser';

const PROTEIN_COLORS: Record<string, number> = {
  GFP: 0x22c55e,
  RFP: 0xef4444,
  RepA: 0xa855f7,
  ActA: 0x06b6d4,
  Insulin: 0x8b5cf6,
};

export class CellScene extends Scene {
  private glowGfx!: GameObjects.Graphics;
  private proteinDots: GameObjects.Arc[] = [];
  private resultTweens: Tweens.Tween[] = [];
  private glowState = { alpha: 0, color: 0x000000 };

  constructor() {
    super({ key: 'CellScene' });
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    this.cameras.main.setBackgroundColor('#0f0e0d');

    // Glow layer (drawn each frame via update)
    this.glowGfx = this.add.graphics();

    // Cell membrane
    const cell = this.add.graphics();
    cell.lineStyle(3, 0xb8956e, 1);
    cell.fillStyle(0x2a2520, 0.9);
    cell.fillEllipse(cx, cy, 200, 160);
    cell.strokeEllipse(cx, cy, 200, 160);

    // Nucleus
    const nuc = this.add.graphics();
    nuc.lineStyle(2, 0x8b7355, 0.7);
    nuc.fillStyle(0x1a1815, 0.9);
    nuc.fillEllipse(cx, cy - 5, 65, 50);
    nuc.strokeEllipse(cx, cy - 5, 65, 50);

    // DNA helix decoration inside nucleus
    const dna = this.add.graphics();
    dna.lineStyle(1.5, 0xb8956e, 0.35);
    for (let i = -20; i <= 20; i += 3) {
      const t = ((i + 20) / 40) * Math.PI * 3;
      dna.lineBetween(cx + i, cy - 5 + Math.sin(t) * 10, cx + i, cy - 5 - Math.sin(t) * 10);
    }

    // Idle breathing animation
    this.tweens.add({
      targets: cell,
      scaleX: 1.01,
      scaleY: 0.99,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  override update() {
    this.glowGfx.clear();
    if (this.glowState.alpha > 0.01) {
      const { width, height } = this.scale;
      this.glowGfx.fillStyle(this.glowState.color, this.glowState.alpha);
      this.glowGfx.fillEllipse(width / 2, height / 2, 280, 230);
    }
  }

  showResult(glowColor: string | null, intensity: number, proteins: Record<string, number>) {
    this.clearResult();
    if (!glowColor || intensity <= 0) return;

    const color = Display.Color.HexStringToColor(glowColor);
    this.glowState.color = color.color;

    // Animate glow pulse
    this.resultTweens.push(
      this.tweens.add({
        targets: this.glowState,
        alpha: { from: intensity * 0.15, to: intensity * 0.4 },
        duration: 1400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      }),
    );

    this.spawnProteins(proteins);
  }

  clearResult() {
    for (const t of this.resultTweens) t.destroy();
    this.resultTweens = [];
    for (const d of this.proteinDots) d.destroy();
    this.proteinDots = [];
    this.glowState.alpha = 0;
    this.glowGfx.clear();
  }

  private spawnProteins(proteins: Record<string, number>) {
    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    for (const [name, amount] of Object.entries(proteins)) {
      if (amount <= 0) continue;
      const dotColor = PROTEIN_COLORS[name] ?? 0xffffff;
      const count = Math.min(amount * 4, 20);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 25 + Math.random() * 55;
        const fx = cx + Math.cos(angle) * dist;
        const fy = cy + Math.sin(angle) * dist * 0.75;
        const size = 2 + Math.random() * 2.5;

        const dot = this.add.circle(cx, cy - 5, size, dotColor, 0);
        this.proteinDots.push(dot);

        // Fly out from nucleus
        this.resultTweens.push(
          this.tweens.add({
            targets: dot,
            x: fx,
            y: fy,
            alpha: { from: 0, to: 0.7 + Math.random() * 0.3 },
            duration: 350 + Math.random() * 400,
            delay: i * 55,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              // Brownian drift
              this.resultTweens.push(
                this.tweens.add({
                  targets: dot,
                  x: fx + (Math.random() - 0.5) * 30,
                  y: fy + (Math.random() - 0.5) * 20,
                  duration: 1800 + Math.random() * 1200,
                  yoyo: true,
                  repeat: -1,
                  ease: 'Sine.easeInOut',
                }),
              );
            },
          }),
        );
      }
    }
  }
}
