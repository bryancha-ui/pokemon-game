import Phaser from 'phaser';
import { markTrainerPortrait } from './BattlePortraits';

// ── Overworld trainer pixel sprites ─────────────────────────────────────────────
// Gender-aware pixel drawings of the player / rival, styled after the character art:
// a charcoal Korean school blazer with a white collar — the BOY has dark side-parted
// hair, a red tie and grey trousers; the GIRL has a hair bun, a pink backpack and a
// dark pleated skirt over bare legs. Both wear white sneakers.
//
// Drawn around the origin (feet near y≈13); the caller does g.setPosition(x, y).
// facing: 0 down, 1 up (back), 2 left, 3 right.  frame: 0 or 1 (walk step).

type Reg = { get(key: string): unknown };

export function playerDesign(reg: Reg): 'boy' | 'girl' {
  return reg.get('playerGender') === 'girl' ? 'girl' : 'boy';
}
export function rivalDesign(reg: Reg): 'boy' | 'girl' {
  return reg.get('playerGender') === 'girl' ? 'boy' : 'girl';
}
/** The rival's trainer name. Uses the name the player chose at the intro if set,
 *  otherwise a gender-based default (a male player faces female 'Soohyun'; a female
 *  player faces male 'Minhyuk'). */
export function rivalTrainerName(reg: Reg): string {
  const custom = reg.get('rivalName');
  const rivalKey = String(reg.get('rivalKey') ?? '').toLowerCase();
  // Self-heal old saves where 'rivalName' was accidentally set to the rival's starter
  // Pokémon (e.g. "Munkain") — reject a name that matches the rival's species key.
  if (typeof custom === 'string' && custom.trim() && custom.trim().toLowerCase() !== rivalKey) {
    return custom.trim();
  }
  return rivalDesign(reg) === 'girl' ? 'Soohyun' : 'Minhyuk';
}

/** The player's trainer name — chosen at the intro, or a gender-based default. */
export function playerTrainerName(reg: Reg): string {
  const name = reg.get('playerName');
  if (typeof name === 'string' && name.trim()) return name.trim();
  return playerDesign(reg) === 'girl' ? 'Hana' : 'Jun';
}

const SKIN = 0xf0c8a0, HAIR = 0x1a1410, BLAZER = 0x33363e, COLLAR = 0xffffff;

/**
 * A generic NPC pixel body in the same clean style as the player, front-facing.
 * `outfit` colours the robe/coat; pass a portrait's signature colour so overworld
 * NPCs read like their battle art. Drawn around the origin (caller sets position).
 */
export function drawNpcBody(
  g: Phaser.GameObjects.Graphics, outfit: number,
  opts: { hair?: number; skin?: number; frame?: number } = {},
) {
  const hair = opts.hair ?? HAIR, skin = opts.skin ?? SKIN, f = opts.frame ?? 0;
  const ly = f === 0 ? 9 : 7, ry = f === 0 ? 7 : 9;
  g.clear();
  g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 17, 5);
  // Shoes
  g.fillStyle(0x1c1c1c); g.fillRect(-8, ly, 6, 5); g.fillRect(2, ry, 6, 5);
  // Robe / coat (body + a flared hem + arms)
  g.fillStyle(outfit);
  g.fillRect(-8, -9, 16, 14); g.fillTriangle(-9, 5, 9, 5, 0, -2);
  g.fillRect(-12, -8, 5, 10); g.fillRect(7, -8, 5, 10);
  // Collar + belt trim
  g.fillStyle(0xffffff, 0.85); g.fillRect(-4, -9, 8, 2);
  g.fillStyle(0x000000, 0.3); g.fillRect(-8, -1, 16, 2);
  // Hands
  g.fillStyle(skin); g.fillRect(-12, 1, 5, 3); g.fillRect(7, 1, 5, 3);
  // Head + hair
  g.fillStyle(skin); g.fillRect(-7, -22, 14, 12);
  g.fillStyle(hair); g.fillRect(-7, -23, 14, 6); g.fillRect(-7, -23, 3, 10); g.fillRect(4, -23, 3, 10);
  // Eyes
  g.fillStyle(0x000000); g.fillRect(-4, -16, 2, 2); g.fillRect(2, -16, 2, 2);
}

/**
 * A robed gym-leader figure on the dais, themed to the leader's type colour, with a
 * glowing sash + aura and a floating name label. Mirrors Leader Jin's bespoke figure
 * so every gym shows its leader as a pixel character, like the other gym trainers.
 * Drawn around (x, y); the leader faces down toward the approaching player.
 */
export function drawGymLeader(
  scene: Phaser.Scene, x: number, y: number,
  opts: {
    body: number; accent: number; label: string; labelColor: string;
    skin?: number; hair?: number; trainerKey?: string;
  },
): Phaser.GameObjects.Graphics {
  const skin = opts.skin ?? 0xffcc99, hair = opts.hair ?? 0x140820;
  const g = scene.add.graphics().setDepth(12);   // above dais + trainers so the leader always reads
  g.setPosition(x, y);
  g.fillStyle(0x000000, 0.32); g.fillEllipse(0, 16, 26, 8);          // shadow pool
  g.fillStyle(opts.accent, 0.22); g.fillEllipse(0, 16, 32, 10);      // glowing base ring (pops off any dais)
  // Robe with a dark outline so the figure separates from same-coloured stages.
  g.fillStyle(0x0a0a12, 1); g.fillRect(-11, -7, 22, 24);            // outline
  g.fillStyle(opts.body); g.fillRect(-10, -6, 20, 22);              // long robe
  g.fillStyle(opts.accent, 0.95); g.fillRect(-10, -6, 20, 6);       // shoulders
  g.fillStyle(opts.accent, 0.9); g.fillRect(-2, -4, 4, 16);         // glowing sash
  g.fillStyle(0x0a0a12, 1); g.fillRect(-14, -5, 6, 14); g.fillRect(8, -5, 6, 14);   // arm outlines
  g.fillStyle(opts.body); g.fillRect(-13, -4, 4, 12); g.fillRect(9, -4, 4, 12);  // arms
  g.fillStyle(0x0a0a12, 1); g.fillRect(-8, -22, 16, 16);            // head outline
  g.fillStyle(skin); g.fillRect(-6, -20, 12, 12);                   // head
  g.fillStyle(hair); g.fillRect(-7, -21, 14, 6);                    // hair
  g.fillStyle(0x000000); g.fillRect(-4, -14, 2, 2); g.fillRect(2, -14, 2, 2);    // eyes
  g.lineStyle(2, opts.accent, 0.8); g.strokeCircle(0, 0, 21);       // themed aura
  scene.add.text(x, y - 30, opts.label, {
    fontSize: '9px', color: opts.labelColor, fontStyle: 'bold',
    backgroundColor: '#00000088', padding: { x: 4, y: 2 },
  }).setOrigin(0.5).setDepth(10);
  if (opts.trainerKey) markTrainerPortrait(g, opts.trainerKey);
  return g;
}

/**
 * The player on a bicycle — the normal trainer body with a little bike drawn over
 * the legs so it reads as "riding". Same call signature as drawTrainerBody, so a
 * scene can swap between them based on whether the player is cycling.
 */
export function drawRiderBody(
  g: Phaser.GameObjects.Graphics, facing: number, frame: number, design: 'boy' | 'girl',
) {
  drawTrainerBody(g, facing, frame, design);   // clears + draws the trainer first
  const side = facing === 2 || facing === 3;
  if (side) {
    const d = facing === 2 ? -1 : 1;
    g.fillStyle(0x1a66cc); g.fillRect(-8, 9, 16, 3);                 // frame bar
    g.fillRect((d === 1 ? 6 : -8), 2, 2, 8);                         // fork / handlebar
    g.fillStyle(0x222222); g.fillCircle(-8, 12, 5); g.fillCircle(8, 12, 5);   // wheels
    g.lineStyle(1.5, 0xcfd6dd); g.strokeCircle(-8, 12, 5); g.strokeCircle(8, 12, 5);
  } else {
    g.fillStyle(0x1a66cc); g.fillRect(-8, 10, 16, 3);               // axle
    g.fillStyle(0x222222); g.fillCircle(-7, 13, 4); g.fillCircle(7, 13, 4);   // two wheels
    g.lineStyle(1.5, 0xcfd6dd); g.strokeCircle(-7, 13, 4); g.strokeCircle(7, 13, 4);
  }
}

export function drawTrainerBody(
  g: Phaser.GameObjects.Graphics, facing: number, frame: number, design: 'boy' | 'girl',
) {
  g.clear();
  const flip = facing === 2;
  const lx = flip ? 3 : -8, rx = flip ? -8 : 3;
  const ly = frame === 0 ? 9 : 6, ry = frame === 0 ? 6 : 9;

  // Shadow
  g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 13, 18, 6);

  if (design === 'girl') drawGirl(g, facing, lx, rx, ly, ry);
  else                   drawBoy(g, facing, lx, rx, ly, ry);
}

function eyes(g: Phaser.GameObjects.Graphics, facing: number) {
  if (facing === 1) return;                       // back — no face
  g.fillStyle(0x000000);
  if (facing === 0)      { g.fillRect(-4, -16, 2, 2); g.fillRect(2, -16, 2, 2); }
  else if (facing === 2) { g.fillRect(-5, -16, 2, 2); }
  else                   { g.fillRect(3, -16, 2, 2); }
}

function drawBoy(g: Phaser.GameObjects.Graphics, facing: number, lx: number, rx: number, ly: number, ry: number) {
  const back = facing === 1, side = facing === 2 || facing === 3;
  // White sneakers
  g.fillStyle(0xf2f2f2); g.fillRect(lx, ly, 6, 5); g.fillRect(rx, ry, 6, 5);
  // Charcoal trousers
  g.fillStyle(0x3a3d45); g.fillRect(lx + 1, ly - 7, 4, 8); g.fillRect(rx + 1, ry - 7, 4, 8);
  // Blazer (body + arms)
  g.fillStyle(BLAZER); g.fillRect(-8, -8, 16, 11); g.fillRect(-12, -7, 5, 9); g.fillRect(7, -7, 5, 9);
  if (back) {
    // Back of the jacket — a centre seam and collar band, no shirt/tie.
    g.fillStyle(0x2a2c33); g.fillRect(-1, -8, 2, 11);
    g.fillStyle(0x26282e); g.fillRect(-6, -8, 12, 2);
  } else {
    // Front: grey vest, white collar, red tie (tie leans toward the facing side).
    g.fillStyle(0xd6d6da); g.fillRect(-3, -7, 6, 5);
    g.fillStyle(COLLAR);   g.fillRect(-3, -8, 6, 2);
    const tx = side ? (facing === 2 ? -3 : 1) : -1;
    g.fillStyle(0xaa2222); g.fillRect(tx, -7, 2, 6);
  }
  // Hands
  g.fillStyle(SKIN); g.fillRect(-12, 1, 5, 3); g.fillRect(7, 1, 5, 3);
  // Head
  g.fillStyle(SKIN); g.fillRect(-7, -22, 14, 12);
  // Dark side-parted hair
  g.fillStyle(HAIR); g.fillRect(-7, -23, 14, 6);
  if (back) g.fillRect(-7, -23, 14, 13);            // back = full head of hair
  else if (side) g.fillRect(facing === 2 ? 2 : -7, -23, 5, 9);  // bang on the trailing side
  else g.fillRect(-7, -23, 5, 9);                    // front side bang
  eyes(g, facing);
}

function drawGirl(g: Phaser.GameObjects.Graphics, facing: number, lx: number, rx: number, ly: number, ry: number) {
  const back = facing === 1, side = facing === 2 || facing === 3;
  // White sneakers
  g.fillStyle(0xeaeaee); g.fillRect(lx, ly, 6, 5); g.fillRect(rx, ry, 6, 5);
  // Bare legs
  g.fillStyle(SKIN); g.fillRect(lx + 1, ly - 6, 4, 7); g.fillRect(rx + 1, ry - 6, 4, 7);
  // Dark pleated skirt (flared)
  g.fillStyle(0x33353c); g.fillTriangle(-9, 3, 9, 3, 0, -3); g.fillRect(-8, -3, 16, 6);
  // Blazer (body + arms)
  g.fillStyle(BLAZER); g.fillRect(-7, -8, 14, 8); g.fillRect(-11, -7, 4, 9); g.fillRect(7, -7, 4, 9);
  // Pink backpack — full pack from behind, shoulder straps from the front/side.
  g.fillStyle(0xe28aa0);
  if (back) { g.fillRect(-6, -8, 12, 10); g.fillStyle(0xc46e86); g.fillRect(-6, -8, 12, 2); }
  else {
    g.fillStyle(COLLAR); g.fillRect(-3, -8, 6, 2);   // front collar
    g.fillStyle(0xe28aa0);
    if (side) g.fillRect(facing === 2 ? 4 : -6, -7, 2, 8);   // one strap over the near shoulder
    else { g.fillRect(-6, -7, 2, 8); g.fillRect(4, -7, 2, 8); }
  }
  // Hands
  g.fillStyle(SKIN); g.fillRect(-11, 1, 4, 3); g.fillRect(7, 1, 4, 3);
  // Head
  g.fillStyle(SKIN); g.fillRect(-6, -22, 12, 11);
  // Dark hair + top bun
  g.fillStyle(HAIR); g.fillRect(-6, -23, 12, 6);
  if (back) g.fillRect(-6, -23, 12, 12);
  g.fillCircle(0, -25, 3);   // bun
  eyes(g, facing);
}
