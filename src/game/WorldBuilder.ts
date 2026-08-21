import * as THREE from 'three';
import { RealmId } from '../types/game';

export interface WorldObjects {
  realmGroup: THREE.Group;
  interactables: {
    type: 'fresh_kill_pile' | 'moonpool_altar' | 'starclan_spirit' | 'darkforest_instructor' | 'herb_plant' | 'border_scent' | 'clan_change_stone';
    id: string;
    position: THREE.Vector3;
    radius: number;
    data?: unknown;
  }[];
  waterMeshes: THREE.Mesh[];
  herbNodes: { id: string; type: string; mesh: THREE.Group; position: THREE.Vector3; harvested: boolean }[];
  freshKillMeshGroup: THREE.Group;
  scentVisionGroup: THREE.Group;
}

export class WorldBuilder {
  /**
   * Builds the specified realm into the scene
   */
  public static buildRealm(realm: RealmId): WorldObjects {
    const realmGroup = new THREE.Group();
    realmGroup.name = `Realm_${realm}`;

    const interactables: WorldObjects['interactables'] = [];
    const waterMeshes: THREE.Mesh[] = [];
    const herbNodes: WorldObjects['herbNodes'] = [];
    const freshKillMeshGroup = new THREE.Group();
    freshKillMeshGroup.name = 'FreshKillPileGroup';
    const scentVisionGroup = new THREE.Group();
    scentVisionGroup.name = 'ScentVisionGroup';
    scentVisionGroup.visible = false; // Toggled via Scent Sense

    if (realm === 'territory') {
      this.buildTerritoryRealm(realmGroup, interactables, waterMeshes, herbNodes, freshKillMeshGroup, scentVisionGroup);
    } else if (realm === 'moonpool') {
      this.buildMoonpoolRealm(realmGroup, interactables, waterMeshes, scentVisionGroup);
    } else if (realm === 'starclan') {
      this.buildStarClanRealm(realmGroup, interactables, waterMeshes);
    } else if (realm === 'darkforest') {
      this.buildDarkForestRealm(realmGroup, interactables, waterMeshes);
    }

    realmGroup.add(freshKillMeshGroup);
    realmGroup.add(scentVisionGroup);

    return {
      realmGroup,
      interactables,
      waterMeshes,
      herbNodes,
      freshKillMeshGroup,
      scentVisionGroup,
    };
  }

  public static updateFreshKillPileCount(worldObjects: WorldObjects, count: number) {
    if (!worldObjects.freshKillMeshGroup) return;
    const group = worldObjects.freshKillMeshGroup;
    // Clear existing small prey spheres (keep the base cylinder)
    while (group.children.length > 1) {
      group.remove(group.children[group.children.length - 1]);
    }

    const preyMat1 = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
    const preyMat2 = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

    const visualCount = Math.min(count, 20);
    for (let p = 0; p < visualCount; p++) {
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 6, 6),
        p % 2 === 0 ? preyMat1 : preyMat2
      );
      pMesh.position.set(
        (Math.random() - 0.5) * 2.0,
        0.25 + (p / visualCount) * 0.4,
        (Math.random() - 0.5) * 2.0
      );
      pMesh.castShadow = true;
      group.add(pMesh);
    }
  }

  // ==========================================
  // 1. OVERWORLD CLAN TERRITORY
  // ==========================================
  private static buildTerritoryRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[],
    herbNodes: WorldObjects['herbNodes'],
    freshKillGroup: THREE.Group,
    scentGroup: THREE.Group
  ) {
    // 1. Terrain Mesh (200x200m)
    const terrainGeo = new THREE.PlaneGeometry(220, 220, 64, 64);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // River depression winding through x in [-60, -30]
      let y = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 2.5;
      // Camp hollow bowl at center (x: 0, z: 0)
      const distFromCenter = Math.sqrt(x * x + z * z);
      if (distFromCenter < 35) {
        y = (distFromCenter / 35) * 2.5 - 2.5;
      }
      // River channel
      if (x > 35 && x < 65) {
        y -= 2.2;
      }
      // Outer mountain cliffs
      if (Math.abs(x) > 85 || Math.abs(z) > 85) {
        y += Math.pow((Math.max(Math.abs(x), Math.abs(z)) - 85) * 0.4, 1.6);
      }

      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x3e6b27, // Rich forest moss green
      roughness: 0.85,
      metalness: 0.05,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    parent.add(terrainMesh);

    // 2. Flowing River Water Plane
    const riverGeo = new THREE.PlaneGeometry(32, 180, 16, 32);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.15,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(50, -1.2, 0);
    parent.add(riverMesh);
    waterMeshes.push(riverMesh);

    // 3. Camp Features (Highrock, Dens, Freshkill Pile)
    // Highrock
    const highrockGeo = new THREE.DodecahedronGeometry(4.5, 1);
    highrockGeo.scale(1.4, 1.8, 1.2);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const highrock = new THREE.Mesh(highrockGeo, rockMat);
    highrock.position.set(-14, 1.2, -12);
    highrock.castShadow = true;
    highrock.receiveShadow = true;
    parent.add(highrock);

    // Leader's Den cave entrance
    const leaderCave = new THREE.Mesh(new THREE.TorusGeometry(2.5, 1.0, 6, 8), rockMat);
    leaderCave.position.set(-15, -0.5, -16);
    leaderCave.rotation.y = 0.5;
    parent.add(leaderCave);

    // Medicine Cat Den (Lichen-draped rock fissure)
    const medDen = new THREE.Mesh(new THREE.DodecahedronGeometry(3.5, 1), rockMat);
    medDen.position.set(16, 0.5, -12);
    medDen.castShadow = true;
    parent.add(medDen);

    // Apprentice Den (Woven bramble hollow)
    const brambleMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const appDen = new THREE.Mesh(new THREE.TorusGeometry(3.0, 1.2, 6, 8), brambleMat);
    appDen.position.set(-16, -1.0, 14);
    appDen.rotation.x = Math.PI / 2;
    parent.add(appDen);

    // Nursery (Gorse bushes)
    const nurseryMat = new THREE.MeshStandardMaterial({ color: 0xca8a04, roughness: 0.9 });
    const nursery = new THREE.Mesh(new THREE.SphereGeometry(3.2, 8, 8), nurseryMat);
    nursery.position.set(15, -0.8, 14);
    nursery.scale.set(1.2, 0.7, 1.2);
    parent.add(nursery);

    // Fresh-Kill Pile at Camp Center
    freshKillGroup.position.set(0, -2.4, 0);
    const pileRock = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.5, 0.4, 12), rockMat);
    freshKillGroup.add(pileRock);

    // Initial prey visually piled
    for (let p = 0; p < 8; p++) {
      const pMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 6, 6), new THREE.MeshStandardMaterial({ color: p % 2 === 0 ? 0x9ca3af : 0xd97706 }));
      pMesh.position.set((Math.random() - 0.5) * 2.0, 0.25 + (p / 8) * 0.3, (Math.random() - 0.5) * 2.0);
      freshKillGroup.add(pMesh);
    }

    interactables.push({
      type: 'fresh_kill_pile',
      id: 'camp_freshkill',
      position: new THREE.Vector3(0, -2.4, 0),
      radius: 3.5,
    });

    // Clan Change Gathering Stone (Neutral Border)
    const gatheringStone = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.4, 1.5, 8), new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.2 }));
    gatheringStone.position.set(-65, 0.8, -65);
    gatheringStone.castShadow = true;
    parent.add(gatheringStone);

    // Rune ring
    const runeRing = new THREE.Mesh(new THREE.RingGeometry(2.5, 3.2, 16), new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide }));
    runeRing.position.set(-65, 0.05, -65);
    runeRing.rotation.x = -Math.PI / 2;
    parent.add(runeRing);

    interactables.push({
      type: 'clan_change_stone',
      id: 'neutral_gathering_stone',
      position: new THREE.Vector3(-65, 0.8, -65),
      radius: 4.5,
    });

    // 4. Forest Canopy (Oak trees, Pines, Birch, Rocks)
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c2b14, roughness: 0.9 });
    const oakLeavesMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    const pineLeavesMat = new THREE.MeshStandardMaterial({ color: 0x14532d, roughness: 0.8 });
    const birchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.6 });

    // Seed Trees across territory
    for (let i = 0; i < 90; i++) {
      const tx = (Math.random() - 0.5) * 180;
      const tz = (Math.random() - 0.5) * 180;

      // Don't spawn trees inside camp hollow or in river
      const distFromCenter = Math.sqrt(tx * tx + tz * tz);
      if (distFromCenter < 28 || (tx > 32 && tx < 68)) continue;

      const treeType = i % 3;
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      if (treeType === 0) {
        // Broad Oak
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.9, 6.5, 6), trunkMat);
        trunk.position.y = 3.25;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(4.2, 1), oakLeavesMat);
        foliage.position.y = 7.5;
        foliage.castShadow = true;
        treeGroup.add(foliage);
      } else if (treeType === 1) {
        // Tall Pine
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 9.0, 5), trunkMat);
        trunk.position.y = 4.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        for (let l = 0; l < 3; l++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(3.5 - l * 0.8, 4.0, 6), pineLeavesMat);
          cone.position.y = 5.5 + l * 2.8;
          cone.castShadow = true;
          treeGroup.add(cone);
        }
      } else {
        // White Birch
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 7.0, 6), birchTrunkMat);
        trunk.position.y = 3.5;
        trunk.castShadow = true;
        treeGroup.add(trunk);

        const foliage = new THREE.Mesh(new THREE.SphereGeometry(3.0, 6, 6), oakLeavesMat);
        foliage.position.y = 7.0;
        foliage.scale.set(1.0, 1.4, 1.0);
        foliage.castShadow = true;
        treeGroup.add(foliage);
      }

      parent.add(treeGroup);
    }

    // 5. Scattered Boulders & Fallen Logs
    for (let b = 0; b < 25; b++) {
      const bx = (Math.random() - 0.5) * 160;
      const bz = (Math.random() - 0.5) * 160;
      if (Math.sqrt(bx * bx + bz * bz) < 22) continue;

      const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + Math.random() * 1.5, 1), rockMat);
      rock.position.set(bx, 0.4, bz);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      parent.add(rock);
    }

    // 6. Wild Medicinal Herbs
    const herbTypes = [
      { type: 'marigold', color: 0xf59e0b, name: 'Marigold Patch' },
      { type: 'dock', color: 0x84cc16, name: 'Dock Leaves' },
      { type: 'poppy_seed', color: 0xe11d48, name: 'Wild Poppies' },
      { type: 'horsetail', color: 0x10b981, name: 'Horsetail Reeds' },
      { type: 'catmint', color: 0x6366f1, name: 'Rare Catmint' },
    ];

    herbTypes.forEach((herb, idx) => {
      for (let h = 0; h < 3; h++) {
        const angle = (idx * 3 + h) * 0.45;
        const rad = 25 + (h + 1) * 14;
        const hx = Math.cos(angle) * rad;
        const hz = Math.sin(angle) * rad;

        const herbGroup = new THREE.Group();
        herbGroup.position.set(hx, 0.1, hz);

        // Herb flowers
        const flowerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), new THREE.MeshStandardMaterial({ color: herb.color, emissive: herb.color, emissiveIntensity: 0.2 }));
        flowerMesh.position.y = 0.35;
        herbGroup.add(flowerMesh);

        // Glow particle
        const glowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), new THREE.MeshBasicMaterial({ color: herb.color, transparent: true, opacity: 0.35 }));
        glowMesh.position.y = 0.35;
        herbGroup.add(glowMesh);

        parent.add(herbGroup);

        const node = {
          id: `herb_${herb.type}_${idx}_${h}`,
          type: herb.type,
          mesh: herbGroup,
          position: new THREE.Vector3(hx, 0.1, hz),
          harvested: false,
        };
        herbNodes.push(node);

        interactables.push({
          type: 'herb_plant',
          id: node.id,
          position: node.position,
          radius: 2.2,
          data: herb,
        });

        // Scent trail visualizer node
        const scentParticle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.4, 4.0, 6), new THREE.MeshBasicMaterial({ color: herb.color, transparent: true, opacity: 0.55 }));
        scentParticle.position.set(hx, 2.0, hz);
        scentGroup.add(scentParticle);
      }
    });

    // 7. Border Scent Markers
    const borderPoints = [
      { x: -75, z: 0, clan: 'ShadowPines Border' },
      { x: 75, z: 0, clan: 'RiverMist Border' },
      { x: 0, z: -75, clan: 'WindBreeze Border' },
      { x: 0, z: 75, clan: 'Two-leg Border' },
    ];
    borderPoints.forEach((bp, idx) => {
      const scentPost = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 6), trunkMat);
      scentPost.position.set(bp.x, 1.1, bp.z);
      scentPost.castShadow = true;
      parent.add(scentPost);

      const scentWisp = new THREE.Mesh(new THREE.SphereGeometry(0.8, 6, 6), new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.4 }));
      scentWisp.position.set(bp.x, 1.8, bp.z);
      scentGroup.add(scentWisp);

      interactables.push({
        type: 'border_scent',
        id: `border_${idx}`,
        position: new THREE.Vector3(bp.x, 1.1, bp.z),
        radius: 3.5,
        data: bp,
      });
    });
  }

  // ==========================================
  // 2. MOONPOOL SACRED GROTTO
  // ==========================================
  private static buildMoonpoolRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[],
    scentGroup: THREE.Group
  ) {
    // Deep Cavern Bowl
    const caveGeo = new THREE.SphereGeometry(45, 24, 24, 0, Math.PI * 2, 0, Math.PI * 0.7);
    const caveMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      side: THREE.BackSide,
      roughness: 0.9,
    });
    const caveMesh = new THREE.Mesh(caveGeo, caveMat);
    caveMesh.position.y = 10;
    parent.add(caveMesh);

    // Floor terrain
    const floorGeo = new THREE.PlaneGeometry(80, 80, 24, 24);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.receiveShadow = true;
    parent.add(floorMesh);

    // Sacred Crystal Pool
    const poolGeo = new THREE.CircleGeometry(10, 32);
    poolGeo.rotateX(-Math.PI / 2);
    const poolMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
      roughness: 0.1,
      metalness: 0.8,
    });
    const poolMesh = new THREE.Mesh(poolGeo, poolMat);
    poolMesh.position.set(0, 0.15, 0);
    parent.add(poolMesh);
    waterMeshes.push(poolMesh);

    // Surrounding Glowing Crystal Shards
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0x60a5fa,
      emissiveIntensity: 0.8,
      roughness: 0.1,
    });

    for (let c = 0; c < 16; c++) {
      const angle = (c / 16) * Math.PI * 2;
      const dist = 10.5;
      const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.5, 5), crystalMat);
      crystal.position.set(Math.cos(angle) * dist, 1.6, Math.sin(angle) * dist);
      crystal.rotation.z = Math.sin(angle) * 0.3;
      crystal.rotation.x = Math.cos(angle) * 0.3;
      parent.add(crystal);
    }

    // Sacred Altar Interaction Point
    interactables.push({
      type: 'moonpool_altar',
      id: 'sacred_moonpool_shrine',
      position: new THREE.Vector3(0, 0.2, 0),
      radius: 6.0,
    });

    // Celestial Beam of Light from roof
    const beamGeo = new THREE.CylinderGeometry(2.5, 4.0, 35, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.set(0, 16, 0);
    parent.add(beamMesh);
  }

  // ==========================================
  // 3. STARCLAN SILVERPELT REALM
  // ==========================================
  private static buildStarClanRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[]
  ) {
    // Ethereal Silverpelt terrain
    const starFloorGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    starFloorGeo.rotateX(-Math.PI / 2);
    const starFloorMat = new THREE.MeshStandardMaterial({
      color: 0x1e1b4b,
      emissive: 0x312e81,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.6,
    });
    const starFloor = new THREE.Mesh(starFloorGeo, starFloorMat);
    parent.add(starFloor);

    // Silverpelt Milky Way Stream
    const silverStreamGeo = new THREE.PlaneGeometry(24, 140, 16, 32);
    silverStreamGeo.rotateX(-Math.PI / 2);
    const silverStreamMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      emissive: 0xbfdbfe,
      emissiveIntensity: 0.7,
      roughness: 0.1,
    });
    const silverStream = new THREE.Mesh(silverStreamGeo, silverStreamMat);
    silverStream.position.set(0, 0.05, 0);
    parent.add(silverStream);
    waterMeshes.push(silverStream);

    // Ancestral Star Tree of Whispers
    const starTreeTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 12, 8), new THREE.MeshStandardMaterial({ color: 0xe0e7ff, emissive: 0x818cf8, emissiveIntensity: 0.5 }));
    starTreeTrunk.position.set(0, 6, -30);
    parent.add(starTreeTrunk);

    const starTreeFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(8.0, 2), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7, emissiveIntensity: 0.75, transparent: true, opacity: 0.85 }));
    starTreeFoliage.position.set(0, 14, -30);
    parent.add(starTreeFoliage);

    // Ancestral Star Spirits
    const spirits = [
      { name: 'SilverStar (Ancient Leader)', x: -8, z: -15, role: 'Bestows Leader Nine-Lives Blessings' },
      { name: 'GoldenFeather (Old Medicine Elder)', x: 8, z: -15, role: 'Reveals Sacred Prophecies' },
      { name: 'NightWatcher (Star Warrior)', x: 0, z: -22, role: 'Teaches Ancestral Combat Virtues' },
    ];

    spirits.forEach((sp, idx) => {
      const spiritGroup = new THREE.Group();
      spiritGroup.position.set(sp.x, 0.5, sp.z);

      const spiritGlow = new THREE.Mesh(new THREE.SphereGeometry(1.0, 12, 12), new THREE.MeshBasicMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.65 }));
      spiritGroup.add(spiritGlow);

      parent.add(spiritGroup);

      interactables.push({
        type: 'starclan_spirit',
        id: `spirit_${idx}`,
        position: new THREE.Vector3(sp.x, 0.5, sp.z),
        radius: 4.0,
        data: sp,
      });
    });
  }

  // ==========================================
  // 4. DARK FOREST (PLACE OF NO STARS)
  // ==========================================
  private static buildDarkForestRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[]
  ) {
    // Murky Wasteland Floor
    const darkFloorGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
    darkFloorGeo.rotateX(-Math.PI / 2);
    const darkFloorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.95,
    });
    const darkFloor = new THREE.Mesh(darkFloorGeo, darkFloorMat);
    parent.add(darkFloor);

    // Stagnant Black Marsh Pools
    const marshGeo = new THREE.CircleGeometry(16, 24);
    marshGeo.rotateX(-Math.PI / 2);
    const marshMat = new THREE.MeshStandardMaterial({
      color: 0x3b0764,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.2,
      roughness: 0.2,
    });
    const marsh = new THREE.Mesh(marshGeo, marshMat);
    marsh.position.set(15, 0.05, 10);
    parent.add(marsh);
    waterMeshes.push(marsh);

    // Twisted Dead Gnarled Trees
    const deadWoodMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    for (let t = 0; t < 30; t++) {
      const tx = (Math.random() - 0.5) * 140;
      const tz = (Math.random() - 0.5) * 140;
      const deadTree = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.8, 8.0, 5), deadWoodMat);
      deadTree.position.set(tx, 4.0, tz);
      deadTree.rotation.set((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4);
      parent.add(deadTree);
    }

    // Shadow Training Ground Arena
    const arenaRing = new THREE.Mesh(new THREE.RingGeometry(8, 9, 24), new THREE.MeshBasicMaterial({ color: 0xdc2626, side: THREE.DoubleSide }));
    arenaRing.position.set(0, 0.05, -15);
    arenaRing.rotation.x = -Math.PI / 2;
    parent.add(arenaRing);

    // Shadowy Instructors
    const shadowInstructor = {
      name: 'ShadeFang (Renegade Warrior)',
      x: 0,
      z: -15,
      role: 'Offers Brutal Combat Training Trials',
    };

    const shadowGroup = new THREE.Group();
    shadowGroup.position.set(shadowInstructor.x, 0.5, shadowInstructor.z);

    const shadowGlow = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7f1d1d, transparent: true, opacity: 0.7 }));
    shadowGroup.add(shadowGlow);
    parent.add(shadowGroup);

    interactables.push({
      type: 'darkforest_instructor',
      id: 'dark_instructor_shadefang',
      position: new THREE.Vector3(shadowInstructor.x, 0.5, shadowInstructor.z),
      radius: 4.5,
      data: shadowInstructor,
    });
  }
}
