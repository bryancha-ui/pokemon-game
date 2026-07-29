/**
 * Reusable in-battle party-switch overlay.
 * Call openSwitchPanel() from any battle scene.
 */
import Phaser from 'phaser';
import { PartySystem } from './PartySystem';
import { TYPE_COLORS } from '../data/StarterData';
import { t, tr, typeName, pokeNameEn} from './i18n';

export function openSwitchPanel(
  scene:        Phaser.Scene,
  activeSlot:   number,
  onCancel:     () => void,
  onSelect:     (slotIdx: number) => void,
  allowCancel = true,    // false = forced switch (e.g. after a faint): no escape
  // Which rows are selectable. Default = switch rules (a healthy, benched Pokémon).
  // Item targeting passes its own (e.g. Revive → only fainted slots).
  canSelectFn?: (entry: import('./PartySystem').PartyEntry, idx: number) => boolean,
  title = 'Choose a Pokémon',
) {
  const W  = scene.scale.width;
  const H  = scene.scale.height;
  const cx = W / 2;
  const cy = H / 2;

  const panelW = 740;
  const rowH   = 58;
  const party  = PartySystem.get(scene.sys.game.registry);

  const overlay = scene.add.container(0, 0).setDepth(50);

  // Dim + panel background
  overlay.add(scene.add.rectangle(cx, cy, W, H, 0x000000, 0.55));
  overlay.add(
    scene.add.rectangle(cx, cy, panelW, 420, 0x0d0d2e, 0.97)
      .setStrokeStyle(2, 0x5577aa),
  );

  // Title
  overlay.add(
    scene.add.text(cx, cy - 190, tr(title), {
      fontSize: '18px', color: '#ffe44e', fontStyle: 'bold',
    }).setOrigin(0.5),
  );

  // Cancel button (hidden on a forced switch — you must send something out)
  if (allowCancel) {
    const cancelBtn = scene.add.text(cx + panelW / 2 - 12, cy - 190, t('✕  CANCEL', '✕  취소'), {
      fontSize: '13px', color: '#aaaaaa',
    }).setOrigin(1, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover',  () => cancelBtn.setColor('#ffffff'))
      .on('pointerout',   () => cancelBtn.setColor('#aaaaaa'))
      .on('pointerdown',  () => { overlay.destroy(true); onCancel(); });
    overlay.add(cancelBtn);
  }

  // Party rows
  for (let i = 0; i < 6; i++) {
    const entry    = party[i];
    const rowY     = cy - 125 + i * rowH;

    if (!entry) {
      // Empty slot
      overlay.add(
        scene.add.rectangle(cx, rowY, panelW - 40, rowH - 6, 0x0a0a1a)
          .setStrokeStyle(1, 0x1a1a33),
      );
      overlay.add(
        scene.add.text(cx, rowY, t('— empty —', '— 비어 있음 —'), { fontSize: '12px', color: '#333355' })
          .setOrigin(0.5),
      );
      continue;
    }

    const isActive  = i === activeSlot;
    const isFainted = entry.hp <= 0;
    const canSelect = canSelectFn ? canSelectFn(entry, i) : (!isActive && !isFainted);

    // Row bg
    const rowBg = scene.add.rectangle(cx, rowY, panelW - 40, rowH - 6,
      isActive ? 0x1a3355 : 0x111133)
      .setStrokeStyle(isActive ? 2 : 1, isActive ? 0xffe44e : 0x223355);
    overlay.add(rowBg);

    // Type badge
    const typeColor = (TYPE_COLORS as Record<string, number>)[entry.type1] ?? 0x666666;
    overlay.add(
      scene.add.rectangle(cx - 310, rowY, 52, 15, typeColor).setAlpha(isFainted ? 0.3 : 1),
    );
    overlay.add(
      scene.add.text(cx - 310, rowY, typeName(entry.type1),
        { fontSize: '8px', color: '#fff', fontStyle: 'bold' })
        .setOrigin(0.5).setAlpha(isFainted ? 0.4 : 1),
    );

    // Name + level
    const nameAlpha = isFainted ? 0.4 : 1;
    overlay.add(
      scene.add.text(cx - 268, rowY - 9, pokeNameEn(entry.name).toUpperCase(),
        { fontSize: '14px', color: isFainted ? '#664444' : '#ffffff', fontStyle: 'bold' })
        .setAlpha(nameAlpha),
    );
    overlay.add(
      scene.add.text(cx - 268, rowY + 8, `Lv.${entry.level}`,
        { fontSize: '11px', color: '#aaccff' }).setAlpha(nameAlpha),
    );

    // HP bar
    const ratio  = Math.max(0, entry.hp / Math.max(1, entry.maxHp));
    const barW   = 200;
    const hpCol  = ratio > 0.5 ? 0x44cc44 : ratio > 0.25 ? 0xddcc00 : 0xcc4444;
    overlay.add(scene.add.rectangle(cx + 60, rowY + 6, barW, 8, 0x222244));
    overlay.add(
      scene.add.rectangle(cx + 60 - barW / 2, rowY + 6, Math.max(0, ratio * barW), 8, hpCol)
        .setOrigin(0, 0.5),
    );
    overlay.add(
      scene.add.text(cx + 175, rowY - 4, `${entry.hp}/${entry.maxHp}`,
        { fontSize: '10px', color: '#aaaaaa' }).setOrigin(0, 0),
    );

    // Status label
    if (isActive) {
      overlay.add(
        scene.add.text(cx + 320, rowY, t('ACTIVE', '출전 중'),
          { fontSize: '10px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5),
      );
    } else if (isFainted) {
      overlay.add(
        scene.add.text(cx + 320, rowY, t('FAINTED', '기절'),
          { fontSize: '10px', color: '#cc4444', fontStyle: 'bold' }).setOrigin(0.5),
      );
    }

    // Click interaction on selectable rows
    if (canSelect) {
      rowBg.setInteractive({ useHandCursor: true })
        .on('pointerover',  () => rowBg.setFillStyle(0x1a4488))
        .on('pointerout',   () => rowBg.setFillStyle(0x111133))
        .on('pointerdown',  () => { overlay.destroy(true); onSelect(i); });
    }
  }
}
