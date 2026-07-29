import Phaser from 'phaser';
import { dexEntry, POKEDEX } from '../data/Pokedex';
import { KO_STRINGS, KO_TYPES, KO_SPEAKERS } from '../data/ko_strings';

// Korean names for the region's custom Pokémon, from public/assets/pokemon_dictionary.xlsx.
export const POKE_KR: Record<string, string> = {
  bosongnun: '보송눈', snoqueen: '스노퀸', kkaakdang: '까악단',
  onnurian: '학동자', onnujang: '화투루미', thanatoat: '두루광',
  vipour: '염혈목이', scorpent: '춤추사', feldaconda: '비얌마담',
  munkain: '다람톨', munklift: '훔치람쥐', banderado: '활빈다람',
  nabihalmang: '나비할망', daejangseung: '천하대장승', sottori: '솟오리',
  // Mythological pantheon (already Korean in the story text).
  hwanwoong: '환웅', poongbaek: '풍백', woosa: '우사', woonsa: '운사',
};

// ── Localization ─────────────────────────────────────────────────────────────
// The game supports English and Korean. The chosen language is a global preference
// (localStorage), independent of any save slot, and is also mirrored into the Phaser
// registry so scenes can react. Strings are localized at the call site with `t(en, ko)`
// — pass the English text plus its Korean translation; the current language decides.

export type Lang = 'en' | 'ko';

const LS_KEY = 'pk_lang';
let currentLang: Lang = 'en';
let gameRef: Phaser.Game | undefined;

export function initI18n(game: Phaser.Game): void {
  gameRef = game;
  let saved: string | null = null;
  try { saved = localStorage.getItem(LS_KEY); } catch { /* private mode */ }
  currentLang = saved === 'ko' ? 'ko' : 'en';
  game.registry.set('lang', currentLang);
}

export function getLang(): Lang { return currentLang; }

export function setLang(l: Lang): void {
  currentLang = l;
  try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
  gameRef?.registry.set('lang', l);
}

export function toggleLang(): Lang {
  setLang(currentLang === 'ko' ? 'en' : 'ko');
  return currentLang;
}

/** Pick the localized string for the current language (falls back to English). */
export function t(en: string, ko?: string): string {
  return currentLang === 'ko' && ko !== undefined ? ko : en;
}

/** Look up an English string in the Korean dictionary. Unmapped strings (and English
 *  mode) return the original unchanged, so callers can wrap freely without risk. */
// Reverse index: a Pokémon's English display name (lower-cased) → its Korean name.
// Battle UIs only have the English `data.name` (often upper-cased), so we match
// case-insensitively and fall back to the original for species without a KO name.
const EN_TO_KR_POKE: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const e of POKEDEX) {
    const kr = POKE_KR[e.key];
    if (kr) map[e.name.toLowerCase()] = kr;
  }
  return map;
})();

/** Translate a Pokémon's English display name (any case) to Korean, else return it. */
export function pokeNameEn(name: string): string {
  if (currentLang !== 'ko' || typeof name !== 'string') return name;
  return EN_TO_KR_POKE[name.toLowerCase()] ?? name;
}

// Case-insensitive speaker lookup for trainer nameplates / battle intros.
const SPEAKER_LC: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const k of Object.keys(KO_SPEAKERS)) map[k.toLowerCase()] = KO_SPEAKERS[k];
  return map;
})();

/** Translate a trainer/NPC name to Korean (from KO_SPEAKERS), else return it. */
export function speakerName(name: string): string {
  if (currentLang !== 'ko' || typeof name !== 'string') return name;
  return SPEAKER_LC[name.toLowerCase()] ?? name;
}

// Dynamic battle lines embed a Pokémon's (English) name; translate the template and
// localize the embedded name so every battle reads in Korean.
const P = (s: string) => pokeNameEn(s);
const S = (s: string) => speakerName(s);
const BATTLE_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^What will (.+) do\?$/, m => `${P(m[1])}는 무엇을 할까?`],
  [/^(.+) fainted!$/,       m => `${P(m[1])}은 쓰러졌다!`],
  [/^Go, (.+)!$/,           m => `가랏, ${P(m[1])}!`],
  [/^Go (.+)!$/,            m => `가랏, ${P(m[1])}!`],
  [/^A wild (.+) appeared!$/, m => `앗! 야생 ${P(m[1])}이 나타났다!`],
  [/^Wild (.+) used (.+)!$/, m => `야생 ${P(m[1])}의 ${KO_STRINGS[m[2]] ?? m[2]}!`],
  [/^You caught (.+)!$/,    m => `${P(m[1])}을 잡았다!`],
  [/^(.+) threw a Pokéball!$/, m => `${S(m[1])}가 몬스터볼을 던졌다!`],
  [/^(.+) used (.+)!$/,     m => `${P(m[1])}의 ${KO_STRINGS[m[2]] ?? m[2]}!`],
  [/^(.+) is already in battle!$/, m => `${P(m[1])}은 이미 배틀에 나와 있어!`],
  [/^Go! (.+)!$/,           m => `가랏! ${P(m[1])}!`],
  [/^(.+) sent out (.+)!$/, m => `${S(m[1])}가 ${P(m[2])}을 내보냈다!`],
  [/^✨ (.+) grew to Lv\. (\d+)!$/, m => `✨ ${P(m[1])}(은)는 Lv. ${m[2]}로 성장했다!`],
  [/^(.+) gained (\d+) EXP!$/, m => `${P(m[1])}(은)는 ${m[2]} 경험치를 얻었다!`],
  // Evolution
  [/^What\? (.+) is evolving!$/,                       m => `어라? ${P(m[1])}의 모습이...!`],
  [/^Congratulations! Your ([\s\S]+?)\nevolved into (.+)!$/, m => `축하해! ${P(m[1])}가\n${P(m[2])}(으)로 진화했다!`],
  [/^(.+) stopped evolving!$/,                         m => `${P(m[1])}의 진화가 멈췄다!`],
  // Trainer battle flow
  [/^(.+) wants to battle!$/,   m => `${S(m[1])}가 승부를 걸어왔다!`],
  [/^You got (.+) for winning!$/, m => `이겨서 ${m[1]}을 얻었다!`],
  // New-game name prompts (embed the chosen names)
  [/^Prof\. Song: This spirited young trainer will be your rival, (.+)\. What is their name\?$/,
    m => `송 박사: 이 활기찬 젊은 트레이너가 네 라이벌이 될 거야, ${m[1]}. 그 아이의 이름은?`],
  [/^Prof\. Song: Now you're all set, (.+)! (.+) is waiting to see how far you'll go\. I hope you enjoy your adventure!$/,
    m => `송 박사: 이제 다 됐구나, ${m[1]}! ${m[2]}가 네가 얼마나 멀리 갈지 지켜보고 있어. 즐거운 모험이 되길 바란다!`],
];

export function tr(en: string): string {
  if (currentLang !== 'ko' || typeof en !== 'string') return en;
  const exact = KO_STRINGS[en] ?? KO_STRINGS[en.trim()];
  if (exact) return exact;
  for (const [re, fn] of BATTLE_PATTERNS) {
    const m = en.match(re);
    if (m) return fn(m);
  }
  // "Speaker: spoken line" — translate the speaker and the line independently, so a
  // line only needs its spoken text in the dictionary to localize (and vice-versa).
  const idx = en.indexOf(': ');
  if (idx > 0 && idx <= 24) {
    const speaker = en.slice(0, idx);
    const rest = en.slice(idx + 2);
    const koRest = KO_STRINGS[rest] ?? KO_STRINGS[rest.trim()];
    const koSpeaker = KO_SPEAKERS[speaker];
    if (koRest || koSpeaker) return `${koSpeaker ?? speaker}: ${koRest ?? rest}`;
  }
  return en;
}

/** A type's display name in the current language. */
export function typeName(type: string): string {
  if (currentLang === 'ko') return KO_TYPES[type?.toLowerCase?.()] ?? type;
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : type;
}

/** A Pokémon's display name in the current language (Korean from the dictionary). */
export function pokeName(key: string, fallback?: string): string {
  if (currentLang === 'ko' && POKE_KR[key]) return POKE_KR[key];
  return dexEntry(key)?.name ?? fallback ?? key;
}
