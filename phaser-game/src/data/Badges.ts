/**
 * The region's eight Gym Badges, in story order. Each badge is "earned" when its
 * gym-victory flag is set in the registry (the same flags that grant the gym TMs
 * in TMs.ts). Drives the Bag → Gym Badges showcase.
 */
export interface BadgeDef {
  flag:   string;   // registry flag set when the gym is beaten
  name:   string;   // badge name
  leader: string;   // gym leader
  city:   string;   // where the gym is
  type:   string;   // theming type (drives the emblem colour)
  icon:   string;   // emblem glyph
}

export const BADGES: BadgeDef[] = [
  { flag: 'gymLeaderDefeated',  name: 'Shadow Badge',         leader: 'Leader Jin', city: 'Capitol City', type: 'dark',     icon: '🌑' },
  { flag: 'baekduGymDefeated',  name: 'Summit Seal Badge',    leader: 'Byeoksan',   city: 'Baekdu',        type: 'fighting', icon: '🏔' },
  { flag: 'dolmoeGymDefeated',  name: 'Bedrock Badge',        leader: 'Sandol',     city: 'Dolmoe',        type: 'rock',     icon: '🪨' },
  { flag: 'forestGymDefeated',  name: 'Ancient Keeper Badge', leader: 'Noksaek',    city: 'Forest',        type: 'grass',    icon: '🌿' },
  { flag: 'geumgangGymDefeated', name: 'Lantern Stage Badge', leader: 'Namsun',     city: 'Geumgang',      type: 'fairy',    icon: '🏮' },
  { flag: 'haeanGymDefeated',   name: 'Tidekeeper Badge',     leader: 'Harang',     city: 'Haean',         type: 'water',    icon: '🌊' },
  { flag: 'seoraeGymDefeated',  name: 'Frostbell Badge',      leader: 'Yeona',      city: 'Seorae',        type: 'ice',      icon: '❄' },
  { flag: 'sunriseGymDefeated', name: 'Stormwatcher Badge',   leader: 'Beonge',     city: 'Sunrise',       type: 'electric', icon: '⚡' },
];
