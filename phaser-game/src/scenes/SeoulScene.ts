// SeoulScene is now an alias — it immediately starts CapitolCityScene.
import Phaser from 'phaser';
export class SeoulScene extends Phaser.Scene {
  constructor() { super('SeoulScene'); }
  create() { this.scene.start('CapitolCityScene'); }
}
