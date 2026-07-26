import Phaser from 'phaser';
import { REGION_NODES, RegionNode, nodeForScene, visitedNodeIds, FLY_MOVE } from '../data/RegionMap';
import { PartySystem } from '../systems/PartySystem';

// ── Region map (Town Map) ──────────────────────────────────────────────────────
// A full-screen, view-anywhere map of the Hanbando region. Shows every place, a
// pulsing "You are here" marker, and — once HM Fly is earned and a party Pokémon
// knows Fly — lets the player pick a city and fly straight there.
//
// Opened as a modal over its parent (usually MenuScene, which pauses itself).

const W = 1280, H = 720;
const PANEL_X = 150, PANEL_Y = 118, PANEL_W = 980, PANEL_H = 552;


export class RegionMapScene extends Phaser.Scene {
  private parentKey = 'MenuScene';
  private underScene?: string;   // overworld scene running beneath the menu (paused while map is open)
  private confirmOverlay?: Phaser.GameObjects.Container;

  private flyable: RegionNode[] = [];
  private flySel = 0;
  private canFly = false;
  private northUnlocked = false;
  private visited = new Set<string>();
  private selectorRing?: Phaser.GameObjects.Arc;
  private pendingNode?: RegionNode;
  private keys!: Record<'esc' | 'm' | 'left' | 'right' | 'up' | 'down' | 'enter' | 'space', Phaser.Input.Keyboard.Key>;

  // On-screen rect of the fitted region-map image (nodes are plotted within it).
  private mx = PANEL_X; private my = PANEL_Y; private mw = PANEL_W; private mh = PANEL_H;

  constructor() { super('RegionMapScene'); }

  init(data: { parentKey?: string }) { this.parentKey = data.parentKey ?? 'MenuScene'; }

  preload() {
    if (!this.textures.exists('regionMapImg')) this.load.image('regionMapImg', 'assets/region_map.png');
  }

  private px(n: RegionNode) { return this.mx + n.nx * this.mw; }
  private py(n: RegionNode) { return this.my + n.ny * this.mh; }

  /** Draw the hand-illustrated region map fitted (contain) into the panel. */
  private drawMapImage() {
    if (!this.textures.exists('regionMapImg')) return;
    const src = this.textures.get('regionMapImg').getSourceImage();
    const iw = (src.width as number) || 1120, ih = (src.height as number) || 944;
    const scale = Math.min(PANEL_W / iw, PANEL_H / ih);
    this.mw = iw * scale; this.mh = ih * scale;
    this.mx = PANEL_X + (PANEL_W - this.mw) / 2;
    this.my = PANEL_Y + (PANEL_H - this.mh) / 2;
    this.add.image(this.mx, this.my, 'regionMapImg').setOrigin(0, 0).setDisplaySize(this.mw, this.mh).setDepth(0);
  }

  create() {
    this.scene.bringToTop();
    this.cameras.main.fadeIn(150);

    const currentScene = (this.registry.get('lastScene') as string) ?? 'WorldMapScene';
    const currentNode  = nodeForScene(currentScene);

    // The overworld scene keeps running under the (paused) menu — pause it too so
    // arrow-key selection here doesn't walk the player around behind the map.
    this.underScene = currentScene;
    if (this.underScene && this.underScene !== this.parentKey && this.scene.isActive(this.underScene)) {
      this.scene.pause(this.underScene);
    }

    // Places the player has actually been (the current spot always counts).
    this.visited = visitedNodeIds(this.registry);
    if (currentNode) this.visited.add(currentNode.id);

    // Fly is available after HM Fly is earned AND a party Pokémon knows Fly,
    // and only to cities you have already visited.
    // The NORTHERN part of the map stays hidden until Phase 1 is cleared and the north
    // is reached (Hanbando Champion beaten / the northern invite seen).
    this.northUnlocked = !!(this.registry.get('championDefeated') || this.registry.get('northInviteSeen') || this.registry.get('northLeagueDone'));

    this.canFly = !!this.registry.get('hasFlyHM') && PartySystem.anyKnows(this.registry, FLY_MOVE);
    this.flyable = this.canFly
      ? REGION_NODES.filter(n => n.fly && this.visited.has(n.id) && n.id !== currentNode?.id && (n.region !== 'north' || this.northUnlocked))
      : [];

    // ── Backdrop + panel ──────────────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x05060f, 0.92);
    this.add.rectangle(W / 2, H / 2, PANEL_W + 40, PANEL_H + 96, 0x0a1830, 0.98)
      .setStrokeStyle(3, 0x3a6ea5);

    this.drawMapImage();
    this.drawNodes(currentNode);

    // ── Header ────────────────────────────────────────────────────────────────
    this.add.text(W / 2, 46, '🗺️  HANBANDO REGION MAP  ·  한반도 지역 지도', {
      fontSize: '24px', color: '#ffe44e', fontStyle: 'bold', stroke: '#221133', strokeThickness: 4,
    }).setOrigin(0.5);

    if (currentNode) {
      this.add.text(W / 2, 82, `📍 You are here — ${currentNode.name} (${currentNode.kr})`, {
        fontSize: '15px', color: '#aef0ff',
      }).setOrigin(0.5);
    }

    // ── Footer / controls ──────────────────────────────────────────────────────
    this.drawFooter();

    // ── Input ──────────────────────────────────────────────────────────────────
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard!;
    this.keys = {
      esc: kb.addKey(K.ESC), m: kb.addKey(K.M),
      left: kb.addKey(K.LEFT), right: kb.addKey(K.RIGHT),
      up: kb.addKey(K.UP), down: kb.addKey(K.DOWN),
      enter: kb.addKey(K.ENTER), space: kb.addKey(K.SPACE),
    };
    if (this.canFly && this.flyable.length > 0) this.createSelector();
  }

  update() {
    const J = Phaser.Input.Keyboard.JustDown;
    const k = this.keys;

    // While the fly confirmation is up, it captures Enter/Space/Esc.
    if (this.confirmOverlay) {
      if (J(k.enter) || J(k.space)) this.doFly(this.pendingNode!);
      else if (J(k.esc)) this.dismissConfirm();
      return;
    }

    if (J(k.esc) || J(k.m)) { this.close(); return; }

    if (this.canFly && this.flyable.length > 0) {
      if (J(k.left)  || J(k.up))   this.cycleSelector(-1);
      if (J(k.right) || J(k.down)) this.cycleSelector(1);
      if (J(k.enter) || J(k.space)) this.askFly(this.flyable[this.flySel]);
    }
  }

  // ── Drawing ────────────────────────────────────────────────────────────────
  private drawNodes(current?: RegionNode) {
    for (const n of REGION_NODES) {
      if (n.region === 'north' && !this.northUnlocked) continue;   // northern region hidden until Phase 1 cleared
      const x = this.px(n), y = this.py(n);
      const isCity    = n.kind === 'city';
      const isCurrent = !!current && n.id === current.id;
      const visited   = this.visited.has(n.id) || isCurrent;
      const flyTarget = this.canFly && n.fly && visited && !isCurrent;
      const r = isCity ? 9 : 5;

      // Marker — unvisited places are dimmed so the map still shows the whole region.
      const fill = !visited ? 0x556070 : isCity ? 0xff5544 : 0xffffff;
      const dot = this.add.circle(x, y, r, fill).setStrokeStyle(2, 0x222222);
      if (!visited) dot.setAlpha(0.55);

      // "You are here" pulse
      if (isCurrent) {
        const pulse = this.add.circle(x, y, r + 4, 0x00ff88, 0).setStrokeStyle(3, 0x66ffcc, 1);
        this.tweens.add({
          targets: pulse, scale: { from: 1, to: 1.8 }, alpha: { from: 1, to: 0 },
          duration: 1100, repeat: -1,
        });
      }

      // Label (cities named, routes just show the dot to avoid clutter)
      if (isCity) {
        const nameColor = flyTarget ? '#ffe44e' : visited ? '#ffffff' : '#8894a4';
        this.add.text(x, y - r - 4, n.name, {
          fontSize: '12px', color: nameColor, fontStyle: 'bold',
          stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5, 1).setAlpha(visited ? 1 : 0.7);
        this.add.text(x, y + r + 2, n.kr, {
          fontSize: '10px', color: visited ? '#cfe6ff' : '#8894a4', stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5, 0).setAlpha(visited ? 1 : 0.7);

        // Clickable fly hotspot (visited fly targets only)
        if (flyTarget) {
          dot.setInteractive({ useHandCursor: true })
            .on('pointerover', () => { const idx = this.flyable.indexOf(n); if (idx >= 0) this.setSelector(idx); })
            .on('pointerdown', () => this.askFly(n));
        }
      }
    }
  }

  private drawFooter() {
    let hint: string;
    if (this.canFly && this.flyable.length > 0) {
      hint = '✈  ARROWS: choose city   ·   ENTER/SPACE or click: Fly   ·   ESC/M: close';
    } else if (this.canFly) {
      hint = 'Visit more cities to unlock them as Fly destinations.   ·   ESC/M: close';
    } else if (this.registry.get('hasFlyHM')) {
      hint = `Teach ${FLY_MOVE} to a Pokémon to fly between cities.   ·   ESC/M: close`;
    } else {
      hint = 'Beat the Pokémon League to earn HM Fly and travel the region instantly.   ·   ESC/M: close';
    }
    this.add.rectangle(W / 2, H - 30, PANEL_W + 40, 40, 0x000000, 0.55);
    this.add.text(W / 2, H - 30, hint, { fontSize: '13px', color: '#cfe0ff' }).setOrigin(0.5);
  }

  // ── Fly selector ─────────────────────────────────────────────────────────────
  private createSelector() {
    this.selectorRing = this.add.circle(0, 0, 15, 0x000000, 0).setStrokeStyle(3, 0xffe44e, 1);
    this.tweens.add({ targets: this.selectorRing, scale: { from: 1, to: 1.25 }, duration: 500, yoyo: true, repeat: -1 });
    this.setSelector(0);
  }

  private setSelector(idx: number) {
    this.flySel = (idx + this.flyable.length) % this.flyable.length;
    const n = this.flyable[this.flySel];
    this.selectorRing?.setPosition(this.px(n), this.py(n));
  }

  private cycleSelector(dir: number) {
    if (this.confirmOverlay) return;
    this.setSelector(this.flySel + dir);
  }

  // ── Confirm + warp ──────────────────────────────────────────────────────────
  private askFly(node: RegionNode) {
    if (this.confirmOverlay) return;
    this.pendingNode = node;
    const idx = this.flyable.indexOf(node);
    if (idx >= 0) this.setSelector(idx);

    const c = this.add.container(0, 0).setDepth(100);
    c.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55));
    c.add(this.add.rectangle(W / 2, H / 2, 460, 200, 0x0d1830, 0.99).setStrokeStyle(2, 0x5599dd));
    c.add(this.add.text(W / 2, H / 2 - 58, '✈  FLY', { fontSize: '18px', color: '#ffe44e', fontStyle: 'bold' }).setOrigin(0.5));
    c.add(this.add.text(W / 2, H / 2 - 18, `Fly to ${node.name}?\n${node.kr}`, {
      fontSize: '15px', color: '#ffffff', align: 'center', lineSpacing: 6,
    }).setOrigin(0.5));

    const flyBtn = this.add.text(W / 2 - 90, H / 2 + 52, '  FLY  ', {
      fontSize: '15px', color: '#0d1830', backgroundColor: '#ffe44e', fontStyle: 'bold', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.doFly(node));
    const cancelBtn = this.add.text(W / 2 + 90, H / 2 + 52, ' CANCEL ', {
      fontSize: '15px', color: '#ffffff', backgroundColor: '#33445a', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.dismissConfirm());
    c.add([flyBtn, cancelBtn]);
    this.confirmOverlay = c;
  }

  private dismissConfirm() {
    this.confirmOverlay?.destroy(true);
    this.confirmOverlay = undefined;
    this.pendingNode = undefined;
  }

  private doFly(node: RegionNode) {
    // Clear the destination's spawn keys so it lands at its own default entrance.
    if (node.returnKey) {
      this.registry.remove(`${node.returnKey}ReturnX`);
      this.registry.remove(`${node.returnKey}ReturnY`);
    }
    this.cameras.main.fadeOut(400, 0, 0, 0, () => {
      // Explicitly stop the (PAUSED) menu + under-scene — paused scenes are NOT in
      // getScenes(true), so relying on that alone left the frozen bag menu on top.
      this.scene.stop(this.parentKey);
      if (this.underScene && this.underScene !== node.scene) this.scene.stop(this.underScene);
      // Also stop any other still-active scene (covers a stale `lastScene`).
      for (const s of this.game.scene.getScenes(true)) {
        const k = s.scene.key;
        if (k !== 'RegionMapScene' && k !== node.scene) this.scene.stop(k);
      }
      this.scene.start(node.scene);   // shuts down this map scene, starts the destination
    });
  }

  // ── Close ─────────────────────────────────────────────────────────────────
  private close() {
    this.cameras.main.fadeOut(150, 0, 0, 0, () => {
      if (this.underScene && this.underScene !== this.parentKey) this.scene.resume(this.underScene);
      this.scene.stop();
      this.scene.resume(this.parentKey);
    });
  }
}
