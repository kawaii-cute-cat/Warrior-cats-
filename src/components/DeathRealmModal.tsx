import React from 'react';
import { PlayerCharacter, RealmId } from '../types/game';
import { Sparkles, Skull, HeartHandshake, Compass } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface DeathRealmModalProps {
  character: PlayerCharacter;
  onSelectPostDeathRealm: (realm: RealmId) => void;
  onResurrectAtCamp: () => void;
}

export const DeathRealmModal: React.FC<DeathRealmModalProps> = ({
  character,
  onSelectPostDeathRealm,
  onResurrectAtCamp,
}) => {
  const isLeader = character.role === 'Leader';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/95 backdrop-blur-lg p-4 select-none">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-700/80 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-6 text-stone-100 text-center">
        {/* ICON */}
        <div className="w-16 h-16 rounded-full bg-stone-800 border-2 border-stone-600 flex items-center justify-center text-3xl mx-auto mb-3">
          🕊️
        </div>

        <h2 className="text-xl font-black text-amber-200 uppercase tracking-widest">
          Your Mortal Strength Has Faded
        </h2>
        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
          {character.name}'s spirit separates from its mortal shell. The stars and shadows call out across the spiritual divide.
        </p>

        {/* POST-DEATH REALM SELECTION */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          {/* STARCLAN */}
          <div
            onClick={() => {
              soundEngine.playStarClanChime();
              onSelectPostDeathRealm('starclan');
            }}
            className="cursor-pointer p-4 rounded-2xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 hover:border-indigo-400 transition flex flex-col items-center group shadow-lg"
          >
            <Sparkles className="w-8 h-8 text-indigo-300 group-hover:scale-110 transition mb-2" />
            <span className="font-bold text-xs text-indigo-100">Ascend to StarClan</span>
            <span className="text-[10px] text-stone-400 mt-1">Walk among Silverpelt ancestors.</span>
          </div>

          {/* DARK FOREST */}
          <div
            onClick={() => {
              soundEngine.playDarkForestWhisper();
              onSelectPostDeathRealm('darkforest');
            }}
            className="cursor-pointer p-4 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-600/40 hover:border-purple-400 transition flex flex-col items-center group shadow-lg"
          >
            <Skull className="w-8 h-8 text-purple-400 group-hover:scale-110 transition mb-2" />
            <span className="font-bold text-xs text-purple-100">Descend to Dark Forest</span>
            <span className="text-[10px] text-stone-400 mt-1">Train in shadow and forbidden trials.</span>
          </div>

          {/* REAWAKEN AT MEDICINE DEN */}
          <div
            onClick={() => {
              soundEngine.playPurr();
              onResurrectAtCamp();
            }}
            className="cursor-pointer p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-600/40 hover:border-emerald-400 transition flex flex-col items-center group shadow-lg"
          >
            <HeartHandshake className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition mb-2" />
            <span className="font-bold text-xs text-emerald-100">Awaken at Camp Den</span>
            <span className="text-[10px] text-stone-400 mt-1">Revive under medicine cat care.</span>
          </div>
        </div>

        {isLeader && (
          <p className="text-xs text-amber-400 font-semibold bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl">
            ★ Leader Status: You have {character.leaderLives} of 9 lives remaining in your cycle.
          </p>
        )}
      </div>
    </div>
  );
};
