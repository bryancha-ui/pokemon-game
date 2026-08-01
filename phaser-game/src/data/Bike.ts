import Phaser from 'phaser';

// ── The Bicycle ──────────────────────────────────────────────────────────────
// Obtained free from the Han River Bike Shop. In any scene that opts in, press the
// bike key (C) to hop on/off — riding roughly doubles walking speed and swaps the
// overworld sprite for the rider sprite (drawRiderBody). "Cycling" is per-scene
// state shared through the registry so changing maps never dismounts the rider;
// `hasBicycle` in the registry is permanent.

export const BIKE_SPEED = 250;

export function hasBike(reg: Phaser.Data.DataManager): boolean {
  return !!reg.get('hasBicycle');
}
export function isBikeRiding(reg: Phaser.Data.DataManager): boolean {
  return hasBike(reg) && reg.get('bikeRiding') === true;
}
export function setBikeRiding(reg: Phaser.Data.DataManager, riding: boolean): void {
  reg.set('bikeRiding', riding && hasBike(reg));
}
export function giveBike(reg: Phaser.Data.DataManager): void {
  reg.set('hasBicycle', true);
}
