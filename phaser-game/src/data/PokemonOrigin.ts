/** Human-readable capture locations for the status screen. */
const LOCATION_BY_SCENE: Record<string, string> = {
  RouteScene: 'Route 1',
  Route2Scene: "Route 2 — Scholar's Road",
  ScholarsRoadScene: "Scholar's Road",
  Route3Scene: 'Route 3',
  Route4Scene: 'Route 4',
  Route5Scene: 'Route 5',
  Route6Scene: 'Route 6',
  AhobiryongPassScene: 'Ahobiryong Pass',
  BaekduCheckpointScene: 'Baekdu Checkpoint',
  BaekduPassScene: 'Baekdu Plateau Pass',
  BaekduSummitScene: 'Baekdu Summit',
  ChilboHighlandsScene: 'Chilbo Highlands',
  DolmoeMineScene: 'Dolmoe Mine',
  DolmoeRuinsScene: 'Dolmoe Ruins',
  FerryScene: 'Onnuri Ferry Route',
  FogboundManorScene: 'Fogbound Manor',
  ForestShrineScene: 'Ancient Forest Shrine',
  HamhungMineScene: 'Hamhung Mine',
  JejuVentScene: 'Jeju Volcanic Vent',
  KaemaPlateauScene: 'Kaema Plateau',
  NampoBeachScene: 'Nampo Beach',
  NorthernReachesScene: 'Northern Reaches',
  OceanScene: 'Onnuri Sea',
  RyesongValleyScene: 'Ryesong Valley',
  SacredPeakScene: 'Sacred Peak',
  SeoraePassScene: 'Seorae Pass',
  SijungCoastScene: 'Sijung Coast',
  SinuijuIceCaveScene: 'Sinuiju Ice Cave',
  WonsanBeachScene: 'Wonsan Beach',
};

export function caughtLocationName(sceneKey?: string): string {
  if (!sceneKey) return 'Unknown location';
  return LOCATION_BY_SCENE[sceneKey]
    ?? sceneKey.replace(/Scene$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
}
