import Phaser from 'phaser';
import { dexEntry, POKEDEX } from '../data/Pokedex';
import { KO_STRINGS, KO_TYPES, KO_SPEAKERS } from '../data/ko_strings';
import { KO_ABILITIES } from '../data/ko_abilities';

// Korean names for the region's custom Pokémon, from public/assets/pokemon_dictionary.xlsx.
export const POKE_KR: Record<string, string> = {
  // Official Pokémon used by story trainers but not listed in the custom dex.
  houndoom: '헬가',

  bosongnun: '보송눈', snoqueen: '스노퀸', kkaakdang: '까악단',
  onnurian: '학동자', onnujang: '화투루미', thanatoat: '두루광',
  vipour: '염혈목이', scorpent: '춤추사', feldaconda: '비얌마담',
  munkain: '다람톨', munklift: '훔치람쥐', banderado: '활빈다람',
  nabihalmang: '나비할망', daejangseung: '천하대장승', sottori: '솟오리',
  // Mythological pantheon (already Korean in the story text).
  hwanwoong: '환웅', poongbaek: '풍백', woosa: '우사', woonsa: '운사',

  // ── Auto-transliterated species (full dex KO coverage) ──
  disguijar: '돌제비',
  corrpanda: '그림삵',
  gawlhawk: '바위매',
  prowlrock: '벼랑매',
  prowlnox: '월식매',
  nosepassx: '코코파스',
  oribioass: '자침포',
  sandygastx: '모래꿍',
  palossandx: '사다이스',
  luninari: '달빙희',
  kidstrel: '발차매',
  falcrush: '격파매',
  ureunggul: '우렁꿀',
  metdoyaroe: '뇌벌집',
  redheadagama: '홍염도마',
  beardiedragon: '염수룡',
  aroryong: '여울미르',
  dracopaia: '창해미르',
  maewoyong: '이내룡',
  seuphaisin: '장마룡',
  honupup: '촛불개',
  honutomb: '이끼묘견',
  arctorodon: '빙하거수',
  zoltile: '파치랩터',
  ssaktrin: '싹트린',
  longroffe: '길어프',
  onnurigrowlithe: '가디',
  onnuriarcanine: '윈디',
  onnurismoochum: '뽀뽀라',
  idolena: '불티돌',
  groundzoome: '흙무령',
  groundzomber: '흙강시',
  kelpoxin: '독미역',
  twinkluppy: '윤슬개',
  nootillunar: '달조수',
  babymammoth: '털매머',
  bookmoth: '책나방',
  venombee: '독침벌',
  glacewing: '서리나비',
  volthopper: '번개뚜기',
  dynabeetle: '화염장수',
  saekomaga: '새콤싹',
  saekomassi: '짜릿새콤',
  secommamma: '새콤마마',
  moktakgwi: '목탁귀',
  moranlovebird: '모란잉꼬',
  moransae: '모란새',
  squirrel1: '도토람',
  squirrel2: '하늘다람',
  nabicocoon: '천년고치',
  hambillet: '무쇠오리',
  ivelon: '잎멜레온',
  palmcockatoo: '북앵무',
  peacockrose: '장미공작',
  bookbug: '책벌레',
  camerghoost: '사진귀',
  burinao: '오뚝귀',
  chattyscream: '수다괴',
  balchataek: '발차택',
  crystbeetle: '수정풍뎅',
  unsilgami: '운실가미',
  kkorisagwi: '꼬리사귀',
  supiryeong: '수피령',
  bonejoillion: '별뼈봇',
  samdumae: '삼두매',
  salmua: '살무아',
  doksalsa: '독살사',
  dundunguri: '든든구리',
  neogulgamyeon: '너굴가면',
  doribi: '도리비',
  hwidoribi: '휘도리비',
  paratoxin: '기생독',
  silicutis: '유리갑충',
  plumpypu: '포동두지',
  capaludar: '버섯동자',
  ottershaman: '수달제',
  ottermudang: '수달무당',
  liondance: '사자탈',
  turtleship: '거북선',
  kingfisher: '물총새',
  thunderon: '뇌백로',
  kudzu: '칡동이',
  wildcat: '들삵',
  foxgeist: '여우귀',
  cerrapin: '조약거북',
  booktoise: '서책거북',
  strawtle: '짚풀거북',
  roundtailor: '꼬리각시',
  sandfox: '모래여우',
  bookkuddoong: '부끄뚱',
  odamryul: '오담률',
  mushvenom: '독돌버섯',
  ghograss: '넋풀',
  trumpetcreeper: '능소풀',
  tokkigongju: '토끼공주',
  tigerbabe: '불범이',
  yeomtaeja: '염태자',
  pipetiger: '염흥왕',
  layone: '라온이',
  sotori: '솟대지기',
  gorcobat: '곡예산양',
  blazekunk: '불스컹',
  frysm: '몽개복치',
  martbadger: '무쇠오소리',
  waterdeer: '고라니',
  ssangdungori: '쌍둥오리',
  ampere: '뇌폭오리',
  rideer: '배달록',
  cheonjisin: '천지신',
  jakdangsae: '작당새',
  jakdangchi: '작당치',
  mugunga: '무궁아',
  norigung: '노리궁',
  mugungmama: '무궁마마',
  gatnannu: '갓난누',
  danachungi: '단아충이',
  nabiguni: '나비구니',
  komodread: '독왕도마',
  noeryong: '뇌룡',
  merrloween: '사탕령',
  hallowknight: '갑충기사',
  halubang: '하르방',
  ratouille: '요리쥐',
  mperodactyl: '해남익룡',
  dracoelido: '방패공룡',
  butlerawn: '집사새우',
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
  'api-132': '메타몽',
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
  // PokeAPI-backed species do not have entries in the custom regional dex.
  map.houndoom = POKE_KR.houndoom;
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
  // Waterfall City — rival departure cutscene (speaker is the rival's chosen name)
  [/^(.+): Hey, (.+)! Stop right there\.$/,        m => `${S(m[1])}: 야, ${m[2]}! 거기 서.`],
  [/^(.+): You think you can just leave town with (.+)\?$/, m => `${S(m[1])}: 그 ${P(m[2])} 데리고 그냥 마을을 뜰 수 있을 것 같아?`],
  [/^(.+): I chose (.+)\.\nWe have both been waiting for this\.$/, m => `${S(m[1])}: 난 ${P(m[2])}(으)로 정했어.\n우리 둘 다 이 순간을 기다려왔잖아.`],
  // Waterfall City — Mom (home) and Prof. Song (lab), embedding the starter's name
  [/^Mom: So you chose (.+)! I'm so proud of you\.$/, m => `엄마: ${P(m[1])}(으)로 정했구나! 정말 자랑스러워.`],
  [/^Prof\. Song: How is (.+) settling in\? A fine choice — I can tell you two already trust each other\.$/,
    m => `송 박사: ${P(m[1])}(은)는 잘 적응하고 있니? 훌륭한 선택이야 — 너희 둘은 벌써 서로를 믿고 있는 게 보이는구나.`],
  // ── Battle results / wild capture / EXP / TM ──
  [/^(.+) fainted! You win!$/,  m => `${P(m[1])}은 쓰러졌다! 승리!`],
  [/^(.+) fainted! You lose!$/, m => `${P(m[1])}은 쓰러졌다! 패배...`],
  [/^(.+) fainted\.\.\.$/,      m => `${P(m[1])}은 쓰러졌다...`],
  [/^Leader Jin: (.+), step forward!$/,          m => `관장 진: ${P(m[1])}, 나서라!`],
  [/^Leader Jin: You are strong\. (.+), come!$/, m => `관장 진: 강하구나. ${P(m[1])}, 나와라!`],
  [/^Oh no! (.+) broke free!$/, m => `이런! ${P(m[1])}이 튀어나왔다!`],
  [/^(.+) joined the party!\n(.+) was sent to the PC\.$/, m => `${P(m[1])}이 동료에 합류했다!\n${P(m[2])}은 PC로 보내졌다.`],
  [/^(.+) was sent to the PC\.$/, m => `${P(m[1])}은 PC로 보내졌다.`],
  [/^Swap a Pokémon for (.+), or send it to the PC\?$/, m => `${P(m[1])}을 위해 포켓몬을 교체할까, 아니면 PC로 보낼까?`],
  [/^✨ Gotcha! (.+) was caught!\nAdded to your party!$/, m => `✨ 좋았어! ${P(m[1])}을 잡았다!\n동료에 추가됐다!`],
  [/^✨ Gotcha! (.+) was caught!\nBut your party is full\.$/, m => `✨ 좋았어! ${P(m[1])}을 잡았다!\n하지만 동료가 가득 찼다.`],
  [/^✨ (.+) grew to Lv\. (\d+)!\nMax HP: (\d+)$/, m => `✨ ${P(m[1])}(은)는 Lv. ${m[2]}로 성장했다!\n최대 HP: ${m[3]}`],
  [/^\n✨ (.+) grew to Lv\. (\d+)!$/, m => `\n✨ ${P(m[1])}(은)는 Lv. ${m[2]}로 성장했다!`],
  [/^Received: TM — (.+)!  \(Check your Bag to teach it\.\)$/, m => `받았다: 기술머신 — ${KO_STRINGS[m[1]] ?? m[1]}!  (가방에서 가르칠 수 있어.)`],
  // ── Trainer battle flow ──
  [/^(.+) sent out (.+)\.\nWill you switch your Pokémon\?$/, m => `${S(m[1])}가 ${P(m[2])}을 내보냈다.\n포켓몬을 교체할까?`],
  [/^([\s\S]+)\nYou got (.+) for winning!$/, m => `${tr(m[1])}\n이겨서 ${m[2]}을 얻었다!`],
  // ── Rival battle ──
  [/^(.+): Tch\. You got me this time\.\n(.+) gained (\d+) EXP!$/, m => `${S(m[1])}: 쳇. 이번엔 네가 이겼군.\n${P(m[2])}(은)는 ${m[3]} 경험치를 얻었다!`],
  [/^You lost\.\.\.\n(.+): Don't give up\. Come back stronger!\nMom healed your Pokémon at home\.$/, m => `졌다...\n${S(m[1])}: 포기하지 마. 더 강해져서 돌아와!\n엄마가 집에서 네 포켓몬을 회복시켜줬다.`],
  // ── Menu — moves / lead / badges ──
  [/^(.+) forgot (.+) and learned (.+)!$/, m => `${P(m[1])}(은)는 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 잊고 ${KO_STRINGS[m[3]] ?? m[3]}(을)를 배웠다!`],
  [/^(.+) already knows (.+)\.$/, m => `${P(m[1])}(은)는 이미 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 알고 있어.`],
  [/^(.+) did not learn (.+)\.$/, m => `${P(m[1])}(은)는 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 배우지 않았다.`],
  [/^(.+) wants to learn (.+), but it already knows 4 moves\.$/, m => `${P(m[1])}(은)는 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 배우고 싶어하지만, 이미 기술을 4개 배웠어.`],
  [/^(.+) wants to learn (.+)\.$/, m => `${P(m[1])}(은)는 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 배우고 싶어해.`],
  [/^(.+) learned (.+)!$/, m => `${P(m[1])}(은)는 ${KO_STRINGS[m[2]] ?? m[2]}(을)를 배웠다!`],
  [/^(.+) is now your lead!$/, m => `${P(m[1])}(을)를 선두로 지정했다!`],
  [/^(\d+) of (\d+) badges collected\. Tap to view your case\.$/, m => `배지 ${m[2]}개 중 ${m[1]}개 획득. 탭하면 배지 케이스를 봐.`],
  [/^Teach (.+) to…$/, m => `${KO_STRINGS[m[1]] ?? m[1]}(을)를 누구에게 가르칠까…`],
  [/^Use (.+) on…$/, m => `${KO_STRINGS[m[1]] ?? m[1]}(을)를 누구에게 쓸까…`],
  // ── Quiz / checkpoints ──
  [/^Question (\d+) of (\d+)\.$/, m => `${m[2]}문제 중 ${m[1]}번.`],
  [/^어사대장 Hyeon: (\d+) of (\d+)\. A clear and ordered mind\. The academy is satisfied\.$/, m => `어사대장 현: ${m[2]}문제 중 ${m[1]}개 정답. 맑고 정연한 정신이군. 학원은 만족한다.`],
  [/^어사대장 Hyeon: (\d+) of (\d+)\. Not yet — a scholar who guesses is no scholar\.$/, m => `어사대장 현: ${m[2]}문제 중 ${m[1]}개 정답. 아직이다 — 찍는 자는 학자가 아니다.`],
  [/^Receptionist: (\d+) of the Elite Four down already — the whole region is talking about you\.$/, m => `안내원: 벌써 사천왕 중 ${m[1]}명 격파 — 온 지역이 네 이야기로 떠들썩해.`],
  [/^League Warden: You hold (\d+) of 8 마패\. Complete the inspectorate circuit, defeat Supreme Gwang in Gwanmunseong, and return\.$/, m => `리그 문지기: 너는 8개 중 ${m[1]}개의 마패를 지녔다. 어사대 순회를 마치고, 관문성에서 총수 광을 이기고 돌아와라.`],
  [/^Royal Warden: You bear (\d+) of the (\d+) regional tablets\. Complete the circuit and return\.$/, m => `왕실 관리인: 너는 ${m[2]}개 중 ${m[1]}개의 지방 석판을 지녔다. 순회를 마치고 돌아오라.`],
  [/^Supreme Gwang: You have (\d+) of the 7 regional 마패\. Return when you have mastered all seven regional trials\.$/, m => `총수 광: 너는 7개 중 ${m[1]}개의 지방 마패를 지녔다. 일곱 지방 시험을 모두 통달한 뒤에 돌아오라.`],
  // ── Starter select / badge scanner ──
  [/^Choose (.+)\?$/, m => `${P(m[1])}(으)로 정할까?`],
  [/^Badge Scanner: Scanning trainer credentials\.\.\. (\d+) \/ (\d+) badges detected\.$/, m => `배지 스캐너: 트레이너 자격 확인 중... ${m[2]}개 중 ${m[1]}개 배지 감지됨.`],
  [/^Badge Scanner: Scanning trainer credentials\.\.\. all (\d+) region badges verified\.$/, m => `배지 스캐너: 트레이너 자격 확인 중... ${m[1]}개 지역 배지 전부 확인됨.`],
  [/^Badge Scanner: The gate is sealed\. Still missing: (.+)\.$/, m => `배지 스캐너: 관문이 봉인돼 있다. 아직 부족: ${m[1]}.`],
  // ── Starter select — Prof. Song hands over the Pokédex ──
  [/^Prof\. Song: Excellent choice! (.+) is happy to travel with you\.\nAnd take this — your very own Pokédex! Press M, open your BAG,\nand select the Pokémon Encyclopedia to study every Pokémon you meet\.$/,
    m => `송 박사: 훌륭한 선택이야! ${P(m[1])}(은)는 너와 함께 여행하게 되어 기뻐하고 있어.\n그리고 이걸 받아 — 너만의 포켓몬 도감이야! M을 눌러 가방을 열고,\n포켓몬 도감을 선택해 만나는 모든 포켓몬을 조사해봐.`],
  // ── EXP-to-next-level suffix + map / city signposts ──
  [/^([\s\S]+)  \((\d+) to next level\)$/, m => `${tr(m[1])}  (다음 레벨까지 ${m[2]})`],
  [/^📍 You are here — (.+) \((.+)\)$/, m => `📍 현재 위치 — ${m[2]}`],
  [/^🏙 Capitol City( — .+)?$/, m => `🏙 소올 시티${m[1] ? tr(m[1]) : ''}`],
  [/^Teach (.+) to a Pokémon to fly between cities\.   ·   ESC\/M: close$/, m => `${KO_STRINGS[m[1]] ?? m[1]}을(를) 포켓몬에게 가르치면 도시 사이를 즉시 비행할 수 있어.   ·   ESC/M: 닫기`],
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

/** Localize both official and Onnuri-original ability names. `localizedKo` is
 * supplied for official abilities hydrated from PokeAPI; the local dictionary
 * keeps custom abilities and offline play fully translated. */
export function abilityName(ability: string, localizedKo?: string): string {
  if (!ability) return currentLang === 'ko' ? '알 수 없음' : 'Unknown';
  const humanize = (value: string) => value.trim().replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  if (currentLang !== 'ko') return ability.split('/').map(humanize).join(' / ');
  if (localizedKo) return localizedKo;
  return ability.split('/').map(part => {
    const normalized = part.trim().replace(/[-_]+/g, ' ').toLowerCase();
    return KO_ABILITIES[normalized] ?? humanize(part);
  }).join(' / ');
}

/** A Pokémon's display name in the current language (Korean from the dictionary). */
export function pokeName(key: string, fallback?: string): string {
  if (currentLang === 'ko' && POKE_KR[key]) return POKE_KR[key];
  return dexEntry(key)?.name ?? fallback ?? key;
}
