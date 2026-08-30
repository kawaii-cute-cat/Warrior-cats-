import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  AccessoryType, 
  AnimationState, 
  AuraType, 
  BodyType, 
  CatAppearance, 
  ClanId, 
  ClanRole, 
  EarShape, 
  EyeState, 
  FurStyle, 
  MarkingType, 
  MuzzleShape, 
  PlayerCharacter, 
  ScarType 
} from '../types/game';
import { CAT_NAME_PREFIXES, CAT_NAME_SUFFIXES, CLAN_LORE, COLOR_PALETTE, DEFAULT_APPEARANCE } from '../constants/clans';
import { CatMeshBuilder, CatRigNodes } from '../game/CatMeshBuilder';
import { CatAnimationController } from '../game/CatAnimationController';
import { 
  RotateCw, 
  Shuffle, 
  Eye, 
  Feather, 
  Shield, 
  Palette, 
  Layers, 
  Sparkles, 
  User, 
  X, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  FileText,
  Sliders
} from 'lucide-react';
import { soundEngine } from '../audio/SoundEngine';

interface CharacterCreatorProps {
  initialCharacter?: PlayerCharacter | null;
  onComplete: (character: PlayerCharacter) => void;
  onCancel?: () => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  initialCharacter,
  onComplete,
  onCancel,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Character Identity State
  const [nameMode, setNameMode] = useState<'clan' | 'custom'>(
    initialCharacter ? (CAT_NAME_PREFIXES.includes(initialCharacter.prefix) ? 'clan' : 'custom') : 'clan'
  );
  const [namePrefix, setNamePrefix] = useState(initialCharacter?.prefix || 'Bramble');
  const [nameSuffix, setNameSuffix] = useState(initialCharacter?.suffix || 'claw');
  const [customFullName, setCustomFullName] = useState(initialCharacter?.name || 'Brambleclaw');
  const [bio, setBio] = useState(initialCharacter?.bio || '');
  const [selectedClan, setSelectedClan] = useState<ClanId>(initialCharacter?.clan || 'ThunderClan');
  const [selectedRole, setSelectedRole] = useState<ClanRole>(initialCharacter?.role || 'Warrior');
  
  // Cat Appearance State
  const [appearance, setAppearance] = useState<CatAppearance>(
    initialCharacter?.appearance ? { ...initialCharacter.appearance } : { ...DEFAULT_APPEARANCE }
  );

  // Active Tab
  const [activeTab, setActiveTab] = useState<'identity' | 'body' | 'pelt' | 'face' | 'tail_paws' | 'accessories' | 'scars' | 'auras'>('identity');
  const [previewAnimation, setPreviewAnimation] = useState<AnimationState>('idle');
  const [cameraZoom, setCameraZoom] = useState(2.8);

  // 3D Preview Engine Reference
  const previewRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    group: THREE.Group | null;
    rig: CatRigNodes | null;
    animator: CatAnimationController | null;
    clock: THREE.Clock;
    animId: number | null;
    isDragging: boolean;
    prevX: number;
    rotationY: number;
  }>({
    scene: null,
    camera: null,
    renderer: null,
    group: null,
    rig: null,
    animator: null,
    clock: new THREE.Clock(),
    animId: null,
    isDragging: false,
    prevX: 0,
    rotationY: 0.3,
  });

  // Rebuild the 3D Cat Model mesh inside the scene
  const rebuildCatMesh = (currentAppearance: CatAppearance, currentAnim: AnimationState) => {
    const p = previewRef.current;
    if (!p.scene) return;

    if (p.group) {
      p.scene.remove(p.group);
      p.group = null;
      p.rig = null;
      p.animator = null;
    }

    const { group, rig } = CatMeshBuilder.buildCat(currentAppearance);
    group.rotation.y = p.rotationY;
    p.scene.add(group);
    p.group = group;
    p.rig = rig;
    p.animator = new CatAnimationController(rig);
    p.animator.setState(currentAnim);
  };

  // Setup 3D Canvas Preview with guaranteed initialization lifecycle
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x18181b);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
    camera.position.set(0, 0.55, cameraZoom);
    camera.lookAt(0, 0.22, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;

    // Explicitly enforce responsive canvas styling
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const hemiLight = new THREE.HemisphereLight(0xffedd5, 0x18181b, 0.95);
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
      new THREE.CylinderGeometry(1.25, 1.35, 0.1, 32),
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

    // Synchronize viewport dimensions with parent container
    const updateViewportSize = () => {
      if (!mountRef.current || !renderer || !camera) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      if (width > 0 && height > 0) {
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
      }
    };

    // Initial measurement pass immediately and deferred across animation frames
    updateViewportSize();
    let rAf1: number | null = null;
    let rAf2: number | null = null;
    rAf1 = requestAnimationFrame(() => {
      updateViewportSize();
      rAf2 = requestAnimationFrame(() => {
        updateViewportSize();
      });
    });

    // Build the initial cat mesh immediately
    rebuildCatMesh(appearance, previewAnimation);

    // Render loop
    const animate = () => {
      const p = previewRef.current;
      if (!p.renderer || !p.scene || !p.camera) return;
      p.animId = requestAnimationFrame(animate);
      const delta = p.clock.getDelta();

      if (p.animator) {
        p.animator.update(delta);
      }

      if (p.group && !p.isDragging) {
        p.rotationY += delta * 0.15; // Gentle rotation
        p.group.rotation.y = p.rotationY;
      }

      p.renderer.render(p.scene, p.camera);
    };

    animate();

    // ResizeObserver on the actual canvas container
    const resizeObserver = new ResizeObserver(() => {
      updateViewportSize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', updateViewportSize);

    // Drag to rotate controls
    const onMouseDown = (e: MouseEvent) => {
      previewRef.current.isDragging = true;
      previewRef.current.prevX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!previewRef.current.isDragging || !previewRef.current.group) return;
      const deltaX = e.clientX - previewRef.current.prevX;
      previewRef.current.rotationY += deltaX * 0.01;
      previewRef.current.group.rotation.y = previewRef.current.rotationY;
      previewRef.current.prevX = e.clientX;
    };
    const onMouseUp = () => {
      previewRef.current.isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setCameraZoom((prev) => {
        const next = Math.max(1.5, Math.min(4.5, prev + e.deltaY * 0.002));
        if (previewRef.current.camera) {
          previewRef.current.camera.position.z = next;
        }
        return next;
      });
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateViewportSize);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (rAf1 !== null) cancelAnimationFrame(rAf1);
      if (rAf2 !== null) cancelAnimationFrame(rAf2);
      if (previewRef.current.animId !== null) {
        cancelAnimationFrame(previewRef.current.animId);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      previewRef.current.scene = null;
      previewRef.current.camera = null;
      previewRef.current.renderer = null;
    };
  }, []);

  // Rebuild 3D Cat Model whenever appearance changes
  useEffect(() => {
    if (previewRef.current.scene) {
      rebuildCatMesh(appearance, previewAnimation);
    }
  }, [appearance]);

  // Update animation in preview
  const handleSetPreviewAnimation = (anim: AnimationState) => {
    setPreviewAnimation(anim);
    if (previewRef.current.animator) {
      previewRef.current.animator.setState(anim);
    }
  };

  // Adjust Camera Zoom
  const handleZoom = (delta: number) => {
    setCameraZoom((prev) => {
      const next = Math.max(1.5, Math.min(4.5, prev + delta));
      if (previewRef.current.camera) {
        previewRef.current.camera.position.z = next;
      }
      return next;
    });
  };

  // Randomize generator
  const handleRandomize = () => {
    soundEngine.playPurr();
    const randomPre = CAT_NAME_PREFIXES[Math.floor(Math.random() * CAT_NAME_PREFIXES.length)];
    const randomSuf = CAT_NAME_SUFFIXES[Math.floor(Math.random() * CAT_NAME_SUFFIXES.length)];
    setNamePrefix(randomPre);
    setNameSuffix(randomSuf);
    setCustomFullName(`${randomPre}${randomSuf.toLowerCase()}`);

    const furs = COLOR_PALETTE.fur;
    const eyes = COLOR_PALETTE.eyes;
    const fur1 = furs[Math.floor(Math.random() * furs.length)].hex;
    const fur2 = furs[Math.floor(Math.random() * furs.length)].hex;
    const eye1 = eyes[Math.floor(Math.random() * eyes.length)].hex;
    const eye2 = eyes[Math.floor(Math.random() * eyes.length)].hex;

    const markings: MarkingType[] = ['solid', 'classic_tabby', 'mackerel_tabby', 'spotted', 'colorpoint', 'calico', 'tortoiseshell', 'bicolor', 'white_chest'];
    const furStyles: FurStyle[] = ['short_smooth', 'medium', 'fluffy', 'very_fluffy'];
    const earShapes: EarShape[] = ['normal', 'pointed', 'rounded', 'tufted'];
    const muzzleShapes: MuzzleShape[] = ['normal', 'short', 'long'];
    const bodyTypes: BodyType[] = ['adult', 'slender_hunter', 'large_warrior'];

    setAppearance({
      ...appearance,
      primaryColor: fur1,
      secondaryColor: fur2,
      underbellyColor: Math.random() > 0.4 ? '#fffbeb' : fur1,
      markingType: markings[Math.floor(Math.random() * markings.length)],
      furStyle: furStyles[Math.floor(Math.random() * furStyles.length)],
      earShape: earShapes[Math.floor(Math.random() * earShapes.length)],
      muzzleShape: muzzleShapes[Math.floor(Math.random() * muzzleShapes.length)],
      bodyType: bodyTypes[Math.floor(Math.random() * bodyTypes.length)],
      bodyScale: 0.85 + Math.random() * 0.35,
      eyeColorLeft: eye1,
      eyeColorRight: Math.random() > 0.85 ? eye2 : eye1,
      isHeterochromia: Math.random() > 0.85,
      tailLength: 0.8 + Math.random() * 0.4,
      tailThickness: 0.85 + Math.random() * 0.35,
      earSize: 0.85 + Math.random() * 0.3,
      muzzleLength: 0.85 + Math.random() * 0.3,
      legLength: 0.9 + Math.random() * 0.25,
      pawSize: 0.9 + Math.random() * 0.25,
      earTufts: Math.random() > 0.6,
    });
  };

  const computedName = nameMode === 'clan' 
    ? `${namePrefix}${nameSuffix.toLowerCase()}` 
    : (customFullName.trim() || `${namePrefix}${nameSuffix.toLowerCase()}`);

  const handleSaveCharacter = () => {
    soundEngine.playStarClanChime();
    const characterData: PlayerCharacter = {
      id: initialCharacter?.id || `cat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: computedName,
      prefix: nameMode === 'clan' ? namePrefix : computedName,
      suffix: nameMode === 'clan' ? nameSuffix.toLowerCase() : '',
      clan: selectedClan,
      role: selectedRole,
      bio: bio.trim(),
      appearance,
      leaderLives: selectedRole === 'Leader' ? (initialCharacter?.leaderLives ?? 9) : 0,
      maxLeaderLives: selectedRole === 'Leader' ? 9 : 0,
      reputation: initialCharacter?.reputation ?? 100,
      deathHistory: initialCharacter?.deathHistory ?? [],
      createdAt: initialCharacter?.createdAt || new Date().toISOString(),
      lastPlayed: new Date().toISOString(),
    };
    onComplete(characterData);
  };

  return (
    <div className="relative w-full h-full min-h-0 min-w-0 flex flex-col lg:flex-row bg-stone-950 text-stone-100 select-none overflow-hidden">
      {/* ================= LEFT: 3D LIVE TURNTABLE PREVIEW ================= */}
      <div className="relative flex-1 min-h-0 min-w-0 h-[45vh] lg:h-full bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 flex flex-col items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-stone-800">
        {/* Top Info & Back Button */}
        <div className="absolute top-4 left-4 z-10 flex flex-col">
          <span className="text-[10px] font-black tracking-widest uppercase text-amber-400/90 flex items-center gap-1.5">
            <span>🐾</span>
            <span>{CLAN_LORE[selectedClan]?.name || selectedClan}</span>
          </span>
          <span className="text-2xl font-black text-stone-100 tracking-wide drop-shadow-md">
            {computedName}
          </span>
          <span className="text-xs font-bold text-amber-300">
            {selectedRole} • {CLAN_LORE[selectedClan]?.motto || ''}
          </span>
        </div>

        {/* Close/Cancel Button if in-game */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 z-10 p-2.5 bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white rounded-xl border border-stone-700 backdrop-blur-md transition shadow-lg flex items-center gap-1.5 text-xs font-bold"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}

        {/* 3D Canvas Mount Point */}
        <div ref={mountRef} className="absolute inset-0 w-full h-full min-h-0 min-w-0 cursor-grab active:cursor-grabbing overflow-hidden" />

        {/* Floating Turntable & Animation Controls */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="text-[11px] text-stone-400 bg-stone-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-800 flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Drag to rotate</span>
            </div>

            <button
              onClick={() => handleZoom(-0.4)}
              className="p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-300 rounded-xl border border-stone-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(0.4)}
              className="p-2 bg-stone-900/80 hover:bg-stone-800 text-stone-300 rounded-xl border border-stone-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Animation Pose Selector */}
          <div className="flex items-center gap-1 bg-stone-900/90 backdrop-blur-md p-1 rounded-xl border border-stone-800 pointer-events-auto">
            <span className="text-[10px] uppercase font-bold text-stone-400 px-1.5 flex items-center gap-1">
              <Play className="w-2.5 h-2.5" /> Pose:
            </span>
            {(['idle', 'walk', 'sit', 'groom', 'pounce_leap', 'hiss', 'sleep'] as AnimationState[]).map((anim) => (
              <button
                key={anim}
                onClick={() => handleSetPreviewAnimation(anim)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition capitalize ${
                  previewAnimation === anim
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {anim.replace('_', ' ')}
              </button>
            ))}
          </div>

          <button
            onClick={handleRandomize}
            className="pointer-events-auto flex items-center gap-1.5 bg-stone-900/90 hover:bg-stone-800 text-amber-400 font-bold px-3 py-1.5 rounded-xl border border-amber-500/30 text-xs transition active:scale-95 shadow-md"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Randomize</span>
          </button>
        </div>
      </div>

      {/* ================= RIGHT: CUSTOMIZATION CONTROLS SUITE ================= */}
      <div className="w-full lg:w-[480px] h-[55vh] lg:h-full min-h-0 flex-shrink-0 flex flex-col bg-stone-900/95 border-stone-800">
        {/* Navigation Tabs Header */}
        <div className="p-2 border-b border-stone-800 bg-stone-950/70 overflow-x-auto flex gap-1.5 scrollbar-thin">
          {[
            { id: 'identity', label: 'Identity', icon: User },
            { id: 'body', label: 'Body', icon: Sliders },
            { id: 'pelt', label: 'Pelt', icon: Palette },
            { id: 'face', label: 'Face', icon: Eye },
            { id: 'tail_paws', label: 'Tail & Paws', icon: Layers },
            { id: 'accessories', label: 'Items', icon: Feather },
            { id: 'scars', label: 'Scars', icon: Shield },
            { id: 'auras', label: 'Auras', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEngine.playFootstep('grass');
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  isActive
                    ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                    : 'bg-stone-900/60 text-stone-400 hover:text-stone-200 hover:bg-stone-800/80 border border-stone-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          {/* TAB 1: IDENTITY & CLAN ALLEGIANCE */}
          {activeTab === 'identity' && (
            <div className="space-y-5">
              {/* Name Mode Toggle */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Naming Style</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setNameMode('clan')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      nameMode === 'clan'
                        ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>🌲</span>
                    <span>Clan Prefix + Suffix</span>
                  </button>
                  <button
                    onClick={() => setNameMode('custom')}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      nameMode === 'custom'
                        ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-sm'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span>✏️</span>
                    <span>Freeform Custom Name</span>
                  </button>
                </div>
              </div>

              {/* Clan Name Generator */}
              {nameMode === 'clan' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Name Prefix</label>
                    <select
                      value={namePrefix}
                      onChange={(e) => setNamePrefix(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      {CAT_NAME_PREFIXES.map((pre) => (
                        <option key={pre} value={pre}>
                          {pre}-
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-stone-300 block mb-1.5">Name Suffix</label>
                    <select
                      value={nameSuffix}
                      onChange={(e) => setNameSuffix(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-bold focus:outline-none focus:border-amber-400"
                    >
                      {CAT_NAME_SUFFIXES.map((suf) => (
                        <option key={suf} value={suf}>
                          -{suf}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-1.5">Custom Full Cat Name</label>
                  <input
                    type="text"
                    maxLength={30}
                    value={customFullName}
                    onChange={(e) => setCustomFullName(e.target.value)}
                    placeholder="e.g. Scourge, Rusty, Moon-whisper..."
                    className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Clan Allegiance Selection */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Clan Allegiance</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(CLAN_LORE) as ClanId[]).map((clanKey) => {
                    const clan = CLAN_LORE[clanKey];
                    const isSelected = selectedClan === clanKey;
                    return (
                      <button
                        key={clanKey}
                        onClick={() => {
                          setSelectedClan(clanKey);
                          soundEngine.playFootstep('grass');
                        }}
                        className={`p-3 rounded-xl border text-left transition flex flex-col ${
                          isSelected
                            ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                            : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <span className="font-black text-xs text-stone-200">{clan.name}</span>
                        <span className="text-[11px] text-amber-400/80 font-bold mt-0.5">{clan.territoryName || clan.motto}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Clan Rank / Role */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Clan Role & Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Leader', 'Deputy', 'Warrior', 'Medicine Cat', 'Apprentice', 'Elder', 'Kit', 'Rogue'] as ClanRole[]).map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        selectedRole === role
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio & Backstory */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-300 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>Backstory & Personality (Bio)</span>
                  </label>
                  <span className="text-[10px] text-stone-500">{bio.length}/400</span>
                </div>
                <textarea
                  maxLength={400}
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Describe your cat's origins, personality, loyalties, or destiny..."
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-medium focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BODY & STATURE */}
          {activeTab === 'body' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Body Frame & Archetype</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'adult', label: 'Normal Warrior' },
                    { id: 'large_warrior', label: 'Large Warrior (Broad & Tall)' },
                    { id: 'slender_hunter', label: 'Slender Hunter' },
                    { id: 'apprentice', label: 'Apprentice Frame' },
                    { id: 'kit', label: 'Kit Body' },
                  ].map((bt) => (
                    <button
                      key={bt.id}
                      onClick={() => setAppearance({ ...appearance, bodyType: bt.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        appearance.bodyType === bt.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Fur Style & 3D Silhouette</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'short', label: 'Sleek Short-Hair' },
                    { id: 'medium', label: 'Classic Forest Fur' },
                    { id: 'long', label: 'Longhair Coat (Fluffy Tufts)' },
                    { id: 'fluffy', label: 'Thick Mane (Lion-Ruff Fluff)' },
                  ].map((fs) => (
                    <button
                      key={fs.id}
                      onClick={() => setAppearance({ ...appearance, furStyle: fs.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.furStyle === fs.id || (fs.id === 'short' && appearance.furStyle === 'short_smooth') || (fs.id === 'fluffy' && appearance.furStyle === 'very_fluffy')
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {fs.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                  <span>Overall Scale Multiplier</span>
                  <span className="text-amber-400">{Math.round((appearance.bodyScale || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.7"
                  max="1.3"
                  step="0.05"
                  value={appearance.bodyScale || 1.0}
                  onChange={(e) => setAppearance({ ...appearance, bodyScale: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
                <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                  <span>Compact</span>
                  <span>Standard</span>
                  <span>Towering</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PELT PATTERNS & COLORS */}
          {activeTab === 'pelt' && (
            <div className="space-y-5">
              {/* Marking Pattern */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Marking Pattern</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'solid', name: 'Solid Pure' },
                    { id: 'classic_tabby', name: 'Classic Tabby' },
                    { id: 'mackerel_tabby', name: 'Tiger Tabby' },
                    { id: 'spotted', name: 'Leopard Spotted' },
                    { id: 'colorpoint', name: 'Siamese Point' },
                    { id: 'calico', name: 'Calico Patch' },
                    { id: 'tortoiseshell', name: 'Tortoiseshell' },
                    { id: 'bicolor', name: 'Tuxedo Bicolor' },
                    { id: 'white_chest', name: 'White Chest Blaze' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setAppearance({ ...appearance, markingType: m.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        appearance.markingType === m.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Fur Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300">Primary Pelt Coat Color</label>
                  <div className="w-5 h-5 rounded-full border border-stone-600" style={{ backgroundColor: appearance.primaryColor }} />
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {COLOR_PALETTE.fur.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAppearance({ ...appearance, primaryColor: c.hex })}
                      className={`h-8 rounded-lg border-2 transition ${
                        appearance.primaryColor === c.hex ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent hover:border-stone-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Pattern Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300">Secondary / Stripe Color</label>
                  <div className="w-5 h-5 rounded-full border border-stone-600" style={{ backgroundColor: appearance.secondaryColor }} />
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {COLOR_PALETTE.fur.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAppearance({ ...appearance, secondaryColor: c.hex })}
                      className={`h-8 rounded-lg border-2 transition ${
                        appearance.secondaryColor === c.hex ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent hover:border-stone-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* Underbelly & Chest Color */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-stone-300">Underbelly & Muzzle Tint</label>
                  <div className="w-5 h-5 rounded-full border border-stone-600" style={{ backgroundColor: appearance.underbellyColor }} />
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {COLOR_PALETTE.fur.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setAppearance({ ...appearance, underbellyColor: c.hex })}
                      className={`h-8 rounded-lg border-2 transition ${
                        appearance.underbellyColor === c.hex ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent hover:border-stone-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FACE & EYES */}
          {activeTab === 'face' && (
            <div className="space-y-5">
              {/* Heterochromia toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-950/40 rounded-xl border border-stone-800">
                <span className="text-xs font-bold text-stone-300">Heterochromia (Different Eye Colors)</span>
                <input
                  type="checkbox"
                  checked={appearance.isHeterochromia}
                  onChange={(e) => setAppearance({ ...appearance, isHeterochromia: e.target.checked })}
                  className="w-4 h-4 accent-amber-500"
                />
              </div>

              {/* Eye Colors */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">
                  {appearance.isHeterochromia ? 'Left Eye Color' : 'Eye Color'}
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {COLOR_PALETTE.eyes.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => {
                        setAppearance({
                          ...appearance,
                          eyeColorLeft: c.hex,
                          eyeColorRight: appearance.isHeterochromia ? appearance.eyeColorRight : c.hex,
                        });
                      }}
                      className={`h-8 rounded-lg border-2 transition ${
                        appearance.eyeColorLeft === c.hex ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent hover:border-stone-600'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {appearance.isHeterochromia && (
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">Right Eye Color</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PALETTE.eyes.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setAppearance({ ...appearance, eyeColorRight: c.hex })}
                        className={`h-8 rounded-lg border-2 transition ${
                          appearance.eyeColorRight === c.hex ? 'border-amber-400 scale-105 shadow-md' : 'border-transparent hover:border-stone-600'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Eye Condition */}
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Eye Sight & State</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'normal', name: 'Sharp Sighted' },
                    { id: 'narrowed', name: 'Narrowed Fierce' },
                    { id: 'blind_left', name: 'Blind Left Eye' },
                    { id: 'blind_right', name: 'Blind Right Eye' },
                    { id: 'blind_both', name: 'Blind Both Eyes (Jayfeather)' },
                    { id: 'star_shine', name: 'StarClan Shimmer' },
                    { id: 'amber_glow', name: 'Predator Amber Glow' },
                  ].map((es) => (
                    <button
                      key={es.id}
                      onClick={() => setAppearance({ ...appearance, eyeState: es.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.eyeState === es.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400'
                      }`}
                    >
                      {es.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Muzzle Variants & Ears */}
              <div className="space-y-4 pt-2 border-t border-stone-800">
                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">Muzzle Profile Variant</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'classic', label: 'Classic Snout' },
                      { id: 'short_snub', label: 'Snub / Flat Profile' },
                      { id: 'long_angular', label: 'Long / Sharp Angular' },
                      { id: 'broad_tom', label: 'Broad Tom Muzzle' },
                    ].map((mz) => (
                      <button
                        key={mz.id}
                        onClick={() => setAppearance({ ...appearance, muzzleShape: mz.id as any })}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                          appearance.muzzleShape === mz.id || (!appearance.muzzleShape && mz.id === 'classic')
                            ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                            : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        {mz.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-300 block mb-2">Ear Shape Style</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pricked', label: 'Alert Pricked' },
                      { id: 'lynx_tufted', label: 'Lynx Tufted' },
                      { id: 'rounded', label: 'Curved Round' },
                      { id: 'folded', label: 'Folded Down' },
                      { id: 'torn_notched', label: 'Battle Notched' },
                    ].map((es) => (
                      <button
                        key={es.id}
                        onClick={() => setAppearance({ ...appearance, earShape: es.id as any })}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                          appearance.earShape === es.id || (!appearance.earShape && es.id === 'pricked')
                            ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                            : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        {es.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                    <span>Muzzle Length Slider</span>
                    <span className="text-amber-400">{Math.round((appearance.muzzleLength || 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.3"
                    step="0.05"
                    value={appearance.muzzleLength || 1.0}
                    onChange={(e) => setAppearance({ ...appearance, muzzleLength: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                    <span>Ear Size Slider</span>
                    <span className="text-amber-400">{Math.round((appearance.earSize || 1.0) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.35"
                    step="0.05"
                    value={appearance.earSize || 1.0}
                    onChange={(e) => setAppearance({ ...appearance, earSize: parseFloat(e.target.value) })}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-stone-950/40 rounded-xl border border-stone-800">
                  <span className="text-xs font-bold text-stone-300">Lynx Ear Tips Fluff</span>
                  <input
                    type="checkbox"
                    checked={appearance.earTufts}
                    onChange={(e) => setAppearance({ ...appearance, earTufts: e.target.checked })}
                    className="w-4 h-4 accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TAIL & PAWS */}
          {activeTab === 'tail_paws' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Tail Silhouette & Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sleek', label: 'Classic Sleek' },
                    { id: 'bushy_plume', label: 'Bushy Plume' },
                    { id: 'bobtail', label: 'Bobtail' },
                    { id: 'crooked', label: 'Crooked / Bent' },
                    { id: 'stumpy', label: 'Stumpy Nub' },
                  ].map((tt) => (
                    <button
                      key={tt.id}
                      onClick={() => setAppearance({ ...appearance, tailType: tt.id as any })}
                      className={`p-2.5 rounded-xl border text-xs font-bold text-center transition ${
                        appearance.tailType === tt.id || (!appearance.tailType && tt.id === 'sleek')
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-400'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {tt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                  <span>Tail Length</span>
                  <span className="text-amber-400">{Math.round((appearance.tailLength || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={appearance.tailLength || 1.0}
                  onChange={(e) => setAppearance({ ...appearance, tailLength: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                  <span>Tail Thickness</span>
                  <span className="text-amber-400">{Math.round((appearance.tailThickness || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.5"
                  step="0.05"
                  value={appearance.tailThickness || 1.0}
                  onChange={(e) => setAppearance({ ...appearance, tailThickness: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                  <span>Leg Length</span>
                  <span className="text-amber-400">{Math.round((appearance.legLength || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.25"
                  step="0.05"
                  value={appearance.legLength || 1.0}
                  onChange={(e) => setAppearance({ ...appearance, legLength: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-stone-300 mb-1.5">
                  <span>Paw Size</span>
                  <span className="text-amber-400">{Math.round((appearance.pawSize || 1.0) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={appearance.pawSize || 1.0}
                  onChange={(e) => setAppearance({ ...appearance, pawSize: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* TAB 6: ACCESSORIES & FOREST FINERY */}
          {activeTab === 'accessories' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-stone-300 block mb-2">Natural Forest Accoutrements</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'none', name: 'No Item' },
                    { id: 'oak_leaves', name: 'Oak Leaf Sprig' },
                    { id: 'blue_feather', name: 'Blue Jay Feather' },
                    { id: 'cardinal_feather', name: 'Cardinal Feather' },
                    { id: 'violet_flower', name: 'Violet Flower' },
                    { id: 'poppy_flower', name: 'Red Poppy Bloom' },
                    { id: 'leather_collar', name: 'Former Kittypet Collar' },
                    { id: 'bell_collar', name: 'Golden Bell Collar' },
                    { id: 'moss_shoulder_wrap', name: 'Moss Shoulder Wrap' },
                    { id: 'holly_berries', name: 'Holly Berries' },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      onClick={() => setAppearance({ ...appearance, accessory: acc.id as any })}
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                        appearance.accessory === acc.id
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                          : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      {acc.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: BATTLE SCARS */}
          {activeTab === 'scars' && (
            <div className="space-y-3">
              <label className="text-xs font-bold text-stone-300 block mb-1">Battle Scars & War Marks</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'none', name: 'Pristine Pelt' },
                  { id: 'torn_left_ear', name: 'Torn Left Ear' },
                  { id: 'torn_right_ear', name: 'Torn Right Ear' },
                  { id: 'muzzle_scratch', name: 'Muzzle Claw Cut' },
                  { id: 'shoulder_claw_marks', name: 'Shoulder Claw Marks' },
                  { id: 'blind_eye_slash', name: 'Eye Claw Slash' },
                  { id: 'tail_nick', name: 'Tail Notch Cut' },
                  { id: 'cross_scars', name: 'Cross Chest Scars' },
                  { id: 'chest_scar', name: 'Torso Battle Slash' },
                  { id: 'flank_scar', name: 'Flank Claw Marks' },
                  { id: 'battle_worn_all', name: 'Battle-Worn Veteran' },
                ].map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => setAppearance({ ...appearance, scar: sc.id as any })}
                    className={`p-3 rounded-xl border text-xs font-bold text-left transition ${
                      appearance.scar === sc.id
                        ? 'bg-amber-950/60 border-amber-400 text-amber-200'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    {sc.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: CELESTIAL AURAS */}
          {activeTab === 'auras' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-400 mb-2">
                Special particle effects bestowed upon blessed or cursed cats.
              </p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'none', name: 'Standard Forest Presence', desc: 'Natural forest cat aura.' },
                  { id: 'starclan_stars', name: 'StarClan Stardust', desc: 'Glistening silver particles floating like Silverpelt.' },
                  { id: 'darkforest_smoke', name: 'Dark Forest Shadow Smoke', desc: 'Murky shadowy mist trailing in your wake.' },
                  { id: 'celestial_shimmer', name: 'Celestial Moonpool Bloom', desc: 'Soft glowing radiance reflecting the Moonpool.' },
                ].map((au) => (
                  <button
                    key={au.id}
                    onClick={() => setAppearance({ ...appearance, aura: au.id as any })}
                    className={`p-3 rounded-xl border text-left transition ${
                      appearance.aura === au.id
                        ? 'bg-amber-950/70 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                        : 'bg-stone-950/40 border-stone-800 text-stone-400 hover:border-stone-700'
                    }`}
                  >
                    <span className="font-bold text-xs block text-stone-200">{au.name}</span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">{au.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* EMBARK / SAVE FOOTER */}
        <div className="p-4 border-t border-stone-800 bg-stone-950 flex gap-2">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs border border-stone-700 transition"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveCharacter}
            className="flex-[2] flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 font-black py-3 px-6 rounded-2xl text-xs uppercase tracking-wider shadow-2xl transition active:scale-[0.98]"
          >
            <span>🐾</span>
            <span>{initialCharacter ? 'Save & Return to Clan' : 'Embark into the Wild Clans'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
