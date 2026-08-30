import * as THREE from 'three';
import { AnimationState, CatAppearance, ChatMessage, HerbType, PlayerCharacter, PlayerRuntimeState, PreyItem, RealmId } from '../types/game';
import { CatMeshBuilder, CatRigNodes } from './CatMeshBuilder';
import { CatAnimationController } from './CatAnimationController';
import { WorldBuilder, WorldObjects } from './WorldBuilder';
import { PreyEntityManager } from './PreyEntityManager';
import { NetworkEngine } from './NetworkEngine';
import { CombatAndMedicineSystem } from './CombatAndMedicineSystem';
import { LeaderNineLivesSystem } from './LeaderNineLivesSystem';
import { soundEngine } from '../audio/SoundEngine';
import { WorldSpeechBubble, WorldNameplate } from '../components/SpeechBubbleOverlay';

export interface ActiveSpeechBubbleData {
  id: string;
  senderId: string;
  senderName: string;
  senderClan: string;
  text: string;
  isRp: boolean;
  expiresAt: number;
}

export class GameEngine3D {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private dirLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;

  // Local Player
  public playerState: PlayerRuntimeState;
  private playerGroup: THREE.Group;
  private playerRig: CatRigNodes;
  private playerAnimator: CatAnimationController;

  // Pounce physical trajectory state
  private isPouncing = false;
  private pounceTimer = 0;
  private pounceDuration = 0.55;
  private pounceVelocity = new THREE.Vector3();

  // World & Systems
  private worldObjects: WorldObjects | null = null;
  private preyManager: PreyEntityManager;
  public networkEngine: NetworkEngine;

  // Navigation Waypoint
  private activeWaypoint: { name: string; x: number; z: number } | null = null;

  // Speech Bubbles & Nameplates System
  private activeBubbles: Map<string, ActiveSpeechBubbleData> = new Map();

  // Camera parameters
  private cameraDistance = 3.8;
  private cameraYaw = 0;
  private cameraPitch = 0.28;
  private isMouseDown = false;
  private prevMouseX = 0;
  private prevMouseY = 0;

  // Movement & Input
  private keys: Record<string, boolean> = {};
  private clock = new THREE.Clock();
  private animationFrameId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private rAf1: number | null = null;
  private rAf2: number | null = null;

  // Callbacks to React UI
  private onStateChange?: (state: PlayerRuntimeState) => void;
  private onInteractPrompt?: (prompt: { text: string; action: () => void } | null) => void;
  private onRealmTransitionRequested?: (realm: RealmId) => void;
  private onProphecyVisionRequested?: () => void;
  private onClanChangeRequested?: () => void;
  private onDarkForestTrialRequested?: () => void;
  private onMedicineDenOpened?: () => void;
  private onLeaderLifeLost?: (remaining: number, msg: string) => void;
  private onPlayerDied?: () => void;
  private onChatMessage?: (msg: ChatMessage) => void;
  private onSpeechBubblesUpdate?: (bubbles: WorldSpeechBubble[]) => void;
  private onNameplatesUpdate?: (nameplates: WorldNameplate[]) => void;
  private onWaypointUpdate?: (waypoint: { name: string; x: number; z: number; distance: number } | null) => void;

  constructor(
    container: HTMLElement,
    character: PlayerCharacter,
    callbacks: {
      onStateChange?: (state: PlayerRuntimeState) => void;
      onInteractPrompt?: (prompt: { text: string; action: () => void } | null) => void;
      onRealmTransitionRequested?: (realm: RealmId) => void;
      onProphecyVisionRequested?: () => void;
      onClanChangeRequested?: () => void;
      onDarkForestTrialRequested?: () => void;
      onMedicineDenOpened?: () => void;
      onLeaderLifeLost?: (remaining: number, msg: string) => void;
      onPlayerDied?: () => void;
      onChatMessage?: (msg: ChatMessage) => void;
      onSpeechBubblesUpdate?: (bubbles: WorldSpeechBubble[]) => void;
      onNameplatesUpdate?: (nameplates: WorldNameplate[]) => void;
      onWaypointUpdate?: (waypoint: { name: string; x: number; z: number; distance: number } | null) => void;
    }
  ) {
    this.container = container;
    Object.assign(this, callbacks);

    // Initial Runtime State
    this.playerState = {
      id: character.id,
      character,
      position: { x: 0, y: -2.2, z: 8 },
      rotation: { yaw: 0, pitch: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      animation: 'idle',
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      carriedPrey: null,
      herbs: [],
      injuries: [],
      currentRealm: 'territory',
      isSneaking: false,
      isResting: false,
      isScentSenseActive: false,
      isDead: false,
    };

    // 1. Scene & Renderer
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a);
    this.scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Explicitly enforce responsive canvas sizing
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(this.renderer.domElement);

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);

    // Initial resize pass immediately and deferred across animation frames
    this.onResize();
    this.rAf1 = requestAnimationFrame(() => {
      this.onResize();
      this.rAf2 = requestAnimationFrame(() => {
        this.onResize();
      });
    });

    // ResizeObserver on the actual canvas container
    this.resizeObserver = new ResizeObserver(() => {
      this.onResize();
    });
    this.resizeObserver.observe(this.container);

    // 3. Lighting
    this.hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x1e293b, 0.7);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(0xffedd5, 1.2);
    this.dirLight.position.set(40, 60, 30);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 2048;
    this.dirLight.shadow.mapSize.height = 2048;
    this.dirLight.shadow.camera.near = 10;
    this.dirLight.shadow.camera.far = 160;
    this.dirLight.shadow.camera.left = -50;
    this.dirLight.shadow.camera.right = 50;
    this.dirLight.shadow.camera.top = 50;
    this.dirLight.shadow.camera.bottom = -50;
    this.scene.add(this.dirLight);

    // 4. Build Player 3D Cat
    const { group, rig } = CatMeshBuilder.buildCat(character.appearance);
    this.playerGroup = group;
    this.playerRig = rig;
    this.playerAnimator = new CatAnimationController(rig);
    this.playerGroup.position.set(this.playerState.position.x, this.playerState.position.y, this.playerState.position.z);
    this.scene.add(this.playerGroup);

    // 5. Systems
    this.preyManager = new PreyEntityManager(this.scene);
    this.networkEngine = new NetworkEngine(this.scene);
    this.networkEngine.connect(
      this.playerState,
      (msg) => {
        this.addSpeechBubble(msg);
        if (this.onChatMessage) this.onChatMessage(msg);
      },
      (freshKillCount) => {
        if (this.worldObjects) {
          WorldBuilder.updateFreshKillPileCount(this.worldObjects, freshKillCount);
        }
      }
    );

    // 6. Build Realm
    this.loadRealm('territory');

    // 7. Event listeners
    this.bindEvents();

    // Start loop
    this.animate();
  }

  public loadRealm(realm: RealmId) {
    if (this.worldObjects) {
      this.scene.remove(this.worldObjects.realmGroup);
    }
    this.playerState.currentRealm = realm;
    this.worldObjects = WorldBuilder.buildRealm(realm);
    this.scene.add(this.worldObjects.realmGroup);

    // Atmosphere tweaks per realm
    if (realm === 'territory') {
      this.scene.background = new THREE.Color(0x38bdf8); // Sunny day
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.008);
      this.hemiLight.color.setHex(0xfffbeb);
      this.hemiLight.groundColor.setHex(0x14532d);
      this.hemiLight.intensity = 0.8;
      this.dirLight.color.setHex(0xffedd5);
      this.dirLight.intensity = 1.3;
      const spawnY = WorldBuilder.getTerrainHeight('territory', 0, 8);
      this.playerState.position = { x: 0, y: spawnY, z: 8 };
      this.playerGroup.position.set(0, spawnY, 8);
      this.preyManager.initPrey(14);
    } else if (realm === 'moonpool') {
      this.scene.background = new THREE.Color(0x020617);
      this.scene.fog = new THREE.FogExp2(0x0f172a, 0.015);
      this.hemiLight.intensity = 0.3;
      this.dirLight.intensity = 0.4;
      const spawnY = WorldBuilder.getTerrainHeight('moonpool', 0, 12);
      this.playerState.position = { x: 0, y: spawnY, z: 12 };
      this.playerGroup.position.set(0, spawnY, 12);
      this.preyManager.clearAll();
      soundEngine.playStarClanChime();
    } else if (realm === 'starclan') {
      this.scene.background = new THREE.Color(0x0f172a);
      this.scene.fog = new THREE.FogExp2(0x1e1b4b, 0.006);
      this.hemiLight.color.setHex(0xc7d2fe);
      this.hemiLight.intensity = 0.9;
      this.dirLight.color.setHex(0x93c5fd);
      this.dirLight.intensity = 1.0;
      this.playerState.position = { x: 0, y: 0.2, z: 8 };
      this.playerGroup.position.set(0, 0.2, 8);
      this.preyManager.clearAll();
      soundEngine.playStarClanChime();
    } else if (realm === 'darkforest') {
      this.scene.background = new THREE.Color(0x09090b);
      this.scene.fog = new THREE.FogExp2(0x27272a, 0.02);
      this.hemiLight.color.setHex(0x581c87);
      this.hemiLight.intensity = 0.4;
      this.dirLight.color.setHex(0xdc2626);
      this.dirLight.intensity = 0.5;
      this.playerState.position = { x: 0, y: 0.2, z: 8 };
      this.playerGroup.position.set(0, 0.2, 8);
      this.preyManager.clearAll();
      soundEngine.playDarkForestWhisper();
    }

    if (this.onStateChange) {
      this.onStateChange({ ...this.playerState });
    }
  }

  public switchRealm(realm: RealmId) {
    this.loadRealm(realm);
  }

  public teleport(x: number, z: number) {
    this.playerState.position.x = x;
    this.playerState.position.z = z;
    this.playerState.position.y = WorldBuilder.getTerrainHeight(this.playerState.currentRealm, x, z);
    this.playerGroup.position.set(this.playerState.position.x, this.playerState.position.y, this.playerState.position.z);
    this.playerState.velocity = { x: 0, y: 0, z: 0 };
    if (this.onStateChange) this.onStateChange({ ...this.playerState });
  }

  public resurrect() {
    this.playerState.isDead = false;
    this.playerState.health = this.playerState.maxHealth;
    this.playerState.stamina = this.playerState.maxStamina;
    this.playerState.injuries = [];
    this.playerAnimator.setState('idle');
    if (this.playerState.currentRealm === 'territory') {
      const clan = this.playerState.character.clan;
      if (clan === 'ThunderClan' || clan === 'ThunderOak') {
        this.teleport(-65, -25);
      } else if (clan === 'RiverClan' || clan === 'RiverMist') {
        this.teleport(65, 25);
      } else {
        this.teleport(0, 8);
      }
    } else {
      this.teleport(0, 6);
    }
    soundEngine.playPurr();
    if (this.onStateChange) this.onStateChange({ ...this.playerState });
  }

  public attack(type: 'claw_swipe' | 'pounce' | 'bite') {
    this.triggerAttack(type);
  }

  public pounce() {
    this.triggerPounce();
  }

  public eatCarriedPrey() {
    this.eatPrey();
  }

  public depositPrey() {
    this.depositPreyToCamp();
  }

  public playEmote(emote: AnimationState) {
    this.triggerEmote(emote);
  }

  public applyHerb(herb: HerbType) {
    const injIdx = this.playerState.injuries.findIndex((i) => i.curedByHerb === herb);
    if (injIdx >= 0) {
      this.playerState.injuries.splice(injIdx, 1);
    }
    const herbObj = this.playerState.herbs.find((h) => h.type === herb);
    if (herbObj && herbObj.quantity > 0) {
      herbObj.quantity -= 1;
      if (herbObj.quantity <= 0) {
        this.playerState.herbs = this.playerState.herbs.filter((h) => h.quantity > 0);
      }
    }
    this.playerState.health = Math.min(this.playerState.maxHealth, this.playerState.health + 25);
    soundEngine.playPurr();
    if (this.onStateChange) this.onStateChange({ ...this.playerState });
  }

  public addSpeechBubble(msg: ChatMessage) {
    if (!msg.text || msg.channel === 'system') return;
    this.activeBubbles.set(msg.senderId, {
      id: msg.id,
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderClan: msg.senderClan,
      text: msg.text,
      isRp: msg.channel === 'rp',
      expiresAt: Date.now() + 6000,
    });
  }

  public broadcastChat(msg: ChatMessage) {
    this.addSpeechBubble(msg);
    this.networkEngine.sendChatMessage(msg);
  }

  public setWaypoint(waypoint: { name: string; x: number; z: number } | null) {
    this.activeWaypoint = waypoint;
    if (this.onWaypointUpdate) {
      if (waypoint) {
        const dist = Math.hypot(this.playerState.position.x - waypoint.x, this.playerState.position.z - waypoint.z);
        this.onWaypointUpdate({ ...waypoint, distance: Math.round(dist) });
      } else {
        this.onWaypointUpdate(null);
      }
    }
  }

  public clearWaypoint() {
    this.setWaypoint(null);
  }

  public updateCharacter(newChar: PlayerCharacter) {
    this.playerState.character = newChar;
    this.updateAppearance(newChar.appearance);
  }

  public updateAppearance(appearance: CatAppearance) {
    this.scene.remove(this.playerGroup);
    const { group, rig } = CatMeshBuilder.buildCat(appearance);
    this.playerGroup = group;
    this.playerRig = rig;
    this.playerAnimator = new CatAnimationController(rig);
    this.playerGroup.position.set(this.playerState.position.x, this.playerState.position.y, this.playerState.position.z);
    this.scene.add(this.playerGroup);
    this.playerState.character.appearance = appearance;
    if (this.onStateChange) {
      this.onStateChange({ ...this.playerState });
    }
  }

  // ==========================================
  // INPUT & CONTROLS
  // ==========================================
  private bindEvents() {
    window.addEventListener('keydown', (e) => {
      // Don't capture when typing in chat or modals
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA' || document.activeElement?.tagName === 'SELECT') return;

      this.keys[e.code] = true;

      if (e.code === 'Space') {
        e.preventDefault();
        this.triggerPounce();
      } else if (e.code === 'KeyC') {
        this.toggleSneak();
      } else if (e.code === 'KeyV') {
        this.toggleScentSense();
      } else if (e.code === 'KeyF') {
        this.triggerAttack('claw_swipe');
      } else if (e.code === 'KeyR') {
        this.triggerAttack('bite');
      } else if (e.code === 'KeyT') {
        this.triggerEmote('lay_down');
      } else if (e.code === 'KeyG') {
        this.triggerEmote('groom');
      } else if (e.code === 'KeyH') {
        this.triggerEmote('hiss');
      } else if (e.code === 'KeyJ') {
        this.triggerEmote('snarl');
      } else if (e.code === 'KeyB') {
        this.triggerEmote('bow');
      } else if (e.code === 'KeyN') {
        this.triggerEmote('sleep');
      } else if (e.code === 'KeyK') {
        this.triggerEmote('pounce_windup');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    const dom = this.renderer.domElement;
    dom.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;
      const dx = e.clientX - this.prevMouseX;
      const dy = e.clientY - this.prevMouseY;
      this.prevMouseX = e.clientX;
      this.prevMouseY = e.clientY;

      this.cameraYaw -= dx * 0.005;
      this.cameraPitch = Math.max(0.05, Math.min(Math.PI / 2.2, this.cameraPitch - dy * 0.005));
    });

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraDistance = Math.max(1.8, Math.min(9.0, this.cameraDistance + e.deltaY * 0.003));
    });

    window.addEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container || !this.renderer || !this.camera) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.display = 'block';
    }
  };

  // ==========================================
  // GAME ACTIONS
  // ==========================================
  public toggleSneak() {
    this.playerState.isSneaking = !this.playerState.isSneaking;
    if (this.playerState.isSneaking) {
      this.playerAnimator.setState('sneak');
    } else {
      this.playerAnimator.setState('idle');
    }
  }

  public toggleScentSense() {
    this.playerState.isScentSenseActive = !this.playerState.isScentSenseActive;
    if (this.worldObjects?.scentVisionGroup) {
      this.worldObjects.scentVisionGroup.visible = this.playerState.isScentSenseActive;
    }
    if (this.playerState.isScentSenseActive) {
      soundEngine.playPurr();
    }
  }

  public triggerPounce() {
    if (this.playerState.stamina < 15 || this.isPouncing) return;
    this.playerState.stamina = Math.max(0, this.playerState.stamina - 15);
    soundEngine.playPounce();

    // Calculate forward impulse in the exact direction the cat is currently facing
    const facingYaw = this.playerGroup.rotation.y;
    const forwardImpulse = 8.8; // Smooth swift leap speed
    this.pounceVelocity.set(
      Math.sin(facingYaw) * forwardImpulse,
      3.6, // Vertical leap boost
      Math.cos(facingYaw) * forwardImpulse
    );
    this.isPouncing = true;
    this.pounceTimer = 0;
    this.playerAnimator.setState('pounce_leap');

    // Immediate initial catch check
    const caught = this.preyManager.attemptCatch(this.playerGroup.position, true, this.playerState.isSneaking);
    if (caught) {
      this.setCarriedPrey(caught);
    }
  }

  public triggerAttack(type: 'claw_swipe' | 'pounce' | 'bite') {
    if (this.playerState.stamina < 10) return;
    const res = CombatAndMedicineSystem.executeAttack(type, this.playerState);
    this.playerState.stamina = Math.max(0, this.playerState.stamina - res.staminaUsed);
    this.playerAnimator.setState(type === 'claw_swipe' ? 'claw_swipe' : (type === 'bite' ? 'bite' : 'pounce_leap'));

    // Check hit detection in front of cat (radius 2.5m, within 90-degree frontal cone)
    const pPos = this.playerGroup.position;
    const facingYaw = this.playerGroup.rotation.y;
    const facingDir = new THREE.Vector3(Math.sin(facingYaw), 0, Math.cos(facingYaw)).normalize();

    // 1. Prey hit
    const caught = this.preyManager.attemptCatch(pPos, type === 'pounce', this.playerState.isSneaking);
    if (caught) {
      this.setCarriedPrey(caught);
    }

    // 2. Sparring dummies or NPCs in Dark Forest
    if (this.playerState.currentRealm === 'darkforest') {
      const dummies = [-15, 15];
      dummies.forEach((dx) => {
        const dummyPos = new THREE.Vector3(dx, 0.5, 5);
        if (pPos.distanceTo(dummyPos) < 3.2) {
          soundEngine.playGrowl();
        }
      });
    }

    setTimeout(() => {
      if (!this.isPouncing) {
        this.playerAnimator.setState(this.playerState.isSneaking ? 'sneak' : 'idle');
      }
    }, 450);
  }

  public triggerEmote(emote: AnimationState) {
    this.playerAnimator.setState(emote);
    if (emote === 'hiss') soundEngine.playHiss();
    if (emote === 'snarl') soundEngine.playGrowl();
    if (emote === 'groom' || emote === 'sleep') soundEngine.playPurr();
  }

  public setCarriedPrey(prey: PreyItem | null) {
    this.playerState.carriedPrey = prey;
    // Clear mouth slot
    while (this.playerRig.preyMouthGroup.children.length > 0) {
      this.playerRig.preyMouthGroup.remove(this.playerRig.preyMouthGroup.children[0]);
    }
    if (prey) {
      const pMesh = CatMeshBuilder.buildPreyMesh(prey.type);
      pMesh.scale.set(0.6, 0.6, 0.6);
      pMesh.rotation.x = Math.PI / 2;
      this.playerRig.preyMouthGroup.add(pMesh);
    }
  }

  public depositPreyToCamp() {
    if (!this.playerState.carriedPrey) return;
    const clan = this.playerState.character.clan;
    this.networkEngine.sendDepositPrey(clan);
    this.setCarriedPrey(null);
    this.playerState.character.reputation += 10;
    soundEngine.playPurr();
  }

  public eatPrey() {
    if (!this.playerState.carriedPrey) return;
    this.playerState.health = Math.min(this.playerState.maxHealth, this.playerState.health + this.playerState.carriedPrey.nutrition);
    this.playerState.stamina = this.playerState.maxStamina;
    this.setCarriedPrey(null);
    soundEngine.playPurr();
  }

  public harvestHerb(node: { id: string; type: string; mesh: THREE.Group; harvested: boolean }) {
    if (node.harvested) return;
    node.harvested = true;
    node.mesh.visible = false;
    soundEngine.playPurr();

    // Add to inventory
    const existing = this.playerState.herbs.find((h) => h.type === node.type);
    if (existing) {
      existing.quantity += 1;
    } else {
      this.playerState.herbs.push({
        id: `herb_${Date.now()}`,
        type: node.type as HerbType,
        name: node.type.charAt(0).toUpperCase() + node.type.slice(1),
        description: 'Wild medicinal herb gathered in the forest.',
        cures: 'Various clan wounds',
        quantity: 1,
      });
    }

    // Respawn node in 30 seconds
    setTimeout(() => {
      node.harvested = false;
      node.mesh.visible = true;
    }, 30000);
  }

  // ==========================================
  // GAME LOOP
  // ==========================================
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    if (!this.playerState.isDead) {
      this.handlePlayerMovement(delta);
    }

    // Update Player Animator
    this.playerAnimator.update(delta);

    // Update Prey
    const playerSpeed = Math.sqrt(this.playerState.velocity.x ** 2 + this.playerState.velocity.z ** 2);
    this.preyManager.update(delta, this.playerGroup.position, this.playerState.isSneaking, playerSpeed);

    // Update Network & Remote Players
    this.networkEngine.update(delta, this.playerState.currentRealm);
    this.networkEngine.sendStateUpdate(this.playerState);

    // Check Interactables
    this.checkInteractables();

    // Update Third-Person Camera
    this.updateCamera();

    // Water wave animation
    if (this.worldObjects?.waterMeshes) {
      this.worldObjects.waterMeshes.forEach((wm) => {
        wm.position.y += Math.sin(Date.now() * 0.003) * 0.0005;
      });
    }

    // Render
    this.renderer.render(this.scene, this.camera);

    // Calculate & Project World-Space Speech Bubbles & Identity Nameplates
    const now = Date.now();
    const projectedBubbles: WorldSpeechBubble[] = [];
    const projectedNameplates: WorldNameplate[] = [];
    const tempVec = new THREE.Vector3();

    // 1. Local Player Overhead Nameplate
    if (this.playerRig?.headGroup) {
      const localHeadPos = this.playerRig.headGroup.getWorldPosition(tempVec.clone());
      const plateAnchor = localHeadPos.clone().add(new THREE.Vector3(0, 0.45, 0));
      const distToCam = this.camera.position.distanceTo(plateAnchor);
      const screenVec = plateAnchor.clone().project(this.camera);

      if (screenVec.z < 1.0 && distToCam < 45) {
        const screenX = (screenVec.x * 0.5 + 0.5) * this.container.clientWidth;
        const screenY = (-(screenVec.y * 0.5) + 0.5) * this.container.clientHeight;

        projectedNameplates.push({
          id: `plate_${this.playerState.id}`,
          name: this.playerState.character.name,
          clan: this.playerState.character.clan,
          role: this.playerState.character.role,
          isLeader: this.playerState.character.role === 'Leader',
          leaderLives: this.playerState.character.leaderLives,
          health: this.playerState.health,
          maxHealth: this.playerState.maxHealth,
          screenX,
          screenY,
          distance: distToCam,
          visible: true,
        });
      }
    }

    // 2. Remote Players & Simulated Clanmate Nameplates
    const rpList = this.networkEngine.getRemotePlayers();
    rpList.forEach((rp) => {
      if (rp.meshGroup.visible && rp.currentRealm === this.playerState.currentRealm) {
        let rHeadPos = rp.rig?.headGroup
          ? rp.rig.headGroup.getWorldPosition(tempVec.clone())
          : rp.meshGroup.position.clone().add(new THREE.Vector3(0, 0.45, 0));

        const plateAnchor = rHeadPos.clone().add(new THREE.Vector3(0, 0.45, 0));
        const distToCam = this.camera.position.distanceTo(plateAnchor);
        const screenVec = plateAnchor.clone().project(this.camera);

        if (screenVec.z < 1.0 && distToCam < 45) {
          const screenX = (screenVec.x * 0.5 + 0.5) * this.container.clientWidth;
          const screenY = (-(screenVec.y * 0.5) + 0.5) * this.container.clientHeight;

          projectedNameplates.push({
            id: `plate_${rp.id}`,
            name: rp.character.name,
            clan: rp.character.clan,
            role: rp.character.role,
            isLeader: rp.character.role === 'Leader',
            leaderLives: rp.character.leaderLives,
            health: rp.health,
            maxHealth: rp.maxHealth,
            screenX,
            screenY,
            distance: distToCam,
            visible: true,
          });
        }
      }
    });

    if (this.onNameplatesUpdate) {
      this.onNameplatesUpdate(projectedNameplates);
    }

    // 3. Project Speech Bubbles
    this.activeBubbles.forEach((bubble, key) => {
      if (now > bubble.expiresAt) {
        this.activeBubbles.delete(key);
        return;
      }

      let worldHeadPos: THREE.Vector3 | null = null;
      let speakerRealm: RealmId = this.playerState.currentRealm;

      if (bubble.senderId === this.playerState.id) {
        if (this.playerRig?.headGroup) {
          worldHeadPos = this.playerRig.headGroup.getWorldPosition(tempVec.clone());
        } else {
          worldHeadPos = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.45, 0));
        }
        speakerRealm = this.playerState.currentRealm;
      } else {
        const found = rpList.find((p) => p.id === bubble.senderId);
        if (found && found.meshGroup.visible) {
          if (found.rig?.headGroup) {
            worldHeadPos = found.rig.headGroup.getWorldPosition(tempVec.clone());
          } else {
            worldHeadPos = found.meshGroup.position.clone().add(new THREE.Vector3(0, 0.45, 0));
          }
          speakerRealm = found.currentRealm;
        }
      }

      if (worldHeadPos && speakerRealm === this.playerState.currentRealm) {
        const bubbleAnchor = worldHeadPos.clone().add(new THREE.Vector3(0, 0.42, 0));
        const distToCam = this.camera.position.distanceTo(bubbleAnchor);

        const screenVec = bubbleAnchor.clone().project(this.camera);
        const isInFront = screenVec.z < 1.0;

        if (isInFront && distToCam < 48) {
          const screenX = (screenVec.x * 0.5 + 0.5) * this.container.clientWidth;
          const screenY = (-(screenVec.y * 0.5) + 0.5) * this.container.clientHeight;

          const timeLeft = (bubble.expiresAt - now) / 1000;
          const opacity = Math.min(1.0, timeLeft * 1.5);
          const scale = Math.max(0.72, Math.min(1.08, 1.0 - (distToCam / 50) * 0.25));

          projectedBubbles.push({
            id: `${bubble.id}_${key}`,
            senderId: bubble.senderId,
            senderName: bubble.senderName,
            senderClan: bubble.senderClan,
            text: bubble.text,
            isRp: bubble.isRp,
            screenX,
            screenY,
            scale,
            opacity,
            visible: true,
          });
        }
      }
    });

    if (this.onSpeechBubblesUpdate) {
      this.onSpeechBubblesUpdate(projectedBubbles);
    }

    // Update Waypoint info
    if (this.activeWaypoint && this.onWaypointUpdate) {
      const dist = Math.hypot(
        this.playerState.position.x - this.activeWaypoint.x,
        this.playerState.position.z - this.activeWaypoint.z
      );
      this.onWaypointUpdate({
        name: this.activeWaypoint.name,
        x: this.activeWaypoint.x,
        z: this.activeWaypoint.z,
        distance: Math.round(dist),
      });
    }

    // React state hook update
    if (this.onStateChange) {
      this.onStateChange({ ...this.playerState });
    }
  };

  private handlePlayerMovement(delta: number) {
    // 1. If currently in mid-air Pounce Leap
    if (this.isPouncing) {
      this.pounceTimer += delta;
      const t = this.pounceTimer / this.pounceDuration;

      // Apply forward velocity impulse
      this.playerState.position.x += this.pounceVelocity.x * delta;
      this.playerState.position.z += this.pounceVelocity.z * delta;

      // Ground height + Parabolic leap arc
      const groundY = WorldBuilder.getTerrainHeight(this.playerState.currentRealm, this.playerState.position.x, this.playerState.position.z);
      const leapArc = Math.sin(Math.min(Math.PI, t * Math.PI)) * 0.65;
      this.playerState.position.y = groundY + leapArc;

      // Catch check during flight
      const caught = this.preyManager.attemptCatch(this.playerGroup.position, true, this.playerState.isSneaking);
      if (caught) {
        this.setCarriedPrey(caught);
      }

      if (this.pounceTimer >= this.pounceDuration) {
        this.isPouncing = false;
        this.playerState.position.y = groundY;
        this.playerAnimator.setState(this.playerState.isSneaking ? 'sneak' : 'idle');
      }

      this.playerGroup.position.set(
        this.playerState.position.x,
        this.playerState.position.y,
        this.playerState.position.z
      );
      return;
    }

    // 2. Standard Directional Movement (Decoupled from Camera Yaw)
    let moveX = 0;
    let moveZ = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveZ += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveZ -= 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX += 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX -= 1;

    const isMoving = moveX !== 0 || moveZ !== 0;
    const isSprinting = this.keys['ShiftLeft'] || this.keys['ShiftRight'];

    let speed = 3.4; // normal walk/trot
    if (this.playerState.isSneaking) {
      speed = 1.4;
    } else if (isSprinting && this.playerState.stamina > 5) {
      speed = 7.2;
      this.playerState.stamina = Math.max(0, this.playerState.stamina - 14 * delta);
    } else {
      // Regenerate stamina when not sprinting
      this.playerState.stamina = Math.min(this.playerState.maxStamina, this.playerState.stamina + 10 * delta);
    }

    // Has Sprain injury? Slow down
    const hasSprain = this.playerState.injuries.some((i) => i.type === 'sprain');
    if (hasSprain) speed *= 0.7;

    // Bleeding drains HP
    const hasBleed = this.playerState.injuries.some((i) => i.type === 'bleeding');
    if (hasBleed) {
      this.playerState.health = Math.max(1, this.playerState.health - 1.5 * delta);
    }

    if (isMoving) {
      // Calculate move angle relative to camera yaw (camera yaw stays completely undisturbed by movement keys)
      const moveAngle = Math.atan2(moveX, moveZ) + this.cameraYaw;
      const vx = Math.sin(moveAngle) * speed;
      const vz = Math.cos(moveAngle) * speed;

      this.playerState.velocity = { x: vx, y: 0, z: vz };
      this.playerState.position.x += vx * delta;
      this.playerState.position.z += vz * delta;

      // Smooth rotate cat mesh to face movement direction
      let diff = moveAngle - this.playerGroup.rotation.y;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      this.playerGroup.rotation.y += diff * 12.0 * delta;
      this.playerState.rotation.yaw = this.playerGroup.rotation.y;

      // Set animation state
      if (this.playerState.isSneaking) {
        this.playerAnimator.setState('sneak');
      } else if (isSprinting) {
        this.playerAnimator.setState('sprint');
      } else {
        this.playerAnimator.setState('walk');
      }

      // Footsteps
      if (Math.random() < 0.1) {
        soundEngine.playFootstep('grass');
      }
    } else {
      this.playerState.velocity = { x: 0, y: 0, z: 0 };
      if (this.playerAnimator.getState() === 'walk' || this.playerAnimator.getState() === 'sprint') {
        this.playerAnimator.setState(this.playerState.isSneaking ? 'sneak' : 'idle');
      }
    }

    // Bounds restriction
    this.playerState.position.x = Math.max(-95, Math.min(95, this.playerState.position.x));
    this.playerState.position.z = Math.max(-95, Math.min(95, this.playerState.position.z));

    // Dynamic Terrain Height Physics & Surface Snapping
    const targetGroundY = WorldBuilder.getTerrainHeight(this.playerState.currentRealm, this.playerState.position.x, this.playerState.position.z);
    this.playerState.position.y += (targetGroundY - this.playerState.position.y) * Math.min(1.0, 18.0 * delta);

    this.playerGroup.position.set(
      this.playerState.position.x,
      this.playerState.position.y,
      this.playerState.position.z
    );
  }

  private updateCamera() {
    const target = this.playerGroup.position.clone().add(new THREE.Vector3(0, 0.45, 0));
    const cx = target.x - Math.sin(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;
    const cy = target.y + Math.sin(this.cameraPitch) * this.cameraDistance;
    const cz = target.z - Math.cos(this.cameraYaw) * Math.cos(this.cameraPitch) * this.cameraDistance;

    this.camera.position.set(cx, cy, cz);
    this.camera.lookAt(target);
  }

  private checkInteractables() {
    const pPos = this.playerGroup.position;
    let closestPrompt: { text: string; action: () => void } | null = null;

    // 1. Check nearby live prey (< 4.5m)
    const nearbyPrey = this.preyManager.getClosestLivePrey(pPos, 4.5);
    if (nearbyPrey) {
      if (!this.playerState.carriedPrey) {
        const pType = nearbyPrey.entity.type.toUpperCase();
        closestPrompt = {
          text: `Press E or Space to Pounce & Catch ${pType} (Hold C to Stalk)`,
          action: () => this.triggerPounce(),
        };
      }
    }

    // 2. Check world objects & points of interest
    if (this.worldObjects) {
      for (const item of this.worldObjects.interactables) {
        const dist = pPos.distanceTo(item.position);
        if (dist <= item.radius) {
          if (item.type === 'fresh_kill_pile') {
            if (this.playerState.carriedPrey) {
              closestPrompt = {
                text: `Press E to Deposit ${this.playerState.carriedPrey.name} into Fresh-Kill Pile (+10 Rep)`,
                action: () => this.depositPreyToCamp(),
              };
            } else {
              closestPrompt = {
                text: 'Fresh-Kill Pile (Bring hunted prey here for Clan reputation)',
                action: () => {},
              };
            }
          } else if (item.type === 'moonpool_altar') {
            closestPrompt = {
              text: 'Press E to Touch Sacred Pool & Commune with StarClan',
              action: () => {
                if (this.onProphecyVisionRequested) this.onProphecyVisionRequested();
              },
            };
          } else if (item.type === 'starclan_spirit') {
            const spData = item.data as any;
            closestPrompt = {
              text: `Speak with ${spData.name}`,
              action: () => {
                if (this.onProphecyVisionRequested) this.onProphecyVisionRequested();
              },
            };
          } else if (item.type === 'darkforest_instructor') {
            closestPrompt = {
              text: 'Enter Shadow Combat Training Trial',
              action: () => {
                if (this.onDarkForestTrialRequested) this.onDarkForestTrialRequested();
              },
            };
          } else if (item.type === 'clan_change_stone') {
            closestPrompt = {
              text: 'Press E to Commune at Gathering Stone (Change Clan)',
              action: () => {
                if (this.onClanChangeRequested) this.onClanChangeRequested();
              },
            };
          } else if (item.type === 'herb_plant') {
            const herbNode = this.worldObjects.herbNodes.find((h) => h.id === item.id);
            if (herbNode && !herbNode.harvested) {
              closestPrompt = {
                text: `Press E to Harvest ${(item.data as any).name}`,
                action: () => this.harvestHerb(herbNode),
              };
            }
          }
          break;
        }
      }
    }

    if (this.onInteractPrompt) {
      this.onInteractPrompt(closestPrompt);
    }
  }

  public takeDamage(amount: number, cause: string = 'Combat wound') {
    this.playerState.health = Math.max(0, this.playerState.health - amount);
    this.playerAnimator.setState('hurt');

    if (this.playerState.health <= 0) {
      const res = LeaderNineLivesSystem.handleLethalDamage(this.playerState, cause, this.playerState.currentRealm);
      if (res.resurrectedImmediately) {
        if (this.onLeaderLifeLost) {
          this.onLeaderLifeLost(res.remainingLives, res.message);
        }
      } else {
        if (this.onPlayerDied) {
          this.onPlayerDied();
        }
      }
    }
  }

  public destroy() {
    if (this.rAf1 !== null) cancelAnimationFrame(this.rAf1);
    if (this.rAf2 !== null) cancelAnimationFrame(this.rAf2);
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    window.removeEventListener('resize', this.onResize);
    this.networkEngine.disconnect();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }

  public dispose() {
    this.destroy();
  }
}
