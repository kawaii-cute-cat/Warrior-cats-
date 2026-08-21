import React, { useState } from 'react';
import { Prophecy } from '../types/game';
import { PROCEDURAL_PROPHECIES } from '../constants/clans';
import { X, Sparkles, Moon, Eye, Feather } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface MoonpoolProphecyModalProps {
  onClose: () => void;
  onAscendStarClan: () => void;
}

export const MoonpoolProphecyModal: React.FC<MoonpoolProphecyModalProps> = ({
  onClose,
  onAscendStarClan,
}) => {
  const [currentProphecy, setCurrentProphecy] = useState<Prophecy>(
    PROCEDURAL_PROPHECIES[Math.floor(Math.random() * PROCEDURAL_PROPHECIES.length)]
  );
  const [hasDrank, setHasDrank] = useState(false);

  const handleDrink = () => {
    soundEngine.playStarClanChime();
    setHasDrank(true);
    // Pick dynamic prophecy
    const rand = PROCEDURAL_PROPHECIES[Math.floor(Math.random() * PROCEDURAL_PROPHECIES.length)];
    setCurrentProphecy(rand);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-indigo-950 to-stone-950 border border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col p-6 text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-inner">
            🌙
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-200 tracking-wide">
              THE SACRED MOONPOOL COMMUNION
            </h2>
            <p className="text-xs text-indigo-300/80">
              Where the stars of Silverpelt touch the sacred mountain pool.
            </p>
          </div>
        </div>

        {/* PROMPT / PROPHECY CONTENT */}
        {!hasDrank ? (
          <div className="space-y-4 text-center py-6">
            <p className="text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
              You gaze into the crystalline pool. The reflection of Silverpelt glimmers beneath your paws. Touch your nose to the water to sleep and receive visions from your StarClan ancestors.
            </p>

            <button
              onClick={handleDrink}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-stone-950 font-black px-6 py-3 rounded-2xl text-sm uppercase tracking-wider shadow-2xl transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Touch Nose to Moonpool Water</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <div className="p-5 rounded-2xl bg-indigo-900/40 border border-indigo-400/30 text-center space-y-3">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-widest block">
                Vision from {currentProphecy.ancestorGiver}
              </span>
              <h3 className="text-base font-black text-white font-serif">{currentProphecy.title}</h3>
              <div className="italic text-indigo-100 text-sm space-y-1.5 font-serif py-2">
                {currentProphecy.verses.map((v, i) => (
                  <p key={i}>"{v}"</p>
                ))}
              </div>
              <p className="text-xs text-indigo-200/90 pt-2 border-t border-indigo-500/20">
                <strong>Prophecy Meaning:</strong> {currentProphecy.meaning}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  onAscendStarClan();
                  onClose();
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow"
              >
                Ascend into Silverpelt Realm
              </button>
              <button
                onClick={onClose}
                className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs transition"
              >
                Awaken
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
