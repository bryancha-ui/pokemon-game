import { MoveData, PokemonData } from '../battle/Pokemon';
import { PokemonType } from '../battle/TypeChart';

const BASE = 'https://pokeapi.co/api/v2';

// ── Caching ──────────────────────────────────────────────────────────────────
// Every battle used to re-fetch Pokémon + move data from the live PokeAPI, and
// each call is awaited during battle setup — so the very first battle (Bug Catcher
// Billy) froze while the network warmed up, and every later battle paid the same
// round-trip. We cache results in memory (instant within a session) and mirror
// them to localStorage (instant across reloads), so each species/move is fetched
// from the network at most once, ever.
const POKE_CACHE = 'pokeapi_pokemon_v2';   // v2: spriteUrl now prefers HOME 3D renders
const MOVE_CACHE = 'pokeapi_move_v1';

const pokeMem = new Map<string, PokemonData>();
const moveMem = new Map<string, MoveData>();

function loadDisk<T>(key: string): Record<string, T> {
  try { return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, T>; }
  catch { return {}; }
}
function saveDisk<T>(key: string, id: string, val: T) {
  try {
    const all = loadDisk<T>(key);
    all[id] = val;
    localStorage.setItem(key, JSON.stringify(all));
  } catch { /* quota / private mode — memory cache still applies */ }
}

export async function fetchPokemon(idOrName: number | string): Promise<PokemonData> {
  const id = String(idOrName).toLowerCase();
  const mem = pokeMem.get(id);
  if (mem) return mem;
  const disk = loadDisk<PokemonData>(POKE_CACHE)[id];
  if (disk) { pokeMem.set(id, disk); return disk; }

  const res = await fetch(`${BASE}/pokemon/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI: pokemon "${idOrName}" not found`);
  const json = await res.json();

  const stat = (name: string) =>
    (json.stats as { base_stat: number; stat: { name: string } }[])
      .find(s => s.stat.name === name)?.base_stat ?? 45;

  const data: PokemonData = {
    id: json.id,
    name: json.name as string,
    type1: json.types[0].type.name as PokemonType,
    type2: json.types[1]?.type.name as PokemonType | undefined,
    baseHp:    stat('hp'),
    baseAtk:   stat('attack'),
    baseDef:   stat('defense'),
    baseSpAtk: stat('special-attack'),
    baseSpDef: stat('special-defense'),
    baseSpd:   stat('speed'),
    // Prefer the Pokémon HOME renders (portraits of the actual 3D models) over
    // the 96px pixel sprites — they extrude into far better 3D battlers and
    // match the game's 3D presentation. Fallback chain keeps older entries safe.
    spriteUrl: (json.sprites?.other?.home?.front_default
      ?? json.sprites?.other?.['official-artwork']?.front_default
      ?? json.sprites.front_default) as string,
  };
  pokeMem.set(id, data);
  saveDisk(POKE_CACHE, id, data);
  return data;
}

/**
 * Warm the cache for a set of Pokémon in the background (fire-and-forget).
 * Requests are staggered so we don't burst PokeAPI (which rate-limits), and
 * anything already cached is skipped for free by fetchPokemon. Call this from
 * an overworld scene so the first battle there doesn't pay a cold network fetch.
 * Errors (e.g. offline) are swallowed — battles still fetch on demand as before.
 */
const warmedSprites = new Set<string>();
/** Pull a sprite into the browser's HTTP cache so Phaser's loader gets it instantly later. */
function warmSprite(url: string) {
  if (!url || warmedSprites.has(url)) return;
  warmedSprites.add(url);
  const img = new Image();
  img.src = url;   // decode/keep in cache; not attached to the DOM
}

export function prefetchPokemon(ids: (number | string)[], gapMs = 140): void {
  const todo = ids.filter(id => !pokeMem.has(String(id).toLowerCase()));
  todo.forEach((id, i) => {
    setTimeout(() => {
      // Warm the data, then the remote sprite image — the two things a battle
      // awaits on. Both are cached, so the fight starts without a network stall.
      void fetchPokemon(id).then(d => warmSprite(d.spriteUrl)).catch(() => {});
    }, i * gapMs);
  });
}

export async function fetchMove(idOrName: number | string): Promise<MoveData> {
  const id = String(idOrName).toLowerCase();
  const mem = moveMem.get(id);
  if (mem) return mem;
  const disk = loadDisk<MoveData>(MOVE_CACHE)[id];
  if (disk) { moveMem.set(id, disk); return disk; }

  const res = await fetch(`${BASE}/move/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI: move "${idOrName}" not found`);
  const json = await res.json();

  const data: MoveData = {
    name:     json.name as string,
    type:     json.type.name as PokemonType,
    category: json.damage_class.name as MoveData['category'],
    power:    (json.power as number) ?? 0,
    accuracy: (json.accuracy as number) ?? 100,
    pp:       json.pp as number,
  };
  moveMem.set(id, data);
  saveDisk(MOVE_CACHE, id, data);
  return data;
}
