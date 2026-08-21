import React, { useState } from 'react';
import { ClanId, ClanRole } from '../types/game';
import { CLAN_LORE } from '../constants/clans';
import { X, Shield, Check, AlertCircle } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface ClanChangeModalProps {
  currentClan: ClanId;
  onClose: () => void;
  onConfirmClanChange: (newClan: ClanId) => void;
}

export const ClanChangeModal: React.FC<ClanChangeModalProps> = ({
  currentClan,
  onClose,
  onConfirmClanChange,
}) => {
  const [selected, setSelected] = useState<ClanId>(currentClan);

  const handleConfirm = () => {
    soundEngine.playPurr();
    onConfirmClanChange(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/85 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-2xl">
            🐾
          </div>
          <div>
            <h2 className="text-base font-bold text-amber-200 tracking-wide">
              NEUTRAL GATHERING STONE • CLAN ALLEGIANCE
            </h2>
            <p className="text-xs text-stone-400">
              Change your allegiance and camp spawn territory.
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {(Object.keys(CLAN_LORE) as ClanId[]).map((clanKey) => {
            const c = CLAN_LORE[clanKey];
            const isSel = selected === clanKey;
            const isCurrent = currentClan === clanKey;

            return (
              <div
                key={clanKey}
                onClick={() => setSelected(clanKey)}
                className={`cursor-pointer p-3 rounded-2xl border transition flex items-center justify-between ${
                  isSel
                    ? 'bg-amber-950/40 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-stone-950/50 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <span className="font-bold text-xs text-stone-100 flex items-center gap-2">
                    <span>{c.badgeIcon}</span> {c.name}
                    {isCurrent && (
                      <span className="text-[10px] text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                        Current Clan
                      </span>
                    )}
                  </span>
                  <span className="text-[11px] text-stone-400 block mt-0.5">{c.territoryName}</span>
                </div>
                {isSel && <Check className="w-4 h-4 text-amber-400" />}
              </div>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={selected === currentClan}
            className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow"
          >
            Pledge Allegiance & Relocate
          </button>
          <button
            onClick={onClose}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
