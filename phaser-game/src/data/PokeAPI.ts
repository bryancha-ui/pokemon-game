import { MoveData, PokemonData } from '../battle/Pokemon';
import { PokemonType } from '../battle/TypeChart';

const BASE = 'https://pokeapi.co/api/v2';

export async function fetchPokemon(idOrName: number | string): Promise<PokemonData> {
  const res = await fetch(`${BASE}/pokemon/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI: pokemon "${idOrName}" not found`);
  const json = await res.json();

  const stat = (name: string) =>
    (json.stats as { base_stat: number; stat: { name: string } }[])
      .find(s => s.stat.name === name)?.base_stat ?? 45;

  return {
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
    spriteUrl: json.sprites.front_default as string,
  };
}

export async function fetchMove(idOrName: number | string): Promise<MoveData> {
  const res = await fetch(`${BASE}/move/${idOrName}`);
  if (!res.ok) throw new Error(`PokeAPI: move "${idOrName}" not found`);
  const json = await res.json();

  return {
    name:     json.name as string,
    type:     json.type.name as PokemonType,
    category: json.damage_class.name as MoveData['category'],
    power:    (json.power as number) ?? 0,
    accuracy: (json.accuracy as number) ?? 100,
    pp:       json.pp as number,
  };
}
