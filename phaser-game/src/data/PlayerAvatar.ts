// ── Player / rival trainer avatars ──────────────────────────────────────────────
// The player picks boy or girl at the start of a new game. The rival is always the
// opposite gender. These portraits are shown in trainer-battle intros.

type Reg = { get(key: string): unknown };

export const AVATAR_URL: Record<string, string> = {
  trainer_boy:  'assets/trainer_boy.png',
  trainer_girl: 'assets/trainer_girl.png',
};

/** 'boy' (default) or 'girl'. */
export function playerGender(reg: Reg): 'boy' | 'girl' {
  return reg.get('playerGender') === 'girl' ? 'girl' : 'boy';
}

/** Texture key for the player's own trainer portrait. */
export function playerAvatarKey(reg: Reg): string {
  return playerGender(reg) === 'girl' ? 'trainer_girl' : 'trainer_boy';
}

/** Texture key for the rival's portrait (always the opposite gender). */
export function rivalAvatarKey(reg: Reg): string {
  return playerGender(reg) === 'girl' ? 'trainer_boy' : 'trainer_girl';
}
