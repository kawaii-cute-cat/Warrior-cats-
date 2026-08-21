import React, { useState } from 'react';
import { PlayerRuntimeState, RealmId } from '../types/game';
import { X, Navigation, Moon, Sparkles, Skull, Compass, BookOpen } from 'lucide-react';
import { CLAN_LORE, PROCEDURAL_PROPHECIES } from '../constants/clans';

interface StarMapNavigationModalProps {
  playerState: PlayerRuntimeState;
  onClose: () => void;
  onSwitchRealm: (realm: RealmId) => void;
}

export const StarMapNavigationModal: React.FC<StarMapNavigationModalProps> = ({
  playerState,
  onClose,
  onSwitchRealm,
}) => {
  const [selectedTab, setSelectedTab] = useState<'routes' | 'prophecies' | 'lore'>('routes');

  const navigationRoutes = [
    {
      destination: 'The Sacred Moonpool Grotto',
      realm: 'moonpool' as RealmId,
      instructions: 'Head northeast past the Sunlit Ravine, cross the stepping stones across RiverMist, and climb the crystal ridge to the cavern mouth.',
      icon: <Moon className="w-5 h-5 text-sky-400" />,
      distanceEst: 'Approx. 2 minutes on foot',
    },
    {
      destination: 'StarClan Silverpelt Ancestral Meadow',
      realm: 'starclan' as RealmId,
      instructions: 'Accessible by sleeping with your nose touching the sacred Moonpool water during full moonlight, or through ancestral death ascension.',
      icon: <Sparkles className="w-5 h-5 text-indigo-400" />,
      distanceEst: 'Spiritual Realm Transition',
    },
    {
      destination: 'Place of No Stars (Dark Forest)',
      realm: 'darkforest' as RealmId,
      instructions: 'Lurking beneath the twisted thorny hollow where no star shines. Ambition and forbidden dreams lead living warriors into its shadowy trials.',
      icon: <Skull className="w-5 h-5 text-red-500" />,
      distanceEst: 'Spiritual Shadow Gateway',
    },
    {
      destination: 'Clan Living Overworld Territory',
      realm: 'territory' as RealmId,
      instructions: 'The physical forest realm containing the camp hollows, fresh-kill piles, riverbeds, and borders of the four warrior clans.',
      icon: <Compass className="w-5 h-5 text-amber-400" />,
      distanceEst: 'Living Realm',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-2xl bg-stone-900 border border-stone-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/70">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-black text-indigo-200 tracking-wide">
              STAR MAP & ANCESTRAL LORE COMPASS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-4 pt-2 gap-2">
          {[
            { id: 'routes', label: 'Realm Navigation & Travel', icon: <Navigation className="w-4 h-4" /> },
            { id: 'prophecies', label: 'Prophecy Log', icon: <BookOpen className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl transition ${
                selectedTab === tab.id
                  ? 'bg-stone-800 text-indigo-300 border-t-2 border-indigo-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* BODY */}
        <div className="p-4 overflow-y-auto space-y-4">
          {selectedTab === 'routes' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400">
                Detailed directions to sacred landmarks and spiritual realms. You can invoke ancestral fast-travel below:
              </p>
              {navigationRoutes.map((route, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800 hover:border-indigo-500/40 transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-stone-100 text-sm">
                      {route.icon}
                      <span>{route.destination}</span>
                    </div>
                    {playerState.currentRealm !== route.realm ? (
                      <button
                        onClick={() => {
                          onSwitchRealm(route.realm);
                          onClose();
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition shadow"
                      >
                        Travel to Realm
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                        Current Realm
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-300">{route.instructions}</p>
                  <span className="text-[11px] font-mono text-indigo-300">{route.distanceEst}</span>
                </div>
              ))}
            </div>
          )}

          {selectedTab === 'prophecies' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-400">
                Omens and sacred words granted by StarClan ancestors at the Moonpool:
              </p>
              {PROCEDURAL_PROPHECIES.map((proph) => (
                <div
                  key={proph.id}
                  className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-indigo-200">{proph.title}</h3>
                    <span className="text-[10px] text-stone-400">Granted by {proph.ancestorGiver}</span>
                  </div>
                  <div className="italic text-xs text-indigo-100 space-y-1 bg-indigo-950/50 p-3 rounded-xl border border-indigo-500/20 font-serif">
                    {proph.verses.map((v, i) => (
                      <p key={i}>"{v}"</p>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-300">
                    <strong className="text-amber-400">Interpretation:</strong> {proph.meaning}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
