import React, { useState } from 'react';
import { X, Skull, Zap, Shield, Sparkles } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface DarkForestTrialModalProps {
  onClose: () => void;
  onRewardAura: () => void;
}

export const DarkForestTrialModal: React.FC<DarkForestTrialModalProps> = ({ onClose, onRewardAura }) => {
  const [trialStep, setTrialStep] = useState<'intro' | 'sparring' | 'complete'>('intro');
  const [sparHealth, setSparHealth] = useState(100);

  const handleStrike = () => {
    soundEngine.playClawSwipe();
    setSparHealth((prev) => {
      const next = prev - 35;
      if (next <= 0) {
        soundEngine.playDarkForestWhisper();
        setTrialStep('complete');
        onRewardAura();
        return 0;
      }
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-purple-950 to-stone-950 border border-purple-600/50 rounded-3xl shadow-[0_0_50px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col p-6 text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-2xl shadow-inner">
            💀
          </div>
          <div>
            <h2 className="text-lg font-black text-purple-200 tracking-wide">
              DARK FOREST SHADOW COMBAT TRIAL
            </h2>
            <p className="text-xs text-purple-300/80">
              Instructor ShadeFang: "Mercy is the weakness of the sunlit clans."
            </p>
          </div>
        </div>

        {/* STEP 1: INTRO */}
        {trialStep === 'intro' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-stone-300 leading-relaxed">
              The shadowy warrior circles you amidst the dead trees. He demands you prove your ruthless strike timing in the ring of thorns.
            </p>

            <button
              onClick={() => setTrialStep('sparring')}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-lg"
            >
              Enter Shadow Sparring Ring
            </button>
          </div>
        )}

        {/* STEP 2: SPARRING */}
        {trialStep === 'sparring' && (
          <div className="space-y-4 py-2 text-center">
            <p className="text-xs text-purple-200">
              Strike ShadeFang with swift claw combos to break his shadow guard!
            </p>

            {/* Dummy Health Bar */}
            <div className="w-full bg-stone-900 h-4 rounded-full overflow-hidden border border-purple-500/40 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-purple-600 rounded-full transition-all"
                style={{ width: `${sparHealth}%` }}
              />
            </div>
            <span className="text-xs font-mono text-purple-300">Guard: {sparHealth}/100</span>

            <div>
              <button
                onClick={handleStrike}
                className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black px-6 py-3 rounded-2xl text-sm uppercase shadow-2xl transition"
              >
                Execute Heavy Shadow Slash!
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: COMPLETE */}
        {trialStep === 'complete' && (
          <div className="space-y-4 py-2 text-center">
            <div className="p-4 bg-purple-900/40 border border-purple-500/30 rounded-2xl">
              <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-purple-100">Shadow Trial Victorious!</h3>
              <p className="text-xs text-stone-300 mt-1">
                ShadeFang bows in cold acknowledgment. You have unlocked the <strong>Dark Forest Smoke Aura</strong>.
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full bg-purple-700 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-xs transition"
            >
              Return to Dark Forest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
