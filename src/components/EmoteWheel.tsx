import React from 'react';
import { AnimationState } from '../types/game';
import { X, Sparkles } from 'lucide-react';

interface EmoteWheelProps {
  onSelectEmote: (emote: AnimationState) => void;
  onClose: () => void;
}

export const EmoteWheel: React.FC<EmoteWheelProps> = ({ onSelectEmote, onClose }) => {
  const emotes: { id: AnimationState; label: string; icon: string; desc: string }[] = [
    { id: 'sit', label: 'Sit Neatly', icon: '🪑', desc: 'Wrap tail around paws attentively.' },
    { id: 'lay_down', label: 'Lay Down', icon: '🐾', desc: 'Rest comfortably on the moss.' },
    { id: 'sleep', label: 'Curled Sleep', icon: '💤', desc: 'Curl up and purr softly.' },
    { id: 'groom', label: 'Groom Paw', icon: '👅', desc: 'Lick forepaw and wash ears.' },
    { id: 'hiss', label: 'Defensive Hiss', icon: '😾', desc: 'Flatten ears and hiss sharply.' },
    { id: 'snarl', label: 'Fierce Growl', icon: '🦁', desc: 'Bite teeth and snarl at foe.' },
    { id: 'bow', label: 'Respectful Bow', icon: '🙇', desc: 'Dip head in clan respect.' },
    { id: 'pounce_windup', label: 'Butt Wiggle', icon: '🎯', desc: 'Coil rear paws eagerly before pouncing.' },
    { id: 'idle', label: 'Stand Alert', icon: '⚡', desc: 'Return to alert neutral stance.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-4 select-none">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🐾</span>
            <h2 className="text-sm font-bold text-amber-200 uppercase tracking-wide">
              Feline Roleplay Emote Wheel
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2.5 p-4 bg-stone-950/40">
          {emotes.map((em) => (
            <button
              key={em.id}
              onClick={() => {
                onSelectEmote(em.id);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-stone-900 border border-stone-800 hover:border-amber-400 hover:bg-stone-800 text-stone-200 transition group shadow"
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition">{em.icon}</span>
              <span className="text-xs font-bold text-center leading-tight">{em.label}</span>
              <span className="text-[9px] text-stone-400 text-center mt-0.5 line-clamp-1">{em.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
