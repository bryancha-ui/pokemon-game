import { isLegendary } from './Legendaries';
import { POKEDEX, dexEntry } from './Pokedex';

export type PokemonGender = 'male' | 'female' | 'genderless';

export interface PokemonIdentity {
  name: string;
  key?: string;
  id?: number;
  gender?: PokemonGender;
}

// Genderless official species that can appear in this game's PokéAPI-backed
// encounters. Legendary status is checked separately because some legendary
// species have a sex while still being unable to breed.
const GENDERLESS_IDS = new Set([
  81, 82, 100, 101, 120, 121, 132, 137, 144, 145, 146, 150, 151, 201, 233,
  243, 244, 245, 249, 250, 251, 292, 337, 338, 343, 344, 374, 375, 376, 377,
  378, 379, 382, 383, 384, 385, 386, 436, 437, 462, 474, 479, 480, 481, 482,
  483, 484, 486, 487, 489, 490, 491, 492, 493, 494, 599, 600, 601, 615, 622,
  623, 638, 639, 640, 643, 644, 646, 647, 648, 649,
]);

function speciesId(identity: PokemonIdentity): number | undefined {
  if (identity.id && identity.id > 0 && identity.id < 10000) return identity.id;
  const match = identity.key?.match(/(?:wild-|api-|te-)?(\d+)$/);
  return match ? Number(match[1]) : undefined;
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function customDexEntry(identity: PokemonIdentity) {
  const direct = identity.key ? dexEntry(identity.key) : undefined;
  if (direct) return direct;
  const name = identity.name.toLowerCase();
  return POKEDEX.find(e => e.name.toLowerCase() === name);
}

/** True for official legendary/mythical species and every custom Pokédex entry
 * marked as Legendary. This is deliberately independent from gender. */
export function isLegendaryPokemon(identity: PokemonIdentity): boolean {
  const entry = customDexEntry(identity);
  if (entry?.legendary || entry?.dist === 'Legendary') return true;
  const id = speciesId(identity);
  return id !== undefined && isLegendary(id);
}

/** Stable gender for old saves and opponents that predate stored sex data. */
export function genderForPokemon(identity: PokemonIdentity, salt = ''): PokemonGender {
  if (identity.gender) return identity.gender;
  const id = speciesId(identity);
  if (id !== undefined && GENDERLESS_IDS.has(id)) return 'genderless';
  if (customDexEntry(identity)?.legendary) return 'genderless';
  const seed = `${identity.key ?? id ?? identity.name}:${identity.name}:${salt}`;
  return hash(seed) % 2 === 0 ? 'male' : 'female';
}

export function genderSymbol(gender: PokemonGender): string {
  return gender === 'male' ? '♂' : gender === 'female' ? '♀' : '–';
}

export function genderedName(label: string, identity: PokemonIdentity, salt = ''): string {
  return `${label} ${genderSymbol(genderForPokemon(identity, salt))}`;
}
