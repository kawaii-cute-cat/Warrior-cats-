import * as THREE from 'three';
import { PreyEntity, PreyItem } from '../types/game';
import { CatMeshBuilder } from './CatMeshBuilder';
import { soundEngine } from '../audio/SoundEngine';

export class PreyEntityManager {
  private preyList: { entity: PreyEntity; mesh: THREE.Group }[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public initPrey(count: number = 14) {
    this.clearAll();
    const types: ('mouse' | 'rabbit' | 'bird' | 'fish' | 'vole' | 'squirrel')[] = [
      'mouse', 'mouse', 'vole', 'rabbit', 'rabbit', 'bird', 'fish', 'squirrel',
    ];

    for (let i = 0; i < count; i++) {
      const type = types[i % types.length];
      const angle = Math.random() * Math.PI * 2;
      const dist = 22 + Math.random() * 65;
      let x = Math.cos(angle) * dist;
      let z = Math.sin(angle) * dist;
      let y = 0.2;

      if (type === 'fish') {
        // Spawn inside river channel (x: 40-60)
        x = 42 + Math.random() * 16;
        z = (Math.random() - 0.5) * 120;
        y = -1.1;
      }

      const entity: PreyEntity = {
        id: `prey_${Date.now()}_${i}`,
        type,
        position: { x, y, z },
        rotation: Math.random() * Math.PI * 2,
        state: 'idle',
        speed: type === 'rabbit' ? 5.5 : (type === 'bird' ? 6.0 : 3.2),
        alertLevel: 0,
        fleeTimer: 0,
      };

      const mesh = CatMeshBuilder.buildPreyMesh(type);
      mesh.position.set(x, y, z);
      mesh.rotation.y = entity.rotation;
      this.scene.add(mesh);

      this.preyList.push({ entity, mesh });
    }
  }

  public update(delta: number, playerPos: THREE.Vector3, isPlayerSneaking: boolean, playerSpeed: number): PreyEntity[] {
    const updatedEntities: PreyEntity[] = [];

    for (let i = this.preyList.length - 1; i >= 0; i--) {
      const item = this.preyList[i];
      const { entity, mesh } = item;

      if (entity.state === 'caught') continue;

      const pPos = new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z);
      const distToPlayer = pPos.distanceTo(playerPos);

      // Detection radius varies by player stance
      let detectionRadius = 16.0;
      if (isPlayerSneaking) {
        detectionRadius = 5.5; // Sneak allows very close stalking!
      } else if (playerSpeed > 6.0) {
        detectionRadius = 24.0; // Sprinting spooks prey from far away!
      } else if (playerSpeed > 2.5) {
        detectionRadius = 14.0; // Normal trot
      }

      // Prey AI State Transitions
      if (distToPlayer < detectionRadius && entity.type !== 'fish') {
        entity.state = 'flee';
        entity.alertLevel = 100;
        entity.fleeTimer = 3.0; // Flee for 3 seconds
      } else if (entity.fleeTimer && entity.fleeTimer > 0) {
        entity.fleeTimer -= delta;
        if (entity.fleeTimer <= 0) {
          entity.state = 'wander';
          entity.alertLevel = 20;
        }
      }

      // Movement behavior
      if (entity.state === 'flee') {
        // Run directly away from player
        const fleeDir = pPos.clone().sub(playerPos).normalize();
        pPos.addScaledVector(fleeDir, entity.speed * delta);
        entity.rotation = Math.atan2(fleeDir.x, fleeDir.z);

        // Little bounce
        mesh.position.y = entity.position.y + Math.abs(Math.sin(Date.now() * 0.015)) * 0.15;
      } else if (entity.state === 'wander' || Math.random() < 0.02) {
        entity.rotation += (Math.random() - 0.5) * 0.8;
        const forward = new THREE.Vector3(Math.sin(entity.rotation), 0, Math.cos(entity.rotation));
        pPos.addScaledVector(forward, (entity.speed * 0.25) * delta);
        mesh.position.y = entity.position.y;
      }

      // Keep within bounds
      if (Math.abs(pPos.x) > 85) pPos.x = Math.sign(pPos.x) * 84;
      if (Math.abs(pPos.z) > 85) pPos.z = Math.sign(pPos.z) * 84;

      entity.position.x = pPos.x;
      entity.position.z = pPos.z;
      mesh.position.x = pPos.x;
      mesh.position.z = pPos.z;
      mesh.rotation.y = entity.rotation;

      updatedEntities.push(entity);
    }

    return updatedEntities;
  }

  /**
   * Finds the closest uncaught live prey within a maximum distance
   */
  public getClosestLivePrey(playerPos: THREE.Vector3, maxDist: number = 4.5): { entity: PreyEntity; distance: number } | null {
    let closest: { entity: PreyEntity; distance: number } | null = null;

    for (const item of this.preyList) {
      if (item.entity.state === 'caught') continue;
      const pPos = new THREE.Vector3(item.entity.position.x, item.entity.position.y, item.entity.position.z);
      const dist = pPos.distanceTo(playerPos);
      if (dist <= maxDist) {
        if (!closest || dist < closest.distance) {
          closest = { entity: item.entity, distance: dist };
        }
      }
    }

    return closest;
  }

  /**
   * Attempts to catch nearby prey when player pounces or attacks
   */
  public attemptCatch(playerPos: THREE.Vector3, isPouncing: boolean, isSneaking: boolean): PreyItem | null {
    for (let i = 0; i < this.preyList.length; i++) {
      const { entity, mesh } = this.preyList[i];
      if (entity.state === 'caught') continue;

      const pPos = new THREE.Vector3(entity.position.x, entity.position.y, entity.position.z);
      const dist = pPos.distanceTo(playerPos);

      const catchRadius = isPouncing ? 3.8 : 2.0;

      if (dist <= catchRadius) {
        // Roll catch probability
        let chance = 0.5;
        if (isPouncing) chance += 0.35;
        if (isSneaking) chance += 0.2;

        if (Math.random() <= chance) {
          entity.state = 'caught';
          this.scene.remove(mesh);
          soundEngine.playPreyCaught();

          const preyItem: PreyItem = {
            id: `caught_${entity.id}`,
            type: entity.type,
            name: `${entity.type.charAt(0).toUpperCase() + entity.type.slice(1)}`,
            nutrition: entity.type === 'rabbit' ? 35 : 20,
            weightKg: entity.type === 'rabbit' ? 1.2 : 0.25,
            freshness: 100,
          };

          // Respawn another prey after 15 seconds
          setTimeout(() => {
            if (this.preyList[i]) {
              this.respawnPrey(i);
            }
          }, 15000);

          return preyItem;
        }
      }
    }
    return null;
  }

  private respawnPrey(index: number) {
    const item = this.preyList[index];
    if (!item) return;

    const angle = Math.random() * Math.PI * 2;
    const dist = 30 + Math.random() * 50;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    item.entity.position = { x, y: 0.2, z };
    item.entity.state = 'idle';
    item.entity.alertLevel = 0;

    item.mesh.position.set(x, 0.2, z);
    this.scene.add(item.mesh);
  }

  public clearAll() {
    this.preyList.forEach((p) => this.scene.remove(p.mesh));
    this.preyList = [];
  }
}
