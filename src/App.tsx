/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { 
  AnimationState, 
  ChatMessage, 
  ClanId, 
  HerbType, 
  PlayerCharacter, 
  PlayerRuntimeState, 
  RealmId 
} from './types/game';
import { GameEngine3D } from './game/GameEngine3D';
import { CharacterCreator } from './components/CharacterCreator';
import { HUD } from './components/HUD';
import { ChatBox } from './components/ChatBox';
import { WorldMapModal } from './components/WorldMapModal';
import { StarMapNavigationModal } from './components/StarMapNavigationModal';
import { EmoteWheel } from './components/EmoteWheel';
import { MedicineDenModal } from './components/MedicineDenModal';
import { MoonpoolProphecyModal } from './components/MoonpoolProphecyModal';
import { DarkForestTrialModal } from './components/DarkForestTrialModal';
import { ClanChangeModal } from './components/ClanChangeModal';
import { DeathRealmModal } from './components/DeathRealmModal';
import { SettingsModal } from './components/SettingsModal';
import { SpeechBubbleOverlay, WorldSpeechBubble, WorldNameplate } from './components/SpeechBubbleOverlay';
import { soundEngine } from './audio/SoundEngine';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine3D | null>(null);

  // Core App Flow State
  const [character, setCharacter] = useState<PlayerCharacter | null>(null);
  const [playerState, setPlayerState] = useState<PlayerRuntimeState | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [speechBubbles, setSpeechBubbles] = useState<WorldSpeechBubble[]>([]);
  const [nameplates, setNameplates] = useState<WorldNameplate[]>([]);
  const [activeWaypoint, setActiveWaypoint] = useState<{ name: string; x: number; z: number } | null>(null);
  const [interactPrompt, setInteractPrompt] = useState<{ text: string; action: () => void } | null>(null);

  // Modal Open States
  const [isCharacterEditorOpen, setIsCharacterEditorOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isStarMapOpen, setIsStarMapOpen] = useState(false);
  const [isEmoteWheelOpen, setIsEmoteWheelOpen] = useState(false);
  const [isMedicineDenOpen, setIsMedicineDenOpen] = useState(false);
  const [isMoonpoolOpen, setIsMoonpoolOpen] = useState(false);
  const [isDarkForestTrialOpen, setIsDarkForestTrialOpen] = useState(false);
  const [isClanChangeOpen, setIsClanChangeOpen] = useState(false);
  const [isDeathModalOpen, setIsDeathModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mount 3D Game Engine once character is chosen
  useEffect(() => {
    if (!character || !canvasContainerRef.current) return;

    // Initialize 3D Engine
    const engine = new GameEngine3D(
      canvasContainerRef.current,
      character,
      {
        onStateChange: (updatedState) => {
          setPlayerState({ ...updatedState });
        },
        onInteractPrompt: (prompt) => {
          setInteractPrompt(prompt);
        },
        onChatMessage: (msg) => {
          setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev.slice(-100), msg]));
        },
        onSpeechBubblesUpdate: (bubbles) => {
          setSpeechBubbles(bubbles);
        },
        onNameplatesUpdate: (plates) => {
          setNameplates(plates);
        },
        onWaypointUpdate: (wp) => {
          if (wp) {
            setActiveWaypoint({ name: wp.name, x: wp.x, z: wp.z });
          } else {
            setActiveWaypoint(null);
          }
        },
        onProphecyVisionRequested: () => {
          setIsMoonpoolOpen(true);
        },
        onDarkForestTrialRequested: () => {
          setIsDarkForestTrialOpen(true);
        },
        onClanChangeRequested: () => {
          setIsClanChangeOpen(true);
        },
        onMedicineDenOpened: () => {
          setIsMedicineDenOpen(true);
        },
        onLeaderLifeLost: (remaining, msg) => {
          setChatMessages((prev) => [
            ...prev,
            {
              id: `sys_life_${Date.now()}`,
              senderId: 'system',
              senderName: 'StarClan Ancestors',
              senderClan: character.clan,
              senderRole: 'Leader',
              text: `★ ${msg} [${remaining}/9 lives remain]`,
              channel: 'system',
              timestamp: Date.now(),
            },
          ]);
        },
        onPlayerDied: () => {
          setIsDeathModalOpen(true);
        },
      }
    );

    engineRef.current = engine;

    // Add introductory system welcome chat
    setChatMessages([
      {
        id: 'sys_1',
        senderId: 'system',
        senderName: 'Ancestral StarClan',
        senderClan: character.clan,
        senderRole: 'Leader',
        text: `May StarClan light your path, ${character.name}. Welcome to the forest territories.`,
        channel: 'system',
        timestamp: Date.now(),
      },
      {
        id: 'sys_2',
        senderId: 'system',
        senderName: 'Forest Guide',
        senderClan: character.clan,
        senderRole: 'Warrior',
        text: 'Controls: WASD to run, Shift sprint, C stalk, Space pounce, V scent sense, M living tactical map, P character editor.',
        channel: 'system',
        timestamp: Date.now() + 100,
      }
    ]);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [character]);

  // Global Keyboard Shortcuts for UI and Modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if typing inside an input/textarea
      const activeEl = document.activeElement;
      if (activeEl && (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl.tagName) || activeEl.getAttribute('contenteditable') === 'true')) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        setIsMapOpen((prev) => !prev);
      } else if (e.key === 'p' || e.key === 'P') {
        setIsCharacterEditorOpen((prev) => !prev);
      } else if (e.key === 'e' || e.key === 'E') {
        if (interactPrompt) {
          interactPrompt.action();
        } else {
          setIsEmoteWheelOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape') {
        setIsCharacterEditorOpen(false);
        setIsMapOpen(false);
        setIsStarMapOpen(false);
        setIsEmoteWheelOpen(false);
        setIsMedicineDenOpen(false);
        setIsMoonpoolOpen(false);
        setIsDarkForestTrialOpen(false);
        setIsClanChangeOpen(false);
        setIsSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [interactPrompt]);

  // Watch for Player Death to show Death/Resurrection Modal
  useEffect(() => {
    if (playerState && playerState.health <= 0 && !isDeathModalOpen) {
      setIsDeathModalOpen(true);
    }
  }, [playerState?.health]);

  // Handler for Character Customizer completion
  const handleCharacterComplete = (newChar: PlayerCharacter) => {
    setCharacter(newChar);
  };

  // Handlers for Engine Controls
  const handleToggleSneak = () => engineRef.current?.toggleSneak();
  const handleToggleScent = () => engineRef.current?.toggleScentSense();
  const handlePounce = () => engineRef.current?.pounce();
  const handleAttack = (type: 'claw_swipe' | 'pounce' | 'bite') => engineRef.current?.attack(type);
  const handleEatPrey = () => engineRef.current?.eatCarriedPrey();
  const handleDepositPrey = () => engineRef.current?.depositPrey();
  const handleSelectEmote = (emote: AnimationState) => engineRef.current?.playEmote(emote);
  const handleTreatHerb = (herb: HerbType) => engineRef.current?.applyHerb(herb);

  const handleFastTravel = (x: number, z: number, realm?: RealmId) => {
    if (realm && realm !== playerState?.currentRealm) {
      engineRef.current?.switchRealm(realm);
    }
    engineRef.current?.teleport(x, z);
    setIsMapOpen(false);
  };

  const handleSwitchRealm = (realm: RealmId) => {
    engineRef.current?.switchRealm(realm);
    setIsStarMapOpen(false);
  };

  const handleConfirmClanChange = (newClan: ClanId) => {
    if (!character) return;
    const updated = { ...character, clan: newClan };
    setCharacter(updated);
    engineRef.current?.teleport(0, 0); // Return to central camp
  };

  const handleResurrectAtCamp = () => {
    engineRef.current?.resurrect();
    setIsDeathModalOpen(false);
  };

  const handleSelectPostDeathRealm = (realm: RealmId) => {
    engineRef.current?.switchRealm(realm);
    engineRef.current?.resurrect();
    setIsDeathModalOpen(false);
  };

  // If no character is selected, show Character Creator
  if (!character) {
    return <CharacterCreator onComplete={handleCharacterComplete} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-950 select-none">
      {/* 3D WEBGL CANVAS VIEWPORT */}
      <div ref={canvasContainerRef} className="absolute inset-0 w-full h-full cursor-crosshair" />

      {/* WORLD-SPACE 3D SPEECH BUBBLE & NAMEPLATE BILLBOARDS */}
      <SpeechBubbleOverlay bubbles={speechBubbles} nameplates={nameplates} />

      {/* IN-GAME HEADS-UP DISPLAY (HUD) */}
      {playerState && (
        <HUD
          playerState={playerState}
          interactPrompt={interactPrompt}
          onOpenCharacter={() => setIsCharacterEditorOpen(true)}
          onOpenMap={() => setIsMapOpen(true)}
          onOpenStarMap={() => setIsStarMapOpen(true)}
          onOpenEmotes={() => setIsEmoteWheelOpen(true)}
          onOpenMedicineDen={() => setIsMedicineDenOpen(true)}
          onToggleSneak={handleToggleSneak}
          onToggleScent={handleToggleScent}
          onPounce={handlePounce}
          onAttack={handleAttack}
          onEatPrey={handleEatPrey}
          onDepositPrey={handleDepositPrey}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* MULTIPLAYER CHAT BOX (400-Character Limit & Selective Profanity Filtering) */}
      <ChatBox
        myPlayerId={character.id}
        myName={character.name}
        myClan={character.clan}
        myRole={character.role}
        messages={chatMessages}
        onSendMessage={(msg) => {
          setChatMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev.slice(-100), msg]));
          engineRef.current?.broadcastChat(msg);
        }}
      />

      {/* ================= MODALS & POPUPS ================= */}

      {/* IN-GAME FULL CHARACTER CUSTOMIZATION & BIO SUITE */}
      {isCharacterEditorOpen && character && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md">
          <CharacterCreator
            initialCharacter={character}
            onComplete={(updated) => {
              setCharacter(updated);
              engineRef.current?.updateCharacter(updated);
              setIsCharacterEditorOpen(false);
            }}
            onCancel={() => setIsCharacterEditorOpen(false)}
          />
        </div>
      )}

      {/* LIVING WORLD TACTICAL MAP */}
      {isMapOpen && playerState && (
        <WorldMapModal
          playerState={playerState}
          activeWaypoint={activeWaypoint}
          onClose={() => setIsMapOpen(false)}
          onSetWaypoint={(wp) => {
            setActiveWaypoint(wp);
            engineRef.current?.setWaypoint(wp);
          }}
          onFastTravel={handleFastTravel}
        />
      )}

      {/* STAR MAP & PROPHECY LORE NAVIGATION */}
      {isStarMapOpen && playerState && (
        <StarMapNavigationModal
          playerState={playerState}
          onClose={() => setIsStarMapOpen(false)}
          onSwitchRealm={handleSwitchRealm}
        />
      )}

      {/* ROLEPLAY EMOTE WHEEL */}
      {isEmoteWheelOpen && (
        <EmoteWheel
          onSelectEmote={handleSelectEmote}
          onClose={() => setIsEmoteWheelOpen(false)}
        />
      )}

      {/* MEDICINE DEN HERB POUCH & HEALING */}
      {isMedicineDenOpen && playerState && (
        <MedicineDenModal
          playerState={playerState}
          onClose={() => setIsMedicineDenOpen(false)}
          onTreat={handleTreatHerb}
        />
      )}

      {/* SACRED MOONPOOL PROPHECY VISION */}
      {isMoonpoolOpen && (
        <MoonpoolProphecyModal
          onClose={() => setIsMoonpoolOpen(false)}
          onAscendStarClan={() => handleSwitchRealm('starclan')}
        />
      )}

      {/* DARK FOREST SHADOW SPARRING TRIAL */}
      {isDarkForestTrialOpen && (
        <DarkForestTrialModal
          onClose={() => setIsDarkForestTrialOpen(false)}
          onRewardAura={() => {
            if (character) {
              const updated = {
                ...character,
                appearance: { ...character.appearance, aura: 'darkforest_smoke' as const },
              };
              setCharacter(updated);
              engineRef.current?.updateCharacter(updated);
            }
          }}
        />
      )}

      {/* NEUTRAL GATHERING CLAN ALLEGIANCE */}
      {isClanChangeOpen && (
        <ClanChangeModal
          currentClan={character.clan}
          onClose={() => setIsClanChangeOpen(false)}
          onConfirmClanChange={handleConfirmClanChange}
        />
      )}

      {/* DEATH & SPIRIT RESURRECTION MODAL */}
      {isDeathModalOpen && (
        <DeathRealmModal
          character={character}
          onSelectPostDeathRealm={handleSelectPostDeathRealm}
          onResurrectAtCamp={handleResurrectAtCamp}
        />
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}

