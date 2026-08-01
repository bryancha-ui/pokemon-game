import Phaser from 'phaser';
import { AVATAR_URL, rivalAvatarKey } from './PlayerAvatar';
// ── Trainer battle portraits ────────────────────────────────────────────────────
// Full-body NPC art shown ONLY during a trainer battle's intro (then it steps aside
// as the Pokémon are sent out). Keyed by the battle's `trainerKey`.

export interface Portrait { key: string; url: string; }

const NPC = 'assets/npc/';
const P = (file: string): Portrait => ({ key: file.replace(/\.\w+$/, ''), url: NPC + file });

export const PORTRAITS: Record<string, Portrait> = {
  // ── Onnuri League — Elite Four + Champion ──
  'e4-gyeoul':  P('npc_gyeoul.png'),
  'e4-hwageum': P('npc_hwageum.png'),
  'e4-baram':   P('npc_baram.png'),
  'e4-saleum':  P('npc_saleum.png'),
  'champion-hwangeum': P('npc_hwangeum.png'),

  // ── Gym Leaders ──
  'capitol-jin':      P('npc_jin.png'),        // Dark — Guardian of Capitol's shadows
  'baekdu-byeoksan':  P('npc_byeoksan.png'),
  'geumgang-namsun':  P('npc_namsun.png'),
  'haean-harang':     P('npc_harang.png'),
  'forest-noksaek':   P('npc_noksaek.png'),
  'sunrise-beonge':   P('npc_beonge.png'),
  'dolmoe-sandol':    P('npc_sandol.png'),   // Rock — The Bedrock
  'seorae-yeona':     P('npc_yeona.png'),    // Ice — The Winter Bell

  // ── 노스단 / Team Suri villains ──
  'nosdan-ryeo-1':     P('npc_ryeo.png'),
  'nosdan-ryeo-2':     P('npc_ryeo.png'),
  'nosdan-ryeo-cliff': P('npc_ryeo.png'),
  'jeju-ryeo-final':   P('npc_ryeo.png'),   // the Jeju summit finale
  'suri-director':     P('npc_suri.png'),
  // ── Northern 어사대 (Inspectorate Chiefs) — the 마패 circuit ──
  'eosa-kaesong':      P('npc_eosajang.png'),   // Songhyeon — 어사대장 Hyeon
  'eosa-nampo':        P('npc_salmu.png'),      // Parangpo — 어사대장 Haemin
  'eosa-wonsan':       P('npc_jito.png'),       // Haesol — 어사대장 Haegang
  'eosa-hamhung':      P('npc_gapcheol.webp'),  // Gangcheoldo — 어사대장 Cheolju (Steel)
  'eosa-chongjin':     P('npc_dosadae.png'),    // Muyeonhang — 어사대장 Mukyeong
  'eosa-sinuiju':      P('npc_jinnok.png'),     // Binghagwan — 어사대장 Amrok
  'eosa-samjiyon':     P('npc_jito.png'),       // Samho — 어사대장 Seolwon
  'eosa-pyeongyang':   P('npc_dosadae.png'),    // Pyeongyang — 어사대장 Jeongan
  'eosa-pyeongseong':  P('npc_dosadae.png'),    // Gwanmunseong — Supreme Commander Gwang
  'suri-chaeyeon-1':   P('npc_chaeyeon.png'),
  'suri-chaeyeon-2':   P('npc_chaeyeon.png'),
  'nosdan-mubaek':     P('npc_mubaek.png'),
  'nosdan-chongjin':   P('npc_mubaek.png'),   // 노스단 officer Hyeok — Muyeonhang exam stand-in
  'baekdu-seollan':    P('npc_seollan.png'),

  // ── POST-GAME I — Northern League ──
  'north-seorak':    P('npc_seorak.png'),
  'north-hanseol':   P('npc_hanseol.png'),
  'north-cheolgang': P('npc_cheolgang.png'),
  'north-baekho':    P('npc_baekho.png'),
  'north-taewang':   P('npc_taewang.png'),

  // ── POST-GAME II — 어사대 (Royal Inspectorate) + 노스단's new leader (battles TBD) ──
  'inspector-jito':    P('npc_jito.png'),
  'inspector-salmu':   P('npc_salmu.png'),
  'inspector-gapcheol':P('npc_gapcheol.webp'),
  'inspector-jinnok':  P('npc_jinnok.png'),
  'dosadae':           P('npc_dosadae.png'),
  'nosdan-sovereign':  P('npc_sovereign.png'),
  'nosdan-samjiyon-boss': P('npc_sovereign.png'),   // Sovereign Clemont — atop the Samho 아지트
  'prof-song':         P('npc_song.webp'),
};

export function portraitFor(trainerKey: string): Portrait | undefined {
  return PORTRAITS[trainerKey];
}

/**
 * Attach an existing full-body portrait to an overworld character. The 2D
 * Graphics object remains authoritative for position/visibility/gameplay, while
 * OverworldMirror replaces its generic relief with this character-specific 3D
 * sculpt when 3D mode is active.
 */
export function markTrainerPortrait(
  obj: Phaser.GameObjects.GameObject,
  trainerKey: string,
): void {
  const portrait = portraitFor(trainerKey);
  if (portrait) {
    obj.setData('characterPortrait3D', portrait);
    obj.setData('characterModel3DKey', portrait.key);
  }
}

/** The rival uses the opposite-gender trainer artwork selected at game start. */
export function markRivalPortrait(
  obj: Phaser.GameObjects.GameObject,
  registry: { get(key: string): unknown },
): void {
  const key = rivalAvatarKey(registry);
  obj.setData('characterPortrait3D', { key, url: AVATAR_URL[key] } satisfies Portrait);
  obj.setData('characterModel3DKey', key);
}

/**
 * Scale a portrait to a consistent on-screen size regardless of its source
 * resolution / framing, by fitting it inside a fixed box (min of width & height
 * scale). Keeps every trainer's portrait roughly the same size in battle.
 */
// Global shrink for ALL NPC battle portraits (they were rendering oversized).
const GLOBAL_PORTRAIT_SCALE = 0.4;

// Per-portrait extra tweak (by texture key) for figures that fill their frame too
// tightly. Multiplied on top of the global scale. 1 = the standard fit.
const PORTRAIT_SCALE: Record<string, number> = {
  npc_byeoksan: 1.305,   // Baekdu gym leader
  npc_gyeoul:   1.305,   // Elite Four
  npc_hwageum:  1.305,
  npc_baram:    1.305,
  npc_saleum:   1.105,  // 0.85 × 1.3 — Saleum's portrait enlarged 1.3×
  npc_ryeo:     1.305,   // Commander Ryeo (Team Suri)
  npc_jito:     1.305,
  npc_gapcheol: 1.305
};

export function fitPortrait(img: Phaser.GameObjects.Image, maxW = 200, maxH = 290): void {
  const src = img.texture.getSourceImage() as { width: number; height: number };
  const w = src.width || 1, h = src.height || 1;
  const s = (PORTRAIT_SCALE[img.texture.key] ?? 1) * GLOBAL_PORTRAIT_SCALE;
  img.setScale(Math.min(maxW / w, maxH / h) * s);
}
