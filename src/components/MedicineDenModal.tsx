import React from 'react';
import { HerbItem, HerbType, Injury, PlayerRuntimeState } from '../types/game';
import { X, Feather, ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { INITIAL_HERBS } from '../constants/clans';
import { CombatAndMedicineSystem } from '../game/CombatAndMedicineSystem';

interface MedicineDenModalProps {
  playerState: PlayerRuntimeState;
  onClose: () => void;
  onTreat: (herbType: HerbType) => void;
}

export const MedicineDenModal: React.FC<MedicineDenModalProps> = ({ playerState, onClose, onTreat }) => {
  const { herbs, injuries, health, maxHealth } = playerState;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-emerald-200 uppercase tracking-wide">
              Medicine Cat Herb Pouch & Poultices
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* ACTIVE INJURIES */}
          <div>
            <h3 className="text-xs font-bold text-stone-300 uppercase mb-2">Current Active Wounds</h3>
            {injuries.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-stone-950/60 border border-stone-800 rounded-2xl text-xs text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Pelt is in pristine condition! No open injuries or sprains.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {injuries.map((inj) => (
                  <div
                    key={inj.id}
                    className="p-3 bg-rose-950/50 border border-rose-600/40 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-rose-200 text-xs block">{inj.name}</span>
                      <span className="text-[11px] text-stone-300 block">{inj.description}</span>
                      <span className="text-[10px] text-rose-400 font-mono">Remedy Herb: {inj.curedByHerb}</span>
                    </div>
                    <button
                      onClick={() => onTreat(inj.curedByHerb)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition"
                    >
                      Apply Herb
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* HERB POUCH INVENTORY */}
          <div>
            <h3 className="text-xs font-bold text-stone-300 uppercase mb-2">Herb Pouch Stock</h3>
            <div className="grid grid-cols-1 gap-2">
              {INITIAL_HERBS.map((herbTemplate) => {
                const owned = herbs.find((h) => h.type === herbTemplate.type);
                const count = owned ? owned.quantity : 0;
                return (
                  <div
                    key={herbTemplate.type}
                    className="p-3 bg-stone-950/60 border border-stone-800 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-stone-800 flex items-center justify-center text-lg">
                        🌿
                      </div>
                      <div>
                        <span className="font-bold text-stone-100 text-xs block">{herbTemplate.name}</span>
                        <span className="text-[10px] text-emerald-400 block">{herbTemplate.cures}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-stone-300 bg-stone-800 px-2 py-0.5 rounded">
                        x{count}
                      </span>
                      <button
                        disabled={count === 0}
                        onClick={() => onTreat(herbTemplate.type)}
                        className="bg-stone-800 hover:bg-stone-700 disabled:opacity-40 text-emerald-300 text-xs font-bold px-2.5 py-1 rounded-xl transition"
                      >
                        Chew / Poultice
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
