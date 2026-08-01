import type { Move, MoveData, Pokemon } from '../battle/Pokemon';

export type BattleWeather = 'clear' | 'rain' | 'sun' | 'sand' | 'snow';

const entered = new WeakSet<Pokemon>();

export function battleWeather(a: Pokemon, b: Pokemon): BattleWeather {
  if (a.hasAbility('Cloud Nine') || b.hasAbility('Cloud Nine')) return 'clear';
  if (a.hasAbility('Drizzle') || b.hasAbility('Drizzle')) return 'rain';
  if (a.hasAbility('Drought') || b.hasAbility('Drought')) return 'sun';
  if (a.hasAbility('Sand Stream') || b.hasAbility('Sand Stream')) return 'sand';
  if (a.hasAbility('Snow Warning') || b.hasAbility('Snow Warning')) return 'snow';
  return 'clear';
}

/** Apply switch-in abilities lazily the first time a combatant participates.
 * This also covers replacements without requiring every battle scene to
 * duplicate Intimidate/weather/custom-ability handling. */
export function activateEntryAbilities(a: Pokemon, b: Pokemon): string[] {
  const messages: string[] = [];
  const activate = (mon: Pokemon, foe: Pokemon) => {
    if (entered.has(mon)) return;
    entered.add(mon);
    if (mon.hasAbility('Intimidate') || mon.hasAbility('Threat Stance')) {
      if (foe.hasAbility('Inner Focus')) messages.push(`${foe.name}'s Inner Focus prevented Intimidate!`);
      else {
        const changed = foe.modifyStage('atk', -1);
        if (changed < 0) messages.push(`${mon.name}'s ${mon.ability} lowered ${foe.name}'s Attack!`);
      }
    }
    if (mon.hasAbility('Stonegaze')) {
      const changed = foe.modifyStage('spd', -1);
      if (changed < 0) messages.push(`${mon.name}'s Stonegaze lowered ${foe.name}'s Speed!`);
    }
    if (mon.hasAbility('Ancient Activation')) {
      const stats = [
        ['atk', mon.atk], ['def', mon.def], ['spAtk', mon.spAtk],
        ['spDef', mon.spDef], ['spd', mon.spd],
      ] as const;
      const best = stats.reduce((x, y) => y[1] > x[1] ? y : x)[0];
      mon.modifyStage(best, 1);
      messages.push(`${mon.name}'s Ancient Activation boosted its strongest stat!`);
    }
    if (mon.hasAbility('Drizzle')) messages.push(`${mon.name}'s Drizzle made it rain!`);
    if (mon.hasAbility('Snow Warning')) messages.push(`${mon.name}'s Snow Warning summoned snow!`);
    if (mon.hasAbility('Drought')) messages.push(`${mon.name}'s Drought intensified the sunlight!`);
    if (mon.hasAbility('Sand Stream')) messages.push(`${mon.name}'s Sand Stream whipped up a sandstorm!`);
  };
  activate(a, b);
  activate(b, a);
  return messages;
}

export function effectiveBattleSpeed(mon: Pokemon, foe: Pokemon): number {
  let speed = mon.battleStat('spd');
  const weather = battleWeather(mon, foe);
  if (weather === 'rain' && mon.hasAbility('Swift Swim')) speed *= 2;
  if (weather === 'sun' && mon.hasAbility('Chlorophyll')) speed *= 2;
  if (weather === 'sand' && mon.hasAbility('Sand Rush')) speed *= 2;
  if (weather === 'snow' && mon.hasAbility('Slush Rush')) speed *= 2;
  if (mon.hasAbility('Sure-Footed')) speed *= 1.1;
  return speed;
}

export function abilityEvasionMultiplier(user: Pokemon, target: Pokemon): number {
  const weather = battleWeather(user, target);
  if (weather === 'sand' && target.hasAbility('Sand Veil')) return 1.25;
  if (weather === 'snow' && target.hasAbility('Snow Cloak')) return 1.25;
  return 1;
}

export function extraPpCost(target: Pokemon): number {
  return target.hasAbility('Pressure') ? 1 : 0;
}

export function guaranteedEscape(mon: Pokemon): boolean {
  return mon.hasAbility('Run Away');
}

export function preventsEscape(mon: Pokemon): boolean {
  return mon.hasAbility('Shadow Tag');
}

export function blocksSecondaryEffects(target: Pokemon, move: MoveData): boolean {
  return move.power > 0 && target.hasAbility('Shield Dust');
}

export function blocksPowderMove(target: Pokemon, move: MoveData): boolean {
  return target.hasAbility('Overcoat')
    && /^(cotton spore|magic powder|poison powder|powder|rage powder|sleep powder|spore|stun spore)$/.test(
      move.name.toLowerCase().replace(/-/g, ' '),
    );
}

export interface StatusTurnResult {
  blocked: boolean;
  messages: string[];
}

/** Resolve abilities and major status conditions immediately before a move. */
export function statusBeforeMove(mon: Pokemon, foe: Pokemon): StatusTurnResult {
  const messages: string[] = [];
  if (mon.status === 'slp' && mon.hasAbility('Insomnia')) {
    mon.cureStatus();
    messages.push(`${mon.name}'s Insomnia woke it up!`);
  } else if (mon.status === 'par' && mon.hasAbility('Limber')) {
    mon.cureStatus();
    messages.push(`${mon.name}'s Limber cured its paralysis!`);
  } else if (mon.status !== 'none' && battleWeather(mon, foe) === 'rain' && mon.hasAbility('Hydration')) {
    mon.cureStatus();
    messages.push(`${mon.name}'s Hydration cured its status condition!`);
  } else if (mon.status !== 'none' && mon.hasAbility('Shed Skin') && Math.random() < 1 / 3) {
    mon.cureStatus();
    messages.push(`${mon.name}'s Shed Skin cured its status condition!`);
  }

  if (mon.status === 'par' && Math.random() < 0.25) {
    messages.push(`${mon.name} is paralyzed! It can't move!`);
    return { blocked: true, messages };
  }
  if (mon.status === 'slp') {
    const wakeChance = mon.hasAbility('Early Bird') ? 2 / 3 : 1 / 3;
    if (Math.random() < wakeChance) {
      mon.cureStatus();
      messages.push(`${mon.name} woke up!`);
    } else {
      messages.push(`${mon.name} is fast asleep.`);
      return { blocked: true, messages };
    }
  }
  if (mon.status === 'frz') {
    if (Math.random() < 0.2) {
      mon.cureStatus();
      messages.push(`${mon.name} thawed out!`);
    } else {
      messages.push(`${mon.name} is frozen solid!`);
      return { blocked: true, messages };
    }
  }
  return { blocked: false, messages };
}

/** Called by switch flows so Natural Cure is not tied to a particular scene. */
export function applySwitchOutAbility(mon: Pokemon): string | undefined {
  if (mon.hasAbility('Natural Cure') && mon.cureStatus()) return `${mon.name}'s Natural Cure healed its status condition!`;
  return undefined;
}

export function abilityPriority(mon: Pokemon, move: Move): number {
  let priority = move.data.priority ?? 0;
  if (mon.hasAbility('Prankster') && move.data.category === 'status') priority += 1;
  if (mon.hasAbility('Gale Wings') && move.data.type === 'flying' && mon.hp === mon.maxHp) priority += 1;
  return priority;
}

export function actsBefore(a: Pokemon, aMove: Move, b: Pokemon, bMove?: Move): boolean {
  const ap = abilityPriority(a, aMove), bp = bMove ? abilityPriority(b, bMove) : 0;
  if (ap !== bp) return ap > bp;
  const as = effectiveBattleSpeed(a, b), bs = effectiveBattleSpeed(b, a);
  return as > bs || (as === bs && Math.random() < 0.5);
}
