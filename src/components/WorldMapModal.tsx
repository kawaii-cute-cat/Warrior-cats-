import React, { useState } from 'react';
import { PlayerRuntimeState, RealmId } from '../types/game';
import { X, Navigation, MapPin, Compass, Search, Info, Flag, Footprints, Shield, Sparkles, Filter } from 'lucide-react';
import { CLAN_LORE } from '../constants/clans';

export interface TerritoryLandmark {
  id: string;
  name: string;
  clan: string;
  category: 'den' | 'landmark' | 'hunting' | 'border' | 'sacred' | 'water';
  x: number;
  z: number;
  icon: string;
  color: string;
  description: string;
  tacticalNote: string;
  preyOrHerbs?: string;
  realm?: RealmId;
}

interface WorldMapModalProps {
  playerState: PlayerRuntimeState;
  activeWaypoint?: { name: string; x: number; z: number } | null;
  onClose: () => void;
  onSetWaypoint: (landmark: { name: string; x: number; z: number } | null) => void;
  onFastTravel: (x: number, z: number, realm?: RealmId) => void;
}

const TERRITORY_LANDMARKS: TerritoryLandmark[] = [
  // ThunderClan Territory & Camp Dens (South-West quadrant: centered around -65, -25)
  {
    id: 'tc_highrock',
    name: 'ThunderClan Highrock',
    clan: 'ThunderClan',
    category: 'den',
    x: -65,
    z: -25,
    icon: '⛰️',
    color: 'text-amber-400',
    description: 'The ancient towering boulder in ThunderClan camp where the Clan leader calls meetings: "Let all cats old enough to catch their own prey gather beneath the Highrock for a clan meeting!"',
    tacticalNote: 'Overlooks the sandy camp clearing with the Leader\'s Den hollowed out beneath the lichen-draped crags.',
  },
  {
    id: 'tc_freshkill',
    name: 'ThunderClan Fresh-Kill Pile',
    clan: 'ThunderClan',
    category: 'den',
    x: -62,
    z: -23,
    icon: '🐭',
    color: 'text-orange-400',
    description: 'The central cache where hunting patrols deposit caught mice, squirrels, voles, and thrushes for elders, queens, and the clan.',
    tacticalNote: 'Hunters must feed the elders and nursery before eating their own share.',
    preyOrHerbs: 'Mice, Voles, Squirrels',
  },
  {
    id: 'tc_warriors_den',
    name: 'ThunderClan Warriors\' Den',
    clan: 'ThunderClan',
    category: 'den',
    x: -69,
    z: -28,
    icon: '⚔️',
    color: 'text-amber-500',
    description: 'A sheltered thicket beneath low-hanging oak branches and bramble thickets where senior and junior warriors sleep on warm moss beds.',
    tacticalNote: 'Positioned close to the camp entrance gorse tunnel for rapid defense.',
  },
  {
    id: 'tc_med_den',
    name: 'ThunderClan Medicine Cat Den',
    clan: 'ThunderClan',
    category: 'den',
    x: -71,
    z: -20,
    icon: '🌿',
    color: 'text-emerald-400',
    description: 'A quiet cave in the ravine wall flanked by ferns with deep rock crevices for storing cobwebs, marigold, poppy seeds, and herbs.',
    tacticalNote: 'Has a trickling stone basin with clean rainwater for sick patients.',
    preyOrHerbs: 'Cobwebs, Marigold, Poppy Seeds, Catmint',
  },
  {
    id: 'tc_nursery',
    name: 'ThunderClan Nursery',
    clan: 'ThunderClan',
    category: 'den',
    x: -58,
    z: -30,
    icon: '🐾',
    color: 'text-pink-400',
    description: 'The warmest, most heavily guarded bramble bush in the camp where queens nurse kits and kits play in safety.',
    tacticalNote: 'Reinforced with woven thorn brambles for absolute defense against predators.',
  },
  {
    id: 'tc_elders_den',
    name: 'ThunderClan Elders\' Den',
    clan: 'ThunderClan',
    category: 'den',
    x: -60,
    z: -18,
    icon: '🍂',
    color: 'text-yellow-600',
    description: 'A cozy hollow under a fallen mossy log where retired warriors rest and share stories of ancient battles with apprentices.',
    tacticalNote: 'Apprentices are assigned daily duties to replace bedding and check for ticks.',
  },
  {
    id: 'tc_sandy_hollow',
    name: 'Sandy Training Hollow',
    clan: 'ThunderClan',
    category: 'hunting',
    x: -45,
    z: -10,
    icon: '🎯',
    color: 'text-amber-300',
    description: 'A wide, soft sandy depression ringed by hazel trees where mentors train apprentices in battle moves, stalking, and pouncing.',
    tacticalNote: 'Soft sand cushions hard falls during combat assessment.',
  },
  {
    id: 'sunningrocks',
    name: 'Sunningrocks',
    clan: 'ThunderClan / RiverClan Border',
    category: 'landmark',
    x: -8,
    z: 2,
    icon: '☀️',
    color: 'text-amber-500',
    description: 'Warm smooth river stones historically contested between ThunderClan and RiverClan. Excellent basking and lizard hunting spot.',
    tacticalNote: 'High tactical value; frequently patrolled by warriors from both clans.',
    preyOrHerbs: 'Lizards, Vole, Warm Basking Rocks',
  },
  {
    id: 'great_sycamore',
    name: 'Great Sycamore Tree',
    clan: 'ThunderClan',
    category: 'landmark',
    x: -35,
    z: -45,
    icon: '🌳',
    color: 'text-emerald-500',
    description: 'An immense old sycamore tree with sprawling branches where young apprentices practice climbing and tree-stalking birds.',
    tacticalNote: 'Excellent elevated vantage point overlooking the whole forest valley.',
  },
  {
    id: 'snakerocks',
    name: 'Snakerocks & Adder Caves',
    clan: 'ThunderClan Border',
    category: 'landmark',
    x: -80,
    z: -60,
    icon: '🐍',
    color: 'text-rose-500',
    description: 'A jagged outcropping of dark cracked boulders infested with adders and birds of prey. Chervil grows near the cracks.',
    tacticalNote: 'Extreme caution advised: poisonous adders strike unwary cats.',
    preyOrHerbs: 'Wild Chervil, Danger: Venomous Adders',
  },

  // RiverClan Territory & Camp (North-East quadrant: centered around 65, 25)
  {
    id: 'rc_island_camp',
    name: 'RiverClan Island Camp',
    clan: 'RiverClan',
    category: 'den',
    x: 65,
    z: 25,
    icon: '🏝️',
    color: 'text-sky-400',
    description: 'A secure camp surrounded on all sides by swirling river channels, reachable only by confident swimmers or over slick stones.',
    tacticalNote: 'Natural moat provides unmatched defense against non-swimming clans.',
  },
  {
    id: 'rc_freshkill',
    name: 'RiverClan Fresh-Kill Pile',
    clan: 'RiverClan',
    category: 'den',
    x: 63,
    z: 23,
    icon: '🐟',
    color: 'text-cyan-400',
    description: 'A gravel-lined mound piled high with fresh trout, silver minnows, carp, and water voles caught along the rapids.',
    tacticalNote: 'Fish are kept cool in shallow wet gravel bowls.',
    preyOrHerbs: 'River Trout, Minnows, Water Voles',
  },
  {
    id: 'rc_reedbeds',
    name: 'Glimmering Reed Beds',
    clan: 'RiverClan',
    category: 'hunting',
    x: 48,
    z: 15,
    icon: '🌾',
    color: 'text-teal-400',
    description: 'Dense stands of fragrant water reeds and sedges where RiverClan apprentices learn water-stalking and scoop-fishing.',
    tacticalNote: 'Abundant with water mint, mallow, and waterbirds.',
    preyOrHerbs: 'Watermint, Mallow, Waterbirds',
  },
  {
    id: 'rc_stepping_stones',
    name: 'River Stepping Stones',
    clan: 'RiverClan Border',
    category: 'border',
    x: 12,
    z: 18,
    icon: '🪨',
    color: 'text-blue-300',
    description: 'A line of mossy boulders cutting across the main river rapids, allowing agile cats to cross into RiverClan territory without getting soaked.',
    tacticalNote: 'Slippery in wet weather; RiverClan guards often scent-mark the western bank.',
  },
  {
    id: 'rc_wooden_bridge',
    name: 'Twoleg Wooden Bridge',
    clan: 'RiverClan / Neutral',
    category: 'border',
    x: 25,
    z: 60,
    icon: '🌉',
    color: 'text-stone-300',
    description: 'A sturdy wooden Twoleg bridge that spans the widest section of the river, used during greenleaf floods when stepping stones are submerged.',
    tacticalNote: 'Twoleg scent is heavy during daylight hours.',
  },

  // Fourtrees Gathering Place (Central: x: 0, z: 0)
  {
    id: 'fourtrees',
    name: 'Fourtrees (Sacred Gathering Clearing)',
    clan: 'Neutral Gathering Ground',
    category: 'sacred',
    x: 0,
    z: 0,
    icon: '✨',
    color: 'text-amber-200',
    description: 'The ancient sacred hollow with four magnificent oak trees where all four Clans gather in truce under the full moon.',
    tacticalNote: 'Strict Sacred Truce enforced by StarClan; no claws or fighting permitted.',
  },

  // WindClan & ShadowClan Landmarks (North-West & South-East)
  {
    id: 'windclan_moor',
    name: 'WindClan Whispering Moorlands',
    clan: 'WindClan',
    category: 'hunting',
    x: -55,
    z: 55,
    icon: '🍃',
    color: 'text-emerald-300',
    description: 'Sweeping open hills carpeted in purple heather, gorse, and wind-carved burrows where swift WindClan cats sprint down hares.',
    tacticalNote: 'Open terrain offers zero tree cover; speed and endurance are vital.',
    preyOrHerbs: 'Heather, Wild Thyme, Moor Hares',
  },
  {
    id: 'shadowclan_marsh',
    name: 'ShadowClan Pine Marsh & Bogs',
    clan: 'ShadowClan',
    category: 'hunting',
    x: 55,
    z: -55,
    icon: '🌲',
    color: 'text-purple-400',
    description: 'Dark, misty evergreen forest carpeted with damp pine needles, murky ponds, and shadowed mud flats where stealthy hunters stalk lizards and frogs.',
    tacticalNote: 'Shadowed canopy blocks sunlight; excellent for nighttime ambushes.',
    preyOrHerbs: 'Frogs, Lizards, Pine Marten',
  },

  // Twolegplace & Highstones Gateway
  {
    id: 'twolegplace_border',
    name: 'Twolegplace Fence & Abandoned Nest',
    clan: 'Neutral / Loner Border',
    category: 'border',
    x: -85,
    z: 85,
    icon: '🏡',
    color: 'text-stone-400',
    description: 'Wooden fences marking the edge of twoleg territory. Housecats (kittypets) lounge on fences and abandoned barns shelter loners.',
    tacticalNote: 'Beware of noisy Twoleg monsters on the Thunderpath nearby.',
    preyOrHerbs: 'Mice in hay bales, Catnip in twoleg gardens',
  },

  // Sacred Moonpool Portal
  {
    id: 'sacred_moonpool',
    name: 'Sacred Moonpool Shrine Portal',
    clan: 'StarClan Sanctuary',
    category: 'sacred',
    x: 78,
    z: 78,
    icon: '🌙',
    color: 'text-cyan-300',
    description: 'The ancient stone arch where Medicine Cats and Leaders dream with StarClan under the moon\'s light reflection in sacred spring water.',
    tacticalNote: 'Commune with ancestors to receive omens, prophecies, and 9 lives ceremonies.',
    realm: 'moonpool',
  },
];

export const WorldMapModal: React.FC<WorldMapModalProps> = ({
  playerState,
  activeWaypoint,
  onClose,
  onSetWaypoint,
  onFastTravel,
}) => {
  const { position, rotation, character } = playerState;
  const [selectedLandmark, setSelectedLandmark] = useState<TerritoryLandmark | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // World bounds range: -95 to +95 -> Map percent: 6% to 94%
  const toMapPercentX = (wx: number) => ((wx + 95) / 190) * 88 + 6;
  const toMapPercentY = (wz: number) => ((wz + 95) / 190) * 88 + 6;

  // Filter landmarks
  const filteredLandmarks = TERRITORY_LANDMARKS.filter((lm) => {
    if (filterCategory !== 'all' && lm.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        lm.name.toLowerCase().includes(q) ||
        lm.clan.toLowerCase().includes(q) ||
        lm.description.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getDistanceToPlayer = (x: number, z: number) => {
    return Math.round(Math.hypot(position.x - x, position.z - z));
  };

  const isWaypointSet = (lm: TerritoryLandmark) => {
    return activeWaypoint && activeWaypoint.x === lm.x && activeWaypoint.z === lm.z;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-2 sm:p-4 select-none animate-fadeIn font-sans">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[760px] bg-stone-900 border border-stone-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800 bg-stone-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-amber-200 uppercase tracking-wide">
                  Living Forest Territory Map
                </h2>
                <span className="text-[10px] font-bold text-stone-400 bg-stone-800/80 px-2 py-0.5 rounded-full border border-stone-700">
                  {CLAN_LORE[character.clan]?.name || character.clan}
                </span>
              </div>
              <p className="text-[11px] text-stone-400">
                Explore Clan territories, dens, rivers, and landmarks. Click any marker for tactical information.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Active Waypoint Pill */}
            {activeWaypoint && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-[11px] text-cyan-300">
                <Navigation className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>Waypoint: <strong>{activeWaypoint.name}</strong> ({Math.round(Math.hypot(position.x - activeWaypoint.x, position.z - activeWaypoint.z))}m)</span>
                <button
                  onClick={() => onSetWaypoint(null)}
                  className="ml-1 text-cyan-400 hover:text-cyan-100"
                  title="Clear Waypoint"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
              title="Close Map (M / Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CONTROLS BAR (Search & Category filters) */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 border-b border-stone-800 bg-stone-900/60 text-xs">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search dens, rivers, landmarks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1 bg-stone-950/80 border border-stone-700/60 rounded-xl text-stone-200 placeholder-stone-500 text-xs focus:outline-none focus:border-amber-500/60"
            />
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
            {[
              { id: 'all', label: 'All Markers', icon: Filter },
              { id: 'den', label: 'Clan Dens', icon: Shield },
              { id: 'landmark', label: 'Landmarks', icon: MapPin },
              { id: 'hunting', label: 'Hunting Grounds', icon: Footprints },
              { id: 'border', label: 'Borders & Crossings', icon: Flag },
              { id: 'sacred', label: 'Sacred Sites', icon: Sparkles },
            ].map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold transition whitespace-nowrap ${
                    filterCategory === cat.id
                      ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                      : 'bg-stone-800/80 text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* MAP CONTENT WORKSPACE */}
        <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* MAP CANVAS VISUALIZER */}
          <div className="relative flex-1 bg-[#122415] border-r border-stone-800 overflow-hidden flex items-center justify-center select-none">
            {/* 1. TERRAIN BIOME BACKGROUND TEXTURES */}
            {/* Forest Texture Grid */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* ThunderClan Dense Oak Woods (South-West: left bottom) */}
            <div className="absolute left-[8%] bottom-[8%] w-[42%] h-[46%] rounded-[40px] bg-emerald-950/40 border border-emerald-800/20 pointer-events-none" />
            <div className="absolute left-[16%] bottom-[20%] text-[10px] uppercase font-black tracking-widest text-emerald-600/50 pointer-events-none">
              ThunderClan Oak Canopy
            </div>

            {/* RiverClan Island & Reeds (North-East: right top) */}
            <div className="absolute right-[8%] top-[8%] w-[42%] h-[46%] rounded-[40px] bg-teal-950/40 border border-teal-800/20 pointer-events-none" />
            <div className="absolute right-[16%] top-[20%] text-[10px] uppercase font-black tracking-widest text-teal-600/50 pointer-events-none">
              RiverClan Reeds & Rapids
            </div>

            {/* WindClan Moorlands (North-West: left top) */}
            <div className="absolute left-[8%] top-[8%] w-[38%] h-[38%] rounded-[30px] bg-lime-950/30 border border-lime-800/20 pointer-events-none" />
            <div className="absolute left-[14%] top-[12%] text-[9px] uppercase font-black tracking-widest text-lime-600/40 pointer-events-none">
              WindClan Heather Moor
            </div>

            {/* ShadowClan Pine Bogs (South-East: right bottom) */}
            <div className="absolute right-[8%] bottom-[8%] w-[38%] h-[38%] rounded-[30px] bg-purple-950/30 border border-purple-800/20 pointer-events-none" />
            <div className="absolute right-[14%] bottom-[12%] text-[9px] uppercase font-black tracking-widest text-purple-600/40 pointer-events-none">
              ShadowClan Pine Marsh
            </div>

            {/* 2. WINDING RIVER WATERWAY (Diagonally across map) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
              {/* Main River Channel */}
              <path
                d="M 50 0 Q 42 30 55 50 T 45 100"
                fill="none"
                stroke="#1d4ed8"
                strokeWidth="7"
                strokeOpacity="0.45"
                strokeLinecap="round"
              />
              <path
                d="M 50 0 Q 42 30 55 50 T 45 100"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeOpacity="0.6"
                strokeLinecap="round"
              />

              {/* Tributary Stream to ThunderClan Sunningrocks */}
              <path
                d="M 55 50 Q 35 52 28 65"
                fill="none"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.5"
                strokeDasharray="2 1"
              />

              {/* Fourtrees Gathering Ring */}
              <circle cx="50" cy="50" r="7" fill="#451a03" fillOpacity="0.3" stroke="#f59e0b" strokeWidth="0.7" strokeDasharray="1 1" />

              {/* ThunderClan Ravine Ring */}
              <circle cx="20" cy="62" r="9" fill="#064e3b" fillOpacity="0.3" stroke="#10b981" strokeWidth="0.8" strokeDasharray="2 2" />

              {/* RiverClan Island Ring */}
              <circle cx="80" cy="38" r="8" fill="#134e4a" fillOpacity="0.3" stroke="#06b6d4" strokeWidth="0.8" strokeDasharray="2 2" />
            </svg>

            {/* 3. ACTIVE WAYPOINT BEACON LINE */}
            {activeWaypoint && (
              <div
                className="absolute pointer-events-none z-15"
                style={{
                  left: `${toMapPercentX(activeWaypoint.x)}%`,
                  top: `${toMapPercentY(activeWaypoint.z)}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 animate-ping opacity-60" />
                <div className="absolute inset-0 w-8 h-8 m-auto rounded-full bg-cyan-500/30 flex items-center justify-center">
                  <Navigation className="w-4 h-4 text-cyan-300 animate-pulse" />
                </div>
              </div>
            )}

            {/* 4. LANDMARK ICONS */}
            {filteredLandmarks.map((lm) => {
              const px = toMapPercentX(lm.x);
              const py = toMapPercentY(lm.z);
              const isSelected = selectedLandmark?.id === lm.id;
              const hasWaypoint = isWaypointSet(lm);

              return (
                <div
                  key={lm.id}
                  onClick={() => setSelectedLandmark(lm)}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center z-20 transition-transform ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-115'
                  }`}
                  style={{ left: `${px}%`, top: `${py}%` }}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border flex items-center justify-center text-xs sm:text-sm shadow-xl transition backdrop-blur-md ${
                      isSelected
                        ? 'bg-amber-400 border-white ring-4 ring-amber-400/40 text-stone-950 scale-110 shadow-amber-500/50'
                        : hasWaypoint
                        ? 'bg-cyan-900/90 border-cyan-400 ring-2 ring-cyan-400/50 text-cyan-200'
                        : 'bg-stone-900/90 border-stone-600 hover:border-amber-400 text-stone-100'
                    }`}
                  >
                    {lm.icon}
                  </div>

                  {/* Marker label */}
                  <span
                    className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow mt-1 whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-amber-400 text-stone-950 font-black shadow-lg'
                        : 'bg-stone-950/90 text-stone-200 group-hover:text-amber-300 border border-stone-800'
                    }`}
                  >
                    {lm.name}
                  </span>
                </div>
              );
            })}

            {/* 5. LIVE PLAYER LOCATION MARKER */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-40 pointer-events-none"
              style={{
                left: `${toMapPercentX(position.x)}%`,
                top: `${toMapPercentY(position.z)}%`,
              }}
            >
              {/* Radar pulse */}
              <div className="absolute -inset-2 rounded-full bg-amber-400/30 animate-ping" />

              <div
                className="w-7 h-7 rounded-full bg-amber-400 border-2 border-white shadow-[0_0_16px_#f59e0b] flex items-center justify-center text-xs font-black text-stone-950"
                style={{ transform: `rotate(${(-rotation.yaw * 180) / Math.PI}deg)` }}
              >
                ▲
              </div>
              <span className="text-[9px] font-black uppercase text-amber-200 bg-stone-950/95 px-1.5 py-0.5 rounded-full border border-amber-500/60 shadow mt-1 whitespace-nowrap">
                You ({character.name})
              </span>
            </div>

            {/* Compass Rose Indicator */}
            <div className="absolute top-3 left-3 p-2 rounded-2xl bg-stone-950/85 border border-stone-800 text-stone-400 text-[10px] font-bold flex flex-col items-center pointer-events-none shadow-lg">
              <span className="text-amber-400">N</span>
              <div className="flex items-center gap-2">
                <span>W</span>
                <Compass className="w-4 h-4 text-amber-500" />
                <span>E</span>
              </div>
              <span>S</span>
            </div>
          </div>

          {/* RIGHT SIDEBAR: LANDMARK DETAILS & INSPECTOR */}
          <div className="w-full md:w-80 bg-stone-950/90 border-t md:border-t-0 md:border-l border-stone-800 p-4 flex flex-col justify-between overflow-y-auto">
            {selectedLandmark ? (
              <div className="flex flex-col gap-3">
                {/* TITLE & BADGE */}
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-stone-900 border border-stone-700 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {selectedLandmark.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-stone-100 leading-tight">
                      {selectedLandmark.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {selectedLandmark.clan}
                      </span>
                      <span className="text-[10px] text-stone-400 uppercase font-semibold">
                        {selectedLandmark.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DISTANCE & COORDINATES */}
                <div className="grid grid-cols-2 gap-2 bg-stone-900/80 p-2.5 rounded-2xl border border-stone-800/80 text-xs">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block">Distance</span>
                    <span className="font-bold text-cyan-300">
                      {getDistanceToPlayer(selectedLandmark.x, selectedLandmark.z)} meters
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block">Coordinates</span>
                    <span className="font-mono text-stone-300">
                      X: {selectedLandmark.x}, Z: {selectedLandmark.z}
                    </span>
                  </div>
                </div>

                {/* LORE DESCRIPTION */}
                <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-800/60">
                  <span className="text-[10px] uppercase font-bold text-amber-300/90 flex items-center gap-1 mb-1">
                    <Info className="w-3 h-3" /> Lore & Overview
                  </span>
                  <p className="text-xs text-stone-300 leading-relaxed">
                    {selectedLandmark.description}
                  </p>
                </div>

                {/* TACTICAL NOTES */}
                <div className="bg-stone-900/60 p-3 rounded-2xl border border-stone-800/60">
                  <span className="text-[10px] uppercase font-bold text-rose-300/90 flex items-center gap-1 mb-1">
                    <Shield className="w-3 h-3" /> Tactical Notes
                  </span>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {selectedLandmark.tacticalNote}
                  </p>
                </div>

                {/* PREY OR HERBS */}
                {selectedLandmark.preyOrHerbs && (
                  <div className="bg-emerald-950/30 p-2.5 rounded-2xl border border-emerald-500/20 text-xs text-emerald-300">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                      Flora & Fauna:
                    </span>
                    {selectedLandmark.preyOrHerbs}
                  </div>
                )}

                {/* ACTIONS */}
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (isWaypointSet(selectedLandmark)) {
                        onSetWaypoint(null);
                      } else {
                        onSetWaypoint({
                          name: selectedLandmark.name,
                          x: selectedLandmark.x,
                          z: selectedLandmark.z,
                        });
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-md ${
                      isWaypointSet(selectedLandmark)
                        ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                        : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-600'
                    }`}
                  >
                    <Navigation className="w-4 h-4" />
                    {isWaypointSet(selectedLandmark) ? 'Clear Waypoint' : 'Set In-World Waypoint'}
                  </button>

                  <button
                    onClick={() => onFastTravel(selectedLandmark.x, selectedLandmark.z, selectedLandmark.realm)}
                    className="w-full py-2.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
                  >
                    <Footprints className="w-4 h-4" />
                    Travel to Landmark
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4 text-stone-500">
                <MapPin className="w-10 h-10 mb-2 opacity-40 text-amber-400" />
                <h4 className="text-sm font-bold text-stone-300 mb-1">Select a Landmark</h4>
                <p className="text-xs text-stone-400 max-w-[220px]">
                  Click any territory den, camp, hunting ground, or crossing marker on the map to inspect lore and set waypoints.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER STATUS BAR */}
        <div className="px-4 py-2.5 bg-stone-950 border-t border-stone-800 flex flex-wrap items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-3">
            <span>
              Your Position: <strong className="font-mono text-amber-300">X: {Math.round(position.x)}, Z: {Math.round(position.z)}</strong>
            </span>
            <span className="hidden sm:inline text-stone-600">•</span>
            <span className="hidden sm:inline">
              Heading: <strong className="font-mono text-stone-300">{Math.round(((-rotation.yaw * 180) / Math.PI + 360) % 360)}°</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span>Press <kbd className="bg-stone-800 px-1 py-0.5 rounded text-stone-200 border border-stone-700">M</kbd> to toggle map</span>
          </div>
        </div>
      </div>
    </div>
  );
};
