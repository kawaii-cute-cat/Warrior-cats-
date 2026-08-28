import React from 'react';
import { getClanColor } from '../constants/clans';

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

export interface WorldNameplate {
  id: string;
  name: string;
  clan: string;
  role: string;
  isLeader: boolean;
  leaderLives?: number;
  health: number;
  maxHealth: number;
  screenX: number;
  screenY: number;
  distance: number;
  visible: boolean;
}

interface SpeechBubbleOverlayProps {
  bubbles: WorldSpeechBubble[];
  nameplates?: WorldNameplate[];
}

export const SpeechBubbleOverlay: React.FC<SpeechBubbleOverlayProps> = ({ bubbles, nameplates = [] }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden select-none">
      {/* 1. OVERHEAD IDENTITY NAMEPLATES */}
      {nameplates.map((plate) => {
        if (!plate.visible) return null;
        const clanColors = getClanColor(plate.clan);
        const scale = Math.max(0.65, Math.min(1.05, 1 - (plate.distance - 4) * 0.02));
        const opacity = Math.max(0.2, Math.min(1, 1 - (plate.distance - 20) * 0.05));
        const hpPercent = Math.max(0, Math.min(100, (plate.health / plate.maxHealth) * 100));

        return (
          <div
            key={plate.id}
            className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-75 flex flex-col items-center"
            style={{
              left: `${plate.screenX}px`,
              top: `${plate.screenY}px`,
              transform: `translate(-50%, -100%) scale(${scale})`,
              opacity,
              transformOrigin: 'bottom center',
            }}
          >
            {/* NAMEPLATE CONTAINER */}
            <div className="flex flex-col items-center bg-stone-950/80 backdrop-blur-sm border border-stone-800/80 px-2.5 py-1 rounded-xl shadow-lg">
              {/* CAT NAME IN CLAN COLOR */}
              <div className="flex items-center gap-1">
                <span
                  className="text-xs font-black tracking-wide drop-shadow"
                  style={{ color: clanColors.hex }}
                >
                  {plate.name}
                </span>
                {plate.isLeader && (
                  <span className="text-[10px] text-amber-400 font-bold" title="Clan Leader">
                    ★
                  </span>
                )}
              </div>

              {/* CLAN & ROLE SUBTITLE */}
              <div className="flex items-center gap-1.5 text-[9px] text-stone-300 font-medium">
                <span>{plate.clan}</span>
                <span className="text-stone-500">•</span>
                <span className="text-amber-300/90 font-semibold">{plate.role}</span>
              </div>

              {/* LEADER LIVES IF LEADER */}
              {plate.isLeader && (
                <div className="flex items-center gap-1 mt-0.5 pt-0.5 border-t border-stone-800/80">
                  <span className="text-[8px] text-amber-400 font-bold">Lives:</span>
                  <span className="text-[8px] font-black text-amber-300">
                    {plate.leaderLives ?? 9} / 9
                  </span>
                </div>
              )}

              {/* MINI HP BAR IF DAMAGED */}
              {plate.health < plate.maxHealth && (
                <div className="w-14 bg-stone-900 h-1 rounded-full overflow-hidden mt-1 border border-stone-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-emerald-400 transition-all"
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              )}
            </div>

            {/* SMALL POINTER PIN */}
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[4px] border-t-stone-950/80" />
          </div>
        );
      })}

      {/* 2. SPEECH BUBBLES */}
      {bubbles.map((bubble) => {
        if (!bubble.visible) return null;
        const clanColors = getClanColor(bubble.senderClan);

        return (
          <div
            key={bubble.id}
            className="absolute transform -translate-x-1/2 -translate-y-full transition-opacity duration-200 pointer-events-none"
            style={{
              left: `${bubble.screenX}px`,
              top: `${bubble.screenY - 24}px`, // Sits neatly above the nameplate
              transform: `translate(-50%, -100%) scale(${bubble.scale})`,
              opacity: bubble.opacity,
              transformOrigin: 'bottom center',
            }}
          >
            {/* SPEECH BUBBLE CONTAINER */}
            <div
              className={`relative max-w-[260px] sm:max-w-[320px] p-2.5 rounded-2xl shadow-2xl border backdrop-blur-md ${
                bubble.isRp
                  ? 'bg-amber-950/95 border-amber-500/70 text-amber-100 shadow-amber-950/80'
                  : 'bg-stone-900/95 border-stone-600/80 text-stone-100 shadow-stone-950/80'
              }`}
            >
              {/* SENDER TAG */}
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className="text-[10px] font-black uppercase tracking-wider"
                  style={{ color: clanColors.hex }}
                >
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

              {/* DOWNWARD POINTER TAIL TO HEAD */}
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
