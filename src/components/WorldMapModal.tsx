import React from 'react';
import { PlayerRuntimeState, RealmId } from '../types/game';
import { X, Navigation, MapPin, Sparkles, Compass } from 'lucide-react';
import { CLAN_LORE } from '../constants/clans';

interface WorldMapModalProps {
  playerState: PlayerRuntimeState;
  onClose: () => void;
  onFastTravel: (x: number, z: number, realm?: RealmId) => void;
}

export const WorldMapModal: React.FC<WorldMapModalProps> = ({ playerState, onClose, onFastTravel }) => {
  const { position, rotation, character } = playerState;

  // Convert 3D world coordinates (-90 to +90) to map percentage (5% to 95%)
  const toMapPercentX = (wx: number) => ((wx + 90) / 180) * 90 + 5;
  const toMapPercentY = (wz: number) => ((wz + 90) / 180) * 90 + 5;

  const landmarks = [
    { name: 'Camp & Highrock', x: 0, z: 0, icon: '⛺', color: 'text-amber-400', realm: 'territory' as RealmId },
    { name: 'Fresh-Kill Pile', x: 0, z: 0, icon: '🐭', color: 'text-orange-400', realm: 'territory' as RealmId },
    { name: 'Training Hollow', x: -15, z: -10, icon: '⚔️', color: 'text-rose-400', realm: 'territory' as RealmId },
    { name: 'RiverMist Stream', x: 50, z: 0, icon: '🌊', color: 'text-sky-400', realm: 'territory' as RealmId },
    { name: 'Neutral Gathering Stone', x: -65, z: -65, icon: '🐾', color: 'text-stone-300', realm: 'territory' as RealmId },
    { name: 'Sacred Moonpool Arch', x: 75, z: 75, icon: '🌙', color: 'text-cyan-300', realm: 'moonpool' as RealmId },
    { name: 'Silverpelt Gateway', x: -75, z: 75, icon: '✨', color: 'text-indigo-300', realm: 'starclan' as RealmId },
    { name: 'Shadow Thorns (Dark Forest)', x: 75, z: -75, icon: '💀', color: 'text-red-500', realm: 'darkforest' as RealmId },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-3xl bg-stone-900 border border-stone-700/70 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-amber-200 tracking-wide">
              TERRITORY TACTICAL MAP • {CLAN_LORE[character.clan]?.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MAP CANVAS VISUALIZER */}
        <div className="relative w-full h-[460px] bg-[#1a2e15] border-y border-stone-800 overflow-hidden flex items-center justify-center">
          {/* Map Grid / River Texture */}
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4d7c0f_1px,transparent_1px)] [background-size:24px_24px]" />

          {/* River Representation */}
          <div className="absolute left-[70%] top-0 bottom-0 w-16 bg-blue-600/40 transform -rotate-6 blur-sm" />

          {/* Camp Clearing Ring */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border-2 border-dashed border-amber-500/40 bg-amber-950/20" />

          {/* Clan Borders Lines */}
          <div className="absolute inset-x-0 top-1/2 border-t border-stone-600/30" />
          <div className="absolute inset-y-0 left-1/2 border-l border-stone-600/30" />

          {/* LANDMARK ICONS */}
          {landmarks.map((lm, idx) => {
            const px = toMapPercentX(lm.x);
            const py = toMapPercentY(lm.z);
            return (
              <div
                key={idx}
                onClick={() => onFastTravel(lm.x, lm.z, lm.realm)}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group flex flex-col items-center z-10"
                style={{ left: `${px}%`, top: `${py}%` }}
              >
                <div className="w-8 h-8 rounded-full bg-stone-900/90 border border-amber-400/60 flex items-center justify-center text-sm shadow-lg group-hover:scale-125 transition">
                  {lm.icon}
                </div>
                <span className="text-[10px] font-bold text-stone-200 bg-stone-950/90 px-1.5 py-0.5 rounded mt-1 opacity-80 group-hover:opacity-100 whitespace-nowrap shadow">
                  {lm.name}
                </span>
              </div>
            );
          })}

          {/* PLAYER MARKER */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 pointer-events-none"
            style={{
              left: `${toMapPercentX(position.x)}%`,
              top: `${toMapPercentY(position.z)}%`,
            }}
          >
            <div
              className="w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-xs shadow-[0_0_12px_#f59e0b]"
              style={{ transform: `rotate(${(-rotation.yaw * 180) / Math.PI}deg)` }}
            >
              ▲
            </div>
            <span className="text-[9px] font-black text-amber-200 bg-stone-950 px-1 py-0.5 rounded shadow mt-0.5">
              YOU
            </span>
          </div>
        </div>

        {/* FOOTER FAST-TRAVEL CONTROLS */}
        <div className="p-3 bg-stone-950 flex items-center justify-between text-xs text-stone-400">
          <span>Click any landmark icon on the map to set waypoint or travel.</span>
          <span className="font-mono text-amber-300">
            Coordinates: X: {Math.round(position.x)}, Z: {Math.round(position.z)}
          </span>
        </div>
      </div>
    </div>
  );
};
