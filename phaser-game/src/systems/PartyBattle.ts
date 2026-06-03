/**
 * Shared utilities for rebuilding a Pokemon object from a PartyEntry
 * so battle scenes can send in any party member, not just the starter.
 */
import { Pokemon, PokemonData, MoveData } from '../battle/Pokemon';
import { PokemonType } from '../battle/TypeChart';
import { PartyEntry } from './PartySystem';
import { STARTERS } from '../data/StarterData';
import { DISGUIJAR_DATA, DISGUIJAR_MOVES } from '../data/CustomPokemon';

// Small lookup of moves that appear on PokéAPI wild Pokémon
const KNOWN_MOVES: Record<string, MoveData> = {
  'tackle':      { name: 'Tackle',      type: 'normal',  category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'growl':       { name: 'Growl',       type: 'normal',  category: 'status',   power:  0, accuracy: 100, pp: 40 },
  'scratch':     { name: 'Scratch',     type: 'normal',  category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'pound':       { name: 'Pound',       type: 'normal',  category: 'physical', power: 40, accuracy: 100, pp: 35 },
  'ember':       { name: 'Ember',       type: 'fire',    category: 'special',  power: 40, accuracy: 100, pp: 25 },
  'water gun':   { name: 'Water Gun',   type: 'water',   category: 'special',  power: 40, accuracy: 100, pp: 25 },
  'vine whip':   { name: 'Vine Whip',   type: 'grass',   category: 'physical', power: 45, accuracy: 100, pp: 25 },
  'bite':        { name: 'Bite',        type: 'dark',    category: 'physical', power: 60, accuracy: 100, pp: 25 },
  'rock throw':  { name: 'Rock Throw',  type: 'rock',    category: 'physical', power: 50, accuracy:  90, pp: 15 },
  'wing attack': { name: 'Wing Attack', type: 'flying',  category: 'physical', power: 60, accuracy: 100, pp: 35 },
  'absorb':      { name: 'Absorb',      type: 'grass',   category: 'special',  power: 20, accuracy: 100, pp: 25 },
  'swift':       { name: 'Swift',       type: 'normal',  category: 'special',  power: 60, accuracy: 100, pp: 20 },
  'leech seed':  { name: 'Leech Seed',  type: 'grass',   category: 'status',   power:  0, accuracy:  90, pp: 10 },
  'sand attack': { name: 'Sand Attack', type: 'ground',  category: 'status',   power:  0, accuracy: 100, pp: 15 },
  'screech':     { name: 'Screech',     type: 'normal',  category: 'status',   power:  0, accuracy:  85, pp: 40 },
  'supersonic':  { name: 'Supersonic',  type: 'normal',  category: 'status',   power:  0, accuracy:  55, pp: 20 },
  'confusion':   { name: 'Confusion',   type: 'psychic', category: 'special',  power: 50, accuracy: 100, pp: 25 },
  'mud-slap':    { name: 'Mud Slap',    type: 'ground',  category: 'special',  power: 20, accuracy: 100, pp: 10 },
};

const TACKLE_FALLBACK: MoveData =
  { name: 'Tackle', type: 'normal', category: 'physical', power: 40, accuracy: 100, pp: 35 };

function movesForEntry(entry: PartyEntry): MoveData[] {
  const moves: MoveData[] = [];
  for (const name of entry.moves) {
    const key = name.toLowerCase();
    const md  = KNOWN_MOVES[key];
    if (md) moves.push(md);
  }
  return moves.length ? moves : [TACKLE_FALLBACK];
}

/** Reconstruct a battle-ready Pokemon from a stored PartyEntry. */
export function buildFromEntry(entry: PartyEntry): Pokemon {
  // Starter Pokémon — use exact STARTERS data
  const starterDef = STARTERS.find(s => s.spriteKey === entry.spriteKey);
  if (starterDef) {
    const p = new Pokemon(starterDef.data, entry.level, starterDef.startingMoves);
    p.hp = entry.hp;
    return p;
  }

  // Custom Pokémon (Disguijar)
  if (entry.spriteKey === 'disguijar' || entry.isCustom) {
    const p = new Pokemon(DISGUIJAR_DATA, entry.level, DISGUIJAR_MOVES);
    p.hp = entry.hp;
    return p;
  }

  // PokéAPI caught Pokémon — approximate base stats from stored maxHp
  const approxBase = Math.max(10,
    Math.round((entry.maxHp - entry.level - 10) * 100 / Math.max(1, entry.level)));
  const data: PokemonData = {
    id:          0,
    name:        entry.name,
    type1:       (entry.type1 as PokemonType) || 'normal',
    type2:       entry.type2 as PokemonType | undefined,
    baseHp:      approxBase,
    baseAtk:     55, baseDef: 55, baseSpAtk: 55, baseSpDef: 55, baseSpd: 55,
    spriteUrl:   entry.spriteUrl,
  };
  const p = new Pokemon(data, entry.level, movesForEntry(entry));
  p.hp = entry.hp;
  return p;
}
