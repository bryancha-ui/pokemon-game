import Phaser from 'phaser';
import { STARTERS } from '../data/StarterData';

export interface PartyEntry {
  name:     string;
  level:    number;
  hp:       number;
  maxHp:    number;
  type1:    string;
  type2?:   string;
  spriteKey: string;
  spriteUrl: string;
  isCustom: boolean;
  moves:    string[];
}

const KEY = 'party';

export const PartySystem = {

  get(registry: Phaser.Data.DataManager): PartyEntry[] {
    const raw = registry.get(KEY) as string | undefined;
    if (!raw) return [];
    try { return JSON.parse(raw) as PartyEntry[]; } catch { return []; }
  },

  set(registry: Phaser.Data.DataManager, party: PartyEntry[]): void {
    registry.set(KEY, JSON.stringify(party));
  },

  initFromStarter(registry: Phaser.Data.DataManager): void {
    const existing = this.get(registry);
    if (existing.length > 0) return; // already initialised

    const name     = (registry.get('starterName') as string) ?? '';
    const level    = (registry.get('starterLevel') as number) ?? 5;
    const key      = (registry.get('starterKey')  as string) ?? '';
    if (!name) return;

    // Look up actual types and base HP from StarterData
    const def   = STARTERS.find(s => s.spriteKey === key);
    const baseHp = def?.data.baseHp ?? 45;
    const maxHp  = Math.floor((baseHp * level) / 100) + level + 10;
    const entry: PartyEntry = {
      name, level, hp: maxHp, maxHp,
      type1:    def?.data.type1  ?? 'normal',
      type2:    def?.data.type2,
      spriteKey: key,
      spriteUrl: `/assets/${key}.jpg`,
      isCustom: true,
      moves: def?.startingMoves.map(m => m.name) ?? [],
    };
    this.set(registry, [entry]);
  },

  add(registry: Phaser.Data.DataManager, entry: PartyEntry): boolean {
    const party = this.get(registry);
    if (party.length >= 6) return false;
    party.push(entry);
    this.set(registry, party);
    return true;
  },

  isFull(registry: Phaser.Data.DataManager): boolean {
    return this.get(registry).length >= 6;
  },

  /** Sync HP of slot 0 (active Pokémon) after battle */
  updateSlot0HP(registry: Phaser.Data.DataManager, hp: number): void {
    this.updateSlotHP(registry, 0, hp);
  },

  /** Sync HP of any slot after battle */
  updateSlotHP(registry: Phaser.Data.DataManager, slot: number, hp: number): void {
    const party = this.get(registry);
    if (party[slot] !== undefined) { party[slot].hp = hp; this.set(registry, party); }
  },

  firstHealthy(registry: Phaser.Data.DataManager): PartyEntry | null {
    return this.get(registry).find(p => p.hp > 0) ?? null;
  },

  healAll(registry: Phaser.Data.DataManager): void {
    const party = this.get(registry);
    party.forEach(p => { p.hp = p.maxHp; });
    this.set(registry, party);
  },
};
