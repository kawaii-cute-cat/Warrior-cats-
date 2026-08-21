import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AccessoryType, AuraType, BodyType, CatAppearance, ClanId, ClanRole, EyeState, FurStyle, MarkingType, PlayerCharacter, ScarType } from '../types/game';
import { CAT_NAME_PREFIXES, CAT_NAME_SUFFIXES, CLAN_LORE, COLOR_PALETTE, DEFAULT_APPEARANCE } from '../constants/clans';
import { CatMeshBuilder, CatRigNodes } from '../game/CatMeshBuilder';
import { CatAnimationController } from '../game/CatAnimationController';
import { 
  Sparkles, 
  RotateCw, 
  Shuffle, 
  Check, 
  Flame, 
  Eye, 
  Feather, 
  Shield, 
  Heart,
  Palette,
  Layers,
  Sparkle
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface CharacterCreatorProps {
  onComplete: (character: PlayerCharacter) => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onComplete }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Character State
  const [namePrefix, setNamePrefix] = useState('Bramble');
  const [nameSuffix, setNameSuffix] = useState('claw');
  const [selectedClan, setSelectedClan] = useState<ClanId>('ThunderOak');
  const [selectedRole, setSelectedRole] = useState<ClanRole>('Warrior');
  const [appearance, setAppearance] = useState<CatAppearance>({ ...DEFAULT_APPEARANCE });
  const [activeTab, setActiveTab] = useState<'clan' | 'body' | 'fur' | 'colors' | 'face' | 'accessories' | 'auras'>('clan');

  // 3D Preview Engine
  const previewRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    group: THREE.Group | null;
    rig: CatRigNodes | null;
    animator: CatAnimationController | null;
    clock: THREE.Clock;
    animId: number | null;
    isDragging: boolean;
    prevX: number;
    rotationY: number;
  }>({
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(45, 1, 0.1, 100),
    renderer: null as any,
    group: null,
    rig: null,
    animator: null,
    clock: new THREE.Clock(),
    animId: null,
    isDragging: false,
    prevX: 0,
    rotationY: 0.3,
  });

  // Setup 3D Canvas Preview
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 50);
    camera.position.set(0, 0.6, 2.8);
    camera.lookAt(0, 0.2, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Soft Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x18181b, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.6);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // Floor Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 0.1, 32),
      new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8, metalness: 0.2 })
    );
    pedestal.position.y = -0.05;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    previewRef.current = {
      scene,
      camera,
      renderer,
      group: null,
      rig: null,
      animator: null,
      clock: new THREE.Clock(),
      animId: null,
      isDragging: false,
      prevX: 0,
      rotationY: 0.3,
    };

    // Render loop
    const animate = () => {
      const p = previewRef.current;
      p.animId = requestAnimationFrame(animate);
      const delta = p.clock.getDelta();

      if (p.animator) {
        p.animator.update(delta);
      }

      if (p.group && !p.isDragging) {
        p.rotationY += delta * 0.15; // Slow gentle display turntable
        p.group.rotation.y = p.rotationY;
      }

      p.renderer.render(p.scene, p.camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !renderer) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (previewRef.current.animId) cancelAnimationFrame(previewRef.current.animId);
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Cat 3D Mesh when appearance state changes
  useEffect(() => {
    const p = previewRef.current;
    if (!p.scene) return;

    if (p.group) {
      p.scene.remove(p.group);
    }

    const { group, rig } = CatMeshBuilder.buildCat(appearance);
    group.rotation.y = p.rotationY;
    p.scene.add(group);

    p.group = group;
    p.rig = rig;
    p.animator = new CatAnimationController(rig);
    p.animator.setState('idle');
  }, [appearance]);

  // Mouse drag turntable
  const handleMouseDown = (e: React.MouseEvent) => {
    previewRef.current.isDragging = true;
    previewRef.current.prevX = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const p = previewRef.current;
    if (!p.isDragging || !p.group) return;
    const dx = e.clientX - p.prevX;
    p.prevX = e.clientX;
    p.rotationY += dx * 0.01;
    p.group.rotation.y = p.rotationY;
  };

  const handleMouseUp = () => {
    previewRef.current.isDragging = false;
  };

  const handleRandomize = () => {
    const randomPrefix = CAT_NAME_PREFIXES[Math.floor(Math.random() * CAT_NAME_PREFIXES.length)];
    const randomSuffix = CAT_NAME_SUFFIXES[Math.floor(Math.random() * CAT_NAME_SUFFIXES.length)];
    setNamePrefix(randomPrefix);
    setNameSuffix(randomSuffix);

    const furColors = COLOR_PALETTE.fur;
    const eyeColors = COLOR_PALETTE.eyes;
    const markings: MarkingType[] = [
      'solid', 'classic_tabby', 'mackerel_tabby', 'spotted', 'colorpoint', 'calico', 'tortoiseshell', 'bicolor'
    ];
    const bodyTypes: BodyType[] = ['kit', 'apprentice', 'adult', 'large_warrior', 'slim_hunter'];
    const furStyles: FurStyle[] = ['short_smooth', 'medium_soft', 'long_flowing', 'fluffy', 'thick_winter'];
    const accessories: AccessoryType[] = ['none', 'oak_leaves', 'blue_feather', 'violet_flower', 'poppy_flower', 'leather_collar'];

    const prim = furColors[Math.floor(Math.random() * furColors.length)].hex;
    const sec = furColors[Math.floor(Math.random() * furColors.length)].hex;
    const eye = eyeColors[Math.floor(Math.random() * eyeColors.length)].hex;

    setAppearance({
      bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
      furStyle: furStyles[Math.floor(Math.random() * furStyles.length)],
      primaryColor: prim,
      secondaryColor: sec,
      underbellyColor: '#fffbeb',
      markingType: markings[Math.floor(Math.random() * markings.length)],
      eyeColorLeft: eye,
      eyeColorRight: eye,
      isHeterochromia: Math.random() < 0.15,
      eyeState: Math.random() < 0.1 ? 'star_shine' : 'normal',
      muzzleLength: 0.9 + Math.random() * 0.3,
      earSize: 0.9 + Math.random() * 0.3,
      earTufts: Math.random() < 0.3,
      tailLength: 0.8 + Math.random() * 0.4,
      tailThickness: 0.8 + Math.random() * 0.4,
      legLength: 0.9 + Math.random() * 0.2,
      pawSize: 0.9 + Math.random() * 0.3,
      bodyScale: 1.0,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      scar: 'none',
      aura: 'none',
    });

    soundEngine.playMeow();
  };

  const handleStartGame = () => {
    soundEngine.playPurr();
    const fullName = `${namePrefix}${nameSuffix.toLowerCase()}`;
    const newChar: PlayerCharacter = {
      id: `player_${Date.now()}`,
      name: fullName,
      prefix: namePrefix,
      suffix: nameSuffix,
      clan: selectedClan,
      role: selectedRole,
      appearance,
      reputation: 50,
      leaderLives: selectedRole === 'Leader' ? 9 : 1,
      maxLeaderLives: selectedRole === 'Leader' ? 9 : 1,
      deathHistory: [],
      createdAt: new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
    };

    onComplete(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col lg:flex-row bg-stone-950 text-stone-100 font-sans select-none overflow-hidden">
      {/* LEFT: 3D INTERACTIVE PREVIEW */}
      <div 
        className="relative flex-1 h-[45vh] lg:h-full flex flex-col bg-gradient-to-b from-stone-900 to-stone-950 border-b lg:border-b-0 lg:border-r border-stone-800"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-stone-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-stone-700/60 shadow-lg">
          <span className="text-lg">{CLAN_LORE[selectedClan].badgeIcon}</span>
          <span className="text-xs font-bold text-amber-300">
            {namePrefix}{nameSuffix.toLowerCase()} • {selectedRole}
          </span>
        </div>

        {/* 3D Canvas Mount Point */}
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Bottom Preview Controls */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
          <div className="text-[11px] text-stone-400 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5 pointer-events-auto">
            <RotateCw className="w-3.5 h-3.5 text-stone-400 animate-spin" />
            <span>Click and drag to rotate cat</span>
          </div>

          <button
            onClick={handleRandomize}
            className="pointer-events-auto flex items-center gap-2 bg-stone-800 hover:bg-stone-700 text-amber-300 border border-amber-500/30 px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg"
          >
            <Shuffle className="w-4 h-4" />
            <span>Randomize</span>
          </button>
        </div>
      </div>

      {/* RIGHT: DEEP CUSTOMIZATION WORKBENCH */}
      <div className="w-full lg:w-[480px] h-[55vh] lg:h-full flex flex-col bg-stone-900 border-stone-800 overflow-hidden">
        {/* HEADER */}
        <div className="p-4 border-b border-stone-800 bg-stone-950/60">
          <h1 className="text-xl font-black text-amber-400 tracking-wider flex items-center gap-2">
            <span>🐾</span> WILDCLANS CHARACTER FORGE
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            Craft your warrior cat's lineage, pelt markings, and celestial destiny.
          </p>

          {/* NAME INPUT GENERATOR */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Prefix</label>
              <select
                value={namePrefix}
                onChange={(e) => setNamePrefix(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-amber-400"
              >
                {CAT_NAME_PREFIXES.map((pre) => (
                  <option key={pre} value={pre}>{pre}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Suffix</label>
              <select
                value={nameSuffix}
                onChange={(e) => setNameSuffix(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-100 font-bold focus:outline-none focus:border-amber-400"
              >
                {CAT_NAME_SUFFIXES.map((suf) => (
                  <option key={suf} value={suf}>{suf}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* WORKBENCH TABS */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 overflow-x-auto scrollbar-none px-2 pt-2 gap-1">
          {[
            { id: 'clan', label: 'Clan & Role', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'body', label: 'Body', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'fur', label: 'Fur & Markings', icon: <Palette className="w-3.5 h-3.5" /> },
            { id: 'face', label: 'Eyes & Face', icon: <Eye className="w-3.5 h-3.5" /> },
            { id: 'accessories', label: 'Decorations', icon: <Feather className="w-3.5 h-3.5" /> },
            { id: 'auras', label: 'Celestial Auras', icon: <Sparkles className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENTS (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* TAB 1: CLAN & ROLE */}
          {activeTab === 'clan' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Choose Your Clan</label>
                <div className="grid grid-cols-1 gap-2">
                  {(Object.keys(CLAN_LORE) as ClanId[]).map((clanKey) => {
                    const c = CLAN_LORE[clanKey];
                    const isSel = selectedClan === clanKey;
                    return (
                      <div
                        key={clanKey}
                        onClick={() => setSelectedClan(clanKey)}
                        className={`cursor-pointer p-3 rounded-xl border transition ${
                          isSel
                            ? 'bg-stone-800/90 border-amber-400 ring-1 ring-amber-400 shadow-lg'
                            : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-100 text-sm flex items-center gap-2">
                            <span>{c.badgeIcon}</span> {c.name}
                          </span>
                          {isSel && <Check className="w-4 h-4 text-amber-400" />}
                        </div>
                        <p className="text-[11px] text-amber-200/80 italic mt-1">{c.motto}</p>
                        <p className="text-[11px] text-stone-400 mt-1">{c.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Select Rank / Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Kit', 'Apprentice', 'Warrior', 'Medicine Cat', 'Deputy', 'Leader'] as ClanRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => {
                        setSelectedRole(role);
                        if (role === 'Kit') setAppearance({ ...appearance, bodyType: 'kit' });
                        if (role === 'Apprentice') setAppearance({ ...appearance, bodyType: 'apprentice' });
                        if (role === 'Leader') setAppearance({ ...appearance, bodyType: 'large_warrior' });
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        selectedRole === role
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {role}
                      {role === 'Leader' && <span className="block text-[9px] text-amber-400 font-normal">9 Star Lives</span>}
                      {role === 'Medicine Cat' && <span className="block text-[9px] text-emerald-400 font-normal">Herbal Healing</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BODY PROPORTIONS */}
          {activeTab === 'body' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Body Build & Age</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'kit', name: 'Kit' },
                    { id: 'apprentice', name: 'Apprentice' },
                    { id: 'adult', name: 'Adult' },
                    { id: 'large_warrior', name: 'Large Warrior' },
                    { id: 'slim_hunter', name: 'Slim Hunter' },
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setAppearance({ ...appearance, bodyType: b.id as any })}
                      className={`p-2 rounded-xl border text-xs font-bold text-center transition ${
                        appearance.bodyType === b.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Muzzle Length ({appearance.muzzleLength.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={appearance.muzzleLength}
                  onChange={(e) => setAppearance({ ...appearance, muzzleLength: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Ear Size ({appearance.earSize.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min="0.7"
                  max="1.4"
                  step="0.05"
                  value={appearance.earSize}
                  onChange={(e) => setAppearance({ ...appearance, earSize: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-1">
                  Tail Length ({appearance.tailLength.toFixed(2)}x)
                </label>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={appearance.tailLength}
                  onChange={(e) => setAppearance({ ...appearance, tailLength: parseFloat(e.target.value) })}
                  className="w-full accent-amber-400"
                />
              </div>
            </div>
          )}

          {/* TAB 3: FUR & MARKINGS */}
          {activeTab === 'fur' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Fur Pattern / Markings</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'solid', name: 'Solid Pure' },
                    { id: 'classic_tabby', name: 'Classic Tabby Swirls' },
                    { id: 'mackerel_tabby', name: 'Mackerel Tiger Stripes' },
                    { id: 'spotted', name: 'Spotted Leopard' },
                    { id: 'colorpoint', name: 'Colorpoint Mask & Paws' },
                    { id: 'calico', name: 'Tri-Color Calico' },
                    { id: 'tortoiseshell', name: 'Tortoiseshell Mottled' },
                    { id: 'bicolor', name: 'Bicolor Tuxedo / Blaze' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setAppearance({ ...appearance, markingType: m.id as any })}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.markingType === m.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Primary Coat Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.fur.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAppearance({ ...appearance, primaryColor: c.hex })}
                      className={`w-7 h-7 rounded-lg border-2 transition ${
                        appearance.primaryColor === c.hex ? 'border-amber-400 scale-110 shadow-md' : 'border-stone-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Secondary Stripe / Patch Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.fur.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAppearance({ ...appearance, secondaryColor: c.hex })}
                      className={`w-7 h-7 rounded-lg border-2 transition ${
                        appearance.secondaryColor === c.hex ? 'border-amber-400 scale-110 shadow-md' : 'border-stone-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EYES & FACE */}
          {activeTab === 'face' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Eye Color Palette</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PALETTE.eyes.map((c) => (
                    <button
                      key={c.name}
                      onClick={() =>
                        setAppearance({
                          ...appearance,
                          eyeColorLeft: c.hex,
                          eyeColorRight: appearance.isHeterochromia ? appearance.eyeColorRight : c.hex,
                        })
                      }
                      className={`w-7 h-7 rounded-lg border-2 transition ${
                        appearance.eyeColorLeft === c.hex ? 'border-amber-400 scale-110 shadow-md' : 'border-stone-700'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Special Eye State / Vision</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'normal', name: 'Keen Sight (Normal)' },
                    { id: 'blind_left', name: 'Blind Left Eye' },
                    { id: 'blind_right', name: 'Blind Right Eye' },
                    { id: 'blind_both', name: 'Blind in Both Eyes' },
                    { id: 'star_shine', name: 'StarClan Shimmer' },
                    { id: 'amber_glow', name: 'Predator Amber Glow' },
                  ].map((es) => (
                    <button
                      key={es.id}
                      onClick={() => setAppearance({ ...appearance, eyeState: es.id as any })}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.eyeState === es.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300'
                      }`}
                    >
                      {es.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACCESSORIES & SCARS */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Natural Forest Decorations</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'No Accessory' },
                    { id: 'oak_leaves', name: 'Oak Leaf Sprig' },
                    { id: 'blue_feather', name: 'Blue Jay Feather' },
                    { id: 'cardinal_feather', name: 'Cardinal Feather' },
                    { id: 'violet_flower', name: 'Violet Flower' },
                    { id: 'poppy_flower', name: 'Red Poppy Bloom' },
                    { id: 'leather_collar', name: 'Former Kittypet Collar' },
                    { id: 'bell_collar', name: 'Golden Bell Collar' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setAppearance({ ...appearance, accessory: acc.id as any })}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.accessory === acc.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Battle Scars</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'Pristine Pelt' },
                    { id: 'torn_left_ear', name: 'Torn Left Ear' },
                    { id: 'torn_right_ear', name: 'Torn Right Ear' },
                    { id: 'muzzle_scratch', name: 'Muzzle Claw Scratch' },
                  ].map((sc) => (
                    <button
                      key={sc.id}
                      onClick={() => setAppearance({ ...appearance, scar: sc.id as any })}
                      className={`p-2 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.scar === sc.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-300'
                      }`}
                    >
                      {sc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CELESTIAL AURAS */}
          {activeTab === 'auras' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400">
                Special particle effects bestowed upon blessed or cursed cats.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'none', name: 'Standard Forest Aura', desc: 'Natural wild cat presence.' },
                  { id: 'starclan_stars', name: 'StarClan Stardust', desc: 'Glistening silver particles floating like Silverpelt.' },
                  { id: 'darkforest_smoke', name: 'Dark Forest Shadow Smoke', desc: 'Murky shadowy mist trailing in your wake.' },
                  { id: 'celestial_shimmer', name: 'Celestial Aurora Bloom', desc: 'Soft cyan glow reflecting the Moonpool.' },
                ].map((au) => (
                  <button
                    key={au.id}
                    onClick={() => setAppearance({ ...appearance, aura: au.id as any })}
                    className={`p-3 rounded-xl border text-left transition ${
                      appearance.aura === au.id
                        ? 'bg-indigo-950/70 border-indigo-400 text-indigo-200 ring-1 ring-indigo-400'
                        : 'bg-stone-950/40 border-stone-800 text-stone-300 hover:border-stone-700'
                    }`}
                  >
                    <span className="font-bold text-xs block">{au.name}</span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">{au.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMBARK BUTTON */}
        <div className="p-4 border-t border-stone-800 bg-stone-950">
          <button
            onClick={handleStartGame}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black py-3 px-6 rounded-2xl text-sm uppercase tracking-wider shadow-2xl transition active:scale-[0.98]"
          >
            <span>🐾</span>
            <span>Embark into the Wild Clans</span>
          </button>
        </div>
      </div>
    </div>
  );
};
