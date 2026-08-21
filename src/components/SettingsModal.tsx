import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { X, Volume2, Monitor, Eye, Keyboard } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [masterVol, setMasterVol] = useState(80);
  const [sfxVol, setSfxVol] = useState(80);
  const [ambientVol, setAmbientVol] = useState(30);

  const handleMasterChange = (val: number) => {
    setMasterVol(val);
    soundEngine.setVolumes(val / 100, sfxVol / 100, ambientVol / 100);
  };

  const handleSfxChange = (val: number) => {
    setSfxVol(val);
    soundEngine.setVolumes(masterVol / 100, val / 100, ambientVol / 100);
  };

  const handleAmbientChange = (val: number) => {
    setAmbientVol(val);
    soundEngine.setVolumes(masterVol / 100, sfxVol / 100, val / 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6 text-stone-100">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-amber-200">GAME & AUDIO SETTINGS</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* AUDIO CONTROLS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-stone-300 uppercase">Sound & Volume</h3>
            <div>
              <div className="flex justify-between text-xs text-stone-400 mb-1">
                <span>Master Volume</span>
                <span className="font-mono">{masterVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVol}
                onChange={(e) => handleMasterChange(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-stone-400 mb-1">
                <span>Feline SFX & Footsteps</span>
                <span className="font-mono">{sfxVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={sfxVol}
                onChange={(e) => handleSfxChange(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-stone-400 mb-1">
                <span>Atmospheric Forest Ambiance</span>
                <span className="font-mono">{ambientVol}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={ambientVol}
                onChange={(e) => handleAmbientChange(parseInt(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* KEYBIND GUIDE */}
          <div className="pt-2 border-t border-stone-800 space-y-2">
            <h3 className="text-xs font-bold text-stone-300 uppercase flex items-center gap-1.5">
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span>Keyboard & Touch Controls</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-300 bg-stone-950/60 p-3 rounded-2xl border border-stone-800">
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">W A S D</kbd> Move Cat</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">Shift</kbd> Sprint</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">C</kbd> Stalk / Sneak</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">Space</kbd> Pounce</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">F</kbd> Claw Swipe</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">R</kbd> Bite Attack</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">V</kbd> Scent Sense</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">E</kbd> Emotes / Interact</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">M</kbd> Territory Map</div>
              <div><kbd className="px-1 py-0.5 bg-stone-800 rounded font-mono">Drag Mouse</kbd> Orbit Camera</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider transition"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
};
