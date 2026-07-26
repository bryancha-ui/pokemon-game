/**
 * Tracks which Pokémon the trainer has SEEN (encountered) and CAUGHT (owned).
 * Stored in the Phaser registry as JSON string arrays.
 */
import Phaser from 'phaser';
import { dexKeyFor } from '../data/Pokedex';
import { PartySystem } from './PartySystem';

const SEEN = 'dexSeen';
const CAUGHT = 'dexCaught';

function readSet(registry: Phaser.Data.DataManager, key: string): Set<string> {
  const raw = registry.get(key) as string | undefined;
  if (!raw) return new Set();
  try { return new Set(JSON.parse(raw) as string[]); } catch { return new Set(); }
}
function writeSet(registry: Phaser.Data.DataManager, key: string, set: Set<string>) {
  registry.set(key, JSON.stringify([...set]));
}

export const DexTracker = {
  hasPokedex(registry: Phaser.Data.DataManager): boolean {
    return !!registry.get('hasPokedex');
  },
  grantPokedex(registry: Phaser.Data.DataManager): void {
    registry.set('hasPokedex', true);
  },

  /** Mark a Pokémon as seen (by sprite key, custom key, or PokéAPI id). */
  markSeen(registry: Phaser.Data.DataManager, idOrKey: string | number): void {
    const k = dexKeyFor(idOrKey);
    const s = readSet(registry, SEEN);
    if (!s.has(k)) { s.add(k); writeSet(registry, SEEN, s); }
  },

  /** Mark a Pokémon as caught (also implies seen). */
  markCaught(registry: Phaser.Data.DataManager, idOrKey: string | number): void {
    const k = dexKeyFor(idOrKey);
    const c = readSet(registry, CAUGHT);
    if (!c.has(k)) { c.add(k); writeSet(registry, CAUGHT, c); }
    this.markSeen(registry, idOrKey);
  },

  isSeen(registry: Phaser.Data.DataManager, key: string): boolean {
    return readSet(registry, SEEN).has(key) || readSet(registry, CAUGHT).has(key);
  },
  isCaught(registry: Phaser.Data.DataManager, key: string): boolean {
    return readSet(registry, CAUGHT).has(key);
  },

  seenCount(registry: Phaser.Data.DataManager): number {
    const s = readSet(registry, SEEN), c = readSet(registry, CAUGHT);
    c.forEach(k => s.add(k));
    return s.size;
  },
  caughtCount(registry: Phaser.Data.DataManager): number {
    return readSet(registry, CAUGHT).size;
  },

  /** Mark every current party member as caught (call when opening the dex / after catching). */
  syncCaughtFromParty(registry: Phaser.Data.DataManager): void {
    const party = PartySystem.get(registry);
    const c = readSet(registry, CAUGHT);
    const s = readSet(registry, SEEN);
    let changed = false;
    for (const e of party) {
      const k = dexKeyFor(e.spriteKey);
      if (!c.has(k)) { c.add(k); s.add(k); changed = true; }
    }
    if (changed) { writeSet(registry, CAUGHT, c); writeSet(registry, SEEN, s); }
  },
};
