export type ClanId = 'ThunderClan' | 'RiverClan' | 'ShadowClan' | 'WindClan' | 'Loner' | 'ThunderOak' | 'RiverMist' | 'ShadowPines' | 'WindBreeze';

export type ClanRole =
  | 'Kit'
  | 'Apprentice'
  | 'Warrior'
  | 'Medicine Cat Apprentice'
  | 'Medicine Cat'
  | 'Deputy'
  | 'Leader'
  | 'Elder';

export type RealmId = 'territory' | 'moonpool' | 'starclan' | 'darkforest';

export type BodyType = 'adult' | 'large_warrior' | 'slender_hunter' | 'apprentice' | 'kit' | 'slim_hunter';

export type FurStyle =
  | 'very_short'
  | 'short'
  | 'medium'
  | 'long'
  | 'fluffy'
  | 'very_fluffy'
  | 'long_haired'
  | 'short_smooth'
  | 'medium_soft'
  | 'long_flowing'
  | 'thick_winter';

export type EarShape = 'normal' | 'small' | 'large' | 'rounded' | 'pointed' | 'tufted' | 'pricked' | 'lynx_tufted' | 'folded' | 'torn_notched';

export type MuzzleShape = 'short' | 'normal' | 'long' | 'short_snub' | 'classic' | 'long_angular' | 'broad_tom';

export type TailType = 'sleek' | 'bushy_plume' | 'bobtail' | 'crooked' | 'stumpy' | 'classic' | 'bushy' | 'plume';

export type MarkingType =
  | 'solid'
  | 'classic_tabby'
  | 'mackerel_tabby'
  | 'spotted'
  | 'rosettes'
  | 'ticked'
  | 'colorpoint'
  | 'bicolor'
  | 'tuxedo'
  | 'van'
  | 'calico'
  | 'tortoiseshell'
  | 'patches'
  | 'white_chest'
  | 'white_paws'
  | 'white_muzzle'
  | 'mask_and_boots';

export type EyeState =
  | 'normal'
  | 'blind_left'
  | 'blind_right'
  | 'blind_both'
  | 'star_shine'
  | 'amber_glow';

export type AccessoryType =
  | 'none'
  | 'oak_leaves'
  | 'leaf_crown'
  | 'blue_feather'
  | 'blue_jay_feather'
  | 'feather'
  | 'cardinal_feather'
  | 'violet_flower'
  | 'poppy_flower'
  | 'moss_shoulder_wrap'
  | 'twig_charm'
  | 'leather_collar'
  | 'bell_collar'
  | 'vine_collar'
  | 'viper_tooth_collar'
  | 'holly_berries';

export type ScarType =
  | 'none'
  | 'torn_left_ear'
  | 'torn_right_ear'
  | 'torn_ear'
  | 'muzzle_scratch'
  | 'muzzle_nick'
  | 'shoulder_claw_marks'
  | 'shoulder_scar'
  | 'blind_eye_slash'
  | 'eye_slash'
  | 'tail_nick'
  | 'cross_scars'
  | 'chest_scar'
  | 'chest_claw_marks'
  | 'flank_scar'
  | 'battle_worn_all';

export type AuraType =
  | 'none'
  | 'starclan_stars'
  | 'starclan_starlight'
  | 'darkforest_smoke'
  | 'darkforest_shadow'
  | 'shadow_mist'
  | 'celestial_shimmer'
  | 'celestial_glow'
  | 'firefly_glow'
  | 'autumn_leaves'
  | 'frost_mist';

export interface CatAppearance {
  bodyType: BodyType;
  furStyle: FurStyle;
  primaryColor: string;
  secondaryColor: string;
  underbellyColor: string;
  markingType: MarkingType;
  eyeColorLeft: string;
  eyeColorRight: string;
  isHeterochromia: boolean;
  eyeState: EyeState;
  muzzleLength: number; // 0.7 (short) to 1.35 (long)
  muzzleShape?: MuzzleShape;
  earSize: number; // 0.7 to 1.4
  earShape?: EarShape;
  earTufts: boolean;
  tailLength: number; // 0.6 to 1.4
  tailThickness: number; // 0.6 to 1.5
  tailType?: TailType;
  legLength: number; // 0.8 to 1.2
  pawSize: number; // 0.8 to 1.3
  bodyScale: number; // overall scale factor
  accessory: AccessoryType;
  accessoryType?: AccessoryType;
  scar: ScarType;
  scarType?: ScarType;
  aura: AuraType;
  auraType?: AuraType;
}

export type AnimationState =
  | 'idle'
  | 'walk'
  | 'trot'
  | 'run'
  | 'sprint'
  | 'jump'
  | 'fall'
  | 'land'
  | 'sneak'
  | 'pounce_windup'
  | 'pounce_leap'
  | 'claw_swipe'
  | 'bite'
  | 'block'
  | 'hurt'
  | 'die'
  | 'sit'
  | 'lay_down'
  | 'sleep'
  | 'groom'
  | 'hiss'
  | 'snarl'
  | 'bow'
  | 'swim';

export interface Injury {
  id: string;
  name: string;
  type: 'scratch' | 'bleeding' | 'sprain' | 'bite_wound' | 'infected';
  severity: 1 | 2 | 3;
  curedByHerb: HerbType;
  description: string;
  timeRemaining: number;
}

export type HerbType = 'marigold' | 'dock' | 'poppy_seed' | 'horsetail' | 'catmint';

export interface HerbItem {
  id: string;
  type: HerbType;
  name: string;
  description: string;
  cures: string;
  quantity: number;
}

export interface PreyItem {
  id: string;
  type: 'mouse' | 'rabbit' | 'bird' | 'fish' | 'vole' | 'squirrel';
  name: string;
  nutrition: number;
  weightKg: number;
  freshness: number; // 100% -> decays over time
}

export interface PreyEntity {
  id: string;
  type: 'mouse' | 'rabbit' | 'bird' | 'fish' | 'vole' | 'squirrel';
  position: { x: number; y: number; z: number };
  rotation: number;
  state: 'idle' | 'wander' | 'alert' | 'flee' | 'caught';
  speed: number;
  alertLevel: number; // 0 to 100
  targetPos?: { x: number; y: number; z: number };
  fleeTimer?: number;
}

export interface DeathRecord {
  lifeNumber: number;
  timestamp: string;
  cause: string;
  location: string;
}

export interface PlayerCharacter {
  id: string;
  name: string;
  prefix: string;
  suffix: string;
  clan: ClanId;
  role: ClanRole;
  bio?: string;
  appearance: CatAppearance;
  reputation: number;
  leaderLives: number; // 0 to 9
  maxLeaderLives: number;
  deathHistory: DeathRecord[];
  createdAt: string;
  lastPlayed: string;
}

export interface PlayerRuntimeState {
  id: string;
  character: PlayerCharacter;
  position: { x: number; y: number; z: number };
  rotation: { yaw: number; pitch: number };
  velocity: { x: number; y: number; z: number };
  animation: AnimationState;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  carriedPrey: PreyItem | null;
  herbs: HerbItem[];
  injuries: Injury[];
  currentRealm: RealmId;
  isSneaking: boolean;
  isResting: boolean;
  isScentSenseActive: boolean;
  isDead: boolean;
  activeTargetId?: string | null;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderClan: ClanId;
  senderRole: ClanRole;
  text: string;
  channel: 'local' | 'clan' | 'whisper' | 'rp' | 'system';
  timestamp: number;
  recipientId?: string;
}

export interface Prophecy {
  id: string;
  title: string;
  verses: string[];
  ancestorGiver: string;
  receivedAt: string;
  meaning: string;
}

export interface ClanDetails {
  id: ClanId;
  name: string;
  motto: string;
  description: string;
  territoryName: string;
  leaderName: string;
  deputyName: string;
  medCatName: string;
  primaryColor: string;
  badgeIcon: string;
  freshKillCount: number;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high' | 'ultra';
  shadows: boolean;
  particles: boolean;
  fov: number;
  cameraDistance: number;
  mouseSensitivity: number;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  showChatBubbles: boolean;
  showPlayerNametags: boolean;
  scentVisionHighlights: boolean;
  reducedMotion: boolean;
}
