import * as Phaser from 'phaser';

export class BenchmarkScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BenchmarkScene' });
  }

  create() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.add.rectangle(width / 2, height / 2, width, height, 0x05070d, 1);
    this.add.text(24, 24, 'Phaser Benchmark Mode', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#d8e8ff',
    }).setDepth(2);
    this.add.text(24, 58, 'No gameplay simulation. Use this for clean FPS ceiling checks.', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#8ea9c7',
    }).setDepth(2);
  }
}
