import Phaser from 'phaser';
import { drawNpcBody } from './CharacterSprite';

// ── Procedural trainer-class battle portraits ────────────────────────────────
// Most story trainers (gym leaders, chiefs, Elite Four, villains) have an
// authored portrait in BattlePortraits. The ~100 generic roadside / gauntlet /
// grunt trainers don't. Rather than a unique image per trainer, we render ONE
// procedural figure per TRAINER CLASS (Bug Catcher, Ace Trainer, Fisher, …) and
// reuse it for every trainer of that class — the class is read straight from the
// trainer's display name ("Skier Yuna", "Ace Trainer Hakryun", "노스단 Grunt").
// No image-generation credits required; the texture is cached per class.

interface ClassLook { outfit: number; hair?: number; skin?: number }

// Class → figure colours. drawNpcBody paints a plain front-facing robed person;
// a distinct outfit colour makes each class read as its own recurring trainer.
const LOOK: Record<string, ClassLook> = {
  bugcatcher: { outfit: 0x8a9a3a, hair: 0x3a2a10 },
  ace:        { outfit: 0x3a5aaa },
  fisher:     { outfit: 0x2a6a5a },
  swimmer:    { outfit: 0x30a8c8 },
  hiker:      { outfit: 0x9a6a3a, hair: 0x2a1c10 },
  skier:      { outfit: 0xc0485a },
  sailor:     { outfit: 0x24407a },
  worker:     { outfit: 0xd8a83a, hair: 0x2a1c10 },
  ranger:     { outfit: 0x2f7a4a },
  farmer:     { outfit: 0x8a7a4a },
  diver:      { outfit: 0x1a5a7a },
  scientist:  { outfit: 0xdfe4ea },
  grunt:      { outfit: 0x2a2a34, hair: 0x101014 },
  generic:    { outfit: 0x5a6a8a },
};

// Ordered keyword → class rules (first match wins). Matches EN + KO names.
const RULES: [RegExp, string][] = [
  [/bug|벌레/i,                         'bugcatcher'],
  [/ace|에이스|엘리트/i,                'ace'],
  [/fisher|angler|낚시|어부|어시/i,     'fisher'],
  [/swimmer|수영/i,                     'swimmer'],
  [/hiker|mountaineer|climber|등산|산악|cliff/i, 'hiker'],
  [/skier|snow|스키|눈/i,               'skier'],
  [/sailor|뱃사람|선원|해적/i,          'sailor'],
  [/worker|miner|labou?rer|광부|인부|제철|용접/i, 'worker'],
  [/ranger|레인저|지기/i,               'ranger'],
  [/farmer|염부|농부|salt/i,            'farmer'],
  [/diver|잠수/i,                       'diver'],
  [/scientist|researcher|연구|박사/i,   'scientist'],
  [/노스단|grunt|admin|간부|sentry|soldier|officer|sovereign|troop/i, 'grunt'],
];

/** Classify a trainer into a reusable class from its display name. */
export function classifyTrainerClass(name: string): string {
  const n = name || '';
  for (const [re, cls] of RULES) if (re.test(n)) return cls;
  return 'generic';
}

/** Build (once) and cache the class figure texture; returns its texture key. */
function ensureTrainerClassTexture(scene: Phaser.Scene, cls: string): string {
  const key = `trnclass-${cls}`;
  if (scene.textures.exists(key)) return key;
  const look = LOOK[cls] ?? LOOK.generic;
  const W = 200, H = 260, S = 5, cx = 100, cy = 175;   // body drawn feet-near-bottom
  const g = scene.make.graphics({ x: 0, y: 0 });
  g.translateCanvas(cx, cy);
  g.scaleCanvas(S, S);
  drawNpcBody(g, look.outfit, { hair: look.hair, skin: look.skin, frame: 0 });
  g.generateTexture(key, W, H);
  g.destroy();
  return key;
}

/**
 * A reusable battle portrait for a trainer that has no authored image, keyed by
 * class. Returns a {key,url} shaped like the authored portraits; the texture is
 * already generated so the caller's `textures.exists(key)` skips any load.
 */
export function trainerClassPortrait(scene: Phaser.Scene, trainerName: string): { key: string; url: string } {
  const cls = classifyTrainerClass(trainerName);
  return { key: ensureTrainerClassTexture(scene, cls), url: '' };
}
