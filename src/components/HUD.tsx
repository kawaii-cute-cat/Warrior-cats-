import React from 'react';
import { PlayerRuntimeState, RealmId } from '../types/game';
import { CLAN_LORE } from '../constants/clans';
import { 
  Compass, 
  Eye, 
  Feather, 
  Heart, 
  Map as MapIcon, 
  Moon, 
  ShieldAlert, 
  Sparkles, 
  Sun, 
  Utensils, 
  Zap, 
  Skull,
  Crosshair,
  Volume2,
  Navigation
} from 'lucide-react';

interface HUDProps {
  playerState: PlayerRuntimeState;
  interactPrompt: { text: string; action: () => void } | null;
  onOpenCharacter: () => void;
  onOpenMap: () => void;
  onOpenStarMap: () => void;
  onOpenEmotes: () => void;
  onOpenMedicineDen: () => void;
  onToggleSneak: () => void;
  onToggleScent: () => void;
  onPounce: () => void;
  onAttack: (type: 'claw_swipe' | 'pounce' | 'bite') => void;
  onEatPrey: () => void;
  onDepositPrey: () => void;
  onOpenSettings: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  playerState,
  interactPrompt,
  onOpenCharacter,
  onOpenMap,
  onOpenStarMap,
  onOpenEmotes,
  onOpenMedicineDen,
  onToggleSneak,
  onToggleScent,
  onPounce,
  onAttack,
  onEatPrey,
  onDepositPrey,
  onOpenSettings,
}) => {
  const { character, health, maxHealth, stamina, maxStamina, injuries, carriedPrey, isSneaking, isScentSenseActive, currentRealm } = playerState;
  const clan = CLAN_LORE[character.clan] || CLAN_LORE.ThunderOak;
  const isLeader = character.role === 'Leader';

  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const staminaPercent = Math.max(0, Math.min(100, (stamina / maxStamina) * 100));

  const realmLabels: Record<RealmId, { name: string; color: string; icon: React.ReactNode }> = {
    territory: { name: 'Living Clan Territory', color: 'text-amber-300', icon: <Sun className="w-4 h-4 text-amber-400" /> },
    moonpool: { name: 'Sacred Moonpool Grotto', color: 'text-sky-300', icon: <Moon className="w-4 h-4 text-sky-400" /> },
    starclan: { name: 'Silverpelt Ancestral Realm', color: 'text-indigo-200', icon: <Sparkles className="w-4 h-4 text-indigo-300" /> },
    darkforest: { name: 'Place of No Stars (Dark Forest)', color: 'text-rose-400', icon: <Skull className="w-4 h-4 text-rose-500" /> },
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-4 font-sans select-none">
      {/* ================= TOP BAR ================= */}
      <div className="flex items-start justify-between">
        {/* PLAYER STATUS CARD */}
        <div 
          onClick={onOpenCharacter}
          className="pointer-events-auto cursor-pointer flex items-center gap-3 bg-stone-900/85 hover:bg-stone-900/95 backdrop-blur-md border border-stone-700/60 hover:border-amber-500/50 p-3 rounded-2xl shadow-2xl max-w-md transition group"
          title="Click to open Character Customization / Editor (P)"
        >
          {/* Avatar circle */}
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner relative border border-white/20 group-hover:scale-105 transition"
            style={{ backgroundColor: character.appearance.primaryColor }}
          >
            <span>{clan.badgeIcon}</span>
            {isLeader && (
              <span className="absolute -top-1 -right-1 text-xs bg-amber-500 text-stone-950 font-black rounded-full px-1.5 py-0.5 shadow">
                9★
              </span>
            )}
          </div>

          {/* Name & Bars */}
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-100 font-bold text-base tracking-wide flex items-center gap-1.5 group-hover:text-amber-300 transition">
                {character.name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-800 text-amber-300 border border-amber-500/30">
                {character.role}
              </span>
            </div>

            {/* Clan label */}
            <p className="text-xs text-stone-400 mb-1.5">{clan.name} • <span className="text-[10px] text-amber-400/80 font-bold">Edit [P]</span></p>

            {/* Health Bar */}
            <div className="w-full bg-stone-950/80 h-3 rounded-full overflow-hidden p-0.5 border border-stone-800 relative mb-1">
              <div
                className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-red-600 via-rose-500 to-emerald-500"
                style={{ width: `${healthPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow">
                HP {Math.round(health)}/{maxHealth}
              </span>
            </div>

            {/* Stamina Bar */}
            <div className="w-full bg-stone-950/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-stone-800 relative">
              <div
                className="h-full rounded-full transition-all duration-150 bg-gradient-to-r from-amber-600 to-yellow-400"
                style={{ width: `${staminaPercent}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow">
                STAMINA {Math.round(stamina)}/{maxStamina}
              </span>
            </div>

            {/* LEADER NINE LIVES GEMS */}
            {isLeader && (
              <div className="flex items-center gap-1 mt-1.5 pt-1 border-t border-stone-800">
                <span className="text-[10px] text-amber-400 font-semibold mr-1">Star Lives:</span>
                {Array.from({ length: 9 }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx < character.leaderLives
                        ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                        : 'bg-stone-800 border border-stone-700'
                    }`}
                    title={`Life ${idx + 1} ${idx < character.leaderLives ? '(Active)' : '(Faded)'}`}
                  />
                ))}
                <span className="text-[10px] text-stone-400 ml-1">{character.leaderLives}/9</span>
              </div>
            )}
          </div>
        </div>

        {/* TOP RIGHT: REALM & QUICK NAV BUTTONS */}
        <div className="pointer-events-auto flex items-center gap-2">
          {/* Realm badge */}
          <div className="flex items-center gap-2 bg-stone-900/85 backdrop-blur-md border border-stone-700/60 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-lg">
            {realmLabels[currentRealm].icon}
            <span className={realmLabels[currentRealm].color}>{realmLabels[currentRealm].name}</span>
          </div>

          <button
            onClick={onOpenCharacter}
            className="flex items-center gap-1.5 bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-500/40 px-3 py-2 rounded-xl text-xs font-bold transition shadow-lg"
            title="Edit Character & WCUE Appearance"
          >
            <span>🐱</span>
            <span>Character (P)</span>
          </button>

          <button
            onClick={onOpenStarMap}
            className="flex items-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40 px-3 py-2 rounded-xl text-xs font-bold transition shadow-lg"
          >
            <Navigation className="w-4 h-4 text-indigo-400" />
            <span>Star Map</span>
          </button>

          <button
            onClick={onOpenMap}
            className="flex items-center gap-1.5 bg-stone-900/85 hover:bg-stone-800 text-amber-200 border border-stone-700/60 px-3 py-2 rounded-xl text-xs font-bold transition shadow-lg"
          >
            <MapIcon className="w-4 h-4 text-amber-400" />
            <span>Map (M)</span>
          </button>

          <button
            onClick={onOpenMedicineDen}
            className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-500/40 px-3 py-2 rounded-xl text-xs font-bold transition shadow-lg"
          >
            <Feather className="w-4 h-4 text-emerald-400" />
            <span>Herbs ({playerState.herbs.reduce((sum, h) => sum + h.quantity, 0)})</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="bg-stone-900/85 hover:bg-stone-800 text-stone-300 border border-stone-700/60 p-2 rounded-xl transition shadow-lg"
            title="Settings"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================= MIDDLE: INTERACTION PROMPT & INJURIES ================= */}
      <div className="flex flex-col items-center justify-center gap-3">
        {/* INTERACTION OVERLAY PROMPT */}
        {interactPrompt && (
          <div 
            onClick={interactPrompt.action}
            className="pointer-events-auto cursor-pointer flex items-center gap-2.5 bg-amber-950/90 text-amber-100 border-2 border-amber-400 px-5 py-2.5 rounded-2xl shadow-2xl animate-bounce text-sm font-bold tracking-wide backdrop-blur-md hover:bg-amber-900 transition"
          >
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>{interactPrompt.text}</span>
          </div>
        )}

        {/* ACTIVE INJURIES LIST */}
        {injuries.length > 0 && (
          <div className="pointer-events-auto flex items-center gap-2 bg-rose-950/85 border border-rose-600/50 px-3 py-1.5 rounded-xl shadow-lg">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span className="text-xs text-rose-200 font-semibold">Injuries:</span>
            {injuries.map((inj) => (
              <span 
                key={inj.id} 
                onClick={onOpenMedicineDen} 
                className="cursor-pointer text-[11px] bg-rose-900/80 hover:bg-rose-800 text-rose-100 px-2 py-0.5 rounded border border-rose-500/40"
                title={`Requires ${inj.curedByHerb} to heal`}
              >
                {inj.name} (Need {inj.curedByHerb})
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ================= BOTTOM BAR: CARRIED PREY & ACTION HOTBAR ================= */}
      <div className="flex items-end justify-between">
        {/* CARRIED PREY DISPLAY */}
        <div>
          {carriedPrey ? (
            <div className="pointer-events-auto flex items-center gap-3 bg-stone-900/90 border border-amber-600/50 p-2.5 rounded-2xl shadow-xl backdrop-blur-md animate-pulse">
              <div className="w-10 h-10 rounded-xl bg-amber-950 flex items-center justify-center text-xl">
                🐭
              </div>
              <div>
                <p className="text-xs font-bold text-amber-200">Carrying: {carriedPrey.name}</p>
                <p className="text-[10px] text-stone-400">Nutr: +{carriedPrey.nutrition} HP | {carriedPrey.weightKg}kg</p>
                <div className="flex gap-1.5 mt-1">
                  <button
                    onClick={onDepositPrey}
                    className="text-[10px] bg-amber-700 hover:bg-amber-600 text-white font-bold px-2 py-0.5 rounded"
                  >
                    Deposit at Camp
                  </button>
                  <button
                    onClick={onEatPrey}
                    className="text-[10px] bg-stone-700 hover:bg-stone-600 text-stone-200 px-2 py-0.5 rounded"
                  >
                    Eat Prey
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-stone-400 bg-stone-950/60 px-3 py-1.5 rounded-xl border border-stone-800">
              Hold <kbd className="px-1 py-0.5 bg-stone-800 rounded text-stone-200 text-[10px]">C</kbd> to Stalk • <kbd className="px-1 py-0.5 bg-stone-800 rounded text-stone-200 text-[10px]">Space</kbd> Pounce
            </div>
          )}
        </div>

        {/* ACTION HOTBAR */}
        <div className="pointer-events-auto flex items-center gap-1.5 bg-stone-900/90 backdrop-blur-md border border-stone-700/60 p-2 rounded-2xl shadow-2xl">
          {/* Stalk / Sneak */}
          <button
            onClick={onToggleSneak}
            className={`flex flex-col items-center justify-center w-13 h-13 rounded-xl transition font-medium ${
              isSneaking ? 'bg-amber-600 text-white border-2 border-amber-300 shadow-lg' : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
            }`}
            title="Toggle Sneak Stalking (C)"
          >
            <Eye className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold">Stalk (C)</span>
          </button>

          {/* Pounce */}
          <button
            onClick={onPounce}
            className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 transition font-medium border border-amber-500/20"
            title="Predatory Pounce (Space)"
          >
            <Crosshair className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold">Pounce</span>
          </button>

          {/* Claw Swipe */}
          <button
            onClick={() => onAttack('claw_swipe')}
            className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-stone-800 hover:bg-stone-700 text-rose-300 transition font-medium border border-rose-500/20"
            title="Claw Swipe Attack (F)"
          >
            <Zap className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold">Swipe (F)</span>
          </button>

          {/* Bite Strike */}
          <button
            onClick={() => onAttack('bite')}
            className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-stone-800 hover:bg-stone-700 text-red-400 transition font-medium border border-red-500/20"
            title="Bite Attack (R)"
          >
            <Skull className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold">Bite (R)</span>
          </button>

          {/* Scent Sense */}
          <button
            onClick={onToggleScent}
            className={`flex flex-col items-center justify-center w-13 h-13 rounded-xl transition font-medium ${
              isScentSenseActive ? 'bg-indigo-600 text-white border-2 border-indigo-300 shadow-lg' : 'bg-stone-800 text-indigo-300 hover:bg-stone-700'
            }`}
            title="Feline Scent Vision (V)"
          >
            <Sparkles className="w-4 h-4 mb-0.5" />
            <span className="text-[9px] font-bold">Scent (V)</span>
          </button>

          {/* Emotes */}
          <button
            onClick={onOpenEmotes}
            className="flex flex-col items-center justify-center w-13 h-13 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition font-medium"
            title="Roleplay Emote Wheel (E)"
          >
            <span className="text-base leading-none mb-0.5">🐾</span>
            <span className="text-[9px] font-bold">Emotes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
