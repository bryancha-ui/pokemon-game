import Phaser from 'phaser';

// ── The Bicycle ──────────────────────────────────────────────────────────────
// Obtained free from the Han River Bike Shop. In any scene that opts in, press the
// bike key (C) to hop on/off — riding roughly doubles walking speed and swaps the
// overworld sprite for the rider sprite (drawRiderBody). "Cycling" is per-scene
// state (you start each area on foot); `hasBicycle` in the registry is permanent.

export const BIKE_SPEED = 250;

export function hasBike(reg: Phaser.Data.DataManager): boolean {
  return !!reg.get('hasBicycle');
}
export function giveBike(reg: Phaser.Data.DataManager): void {
  reg.set('hasBicycle', true);
}
