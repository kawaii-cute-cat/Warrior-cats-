import React, { useState } from 'react';
import { Prophecy } from '../types/game';
import { PROCEDURAL_PROPHECIES } from '../constants/clans';
import { X, Sparkles, Moon, Eye, Feather, PenLine, Scroll, Check } from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface MoonpoolProphecyModalProps {
  onClose: () => void;
  onAscendStarClan: () => void;
}

export const MoonpoolProphecyModal: React.FC<MoonpoolProphecyModalProps> = ({
  onClose,
  onAscendStarClan,
}) => {
  const [prophecyList, setProphecyList] = useState<Prophecy[]>(PROCEDURAL_PROPHECIES);
  const [currentProphecy, setCurrentProphecy] = useState<Prophecy>(
    PROCEDURAL_PROPHECIES[Math.floor(Math.random() * PROCEDURAL_PROPHECIES.length)]
  );
  const [hasDrank, setHasDrank] = useState(false);
  const [isAuthoring, setIsAuthoring] = useState(false);

  // Player custom prophecy input form state
  const [customTitle, setCustomTitle] = useState('');
  const [customAncestor, setCustomAncestor] = useState('Bluestar');
  const [customVerses, setCustomVerses] = useState('');
  const [customMeaning, setCustomMeaning] = useState('');
  const [inscribeSuccess, setInscribeSuccess] = useState(false);

  const handleDrink = () => {
    soundEngine.playStarClanChime();
    setHasDrank(true);
    setIsAuthoring(false);
    // Pick random prophecy from available list
    const rand = prophecyList[Math.floor(Math.random() * prophecyList.length)];
    setCurrentProphecy(rand);
  };

  const handleInscribeProphecy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customVerses.trim()) return;

    const versesArray = customVerses
      .split('\n')
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    const newProphecy: Prophecy = {
      id: `prophecy_custom_${Date.now()}`,
      title: customTitle.trim(),
      ancestorGiver: customAncestor.trim() || 'StarClan Ancestors',
      verses: versesArray.length > 0 ? versesArray : [customVerses.trim()],
      meaning: customMeaning.trim() || 'An omen revealed in the ripples of the Moonpool.',
      receivedAt: new Date().toLocaleDateString(),
    };

    setProphecyList((prev) => [newProphecy, ...prev]);
    setCurrentProphecy(newProphecy);
    setHasDrank(true);
    setIsAuthoring(false);
    setInscribeSuccess(true);
    soundEngine.playStarClanChime();

    // Reset inputs
    setCustomTitle('');
    setCustomVerses('');
    setCustomMeaning('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 backdrop-blur-md p-4 select-none animate-fade-in">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-indigo-950 via-stone-900 to-stone-950 border border-indigo-500/50 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.25)] overflow-hidden flex flex-col p-6 text-stone-100 max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 border border-indigo-400/40 flex items-center justify-center text-2xl shadow-inner">
            🌙
          </div>
          <div>
            <h2 className="text-lg font-black text-indigo-200 tracking-wide font-serif">
              THE SACRED MOONPOOL COMMUNION
            </h2>
            <p className="text-xs text-indigo-300/80">
              Where the stars of Silverpelt touch the sacred mountain pool.
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-2 mb-4 p-1 bg-stone-900/80 rounded-xl border border-indigo-500/30">
          <button
            onClick={() => setIsAuthoring(false)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              !isAuthoring ? 'bg-indigo-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>StarClan Visions</span>
          </button>
          <button
            onClick={() => setIsAuthoring(true)}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              isAuthoring ? 'bg-indigo-600 text-white shadow' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Inscribe Prophecy</span>
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="flex-1 overflow-y-auto pr-1">
          {isAuthoring ? (
            /* PLAYER-CONTROLLED PROPHECY AUTHORING FORM */
            <form onSubmit={handleInscribeProphecy} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  Prophecy Title / Omen
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Fire Alone Can Save Our Clan"
                  className="w-full bg-stone-900/90 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  StarClan Ancestor / Spirit Giver
                </label>
                <input
                  type="text"
                  value={customAncestor}
                  onChange={(e) => setCustomAncestor(e.target.value)}
                  placeholder="e.g. Bluestar, Spottedleaf, Yellowfang, Tallstar"
                  className="w-full bg-stone-900/90 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-400"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  Prophecy Verses (One verse per line)
                </label>
                <textarea
                  value={customVerses}
                  onChange={(e) => setCustomVerses(e.target.value)}
                  placeholder="e.g.&#10;Darkness, air, water, and sky will come together...&#10;and shake the forest to its roots."
                  rows={3}
                  className="w-full bg-stone-900/90 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-400 resize-none font-serif italic"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                  Prophecy Meaning / Omen Lore
                </label>
                <input
                  type="text"
                  value={customMeaning}
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  placeholder="e.g. A warning of impending Great Journey or Clan unity."
                  className="w-full bg-stone-900/90 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-stone-950 font-black py-2.5 px-4 rounded-xl text-xs uppercase tracking-wider shadow-lg transition active:scale-95 flex items-center justify-center gap-2"
                >
                  <Scroll className="w-4 h-4" />
                  <span>Seal & Inscribe Vision into Moonpool</span>
                </button>
              </div>
            </form>
          ) : !hasDrank ? (
            /* INITIAL COMMUNION PROMPT */
            <div className="space-y-4 text-center py-6">
              <p className="text-sm text-stone-300 leading-relaxed max-w-md mx-auto">
                You gaze into the crystalline pool. The reflection of Silverpelt glimmers beneath your paws. Touch your nose to the water to sleep and receive visions from your StarClan ancestors.
              </p>

              <button
                onClick={handleDrink}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-stone-950 font-black px-6 py-3 rounded-2xl text-sm uppercase tracking-wider shadow-2xl transition active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>Touch Nose to Moonpool Water</span>
              </button>
            </div>
          ) : (
            /* ACTIVE VISION DISPLAY */
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-indigo-900/40 border border-indigo-400/30 text-center space-y-3">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-widest block">
                  Vision from {currentProphecy.ancestorGiver}
                </span>
                <h3 className="text-base font-black text-white font-serif">{currentProphecy.title}</h3>
                <div className="italic text-indigo-100 text-sm space-y-1.5 font-serif py-2">
                  {currentProphecy.verses.map((v, i) => (
                    <p key={i}>"{v}"</p>
                  ))}
                </div>
                <p className="text-xs text-indigo-200/90 pt-2 border-t border-indigo-500/20">
                  <strong>Prophecy Meaning:</strong> {currentProphecy.meaning}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleDrink}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Another Vision</span>
                </button>
                <button
                  onClick={() => {
                    onAscendStarClan();
                    onClose();
                  }}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow"
                >
                  Ascend into Silverpelt Realm
                </button>
                <button
                  onClick={onClose}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold py-2.5 px-4 rounded-xl text-xs transition"
                >
                  Awaken
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
