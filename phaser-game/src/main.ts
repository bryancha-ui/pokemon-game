import Phaser from 'phaser';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';
import { BattleScene } from './scenes/BattleScene';
import { PlayerHomeScene } from './scenes/interior/PlayerHomeScene';
import { PokemonCenterScene } from './scenes/interior/PokemonCenterScene';
import { RivalHomeScene } from './scenes/interior/RivalHomeScene';
import { StarterSelectScene } from './scenes/StarterSelectScene';
import { RivalBattleScene } from './scenes/RivalBattleScene';
import { MenuScene } from './scenes/MenuScene';
import { RouteScene } from './scenes/RouteScene';
import { WildBattleScene } from './scenes/WildBattleScene';
import { SeoulScene } from './scenes/SeoulScene';
import { TrainerBattleScene } from './scenes/TrainerBattleScene';
import { CapitolCityScene } from './scenes/CapitolCityScene';
import { CapitolTowerScene } from './scenes/CapitolTowerScene';
import { CapitolGymScene } from './scenes/CapitolGymScene';
import { GymLeaderBattleScene } from './scenes/GymLeaderBattleScene';
import { CapitolPCScene } from './scenes/CapitolPCScene';
import { CapitolPalaceScene } from './scenes/CapitolPalaceScene';
import { CapitolMarketScene } from './scenes/CapitolMarketScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  backgroundColor: '#000000',
  scene: [TitleScene, WorldMapScene, BattleScene, PlayerHomeScene, PokemonCenterScene, RivalHomeScene, StarterSelectScene, RivalBattleScene, MenuScene, RouteScene, WildBattleScene, SeoulScene, TrainerBattleScene, CapitolCityScene, CapitolTowerScene, CapitolGymScene, GymLeaderBattleScene, CapitolPCScene, CapitolPalaceScene, CapitolMarketScene],
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
