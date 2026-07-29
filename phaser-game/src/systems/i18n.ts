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

  // ── Auto-transliterated species (full dex KO coverage) ──
  disguijar: '디스귀자',
  corrpanda: '코르판다',
  gawlhawk: '골호크',
  prowlrock: '프롤록',
  prowlnox: '프롤녹스',
  nosepassx: '코코파스',
  oribioass: '오리비오아스',
  sandygastx: '모래꿍',
  palossandx: '사다이스',
  luninari: '루니나리',
  kidstrel: '키드스트렐',
  falcrush: '팰크러시',
  ureunggul: '우렁굴',
  metdoyaroe: '멧도야로',
  redheadagama: '레드헤드아가마',
  beardiedragon: '비어디드래곤',
  aroryong: '아로려용',
  dracopaia: '드라코파이아',
  maewoyong: '매워용',
  seuphaisin: '스파이신',
  honupup: '호누펍',
  honutomb: '호누툼',
  arctorodon: '아르토로돈',
  zoltile: '졸타일',
  ssaktrin: '싹트린',
  longroffe: '롱로페',
  onnurigrowlithe: '가디',
  onnuriarcanine: '오누리안윈디',
  onnurismoochum: '뽀뽀라',
  idolena: '아이돌레나',
  groundzoome: '그라운드주메',
  groundzomber: '그라운드좀버',
  kelpoxin: '켈폭신',
  twinkluppy: '트윙클러피',
  nootillunar: '누틸루나',
  babymammoth: '베이비맘모스',
  bookmoth: '북모스',
  venombee: '베놈비',
  glacewing: '글레이스윙',
  volthopper: '볼트호퍼',
  dynabeetle: '다이나비틀',
  saekomaga: '새코마가',
  saekomassi: '새코마시',
  secommamma: '세컴마마',
  moktakgwi: '목탁귀',
  moranlovebird: '모란러브버드',
  moransae: '모란새',
  squirrel1: '도토립',
  squirrel2: '소아렐',
  nabicocoon: '나비할망(고치)',
  hambillet: '햄빌렛',
  ivelon: '아이벨론',
  palmcockatoo: '팜코카투',
  peacockrose: '피콕로즈',
  bookbug: '북버그',
  camerghoost: '카메르고스트',
  burinao: '부리나오',
  chattyscream: '채티스크림',
  balchataek: '발차택',
  crystbeetle: '크리스트비틀',
  unsilgami: '운실가미',
  kkorisagwi: '꼬리사귀',
  supiryeong: '수피령',
  bonejoillion: '본조일리온',
  samdumae: '삼두매',
  salmua: '살무아',
  doksalsa: '독살사',
  dundunguri: '든든구리',
  neogulgamyeon: '너굴가면',
  doribi: '도리비',
  hwidoribi: '휘도리비',
  paratoxin: '파라톡신',
  silicutis: '실리쿠티스',
  plumpypu: '플럼피푸',
  capaludar: '카팔루다',
  ottershaman: '오터샤먼',
  ottermudang: '오터무당',
  liondance: '라이온댄스',
  turtleship: '거북선',
  kingfisher: '물총새',
  thunderon: '썬더론',
  kudzu: '칡덤',
  wildcat: '와일드캣',
  foxgeist: '폭스가이스트',
  cerrapin: '세라핀',
  booktoise: '북토이스',
  strawtle: '스트로틀',
  roundtailor: '라운드테일러',
  sandfox: '샌드폭스',
  bookkuddoong: '북꾸뚱',
  odamryul: '오담률',
  mushvenom: '머쉬베놈',
  ghograss: '고그라스',
  trumpetcreeper: '트럼펫크리퍼',
  tokkigongju: '토끼공주',
  tigerbabe: '타이거베이브',
  yeomtaeja: '염태자',
  pipetiger: '파이프타이거',
  layone: '레이원',
  sotori: '소토리',
  gorcobat: '고르코뱃',
  blazekunk: '블레이즈컹크',
  frysm: '프리즘',
  martbadger: '마트배저',
  waterdeer: '고라니',
  ssangdungori: '쌍둥오리',
  ampere: '암페어',
  rideer: '라이디어',
  cheonjisin: '천지신',
  jakdangsae: '작당새',
  jakdangchi: '작당치',
  mugunga: '무궁아',
  norigung: '노리궁',
  mugungmama: '무궁마마',
  gatnannu: '갓난누',
  danachungi: '다나충이',
  nabiguni: '나비구니',
  komodread: '코모드레드',
  noeryong: '뇌룡',
  merrloween: '메를로윈',
  hallowknight: '할로우나이트',
  halubang: '하르방',
  ratouille: '라타투이',
  mperodactyl: '엠페로닥틸',
  dracoelido: '드라코엘리도',
  butlerawn: '버틀런',
  'api-10': '캐터피',
  'api-13': '뿔충이',
  'api-16': '구구',
  'api-19': '꼬렛',
  'api-21': '깨비참',
  'api-41': '주뱃',
  'api-66': '알통몬',
  'api-74': '꼬마돌',
  'api-95': '롱스톤',
  'api-161': '꼬리선',
  'api-163': '부우부',
  'api-198': '니로우',
  'api-197': '블래키',
  'api-246': '애버라스',
  'api-261': '포챠나',
  'api-228': '델빌',
  'api-215': '포푸니',
  'api-315': '로젤리아',
  'api-406': '꽃봉오',
  'api-147': '미뇽',
  'api-148': '신뇽',
  'api-149': '망나뇽',
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
