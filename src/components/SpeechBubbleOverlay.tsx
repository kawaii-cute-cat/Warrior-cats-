import React from 'react';

export interface WorldSpeechBubble {
  id: string;
  senderId: string;
  senderName: string;
  senderClan: string;
  text: string;
  isRp: boolean;
  screenX: number;
  screenY: number;
  scale: number;
  opacity: number;
  visible: boolean;
}

interface SpeechBubbleOverlayProps {
  bubbles: WorldSpeechBubble[];
}

export const SpeechBubbleOverlay: React.FC<SpeechBubbleOverlayProps> = ({ bubbles }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {bubbles.map((bubble) => {
        if (!bubble.visible) return null;

        return (
          <div
            key={bubble.id}
            className="absolute transform -translate-x-1/2 -translate-y-full transition-opacity duration-300"
            style={{
              left: `${bubble.screenX}px`,
              top: `${bubble.screenY}px`,
              transform: `translate(-50%, -100%) scale(${bubble.scale})`,
              opacity: bubble.opacity,
              transformOrigin: 'bottom center',
            }}
          >
            {/* SPEECH BUBBLE CONTAINER */}
            <div
              className={`relative max-w-[260px] sm:max-w-[300px] p-2.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
                bubble.isRp
                  ? 'bg-amber-950/95 border-amber-500/60 text-amber-200 shadow-amber-900/40'
                  : 'bg-stone-900/95 border-stone-600/80 text-stone-100 shadow-stone-950/60'
              }`}
            >
              {/* SENDER TAG */}
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  {bubble.senderName}
                </span>
                {bubble.senderClan && (
                  <span className="text-[9px] text-stone-400 font-semibold px-1 rounded bg-stone-800/80 border border-stone-700/50">
                    {bubble.senderClan}
                  </span>
                )}
              </div>

              {/* MESSAGE TEXT */}
              <p
                className={`text-xs leading-relaxed break-words font-medium ${
                  bubble.isRp ? 'italic text-amber-200' : 'text-stone-100'
                }`}
              >
                {bubble.text}
              </p>

              {/* DOWNWARD POINTER TAIL TO CAT HEAD */}
              <div
                className={`absolute left-1/2 -bottom-2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] ${
                  bubble.isRp ? 'border-t-amber-950/95' : 'border-t-stone-900/95'
                }`}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
