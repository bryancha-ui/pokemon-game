import Phaser from 'phaser';

const CELADON_EMBED = 'https://sketchfab.com/models/6e303b91dfd643e8ad4413fb3c034ea5/embed';
const CELADON_PAGE = 'https://sketchfab.com/3d-models/celadon-city-6e303b91dfd643e8ad4413fb3c034ea5';
const AUTHOR_PAGE = 'https://sketchfab.com/bhaveshchalke4513v2';

/** Adds an opt-in official Sketchfab viewer to a city scene. The remote model
 * remains hosted by Sketchfab; no unlicensed mesh or texture is extracted. */
export function installCeladonCityViewer(scene: Phaser.Scene): void {
  let panel: HTMLDivElement | null = null;

  const syncPanel = () => {
    if (!panel) return;
    const rect = scene.game.canvas.getBoundingClientRect();
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.width = `${rect.width}px`;
    panel.style.height = `${rect.height}px`;
  };

  const close = () => {
    panel?.remove();
    panel = null;
    if (scene.scene.isPaused()) scene.scene.resume();
  };

  const open = () => {
    if (panel) return;
    panel = document.createElement('div');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Celadon City 3D viewer');
    panel.style.cssText =
      'position:fixed;z-index:5000;padding:clamp(10px,2vw,22px);background:rgba(5,10,22,.96);' +
      'display:flex;flex-direction:column;gap:8px;color:#fff;font:13px/1.4 system-ui,sans-serif;';

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;font-weight:800;';
    const title = document.createElement('span');
    title.textContent = 'Celadon City · 3D City View';
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'Close ×';
    closeButton.style.cssText =
      'border:1px solid #fff8;border-radius:8px;padding:7px 12px;background:#b52d45;color:#fff;font-weight:800;cursor:pointer;';
    closeButton.addEventListener('click', close);
    bar.append(title, closeButton);

    const iframe = document.createElement('iframe');
    iframe.title = 'Celadon City';
    iframe.src = CELADON_EMBED;
    iframe.allow = 'autoplay; fullscreen; xr-spatial-tracking';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;min-height:0;flex:1;border:0;border-radius:8px;background:#111;';

    const credit = document.createElement('p');
    credit.style.cssText = 'margin:0;text-align:center;color:#bcc9dc;';
    credit.append('“');
    const modelLink = document.createElement('a');
    modelLink.href = CELADON_PAGE;
    modelLink.target = '_blank';
    modelLink.rel = 'nofollow noopener';
    modelLink.textContent = 'Celadon City';
    modelLink.style.color = '#65c8ff';
    const authorLink = document.createElement('a');
    authorLink.href = AUTHOR_PAGE;
    authorLink.target = '_blank';
    authorLink.rel = 'nofollow noopener';
    authorLink.textContent = 'bhavesh chalke';
    authorLink.style.color = '#65c8ff';
    credit.append(modelLink, '” by ', authorLink, ' on Sketchfab');

    panel.append(bar, iframe, credit);
    document.body.append(panel);
    syncPanel();
    scene.scene.pause();
    closeButton.focus();
  };

  const button = scene.add.text(scene.scale.width - 16, 54, 'VIEW CELADON 3D', {
    fontSize: '11px', color: '#d9ffe2', backgroundColor: '#173c2ddd',
    padding: { x: 8, y: 5 },
  }).setOrigin(1, 0).setScrollFactor(0).setDepth(220).setInteractive({ useHandCursor: true });
  button.on('pointerdown', open);
  scene.input.keyboard?.on('keydown-V', open);
  window.addEventListener('resize', syncPanel);

  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    button.off('pointerdown', open);
    scene.input.keyboard?.off('keydown-V', open);
    window.removeEventListener('resize', syncPanel);
    panel?.remove();
    panel = null;
  });
}
