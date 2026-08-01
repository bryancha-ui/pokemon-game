/**
 * Reusable in-battle party-switch overlay.
 * Call openSwitchPanel() from any battle scene.
 */
import Phaser from 'phaser';
import { PartySystem } from './PartySystem';
import { TYPE_COLORS } from '../data/StarterData';
import { t, tr, typeName, pokeNameEn} from './i18n';
import { deckHideLeadPicker, deckShowLeadPicker } from './TouchControls';

// A duplicated faint callback must never stack two identical modal pickers.
// With two overlays, the first click only destroyed the top one and made the
// player click the same Pokémon again to dismiss the second.
const activePanels = new WeakMap<Phaser.Scene, Phaser.GameObjects.Container>();

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
  const currentPanel = activePanels.get(scene);
  if (currentPanel?.active) {
    currentPanel.setDepth(100_100);
    return;
  }
  if (currentPanel) activePanels.delete(scene);

  const W  = scene.scale.width;
  const H  = scene.scale.height;
  const cx = W / 2;
  const cy = H / 2;

  const panelW = 740;
  const rowH   = 58;
  const party  = PartySystem.get(scene.sys.game.registry);

  // Keep the picker above battle particles and the global post-FX overlay.
  const overlay = scene.add.container(0, 0).setDepth(100_100);
  activePanels.set(scene, overlay);
  const selectableSlots: number[] = [];
  const rowBackgrounds = new Map<number, { row: Phaser.GameObjects.Rectangle; baseColor: number }>();
  let focusedSlot = -1;
  let finished = false;
  let cleaned = false;

  const keyboard = scene.input.keyboard;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    deckHideLeadPicker();
    if (keyboard) {
      keyboard.off('keydown-UP', focusPrevious);
      keyboard.off('keydown-W', focusPrevious);
      keyboard.off('keydown-DOWN', focusNext);
      keyboard.off('keydown-S', focusNext);
      keyboard.off('keydown-SPACE', confirmFocused);
      keyboard.off('keydown-ENTER', confirmFocused);
      keyboard.off('keydown-ESC', cancelSelection);
      keyboard.off('keydown-SHIFT', cancelSelection);
    }
    scene.events.off('shutdown', cleanup);
    if (activePanels.get(scene) === overlay) activePanels.delete(scene);
  };

  const closeAndSelect = (slotIdx: number) => {
    if (finished || !selectableSlots.includes(slotIdx)) return;
    finished = true;
    cleanup();
    overlay.destroy(true);
    onSelect(slotIdx);
  };

  const cancelSelection = () => {
    if (finished || !allowCancel) return;
    finished = true;
    cleanup();
    overlay.destroy(true);
    onCancel();
  };

  function paintFocus() {
    rowBackgrounds.forEach(({ row, baseColor }, slotIdx) => {
      row.setFillStyle(slotIdx === focusedSlot ? 0x1a4488 : baseColor);
    });
  }

  function moveFocus(delta: number) {
    if (!selectableSlots.length) return;
    const current = selectableSlots.indexOf(focusedSlot);
    const start = current < 0 ? 0 : current;
    focusedSlot = selectableSlots[
      Phaser.Math.Wrap(start + delta, 0, selectableSlots.length)
    ];
    paintFocus();
  }

  function focusPrevious() { moveFocus(-1); }
  function focusNext() { moveFocus(1); }
  function confirmFocused() {
    if (focusedSlot >= 0) closeAndSelect(focusedSlot);
  }

  // Dim + panel background
  // The dimmer deliberately consumes pointer input so a battle button cannot fire
  // through the modal while the player is choosing a replacement.
  overlay.add(scene.add.rectangle(cx, cy, W, H, 0x000000, 0.55).setInteractive());
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
      .on('pointerdown',  cancelSelection);
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
    const baseColor = isActive ? 0x1a3355 : 0x111133;
    const rowBg = scene.add.rectangle(cx, rowY, panelW - 40, rowH - 6, baseColor)
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

    // Put a dedicated, full-row hit target ABOVE all labels and HP graphics.
    // This is more reliable than making only the background rectangle interactive,
    // especially for scaled canvases and touch pointers.
    if (canSelect) {
      selectableSlots.push(i);
      rowBackgrounds.set(i, { row: rowBg, baseColor });
      const hitTarget = scene.add.zone(cx, rowY, panelW - 40, rowH - 2)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          focusedSlot = i;
          paintFocus();
        })
        .on('pointerout', () => paintFocus())
        .on('pointerdown', (
          _pointer: Phaser.Input.Pointer,
          _localX: number,
          _localY: number,
          event: Phaser.Types.Input.EventData,
        ) => {
          event.stopPropagation();
          focusedSlot = i;
          closeAndSelect(i);
        });
      overlay.add(hitTarget);
    }
  }

  focusedSlot = selectableSlots[0] ?? -1;
  paintFocus();

  // Keyboard and the mobile lower-screen A/D-pad now follow the same selection
  // path as pointer input, so a forced switch cannot become a touch-only dead end.
  keyboard?.on('keydown-UP', focusPrevious);
  keyboard?.on('keydown-W', focusPrevious);
  keyboard?.on('keydown-DOWN', focusNext);
  keyboard?.on('keydown-S', focusNext);
  keyboard?.on('keydown-SPACE', confirmFocused);
  keyboard?.on('keydown-ENTER', confirmFocused);
  keyboard?.on('keydown-ESC', cancelSelection);
  keyboard?.on('keydown-SHIFT', cancelSelection);
  scene.events.once('shutdown', cleanup);

  const deckSlots: number[] = [];
  const deckChoices = party.slice(0, 6).map((entry, slotIdx) => {
    const isActive = slotIdx === activeSlot;
    const isFainted = entry.hp <= 0;
    const canSelect = canSelectFn ? canSelectFn(entry, slotIdx) : (!isActive && !isFainted);
    deckSlots.push(slotIdx);
    return {
      name: pokeNameEn(entry.name).toUpperCase(),
      level: entry.level,
      hp: entry.hp,
      maxHp: entry.maxHp,
      isLead: isActive,
      disabled: !canSelect,
      status: isActive
        ? t(`ACTIVE · Lv.${entry.level}`, `출전 중 · Lv.${entry.level}`)
        : isFainted
          ? t('FAINTED', '기절')
          : `Lv.${entry.level} · HP ${entry.hp}/${entry.maxHp}`,
    };
  });
  deckShowLeadPicker(
    deckChoices,
    (choiceIdx) => closeAndSelect(deckSlots[choiceIdx]),
    { title: tr(title), allowClose: allowCancel },
  );
}
