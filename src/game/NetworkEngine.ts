import * as THREE from 'three';
import { ChatMessage, PlayerCharacter, PlayerRuntimeState, RealmId } from '../types/game';
import { CatMeshBuilder, CatRigNodes } from './CatMeshBuilder';
import { CatAnimationController } from './CatAnimationController';

export interface RemotePlayer {
  id: string;
  character: PlayerCharacter;
  meshGroup: THREE.Group;
  rig: CatRigNodes;
  animator: CatAnimationController;
  targetPos: THREE.Vector3;
  targetYaw: number;
  currentPos: THREE.Vector3;
  currentYaw: number;
  health: number;
  maxHealth: number;
  currentRealm: RealmId;
  speechBubbleText?: string;
  speechBubbleTimer?: number;
}

export class NetworkEngine {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private myPlayerId: string = '';
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private scene: THREE.Scene;
  private onChatMessageCallback?: (msg: ChatMessage) => void;
  private onFreshKillSyncCallback?: (count: number) => void;
  private simulatedNPCs: RemotePlayer[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public connect(myState: PlayerRuntimeState, onChat: (msg: ChatMessage) => void, onFreshKill: (count: number) => void) {
    this.myPlayerId = myState.id;
    this.onChatMessageCallback = onChat;
    this.onFreshKillSyncCallback = onFreshKill;

    // Try WebSocket connection to server
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.sendJoin(myState);
      };

      this.ws.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          this.handlePacket(packet);
        } catch {
          // Packet parse error
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }

    // Spawn 3 realistic living Clan NPCs on patrol to ensure a vibrant world
    this.spawnSimulatedClanmates(myState.character.clan);
  }

  private sendJoin(playerState: PlayerRuntimeState) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'player_join',
        player: {
          id: playerState.id,
          character: playerState.character,
          position: playerState.position,
          rotation: playerState.rotation,
          animation: playerState.animation,
          health: playerState.health,
          maxHealth: playerState.maxHealth,
          currentRealm: playerState.currentRealm,
        },
      })
    );
  }

  public sendStateUpdate(playerState: PlayerRuntimeState) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'player_update',
        id: playerState.id,
        position: playerState.position,
        rotation: playerState.rotation,
        animation: playerState.animation,
        health: playerState.health,
        currentRealm: playerState.currentRealm,
      })
    );
  }

  public sendChatMessage(msg: ChatMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'chat_message',
        message: msg,
      })
    );
  }

  public sendDepositPrey(clan: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(
      JSON.stringify({
        type: 'deposit_prey',
        clan,
      })
    );
  }

  private handlePacket(packet: any) {
    if (packet.type === 'existing_players') {
      packet.players.forEach((p: any) => {
        if (p.id !== this.myPlayerId) {
          this.addOrUpdateRemotePlayer(p);
        }
      });
    } else if (packet.type === 'player_joined') {
      if (packet.player.id !== this.myPlayerId) {
        this.addOrUpdateRemotePlayer(packet.player);
      }
    } else if (packet.type === 'player_moved') {
      const rp = this.remotePlayers.get(packet.id);
      if (rp) {
        rp.targetPos.set(packet.position.x, packet.position.y, packet.position.z);
        rp.targetYaw = packet.rotation.yaw;
        rp.animator.setState(packet.animation);
        rp.currentRealm = packet.currentRealm;
        rp.health = packet.health;
      }
    } else if (packet.type === 'player_left') {
      this.removeRemotePlayer(packet.id);
    } else if (packet.type === 'chat_broadcast') {
      // Ignore broadcast if it came from our own local player (already rendered in UI)
      if (packet.message.senderId !== this.myPlayerId) {
        if (this.onChatMessageCallback) {
          this.onChatMessageCallback(packet.message);
        }
      }
      // Show speech bubble over sender head
      const sender = this.remotePlayers.get(packet.message.senderId);
      if (sender) {
        sender.speechBubbleText = packet.message.text;
        sender.speechBubbleTimer = 5.0;
      }
    } else if (packet.type === 'fresh_kill_update') {
      if (this.onFreshKillSyncCallback) {
        this.onFreshKillSyncCallback(packet.count);
      }
    }
  }

  private addOrUpdateRemotePlayer(data: any) {
    let rp = this.remotePlayers.get(data.id);
    if (!rp) {
      const { group, rig } = CatMeshBuilder.buildCat(data.character.appearance);
      const animator = new CatAnimationController(rig);
      this.scene.add(group);

      rp = {
        id: data.id,
        character: data.character,
        meshGroup: group,
        rig,
        animator,
        targetPos: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        targetYaw: data.rotation ? data.rotation.yaw : 0,
        currentPos: new THREE.Vector3(data.position.x, data.position.y, data.position.z),
        currentYaw: data.rotation ? data.rotation.yaw : 0,
        health: data.health || 100,
        maxHealth: data.maxHealth || 100,
        currentRealm: data.currentRealm || 'territory',
      };
      this.remotePlayers.set(data.id, rp);
    } else {
      rp.targetPos.set(data.position.x, data.position.y, data.position.z);
      if (data.rotation) rp.targetYaw = data.rotation.yaw;
    }
  }

  private removeRemotePlayer(id: string) {
    const rp = this.remotePlayers.get(id);
    if (rp) {
      this.scene.remove(rp.meshGroup);
      this.remotePlayers.delete(id);
    }
  }

  /**
   * Spawns autonomous clanmate NPCs who walk patrols, hunt, and rest in camp
   */
  private spawnSimulatedClanmates(playerClan: string) {
    const clanmateDefs = [
      {
        name: 'RowanPelt',
        role: 'Warrior' as const,
        pos: new THREE.Vector3(-8, -2.2, -6),
        primary: '#b45309',
        secondary: '#fef3c7',
        marking: 'mackerel_tabby' as const,
      },
      {
        name: 'FernPaw',
        role: 'Apprentice' as const,
        pos: new THREE.Vector3(-12, -1.0, 10),
        primary: '#78350f',
        secondary: '#fffbeb',
        marking: 'classic_tabby' as const,
      },
      {
        name: 'WillowWhisper',
        role: 'Medicine Cat' as const,
        pos: new THREE.Vector3(14, 0.4, -10),
        primary: '#94a3b8',
        secondary: '#f8fafc',
        marking: 'colorpoint' as const,
      },
    ];

    clanmateDefs.forEach((def, idx) => {
      const char: PlayerCharacter = {
        id: `npc_clanmate_${idx}`,
        name: def.name,
        prefix: def.name.slice(0, 5),
        suffix: def.name.slice(5),
        clan: playerClan as any,
        role: def.role,
        appearance: {
          bodyType: def.role === 'Apprentice' ? 'apprentice' : 'adult',
          furStyle: 'medium_soft',
          primaryColor: def.primary,
          secondaryColor: def.secondary,
          underbellyColor: '#fffbeb',
          markingType: def.marking,
          eyeColorLeft: '#10b981',
          eyeColorRight: '#10b981',
          isHeterochromia: false,
          eyeState: 'normal',
          muzzleLength: 1.0,
          earSize: 1.0,
          earTufts: false,
          tailLength: 1.0,
          tailThickness: 1.0,
          legLength: 1.0,
          pawSize: 1.0,
          bodyScale: 1.0,
          accessory: 'oak_leaves',
          scar: 'none',
          aura: 'none',
        },
        reputation: 80,
        leaderLives: 1,
        maxLeaderLives: 1,
        deathHistory: [],
        createdAt: new Date().toISOString(),
        lastPlayed: new Date().toISOString(),
      };

      const { group, rig } = CatMeshBuilder.buildCat(char.appearance);
      group.position.copy(def.pos);
      this.scene.add(group);

      const animator = new CatAnimationController(rig);
      animator.setState('idle');

      const rp: RemotePlayer = {
        id: char.id,
        character: char,
        meshGroup: group,
        rig,
        animator,
        targetPos: def.pos.clone(),
        targetYaw: 0,
        currentPos: def.pos.clone(),
        currentYaw: 0,
        health: 100,
        maxHealth: 100,
        currentRealm: 'territory',
      };

      this.remotePlayers.set(char.id, rp);
      this.simulatedNPCs.push(rp);
    });
  }

  public update(delta: number, currentRealm: RealmId) {
    const now = Date.now();

    // 1. Update remote players interpolation
    this.remotePlayers.forEach((rp) => {
      // Only render in current realm
      rp.meshGroup.visible = rp.currentRealm === currentRealm;
      if (!rp.meshGroup.visible) return;

      // Smooth dead-reckoning position lerp
      rp.currentPos.lerp(rp.targetPos, 10.0 * delta);
      rp.meshGroup.position.copy(rp.currentPos);

      // Smooth rotation slerp
      let diff = rp.targetYaw - rp.currentYaw;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      rp.currentYaw += diff * 8.0 * delta;
      rp.meshGroup.rotation.y = rp.currentYaw;

      rp.animator.update(delta);

      // Speech bubble timer
      if (rp.speechBubbleTimer && rp.speechBubbleTimer > 0) {
        rp.speechBubbleTimer -= delta;
        if (rp.speechBubbleTimer <= 0) {
          rp.speechBubbleText = undefined;
        }
      }
    });

    // 2. Autonomous behavior for simulated clanmates
    this.simulatedNPCs.forEach((npc, i) => {
      if (Math.random() < 0.008) {
        // Switch state (wander, groom, sit, idle)
        const rand = Math.random();
        if (rand < 0.3) {
          npc.animator.setState('idle');
        } else if (rand < 0.5) {
          npc.animator.setState('groom');
        } else if (rand < 0.7) {
          npc.animator.setState('sit');
        } else {
          // Patrol wander near camp
          npc.animator.setState('walk');
          const angle = Math.random() * Math.PI * 2;
          const rad = 8 + Math.random() * 14;
          npc.targetPos.set(Math.cos(angle) * rad, -2.2, Math.sin(angle) * rad);
          npc.targetYaw = angle + Math.PI / 2;
        }
      }
    });
  }

  public getRemotePlayers(): RemotePlayer[] {
    return Array.from(this.remotePlayers.values());
  }

  public disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.remotePlayers.forEach((rp) => this.scene.remove(rp.meshGroup));
    this.remotePlayers.clear();
  }
}
