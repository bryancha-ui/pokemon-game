const SAVE_KEY = 'pokemon_korea_v1';

export interface SaveData {
  version:        number;
  timestamp:      number;
  scene:          string;
  px:             number;
  py:             number;
  starterChosen:  boolean;
  starterKey:     string;
  starterName:    string;
  starterLevel:   number;
  hasRunningShoes: boolean;
  rivalBattleDone: boolean;
  rivalKey:       string;
  rivalName:      string;
}

export const SaveManager = {

  save(registry: Phaser.Data.DataManager, px: number, py: number, scene = 'WorldMapScene'): void {
    const data: SaveData = {
      version:         1,
      timestamp:       Date.now(),
      scene,
      px, py,
      starterChosen:   !!(registry.get('starterChosen')),
      starterKey:      (registry.get('starterKey')   as string)  ?? '',
      starterName:     (registry.get('starterName')  as string)  ?? '',
      starterLevel:    (registry.get('starterLevel') as number)  ?? 5,
      hasRunningShoes: !!(registry.get('hasRunningShoes')),
      rivalBattleDone: !!(registry.get('rivalBattleDone')),
      rivalKey:        (registry.get('rivalKey')  as string) ?? 'onnurian',
      rivalName:       (registry.get('rivalName') as string) ?? 'Onnurian',
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  },

  load(): SaveData | null {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SaveData;
      if (data.version !== 1) return null;
      return data;
    } catch {
      return null;
    }
  },

  restore(registry: Phaser.Data.DataManager, data: SaveData): void {
    registry.set('starterChosen',   data.starterChosen);
    registry.set('starterKey',      data.starterKey);
    registry.set('starterName',     data.starterName);
    registry.set('starterLevel',    data.starterLevel);
    registry.set('hasRunningShoes', data.hasRunningShoes);
    registry.set('rivalBattleDone', data.rivalBattleDone);
    registry.set('rivalKey',        data.rivalKey);
    registry.set('rivalName',       data.rivalName);
    // Pass position for WorldMapScene to pick up
    registry.set('returnX', data.px);
    registry.set('returnY', data.py);
  },

  exists(): boolean {
    return !!localStorage.getItem(SAVE_KEY);
  },

  delete(): void {
    localStorage.removeItem(SAVE_KEY);
  },

  formatDate(ts: number): string {
    return new Date(ts).toLocaleString('ko-KR', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  },
};
