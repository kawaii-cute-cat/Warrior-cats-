import * as THREE from 'three';
import { RealmId } from '../types/game';

export interface WorldObjects {
  realmGroup: THREE.Group;
  interactables: {
    type: 'fresh_kill_pile' | 'moonpool_altar' | 'starclan_spirit' | 'darkforest_instructor' | 'herb_plant' | 'border_scent' | 'clan_change_stone';
    id: string;
    position: THREE.Vector3;
    radius: number;
    data?: any;
  }[];
  waterMeshes: THREE.Mesh[];
  herbNodes: { id: string; type: string; mesh: THREE.Group; position: THREE.Vector3; harvested: boolean }[];
  freshKillMeshGroup: THREE.Group;
  riverClanFreshKillGroup?: THREE.Group;
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
    freshKillMeshGroup.name = 'ThunderClan_FreshKillPile';
    const riverClanFreshKillGroup = new THREE.Group();
    riverClanFreshKillGroup.name = 'RiverClan_FreshKillPile';

    const scentVisionGroup = new THREE.Group();
    scentVisionGroup.name = 'ScentVisionGroup';
    scentVisionGroup.visible = false;

    if (realm === 'territory') {
      this.buildTwoClanConnectedTerritory(
        realmGroup,
        interactables,
        waterMeshes,
        herbNodes,
        freshKillMeshGroup,
        riverClanFreshKillGroup,
        scentVisionGroup
      );
    } else if (realm === 'moonpool') {
      this.buildMoonpoolRealm(realmGroup, interactables, waterMeshes, scentVisionGroup);
    } else if (realm === 'starclan') {
      this.buildStarClanRealm(realmGroup, interactables, waterMeshes);
    } else if (realm === 'darkforest') {
      this.buildDarkForestRealm(realmGroup, interactables, waterMeshes);
    }

    realmGroup.add(freshKillMeshGroup);
    realmGroup.add(riverClanFreshKillGroup);
    realmGroup.add(scentVisionGroup);

    return {
      realmGroup,
      interactables,
      waterMeshes,
      herbNodes,
      freshKillMeshGroup,
      riverClanFreshKillGroup,
      scentVisionGroup,
    };
  }

  /**
   * Evaluates terrain elevation at any 2D coordinate for accurate physics and foot grounding.
   */
  public static getTerrainHeight(realm: RealmId, x: number, z: number): number {
    if (realm === 'territory') {
      let y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2.0;

      // ThunderClan Ravine Camp (around x: -65, z: -25)
      const distTC = Math.hypot(x - (-65), z - (-25));
      if (distTC < 40) {
        y -= (1.0 - distTC / 40) * 3.8;
      }

      // RiverClan Island Camp (around x: 65, z: 25)
      const distRC = Math.hypot(x - 65, z - 25);
      if (distRC < 35) {
        y -= (1.0 - distRC / 35) * 1.5;
      }

      // Winding River Channel running diagonally through center
      const riverCenterX = Math.sin(z * 0.03) * 22;
      const distToRiver = Math.abs(x - riverCenterX);
      if (distToRiver < 18) {
        y -= Math.cos((distToRiver / 18) * (Math.PI / 2)) * 3.2;
      }

      // Sunningrocks Cliff (x: -18 to 2, z: -15 to 20)
      if (x > -18 && x < 2 && z > -15 && z < 20) {
        y += 2.8;
      }

      // Outer boundary mountain ridge
      const maxCoord = Math.max(Math.abs(x), Math.abs(z));
      if (maxCoord > 130) {
        y += Math.pow((maxCoord - 130) * 0.5, 1.7);
      }

      return y;
    } else if (realm === 'moonpool') {
      // Moonpool basin
      const distCenter = Math.hypot(x, z);
      if (distCenter < 10) {
        return 0.05;
      }
      return 0.2;
    } else if (realm === 'starclan') {
      return 0.0;
    } else if (realm === 'darkforest') {
      return 0.0;
    }
    return 0.0;
  }

  public static updateFreshKillPileCount(worldObjects: WorldObjects, count: number) {
    if (!worldObjects.freshKillMeshGroup) return;
    const group = worldObjects.freshKillMeshGroup;
    while (group.children.length > 1) {
      group.remove(group.children[group.children.length - 1]);
    }

    const preyMat1 = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
    const preyMat2 = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });

    const visualCount = Math.min(count, 20);
    for (let p = 0; p < visualCount; p++) {
      const pMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 6, 6),
        p % 2 === 0 ? preyMat1 : preyMat2
      );
      pMesh.position.set(
        (Math.random() - 0.5) * 2.2,
        0.25 + (p / visualCount) * 0.45,
        (Math.random() - 0.5) * 2.2
      );
      pMesh.castShadow = true;
      group.add(pMesh);
    }
  }

  // =========================================================================
  // 1. TWO CONNECTED CLAN TERRITORIES: THUNDERCLAN & RIVERCLAN
  // =========================================================================
  private static buildTwoClanConnectedTerritory(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[],
    herbNodes: WorldObjects['herbNodes'],
    tcFreshKillGroup: THREE.Group,
    rcFreshKillGroup: THREE.Group,
    scentGroup: THREE.Group
  ) {
    // 1. Vast Terrain (300m x 300m)
    const terrainGeo = new THREE.PlaneGeometry(320, 320, 80, 80);
    terrainGeo.rotateX(-Math.PI / 2);

    const posAttr = terrainGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      let y = Math.sin(x * 0.04) * Math.cos(z * 0.04) * 2.0;

      // ThunderClan Ravine Camp (around x: -65, z: -25)
      const distTC = Math.hypot(x - (-65), z - (-25));
      if (distTC < 40) {
        y -= (1.0 - distTC / 40) * 3.8; // Deep sheltered ravine hollow
      }

      // RiverClan Island Camp (around x: 65, z: 25)
      const distRC = Math.hypot(x - 65, z - 25);
      if (distRC < 35) {
        y -= (1.0 - distRC / 35) * 1.5; // Low sandy riverside hollow
      }

      // Winding River Channel running diagonally through center (x: -15 to +20)
      const riverCenterX = Math.sin(z * 0.03) * 22;
      const distToRiver = Math.abs(x - riverCenterX);
      if (distToRiver < 18) {
        y -= Math.cos((distToRiver / 18) * (Math.PI / 2)) * 3.2;
      }

      // Sunningrocks Cliff (x: -10 to -2, z: -10 to 15)
      if (x > -18 && x < 2 && z > -15 && z < 20) {
        y += 2.8;
      }

      // Outer boundary mountain ridge
      const maxCoord = Math.max(Math.abs(x), Math.abs(z));
      if (maxCoord > 130) {
        y += Math.pow((maxCoord - 130) * 0.5, 1.7);
      }

      posAttr.setY(i, y);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x3d6627, // Lush forest moss and meadow green
      roughness: 0.88,
      metalness: 0.05,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = true;
    parent.add(terrainMesh);

    // 2. The Great Border River Water
    const riverGeo = new THREE.PlaneGeometry(36, 300, 16, 40);
    riverGeo.rotateX(-Math.PI / 2);
    const riverMat = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.15,
      metalness: 0.35,
      transparent: true,
      opacity: 0.82,
    });
    const riverMesh = new THREE.Mesh(riverGeo, riverMat);
    riverMesh.position.set(2, -1.3, 0);
    parent.add(riverMesh);
    waterMeshes.push(riverMesh);

    // =========================================================================
    // A. THUNDERCLAN TERRITORY & CAMP (West, X < 0)
    // =========================================================================
    const tcCampCenter = new THREE.Vector3(-65, -2.6, -25);

    // 1. Highrock in ThunderClan Camp
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
    const highrockGeo = new THREE.DodecahedronGeometry(4.8, 1);
    highrockGeo.scale(1.4, 2.0, 1.2);
    const highrock = new THREE.Mesh(highrockGeo, rockMat);
    highrock.position.set(tcCampCenter.x - 14, tcCampCenter.y + 2.5, tcCampCenter.z - 10);
    highrock.castShadow = true;
    highrock.receiveShadow = true;
    parent.add(highrock);

    // Highrock interaction (Leader announcement perch)
    interactables.push({
      type: 'border_scent',
      id: 'tc_highrock',
      position: new THREE.Vector3(highrock.position.x, highrock.position.y + 2.0, highrock.position.z),
      radius: 4.5,
      data: { clan: 'ThunderClan', name: 'The Highrock', desc: 'Call a Clan Meeting from atop Highrock' },
    });

    // 2. ThunderClan Dens:
    // Leader's Den (Cave under Highrock)
    this.createDenMesh(parent, new THREE.Vector3(tcCampCenter.x - 14, tcCampCenter.y + 0.2, tcCampCenter.z - 6), 3.2, 0x475569, 'Leader\'s Cave');
    // Warriors' Den (Big bramble thicket)
    this.createBrambleDen(parent, new THREE.Vector3(tcCampCenter.x + 12, tcCampCenter.y + 0.2, tcCampCenter.z - 12), 4.2, 'Warriors\' Bramble Den');
    // Apprentices' Den (Fern hollow)
    this.createFernDen(parent, new THREE.Vector3(tcCampCenter.x + 10, tcCampCenter.y + 0.2, tcCampCenter.z + 10), 3.4, 'Apprentices\' Fern Hollow');
    // Medicine Cat's Split-Rock Den
    this.createSplitRockDen(parent, new THREE.Vector3(tcCampCenter.x - 10, tcCampCenter.y + 0.2, tcCampCenter.z + 12), 3.6, 'Medicine Cat\'s Split-Rock Cave');
    interactables.push({
      type: 'border_scent',
      id: 'tc_med_den',
      position: new THREE.Vector3(tcCampCenter.x - 10, tcCampCenter.y + 0.5, tcCampCenter.z + 12),
      radius: 3.5,
      data: { clan: 'ThunderClan', name: 'Medicine Den', desc: 'Medicine Cat Storage' },
    });
    // Nursery (Gorse bush)
    this.createGorseDen(parent, new THREE.Vector3(tcCampCenter.x - 16, tcCampCenter.y + 0.2, tcCampCenter.z + 4), 3.8, 'Nursery Gorse Den');
    // Elders' Den (Fallen tree root hollow)
    this.createFallenLogDen(parent, new THREE.Vector3(tcCampCenter.x + 2, tcCampCenter.y + 0.2, tcCampCenter.z + 15), 3.5, 'Elders\' Hollow Log');

    // 3. ThunderClan Fresh-Kill Pile Base
    const tcBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x52525b, roughness: 0.95 })
    );
    tcBase.position.set(tcCampCenter.x, tcCampCenter.y + 0.08, tcCampCenter.z);
    tcBase.receiveShadow = true;
    tcFreshKillGroup.add(tcBase);
    tcFreshKillGroup.position.set(0, 0, 0);

    interactables.push({
      type: 'fresh_kill_pile',
      id: 'tc_fresh_kill',
      position: new THREE.Vector3(tcCampCenter.x, tcCampCenter.y + 0.2, tcCampCenter.z),
      radius: 3.2,
      data: { clan: 'ThunderClan', name: 'ThunderClan Fresh-Kill Pile' },
    });

    // 4. ThunderClan Training Hollow
    this.createTrainingHollow(parent, new THREE.Vector3(-45, -1.0, -50), 'ThunderClan Training Hollow');

    // 5. Sunningrocks on border
    this.createSunningrocks(parent, new THREE.Vector3(-8, 0.4, 4), interactables);

    // =========================================================================
    // B. RIVERCLAN TERRITORY & CAMP (East, X > 0)
    // =========================================================================
    const rcCampCenter = new THREE.Vector3(65, -1.2, 25);

    // 1. RiverClan Camp Base (Island sand clearing surrounded by reeds)
    const sandGeo = new THREE.CircleGeometry(24, 24);
    sandGeo.rotateX(-Math.PI / 2);
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.95 });
    const sandMesh = new THREE.Mesh(sandGeo, sandMat);
    sandMesh.position.set(rcCampCenter.x, rcCampCenter.y + 0.05, rcCampCenter.z);
    sandMesh.receiveShadow = true;
    parent.add(sandMesh);

    // Reed ring wall surrounding RiverClan Camp
    for (let a = 0; a < Math.PI * 2; a += 0.25) {
      const rx = rcCampCenter.x + Math.cos(a) * 22;
      const rz = rcCampCenter.z + Math.sin(a) * 22;
      this.createReedClump(parent, new THREE.Vector3(rx, rcCampCenter.y, rz));
    }

    // 2. RiverClan Leader's Tangled Willow Perch
    const rcLeaderPerch = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.5, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 })
    );
    rcLeaderPerch.position.set(rcCampCenter.x - 12, rcCampCenter.y + 0.9, rcCampCenter.z - 10);
    parent.add(rcLeaderPerch);

    interactables.push({
      type: 'border_scent',
      id: 'rc_leader_perch',
      position: new THREE.Vector3(rcLeaderPerch.position.x, rcLeaderPerch.position.y + 1.2, rcLeaderPerch.position.z),
      radius: 4.0,
      data: { clan: 'RiverClan', name: 'RiverClan Leader\'s Willow Perch', desc: 'Leader\'s Meeting Rock' },
    });

    // 3. RiverClan Dens
    this.createWillowDen(parent, new THREE.Vector3(rcCampCenter.x + 10, rcCampCenter.y + 0.2, rcCampCenter.z - 10), 3.8, 'RiverClan Warriors\' Willow Den');
    this.createReedDen(parent, new THREE.Vector3(rcCampCenter.x + 12, rcCampCenter.y + 0.2, rcCampCenter.z + 8), 3.2, 'RiverClan Apprentices\' Sedge Den');
    this.createSplitRockDen(parent, new THREE.Vector3(rcCampCenter.x - 10, rcCampCenter.y + 0.2, rcCampCenter.z + 10), 3.5, 'RiverClan Medicine Reed Den');
    this.createWillowDen(parent, new THREE.Vector3(rcCampCenter.x - 14, rcCampCenter.y + 0.2, rcCampCenter.z + 2), 3.6, 'RiverClan Feathered Nursery');

    // 4. RiverClan Fresh-Kill Fish Pile
    const rcBase = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 })
    );
    rcBase.position.set(rcCampCenter.x, rcCampCenter.y + 0.08, rcCampCenter.z);
    rcBase.receiveShadow = true;
    rcFreshKillGroup.add(rcBase);

    interactables.push({
      type: 'fresh_kill_pile',
      id: 'rc_fresh_kill',
      position: new THREE.Vector3(rcCampCenter.x, rcCampCenter.y + 0.2, rcCampCenter.z),
      radius: 3.2,
      data: { clan: 'RiverClan', name: 'RiverClan Fresh-Kill Fish Pile' },
    });

    // =========================================================================
    // C. BORDER CONNECTIONS: STEPPING STONES & FALLEN TREE BRIDGE
    // =========================================================================
    // 1. Stepping Stones Crossing (X: -14 to +14, Z: 0)
    for (let s = -14; s <= 14; s += 4.5) {
      const stoneGeo = new THREE.CylinderGeometry(1.4 + Math.random() * 0.4, 1.8, 0.9, 7);
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.position.set(s, -0.9, Math.sin(s * 0.2) * 3);
      stone.rotation.y = Math.random() * Math.PI;
      stone.receiveShadow = true;
      parent.add(stone);
    }
    interactables.push({
      type: 'border_scent',
      id: 'stepping_stones_border',
      position: new THREE.Vector3(0, -0.6, 0),
      radius: 5.0,
      data: { clan: 'Neutral', name: 'Stepping Stones Border Crossing', desc: 'River Crossing between ThunderClan and RiverClan' },
    });

    // 2. Fallen Giant Oak Tree Bridge (X: -16 to +16, Z: -70)
    const logGeo = new THREE.CylinderGeometry(0.8, 0.95, 34, 10);
    logGeo.rotateZ(Math.PI / 2);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const logBridge = new THREE.Mesh(logGeo, logMat);
    logBridge.position.set(0, -0.2, -70);
    logBridge.castShadow = true;
    parent.add(logBridge);

    interactables.push({
      type: 'border_scent',
      id: 'fallen_tree_bridge',
      position: new THREE.Vector3(0, 0.2, -70),
      radius: 4.5,
      data: { clan: 'Neutral', name: 'Fallen Tree Bridge', desc: 'High Gorge Crossing' },
    });

    // 3. Neutral Gathering Great Oak (Four Trees Island, X: 0, Z: 65)
    this.createGreatOak(parent, new THREE.Vector3(0, -0.8, 65));
    interactables.push({
      type: 'clan_change_stone',
      id: 'gathering_great_oak',
      position: new THREE.Vector3(0, -0.5, 65),
      radius: 6.0,
      data: { name: 'The Great Gathering Oak', desc: 'Neutral ground for Clan Peace and Allegiance changes' },
    });

    // =========================================================================
    // D. FORESTRY, FLORA, VEGETATION & HERBS
    // =========================================================================
    // ThunderClan dense oak & pine forest
    for (let i = 0; i < 90; i++) {
      const tx = -130 + Math.random() * 115;
      const tz = -130 + Math.random() * 260;
      // Skip right on camp center
      if (Math.hypot(tx - tcCampCenter.x, tz - tcCampCenter.z) > 28) {
        if (i % 2 === 0) {
          this.createOakTree(parent, new THREE.Vector3(tx, -2.2, tz), 0.8 + Math.random() * 0.6);
        } else {
          this.createPineTree(parent, new THREE.Vector3(tx, -2.2, tz), 0.9 + Math.random() * 0.5);
        }
      }
    }

    // RiverClan willows, reeds & wetlands
    for (let i = 0; i < 60; i++) {
      const rx = 20 + Math.random() * 110;
      const rz = -130 + Math.random() * 260;
      if (Math.hypot(rx - rcCampCenter.x, rz - rcCampCenter.z) > 28) {
        this.createWillowTree(parent, new THREE.Vector3(rx, -1.4, rz), 0.8 + Math.random() * 0.5);
        this.createReedClump(parent, new THREE.Vector3(rx + 2, -1.4, rz + 2));
      }
    }

    // Boulders & Fern patches
    for (let b = 0; b < 40; b++) {
      const bx = (Math.random() - 0.5) * 240;
      const bz = (Math.random() - 0.5) * 240;
      if (Math.abs(bx) > 15) {
        this.createForestBoulder(parent, new THREE.Vector3(bx, -1.8, bz));
      }
    }

    // Herb Nodes across both territories
    const herbTypes = ['marigold', 'dock', 'poppy_seed', 'horsetail', 'catmint'];
    const herbSpots = [
      { x: -50, z: -20, type: 'marigold' },
      { x: -75, z: -40, type: 'dock' },
      { x: -40, z: -10, type: 'poppy_seed' },
      { x: -80, z: -10, type: 'catmint' },
      { x: 50, z: 20, type: 'horsetail' },
      { x: 75, z: 10, type: 'dock' },
      { x: 80, z: 40, type: 'marigold' },
      { x: 55, z: 45, type: 'catmint' },
      { x: -10, z: 25, type: 'horsetail' },
    ];

    herbSpots.forEach((spot, idx) => {
      const hMesh = this.createHerbPlantMesh(spot.type);
      hMesh.position.set(spot.x, -1.2, spot.z);
      parent.add(hMesh);

      herbNodes.push({
        id: `herb_node_${idx}`,
        type: spot.type,
        mesh: hMesh,
        position: new THREE.Vector3(spot.x, -1.2, spot.z),
        harvested: false,
      });

      interactables.push({
        type: 'herb_plant',
        id: `herb_node_${idx}`,
        position: new THREE.Vector3(spot.x, -1.2, spot.z),
        radius: 2.2,
        data: { type: spot.type, nodeIdx: idx },
      });

      // Scent vision trail marker
      const scentTrail = this.createScentParticleMesh(spot.type === 'catmint' ? 0x22c55e : 0xf59e0b);
      scentTrail.position.set(spot.x, -0.6, spot.z);
      scentGroup.add(scentTrail);
    });

    // =========================================================================
    // E. SACRED PORTAL MONUMENTS (Moonpool, StarClan, Dark Forest)
    // =========================================================================
    // Sacred Moonpool Crystal Archway (Northeast mountain slope)
    this.createPortalArch(parent, new THREE.Vector3(100, 4.0, -100), 0x38bdf8, 'Sacred Moonpool Trail');
    interactables.push({
      type: 'border_scent',
      id: 'moonpool_portal',
      position: new THREE.Vector3(100, 4.0, -100),
      radius: 4.5,
      data: { realm: 'moonpool', name: 'Path to the Sacred Moonpool', desc: 'Journey to share tongues with StarClan' },
    });

    // Silverpelt Gateway (Northwest starlight aurora)
    this.createPortalArch(parent, new THREE.Vector3(-100, 4.0, -100), 0x818cf8, 'Silverpelt StarClan Gateway');
    interactables.push({
      type: 'starclan_spirit',
      id: 'starclan_portal',
      position: new THREE.Vector3(-100, 4.0, -100),
      radius: 4.5,
      data: { realm: 'starclan', name: 'Silverpelt Gateway', desc: 'Visit Ancestral Spirits' },
    });

    // Shadow Thorns (Southeast Dark Forest portal)
    this.createDarkForestThornPortal(parent, new THREE.Vector3(100, 2.0, 100));
    interactables.push({
      type: 'darkforest_instructor',
      id: 'darkforest_portal',
      position: new THREE.Vector3(100, 2.0, 100),
      radius: 4.5,
      data: { realm: 'darkforest', name: 'Place of No Stars (Dark Forest)', desc: 'Enter combat trials and shadow training' },
    });
  }

  // =========================================================================
  // HELPER GEOMETRY BUILDERS FOR REALISTIC CAMPS & ENVIRONMENTS
  // =========================================================================
  private static createOakTree(parent: THREE.Group, pos: THREE.Vector3, scale: number) {
    const tree = new THREE.Group();
    tree.position.copy(pos);
    tree.scale.set(scale, scale, scale);

    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    trunk.castShadow = true;
    tree.add(trunk);

    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x2e5c1e, roughness: 0.85 });
    for (let c = 0; c < 3; c++) {
      const canopyGeo = new THREE.DodecahedronGeometry(2.8 - c * 0.4, 1);
      const canopy = new THREE.Mesh(canopyGeo, canopyMat);
      canopy.position.set((Math.random() - 0.5) * 1.2, 5.5 + c * 1.8, (Math.random() - 0.5) * 1.2);
      canopy.castShadow = true;
      tree.add(canopy);
    }
    parent.add(tree);
  }

  private static createPineTree(parent: THREE.Group, pos: THREE.Vector3, scale: number) {
    const tree = new THREE.Group();
    tree.position.copy(pos);
    tree.scale.set(scale, scale, scale);

    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 7, 7);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.95 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.5;
    trunk.castShadow = true;
    tree.add(trunk);

    const pineMat = new THREE.MeshStandardMaterial({ color: 0x143819, roughness: 0.9 });
    for (let l = 0; l < 4; l++) {
      const coneGeo = new THREE.ConeGeometry(3.2 - l * 0.6, 2.5, 7);
      const cone = new THREE.Mesh(coneGeo, pineMat);
      cone.position.y = 4.2 + l * 1.8;
      cone.castShadow = true;
      tree.add(cone);
    }
    parent.add(tree);
  }

  private static createWillowTree(parent: THREE.Group, pos: THREE.Vector3, scale: number) {
    const tree = new THREE.Group();
    tree.position.copy(pos);
    tree.scale.set(scale, scale, scale);

    const trunkGeo = new THREE.CylinderGeometry(0.6, 0.9, 5, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.5;
    trunk.rotation.z = (Math.random() - 0.5) * 0.2;
    tree.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, roughness: 0.85 });
    for (let i = 0; i < 5; i++) {
      const frondGeo = new THREE.CylinderGeometry(0.1, 2.2, 4.5, 6);
      const frond = new THREE.Mesh(frondGeo, foliageMat);
      frond.position.set(Math.cos(i * 1.25) * 2.0, 4.5, Math.sin(i * 1.25) * 2.0);
      frond.rotation.x = Math.PI;
      tree.add(frond);
    }
    parent.add(tree);
  }

  private static createReedClump(parent: THREE.Group, pos: THREE.Vector3) {
    const clump = new THREE.Group();
    clump.position.copy(pos);
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x65a30d, roughness: 0.8 });
    for (let r = 0; r < 6; r++) {
      const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 2.2, 4), reedMat);
      stalk.position.set((Math.random() - 0.5) * 0.8, 1.1, (Math.random() - 0.5) * 0.8);
      stalk.rotation.z = (Math.random() - 0.5) * 0.3;
      clump.add(stalk);
    }
    parent.add(clump);
  }

  private static createBrambleDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const brambleMat = new THREE.MeshStandardMaterial({ color: 0x271e16, roughness: 0.95 });
    const geo = new THREE.TorusGeometry(radius * 0.75, radius * 0.35, 8, 12);
    const arch = new THREE.Mesh(geo, brambleMat);
    arch.rotation.x = Math.PI / 2;
    arch.position.y = radius * 0.4;
    arch.castShadow = true;
    den.add(arch);
    parent.add(den);
  }

  private static createFernDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const fernMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 2.6), fernMat);
      leaf.position.set(Math.cos(i * 0.8) * radius * 0.6, 1.0, Math.sin(i * 0.8) * radius * 0.6);
      leaf.rotation.set(-0.5, i * 0.8, 0);
      den.add(leaf);
    }
    parent.add(den);
  }

  private static createSplitRockDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.92 });
    const r1 = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * 0.8, 1), rockMat);
    r1.position.set(-radius * 0.5, radius * 0.5, 0);
    den.add(r1);
    const r2 = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * 0.75, 1), rockMat);
    r2.position.set(radius * 0.5, radius * 0.45, 0);
    den.add(r2);
    parent.add(den);
  }

  private static createGorseDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const gorseMat = new THREE.MeshStandardMaterial({ color: 0x365314, roughness: 0.95 });
    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * 0.7, 1), gorseMat);
    bush.position.y = radius * 0.5;
    den.add(bush);
    parent.add(den);
  }

  private static createFallenLogDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const logGeo = new THREE.CylinderGeometry(radius * 0.4, radius * 0.45, radius * 1.8, 8);
    logGeo.rotateZ(Math.PI / 2);
    const logMat = new THREE.MeshStandardMaterial({ color: 0x3b1d07, roughness: 0.95 });
    const logMesh = new THREE.Mesh(logGeo, logMat);
    logMesh.position.y = radius * 0.35;
    den.add(logMesh);
    parent.add(den);
  }

  private static createWillowDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const domeGeo = new THREE.SphereGeometry(radius * 0.8, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, side: THREE.DoubleSide, roughness: 0.9 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.1;
    den.add(dome);
    parent.add(den);
  }

  private static createReedDen(parent: THREE.Group, pos: THREE.Vector3, radius: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const reedMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.85 });
    for (let i = 0; i < 6; i++) {
      const clump = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.6, 2.4, 6), reedMat);
      clump.position.set(Math.cos(i) * radius * 0.5, 1.2, Math.sin(i) * radius * 0.5);
      den.add(clump);
    }
    parent.add(den);
  }

  private static createDenMesh(parent: THREE.Group, pos: THREE.Vector3, radius: number, colorHex: number, name: string) {
    const den = new THREE.Group();
    den.position.copy(pos);
    const rockMat = new THREE.MeshStandardMaterial({ color: colorHex, roughness: 0.9 });
    const cave = new THREE.Mesh(new THREE.DodecahedronGeometry(radius * 0.7, 1), rockMat);
    cave.position.y = radius * 0.4;
    den.add(cave);
    parent.add(den);
  }

  private static createTrainingHollow(parent: THREE.Group, pos: THREE.Vector3, name: string) {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(8, 11, 16),
      new THREE.MeshStandardMaterial({ color: 0xb45309, side: THREE.DoubleSide, roughness: 0.95 })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, pos.y + 0.05, pos.z);
    parent.add(ring);
  }

  private static createSunningrocks(parent: THREE.Group, pos: THREE.Vector3, interactables: WorldObjects['interactables']) {
    const group = new THREE.Group();
    group.position.copy(pos);
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.85 });

    for (let i = 0; i < 5; i++) {
      const boulder = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2 + Math.random() * 1.4, 1), rockMat);
      boulder.position.set((i - 2) * 3.2, 0.8, (Math.random() - 0.5) * 4);
      boulder.scale.set(1.4, 0.8, 1.2);
      boulder.castShadow = true;
      group.add(boulder);
    }
    parent.add(group);

    interactables.push({
      type: 'border_scent',
      id: 'sunningrocks_dispute',
      position: new THREE.Vector3(pos.x, pos.y + 1.2, pos.z),
      radius: 6.0,
      data: { clan: 'Contested', name: 'Sunningrocks Border', desc: 'Fiercely contested sunlit territory between ThunderClan and RiverClan' },
    });
  }

  private static createGreatOak(parent: THREE.Group, pos: THREE.Vector3) {
    const oak = new THREE.Group();
    oak.position.copy(pos);
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(1.6, 2.4, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0x27170a, roughness: 0.95 })
    );
    trunk.position.y = 6;
    oak.add(trunk);

    const crown = new THREE.Mesh(
      new THREE.DodecahedronGeometry(6.5, 2),
      new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.9 })
    );
    crown.position.y = 13;
    oak.add(crown);
    parent.add(oak);
  }

  private static createForestBoulder(parent: THREE.Group, pos: THREE.Vector3) {
    const boulder = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.2 + Math.random() * 0.8, 1),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.95 })
    );
    boulder.position.copy(pos);
    boulder.castShadow = true;
    parent.add(boulder);
  }

  private static createHerbPlantMesh(type: string): THREE.Group {
    const group = new THREE.Group();
    let flowerColor = 0xf59e0b;
    if (type === 'catmint') flowerColor = 0xa855f7;
    if (type === 'poppy_seed') flowerColor = 0xdc2626;
    if (type === 'dock') flowerColor = 0x15803d;
    if (type === 'horsetail') flowerColor = 0x84cc16;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.05, 0.6, 6),
      new THREE.MeshStandardMaterial({ color: 0x15803d })
    );
    stem.position.y = 0.3;
    group.add(stem);

    const flower = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 6, 6),
      new THREE.MeshStandardMaterial({ color: flowerColor })
    );
    flower.position.y = 0.62;
    group.add(flower);
    return group;
  }

  private static createScentParticleMesh(colorHex: number): THREE.Group {
    const group = new THREE.Group();
    const partGeo = new THREE.BufferGeometry();
    const count = 12;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.2;
      positions[i * 3 + 1] = Math.random() * 1.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
    }
    partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const partMat = new THREE.PointsMaterial({ color: colorHex, size: 0.08, transparent: true, opacity: 0.75 });
    const pts = new THREE.Points(partGeo, partMat);
    group.add(pts);
    return group;
  }

  private static createPortalArch(parent: THREE.Group, pos: THREE.Vector3, glowHex: number, name: string) {
    const arch = new THREE.Group();
    arch.position.copy(pos);
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 0.6, 8, 16),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 })
    );
    torus.position.y = 3.5;
    arch.add(torus);

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(2.8, 16),
      new THREE.MeshBasicMaterial({ color: glowHex, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    glow.position.y = 3.5;
    arch.add(glow);
    parent.add(arch);
  }

  private static createDarkForestThornPortal(parent: THREE.Group, pos: THREE.Vector3) {
    const portal = new THREE.Group();
    portal.position.copy(pos);
    const thornMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
    for (let i = 0; i < 8; i++) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 4.5, 4), thornMat);
      spike.position.set(Math.cos(i * 0.8) * 2.8, 2.2, Math.sin(i * 0.8) * 2.8);
      spike.rotation.z = (Math.random() - 0.5) * 0.6;
      portal.add(spike);
    }
    const redGaze = new THREE.Mesh(
      new THREE.SphereGeometry(1.2, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0x991b1b, transparent: true, opacity: 0.6 })
    );
    redGaze.position.y = 2.0;
    portal.add(redGaze);
    parent.add(portal);
  }

  // =========================================================================
  // 2. SACRED MOONPOOL GROTTO REALM
  // =========================================================================
  private static buildMoonpoolRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[],
    scentGroup: THREE.Group
  ) {
    const cavern = new THREE.Mesh(
      new THREE.SphereGeometry(50, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x1e1b4b, side: THREE.BackSide, roughness: 0.95 })
    );
    parent.add(cavern);

    const poolWater = new THREE.Mesh(
      new THREE.CircleGeometry(10, 32),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.1, metalness: 0.6, transparent: true, opacity: 0.9 })
    );
    poolWater.rotation.x = -Math.PI / 2;
    poolWater.position.y = 0.05;
    parent.add(poolWater);
    waterMeshes.push(poolWater);

    const altar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.8, 2.2, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8 })
    );
    altar.position.set(0, 0.2, 0);
    parent.add(altar);

    interactables.push({
      type: 'moonpool_altar',
      id: 'moonpool_stone',
      position: new THREE.Vector3(0, 0.5, 0),
      radius: 4.0,
      data: { name: 'Sacred Moonpool Water', desc: 'Touch your nose to the water to dream with StarClan' },
    });
  }

  // =========================================================================
  // 3. SILVERPELT STARCLAN REALM
  // =========================================================================
  private static buildStarClanRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[]
  ) {
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(120, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.BackSide })
    );
    parent.add(skyDome);

    const meadow = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x312e81, roughness: 0.85 })
    );
    meadow.rotation.x = -Math.PI / 2;
    parent.add(meadow);

    const spirit = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xa5f3fc, transparent: true, opacity: 0.85 })
    );
    spirit.position.set(0, 1.4, -6);
    parent.add(spirit);

    interactables.push({
      type: 'starclan_spirit',
      id: 'starclan_elder_spirit',
      position: new THREE.Vector3(0, 1.4, -6),
      radius: 3.5,
      data: { name: 'SunStar of Ancient Days', desc: 'Ancestral StarClan Spirit' },
    });
  }

  // =========================================================================
  // 4. THE DARK FOREST (PLACE OF NO STARS)
  // =========================================================================
  private static buildDarkForestRealm(
    parent: THREE.Group,
    interactables: WorldObjects['interactables'],
    waterMeshes: THREE.Mesh[]
  ) {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.95 })
    );
    ground.rotation.x = -Math.PI / 2;
    parent.add(ground);

    for (let t = 0; t < 30; t++) {
      const tx = (Math.random() - 0.5) * 120;
      const tz = (Math.random() - 0.5) * 120;
      const deadTree = new THREE.Mesh(
        new THREE.CylinderGeometry(0.4, 0.7, 9, 6),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 })
      );
      deadTree.position.set(tx, 4.5, tz);
      deadTree.rotation.z = (Math.random() - 0.5) * 0.4;
      parent.add(deadTree);
    }

    const instructor = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    instructor.position.set(0, 1.2, -8);
    parent.add(instructor);

    interactables.push({
      type: 'darkforest_instructor',
      id: 'shadefang_instructor',
      position: new THREE.Vector3(0, 1.2, -8),
      radius: 4.0,
      data: { name: 'ShadeFang', desc: 'Dark Forest Combat Instructor' },
    });
  }
}
