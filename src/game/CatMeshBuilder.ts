import * as THREE from 'three';
import { 
  AccessoryType, 
  AuraType, 
  BodyType, 
  CatAppearance, 
  EarShape, 
  EyeState, 
  FurStyle, 
  MarkingType, 
  MuzzleShape, 
  ScarType, 
  TailType 
} from '../types/game';
import catModelData from './cat_model_data.json';

export interface CatRigNodes {
  root: THREE.Group;
  body: THREE.Group;
  torsoMesh: THREE.Mesh;
  chestMesh?: THREE.Mesh;
  headGroup: THREE.Group;
  neckGroup: THREE.Group;
  headMesh: THREE.Mesh;
  snoutMesh?: THREE.Mesh;
  jawGroup: THREE.Group;
  leftEyeMesh: THREE.Mesh;
  rightEyeMesh: THREE.Mesh;
  leftEarGroup: THREE.Group;
  rightEarGroup: THREE.Group;
  leftEarMesh: THREE.Mesh;
  rightEarMesh: THREE.Mesh;
  whiskerGroup: THREE.Group;
  furGroup: THREE.Group;
  // Front legs
  leftFrontLeg: THREE.Group;
  leftFrontForearm: THREE.Group;
  rightFrontLeg: THREE.Group;
  rightFrontForearm: THREE.Group;
  // Back legs
  leftBackLeg: THREE.Group;
  leftBackShin: THREE.Group;
  rightBackLeg: THREE.Group;
  rightBackShin: THREE.Group;
  // Tail segments (4 articulated chain nodes)
  tailJoints: THREE.Group[];
  // Accessory & Aura
  accessoryGroup: THREE.Group;
  auraGroup: THREE.Group;
  preyMouthGroup: THREE.Group;
}

interface TriangleCentroid {
  cx: number;
  cy: number;
  cz: number;
}

export class CatMeshBuilder {
  private static cachedSubGeometries: {
    torso: THREE.BufferGeometry;
    head: THREE.BufferGeometry;
    leftEar: THREE.BufferGeometry;
    rightEar: THREE.BufferGeometry;
    frontLeftLegUpper: THREE.BufferGeometry;
    frontLeftForearm: THREE.BufferGeometry;
    frontRightLegUpper: THREE.BufferGeometry;
    frontRightForearm: THREE.BufferGeometry;
    backLeftLegUpper: THREE.BufferGeometry;
    backLeftShin: THREE.BufferGeometry;
    backRightLegUpper: THREE.BufferGeometry;
    backRightShin: THREE.BufferGeometry;
    tail0: THREE.BufferGeometry;
    tail1: THREE.BufferGeometry;
    tail2: THREE.BufferGeometry;
    tail3: THREE.BufferGeometry;
  } | null = null;

  // Base scaling constant from GLB units to Game World meters
  private static readonly SCALE = 0.055;

  /**
   * Generates a realistic high-definition procedural feline coat texture
   * tailored to the GLB model's exact UV coordinates:
   * - Head & Face: U [0.52, 0.70] V [0.75, 0.88]
   * - Ears: U [0.66, 0.73] V [0.67, 0.81]
   * - Snout: U [0.64, 0.70] V [0.82, 0.88]
   * - Chest / Throat: U [0.08, 0.45] V [0.63, 0.80]
   * - Spine / Back: U [0.26, 0.56] V [0.15, 0.49]
   * - Belly / Under: U [0.00, 0.93] V [0.08, 0.73]
   * - Front Legs: U [0.08, 0.35] V [0.54, 0.98]
   * - Back Legs: U [0.76, 0.99] V [0.08, 0.30]
   * - Tail: U [0.00, 0.20] V [0.00, 0.15]
   */
  public static generateCatTexture(appearance: CatAppearance): THREE.CanvasTexture {
    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base primary pelt color
    ctx.fillStyle = appearance.primaryColor || '#94a3b8';
    ctx.fillRect(0, 0, size, size);

    // 2. Underbelly & Chest soft blending gradient
    const underbelly = appearance.underbellyColor || '#f8fafc';
    
    // Chest zone (U: 0.08-0.45, V: 0.63-0.80 -> Canvas Y: (1-0.80)*size to (1-0.63)*size)
    const chestGrad = ctx.createRadialGradient(size * 0.26, size * 0.28, 10, size * 0.26, size * 0.28, size * 0.22);
    chestGrad.addColorStop(0, underbelly);
    chestGrad.addColorStop(0.7, underbelly);
    chestGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = chestGrad;
    ctx.fillRect(size * 0.05, size * 0.10, size * 0.45, size * 0.38);

    // Belly & Throat zones
    ctx.fillStyle = underbelly;
    ctx.beginPath();
    ctx.ellipse(size * 0.45, size * 0.65, size * 0.35, size * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();

    // 3. Markings application
    const markType: MarkingType = appearance.markingType || 'solid';
    const secColor = appearance.secondaryColor || '#475569';
    ctx.save();

    if (markType === 'classic_tabby') {
      ctx.strokeStyle = secColor;
      ctx.fillStyle = secColor;
      ctx.lineWidth = 18;
      ctx.lineCap = 'round';

      // Spine heavy stripes
      for (let y = size * 0.15; y < size * 0.60; y += 45) {
        ctx.beginPath();
        ctx.moveTo(size * 0.26, y);
        ctx.lineTo(size * 0.56, y);
        ctx.stroke();
      }

      // Flank bullseye swirls (Spine/flanks zone)
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(size * 0.42, size * 0.35, 75 + i * 45, 55 + i * 32, 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Tail rings (U: 0.00-0.20, V: 0.00-0.15 -> Y: size*0.85 to size*1.0)
      for (let y = size * 0.86; y < size * 0.99; y += 22) {
        ctx.fillRect(0, y, size * 0.22, 10);
      }

      // Forehead 'M' tabby mark on face (U: 0.52-0.70, V: 0.75-0.88 -> Y: size*0.12-size*0.25)
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(size * 0.56, size * 0.22);
      ctx.lineTo(size * 0.60, size * 0.16);
      ctx.lineTo(size * 0.63, size * 0.20);
      ctx.lineTo(size * 0.66, size * 0.16);
      ctx.lineTo(size * 0.70, size * 0.22);
      ctx.stroke();

    } else if (markType === 'mackerel_tabby') {
      ctx.strokeStyle = secColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';

      // Vertical tiger-like rib stripes across back & flanks
      for (let x = size * 0.22; x < size * 0.60; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, size * 0.18);
        ctx.quadraticCurveTo(x + (Math.sin(x) * 20), size * 0.38, x, size * 0.55);
        ctx.stroke();
      }

      // Spine solid bar
      ctx.fillStyle = secColor;
      ctx.fillRect(size * 0.38, size * 0.15, size * 0.05, size * 0.40);

      // Tail stripes
      for (let y = size * 0.85; y < size; y += 18) {
        ctx.fillRect(0, y, size * 0.20, 8);
      }

      // Leg stripes
      for (let y = size * 0.05; y < size * 0.45; y += 28) {
        ctx.fillRect(size * 0.10, y, size * 0.20, 8);
        ctx.fillRect(size * 0.76, y, size * 0.20, 8);
      }

    } else if (markType === 'spotted' || markType === 'rosettes') {
      ctx.fillStyle = secColor;
      // Body spots
      for (let y = size * 0.16; y < size * 0.58; y += 45) {
        for (let x = size * 0.24; x < size * 0.58; x += 50) {
          ctx.beginPath();
          const r = markType === 'rosettes' ? 14 : 10;
          ctx.arc(x + (Math.random() * 16 - 8), y + (Math.random() * 14 - 7), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Tail spots
      for (let y = size * 0.86; y < size * 0.98; y += 26) {
        ctx.beginPath();
        ctx.arc(size * 0.08, y, 9, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (markType === 'ticked') {
      // Agouti fine ticking
      ctx.fillStyle = secColor;
      for (let i = 0; i < 3500; i++) {
        const tx = Math.random() * size;
        const ty = Math.random() * size;
        ctx.fillRect(tx, ty, 3, 5);
      }

    } else if (markType === 'colorpoint') {
      // Siamese dark mask on face
      const faceGrad = ctx.createRadialGradient(size * 0.63, size * 0.20, 15, size * 0.63, size * 0.20, size * 0.16);
      faceGrad.addColorStop(0, secColor);
      faceGrad.addColorStop(0.8, secColor);
      faceGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = faceGrad;
      ctx.fillRect(size * 0.50, size * 0.10, size * 0.25, size * 0.22);

      // Dark ears (U: 0.66-0.73, V: 0.67-0.81)
      ctx.fillStyle = secColor;
      ctx.fillRect(size * 0.65, size * 0.18, size * 0.10, size * 0.15);

      // Dark tail (U: 0.00-0.20, V: 0.00-0.15)
      ctx.fillRect(0, size * 0.84, size * 0.22, size * 0.16);

      // Dark paws (Bottom legs)
      ctx.fillRect(size * 0.08, size * 0.02, size * 0.25, size * 0.14);
      ctx.fillRect(size * 0.76, size * 0.70, size * 0.24, size * 0.14);

    } else if (markType === 'bicolor' || markType === 'mask_and_boots' || markType === 'tuxedo') {
      // White muzzle, chest blaze, belly, and 4 white paws
      ctx.fillStyle = underbelly;

      // Forehead/Muzzle white blaze
      ctx.beginPath();
      ctx.moveTo(size * 0.63, size * 0.08);
      ctx.lineTo(size * 0.58, size * 0.28);
      ctx.lineTo(size * 0.68, size * 0.28);
      ctx.closePath();
      ctx.fill();

      // White chest shield
      ctx.beginPath();
      ctx.ellipse(size * 0.26, size * 0.28, size * 0.18, size * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();

      // White paws (4 mittens)
      ctx.fillRect(size * 0.08, 0, size * 0.25, size * 0.12);
      ctx.fillRect(size * 0.76, size * 0.85, size * 0.24, size * 0.15);

    } else if (markType === 'van') {
      // High white coat with colored cap on head and colored tail
      ctx.fillStyle = underbelly;
      ctx.fillRect(0, 0, size, size);

      // Head color cap
      ctx.fillStyle = appearance.primaryColor;
      ctx.beginPath();
      ctx.arc(size * 0.63, size * 0.15, size * 0.09, 0, Math.PI * 2);
      ctx.fill();

      // Colored tail
      ctx.fillRect(0, size * 0.84, size * 0.22, size * 0.16);

    } else if (markType === 'calico' || markType === 'patches') {
      const patchColors = [secColor, '#1c1917', underbelly];
      for (let i = 0; i < 28; i++) {
        ctx.fillStyle = patchColors[i % patchColors.length];
        ctx.beginPath();
        const px = Math.random() * size;
        const py = Math.random() * size;
        const pr = 50 + Math.random() * 65;
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }

    } else if (markType === 'tortoiseshell') {
      // Finely mottled mixture of black and ginger/amber
      for (let i = 0; i < 350; i++) {
        ctx.fillStyle = i % 2 === 0 ? secColor : '#18181b';
        ctx.fillRect(Math.random() * size, Math.random() * size, 22 + Math.random() * 24, 16 + Math.random() * 20);
      }

    } else if (markType === 'white_chest') {
      ctx.fillStyle = underbelly;
      ctx.beginPath();
      ctx.ellipse(size * 0.26, size * 0.28, size * 0.16, size * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();

    } else if (markType === 'white_paws') {
      ctx.fillStyle = underbelly;
      ctx.fillRect(size * 0.08, 0, size * 0.25, size * 0.12);
      ctx.fillRect(size * 0.76, size * 0.85, size * 0.24, size * 0.15);

    } else if (markType === 'white_muzzle') {
      ctx.fillStyle = underbelly;
      ctx.beginPath();
      ctx.arc(size * 0.63, size * 0.22, size * 0.08, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Natural low-poly fur grain noise
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let i = 0; i < 4000; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 4);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Initializes and caches sub-geometries from the real Low-Poly Cat model
   */
  private static initSubGeometries() {
    if (this.cachedSubGeometries) return this.cachedSubGeometries;

    const pos = catModelData.pos;
    const norm = catModelData.norm;
    const uv = catModelData.uv;
    const idx = catModelData.idx;
    const triCount = idx.length / 3;
    const S = this.SCALE;

    function getTriCentroid(t: number): TriangleCentroid {
      const i0 = idx[t * 3];
      const i1 = idx[t * 3 + 1];
      const i2 = idx[t * 3 + 2];
      const x0 = pos[i0 * 3] * S, y0 = pos[i0 * 3 + 1] * S, z0 = pos[i0 * 3 + 2] * S;
      const x1 = pos[i1 * 3] * S, y1 = pos[i1 * 3 + 1] * S, z1 = pos[i1 * 3 + 2] * S;
      const x2 = pos[i2 * 3] * S, y2 = pos[i2 * 3 + 1] * S, z2 = pos[i2 * 3 + 2] * S;
      return {
        cx: (x0 + x1 + x2) / 3,
        cy: (y0 + y1 + y2) / 3,
        cz: (z0 + z1 + z2) / 3,
      };
    }

    function buildGeo(triangles: number[], ox: number, oy: number, oz: number): THREE.BufferGeometry {
      const positions: number[] = [];
      const normals: number[] = [];
      const uvs: number[] = [];
      const indices: number[] = [];
      const vertMap = new Map<number, number>();

      for (const t of triangles) {
        const i0 = idx[t * 3];
        const i1 = idx[t * 3 + 1];
        const i2 = idx[t * 3 + 2];
        for (const oldIdx of [i0, i1, i2]) {
          if (!vertMap.has(oldIdx)) {
            const newIdx = positions.length / 3;
            vertMap.set(oldIdx, newIdx);
            positions.push(
              pos[oldIdx * 3] * S - ox,
              pos[oldIdx * 3 + 1] * S - oy,
              pos[oldIdx * 3 + 2] * S - oz
            );
            normals.push(norm[oldIdx * 3], norm[oldIdx * 3 + 1], norm[oldIdx * 3 + 2]);
            uvs.push(uv[oldIdx * 2], uv[oldIdx * 2 + 1]);
          }
          indices.push(vertMap.get(oldIdx)!);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();
      return geo;
    }

    const triGroups = {
      torso: [] as number[],
      head: [] as number[],
      leftEar: [] as number[],
      rightEar: [] as number[],
      frontLeftLegUpper: [] as number[],
      frontLeftForearm: [] as number[],
      frontRightLegUpper: [] as number[],
      frontRightForearm: [] as number[],
      backLeftLegUpper: [] as number[],
      backLeftShin: [] as number[],
      backRightLegUpper: [] as number[],
      backRightShin: [] as number[],
      tail0: [] as number[],
      tail1: [] as number[],
      tail2: [] as number[],
      tail3: [] as number[],
    };

    for (let t = 0; t < triCount; t++) {
      const { cx, cy, cz } = getTriCentroid(t);

      if (cy > 0.54 && cz > 0.24 && cx > 0.015) {
        triGroups.leftEar.push(t);
      } else if (cy > 0.54 && cz > 0.24 && cx < -0.015) {
        triGroups.rightEar.push(t);
      } else if (cz > 0.21 && cy > 0.26) {
        triGroups.head.push(t);
      } else if (cz < -0.30 && cy > 0.22) {
        if (cz > -0.42) triGroups.tail0.push(t);
        else if (cz > -0.54) triGroups.tail1.push(t);
        else if (cz > -0.66) triGroups.tail2.push(t);
        else triGroups.tail3.push(t);
      } else if (cz > 0.0 && cx > 0.028 && cy < 0.32) {
        if (cy > 0.16) triGroups.frontLeftLegUpper.push(t);
        else triGroups.frontLeftForearm.push(t);
      } else if (cz > 0.0 && cx < -0.028 && cy < 0.32) {
        if (cy > 0.16) triGroups.frontRightLegUpper.push(t);
        else triGroups.frontRightForearm.push(t);
      } else if (cz < -0.16 && cx > 0.028 && cy < 0.32) {
        if (cy > 0.16) triGroups.backLeftLegUpper.push(t);
        else triGroups.backLeftShin.push(t);
      } else if (cz < -0.16 && cx < -0.028 && cy < 0.32) {
        if (cy > 0.16) triGroups.backRightLegUpper.push(t);
        else triGroups.backRightShin.push(t);
      } else {
        triGroups.torso.push(t);
      }
    }

    // Pivot offsets (in world meters)
    this.cachedSubGeometries = {
      torso: buildGeo(triGroups.torso, 0, 0.36, -0.04),
      head: buildGeo(triGroups.head, 0, 0.46, 0.35),
      leftEar: buildGeo(triGroups.leftEar, 0.08, 0.58, 0.35),
      rightEar: buildGeo(triGroups.rightEar, -0.08, 0.58, 0.35),
      frontLeftLegUpper: buildGeo(triGroups.frontLeftLegUpper, 0.08, 0.28, 0.16),
      frontLeftForearm: buildGeo(triGroups.frontLeftForearm, 0.08, 0.16, 0.16),
      frontRightLegUpper: buildGeo(triGroups.frontRightLegUpper, -0.08, 0.28, 0.16),
      frontRightForearm: buildGeo(triGroups.frontRightForearm, -0.08, 0.16, 0.16),
      backLeftLegUpper: buildGeo(triGroups.backLeftLegUpper, 0.08, 0.28, -0.22),
      backLeftShin: buildGeo(triGroups.backLeftShin, 0.08, 0.16, -0.22),
      backRightLegUpper: buildGeo(triGroups.backRightLegUpper, -0.08, 0.28, -0.22),
      backRightShin: buildGeo(triGroups.backRightShin, -0.08, 0.16, -0.22),
      tail0: buildGeo(triGroups.tail0, 0, 0.40, -0.32),
      tail1: buildGeo(triGroups.tail1, 0, 0.40, -0.42),
      tail2: buildGeo(triGroups.tail2, 0, 0.40, -0.54),
      tail3: buildGeo(triGroups.tail3, 0, 0.40, -0.66),
    };

    return this.cachedSubGeometries;
  }

  /**
   * Constructs the full, authentic 3D feline player character model
   */
  public static buildCat(appearance: CatAppearance): { group: THREE.Group; rig: CatRigNodes } {
    const geos = this.initSubGeometries();
    const root = new THREE.Group();
    root.name = 'CatRoot';

    // 1. Pelt Material & Canvas Texture
    const texture = this.generateCatTexture(appearance);
    const coatMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.72,
      metalness: 0.05,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xf4a6a6,
      roughness: 0.6,
    });

    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdf848c,
      roughness: 0.35,
    });

    // 2. Eye Materials (Left & Right) with Iris & Glow States
    const isBlindLeft = appearance.eyeState === 'blind_left' || appearance.eyeState === 'blind_both';
    const isBlindRight = appearance.eyeState === 'blind_right' || appearance.eyeState === 'blind_both';

    const getEyeMat = (colorHex: string, isBlind: boolean) => {
      return new THREE.MeshStandardMaterial({
        color: isBlind ? 0xdbeafe : new THREE.Color(colorHex),
        roughness: isBlind ? 0.6 : 0.08,
        metalness: isBlind ? 0.0 : 0.18,
        emissive: appearance.eyeState === 'star_shine' ? new THREE.Color(0x38bdf8) : (appearance.eyeState === 'amber_glow' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)),
        emissiveIntensity: appearance.eyeState === 'star_shine' || appearance.eyeState === 'amber_glow' ? 0.8 : (isBlind ? 0.2 : 0),
      });
    };

    const eyeMatLeft = getEyeMat(appearance.eyeColorLeft || '#38bdf8', isBlindLeft);
    const eyeMatRight = getEyeMat(appearance.eyeColorRight || '#38bdf8', isBlindRight);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const corneaMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.9,
      opacity: 1.0,
      transparent: true,
      roughness: 0.05,
      ior: 1.4,
    });

    // ==========================================
    // SKELETAL PROPORTIONS & BODY TYPES
    // ==========================================
    let overallScale = appearance.bodyScale || 1.0;
    let bodyWidth = 1.0;
    let legScaleY = 1.0 * (appearance.legLength || 1.0);
    let pawScale = 1.0 * (appearance.pawSize || 1.0);
    let headScale = 1.0;

    const bType: BodyType = appearance.bodyType || 'adult';
    if (bType === 'kit') {
      overallScale *= 0.58;
      bodyWidth = 1.05;
      legScaleY *= 0.72;
      headScale = 1.25; // cute big kit head
      pawScale *= 1.2;
    } else if (bType === 'apprentice') {
      overallScale *= 0.82;
      legScaleY *= 0.9;
    } else if (bType === 'large_warrior') {
      // TALLER, broader muscular frame, long legs - NOT FAT!
      overallScale *= 1.24;
      bodyWidth = 1.22;
      legScaleY *= 1.20;
      pawScale *= 1.25;
    } else if (bType === 'slender_hunter' || bType === 'slim_hunter') {
      overallScale *= 1.02;
      bodyWidth = 0.88;
      legScaleY *= 1.14;
      pawScale *= 0.92;
    }

    root.scale.set(overallScale, overallScale, overallScale);

    // ==========================================
    // 1. TORSO & BODY HIERARCHY
    // ==========================================
    const body = new THREE.Group();
    body.name = 'BodyGroup';
    body.position.set(0, 0.36, -0.04);
    body.scale.set(bodyWidth, 1.0, 1.0);
    root.add(body);

    const torsoMesh = new THREE.Mesh(geos.torso, coatMaterial);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    body.add(torsoMesh);

    // ==========================================
    // 2. NECK & HEAD
    // ==========================================
    const neckGroup = new THREE.Group();
    neckGroup.name = 'NeckGroup';
    neckGroup.position.set(0, 0.08, 0.24);
    body.add(neckGroup);

    const headGroup = new THREE.Group();
    headGroup.name = 'HeadGroup';
    headGroup.position.set(0, 0.02, 0.15);
    headGroup.scale.set(headScale, headScale, headScale);
    neckGroup.add(headGroup);

    const headMesh = new THREE.Mesh(geos.head, coatMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // ==========================================
    // 3. 3D EYES WITH REAL VISIBLE PUPILS & GLOW
    // ==========================================
    const buildEyeMesh = (isLeft: boolean, mat: THREE.Material) => {
      const eyeNode = new THREE.Group();
      eyeNode.position.set(isLeft ? 0.052 : -0.052, 0.048, 0.082);
      eyeNode.rotation.y = isLeft ? 0.35 : -0.35;
      eyeNode.rotation.x = -0.08;

      // Iris disc
      const irisGeo = new THREE.CylinderGeometry(0.024, 0.024, 0.006, 12);
      irisGeo.rotateX(Math.PI / 2);
      const iris = new THREE.Mesh(irisGeo, mat);
      eyeNode.add(iris);

      // Slit pupil
      const pupilGeo = new THREE.BoxGeometry(0.007, 0.036, 0.008);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.002;
      eyeNode.add(pupil);

      // Cornea dome
      const domeGeo = new THREE.SphereGeometry(0.025, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2);
      domeGeo.rotateX(Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, corneaMat);
      dome.position.z = 0.003;
      eyeNode.add(dome);

      return { eyeNode, iris };
    };

    const { eyeNode: leftEyeGroup, iris: leftEyeMesh } = buildEyeMesh(true, eyeMatLeft);
    const { eyeNode: rightEyeGroup, iris: rightEyeMesh } = buildEyeMesh(false, eyeMatRight);
    headGroup.add(leftEyeGroup);
    headGroup.add(rightEyeGroup);

    // ==========================================
    // 4. MUZZLE VARIANTS
    // ==========================================
    const muzzleShape: MuzzleShape = appearance.muzzleShape || 'classic';
    const snoutGroup = new THREE.Group();
    snoutGroup.position.set(0, 0.01, 0.09);

    if (muzzleShape === 'short_snub') {
      // Snub/Persian compact muzzle
      const snubGeo = new THREE.BoxGeometry(0.075, 0.055, 0.04);
      const snubMesh = new THREE.Mesh(snubGeo, coatMaterial);
      snoutGroup.add(snubMesh);
      snoutGroup.scale.set(1.15, 0.9, 0.7);
    } else if (muzzleShape === 'long_angular') {
      // Slender oriental muzzle
      const longGeo = new THREE.ConeGeometry(0.045, 0.09, 5);
      longGeo.rotateX(Math.PI / 2);
      const longMesh = new THREE.Mesh(longGeo, coatMaterial);
      snoutGroup.add(longMesh);
      snoutGroup.scale.set(0.9, 0.95, 1.35);
    } else if (muzzleShape === 'broad_tom') {
      // Muscular broad warrior muzzle
      const broadGeo = new THREE.BoxGeometry(0.095, 0.065, 0.06);
      const broadMesh = new THREE.Mesh(broadGeo, coatMaterial);
      snoutGroup.add(broadMesh);
      snoutGroup.scale.set(1.3, 1.15, 1.1);
    }
    headGroup.add(snoutGroup);

    // Mouth / Jaw Group (holds prey)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.03, 0.06);
    headGroup.add(jawGroup);

    const preyMouthGroup = new THREE.Group();
    preyMouthGroup.name = 'PreyMouthGroup';
    preyMouthGroup.position.set(0, 0, 0.05);
    jawGroup.add(preyMouthGroup);

    // ==========================================
    // 5. EARS & EAR SHAPE VARIANTS
    // ==========================================
    const leftEarGroup = new THREE.Group();
    leftEarGroup.name = 'LeftEarGroup';
    leftEarGroup.position.set(0.08, 0.12, 0.0);
    headGroup.add(leftEarGroup);

    const rightEarGroup = new THREE.Group();
    rightEarGroup.name = 'RightEarGroup';
    rightEarGroup.position.set(-0.08, 0.12, 0.0);
    headGroup.add(rightEarGroup);

    const leftEarMesh = new THREE.Mesh(geos.leftEar, coatMaterial);
    const rightEarMesh = new THREE.Mesh(geos.rightEar, coatMaterial);
    leftEarGroup.add(leftEarMesh);
    rightEarGroup.add(rightEarMesh);

    const earShape: EarShape = appearance.earShape || 'pricked';
    if (earShape === 'lynx_tufted') {
      // Sharp long fur tufts atop ears
      const tuftGeo = new THREE.ConeGeometry(0.015, 0.06, 4);
      const lTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      lTuft.position.set(0, 0.08, 0);
      leftEarGroup.add(lTuft);

      const rTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      rTuft.position.set(0, 0.08, 0);
      rightEarGroup.add(rTuft);
    } else if (earShape === 'folded') {
      leftEarGroup.rotation.x = 0.5;
      rightEarGroup.rotation.x = 0.5;
    } else if (earShape === 'torn_notched') {
      leftEarGroup.scale.set(0.85, 0.75, 0.9);
    }

    // ==========================================
    // 6. WHISKERS
    // ==========================================
    const whiskerGroup = new THREE.Group();
    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.85, transparent: true });
    for (let i = 0; i < 3; i++) {
      // Left whiskers
      const lPts = [
        new THREE.Vector3(0.04, 0.01 + i * 0.008, 0.08),
        new THREE.Vector3(0.14, 0.02 + i * 0.012, 0.09 - i * 0.01),
      ];
      const lGeo = new THREE.BufferGeometry().setFromPoints(lPts);
      whiskerGroup.add(new THREE.Line(lGeo, whiskerMat));

      // Right whiskers
      const rPts = [
        new THREE.Vector3(-0.04, 0.01 + i * 0.008, 0.08),
        new THREE.Vector3(-0.14, 0.02 + i * 0.012, 0.09 - i * 0.01),
      ];
      const rGeo = new THREE.BufferGeometry().setFromPoints(rPts);
      whiskerGroup.add(new THREE.Line(rGeo, whiskerMat));
    }
    headGroup.add(whiskerGroup);

    // ==========================================
    // 7. VISIBLY MEANINGFUL 3D FUR SILHOUETTES
    // ==========================================
    const furGroup = new THREE.Group();
    furGroup.name = 'FurGeometryGroup';
    const furStyle: FurStyle = appearance.furStyle || 'medium';

    if (furStyle === 'medium' || furStyle === 'long' || furStyle === 'fluffy' || furStyle === 'long_haired') {
      // Cheek fluff tufts on head
      const cheekTuftGeo = new THREE.ConeGeometry(
        furStyle === 'medium' ? 0.035 : (furStyle === 'long' ? 0.06 : 0.085),
        furStyle === 'medium' ? 0.08 : (furStyle === 'long' ? 0.14 : 0.18),
        4
      );
      cheekTuftGeo.rotateZ(Math.PI / 2);

      const lCheek = new THREE.Mesh(cheekTuftGeo, coatMaterial);
      lCheek.position.set(0.08, -0.02, 0.02);
      lCheek.rotation.y = 0.2;
      headGroup.add(lCheek);

      const rCheek = new THREE.Mesh(cheekTuftGeo, coatMaterial);
      rCheek.position.set(-0.08, -0.02, 0.02);
      rCheek.rotation.y = -0.2;
      rCheek.rotation.z = Math.PI;
      headGroup.add(rCheek);
    }

    if (furStyle === 'long' || furStyle === 'fluffy' || furStyle === 'long_haired') {
      // Magnificent Chest & Neck Fur Ruff
      const ruffScale = furStyle === 'fluffy' || furStyle === 'long_haired' ? 1.35 : 1.0;
      const ruffGeo = new THREE.ConeGeometry(0.14 * ruffScale, 0.22 * ruffScale, 6);
      ruffGeo.rotateX(-Math.PI / 2.8);

      const chestRuff = new THREE.Mesh(ruffGeo, coatMaterial);
      chestRuff.position.set(0, -0.04, 0.18);
      neckGroup.add(chestRuff);

      // Flank fur skirts along body sides
      const flankGeo = new THREE.BoxGeometry(0.04, 0.12 * ruffScale, 0.36 * ruffScale);
      const lFlank = new THREE.Mesh(flankGeo, coatMaterial);
      lFlank.position.set(0.14, -0.06, 0);
      body.add(lFlank);

      const rFlank = new THREE.Mesh(flankGeo, coatMaterial);
      rFlank.position.set(-0.14, -0.06, 0);
      body.add(rFlank);
    }

    body.add(furGroup);

    // ==========================================
    // 8. FRONT LEGS & ARTICULATION
    // ==========================================
    const leftFrontLeg = new THREE.Group();
    leftFrontLeg.name = 'LeftFrontLeg';
    leftFrontLeg.position.set(0.08, -0.08, 0.20);
    leftFrontLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(leftFrontLeg);

    const lFrontUpperMesh = new THREE.Mesh(geos.frontLeftLegUpper, coatMaterial);
    lFrontUpperMesh.castShadow = true;
    leftFrontLeg.add(lFrontUpperMesh);

    const leftFrontForearm = new THREE.Group();
    leftFrontForearm.name = 'LeftFrontForearm';
    leftFrontForearm.position.set(0, -0.12, 0);
    leftFrontLeg.add(leftFrontForearm);

    const lFrontForearmMesh = new THREE.Mesh(geos.frontLeftForearm, coatMaterial);
    lFrontForearmMesh.castShadow = true;
    leftFrontForearm.add(lFrontForearmMesh);

    const rightFrontLeg = new THREE.Group();
    rightFrontLeg.name = 'RightFrontLeg';
    rightFrontLeg.position.set(-0.08, -0.08, 0.20);
    rightFrontLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(rightFrontLeg);

    const rFrontUpperMesh = new THREE.Mesh(geos.frontRightLegUpper, coatMaterial);
    rFrontUpperMesh.castShadow = true;
    rightFrontLeg.add(rFrontUpperMesh);

    const rightFrontForearm = new THREE.Group();
    rightFrontForearm.name = 'RightFrontForearm';
    rightFrontForearm.position.set(0, -0.12, 0);
    rightFrontLeg.add(rightFrontForearm);

    const rFrontForearmMesh = new THREE.Mesh(geos.frontRightForearm, coatMaterial);
    rFrontForearmMesh.castShadow = true;
    rightFrontForearm.add(rFrontForearmMesh);

    // ==========================================
    // 9. BACK LEGS & ARTICULATION
    // ==========================================
    const leftBackLeg = new THREE.Group();
    leftBackLeg.name = 'LeftBackLeg';
    leftBackLeg.position.set(0.08, -0.08, -0.18);
    leftBackLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(leftBackLeg);

    const lBackUpperMesh = new THREE.Mesh(geos.backLeftLegUpper, coatMaterial);
    lBackUpperMesh.castShadow = true;
    leftBackLeg.add(lBackUpperMesh);

    const leftBackShin = new THREE.Group();
    leftBackShin.name = 'LeftBackShin';
    leftBackShin.position.set(0, -0.12, 0);
    leftBackLeg.add(leftBackShin);

    const lBackShinMesh = new THREE.Mesh(geos.backLeftShin, coatMaterial);
    lBackShinMesh.castShadow = true;
    leftBackShin.add(lBackShinMesh);

    const rightBackLeg = new THREE.Group();
    rightBackLeg.name = 'RightBackLeg';
    rightBackLeg.position.set(-0.08, -0.08, -0.18);
    rightBackLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(rightBackLeg);

    const rBackUpperMesh = new THREE.Mesh(geos.backRightLegUpper, coatMaterial);
    rBackUpperMesh.castShadow = true;
    rightBackLeg.add(rBackUpperMesh);

    const rightBackShin = new THREE.Group();
    rightBackShin.name = 'RightBackShin';
    rightBackShin.position.set(0, -0.12, 0);
    rightBackLeg.add(rightBackShin);

    const rBackShinMesh = new THREE.Mesh(geos.backRightShin, coatMaterial);
    rBackShinMesh.castShadow = true;
    rightBackShin.add(rBackShinMesh);

    // ==========================================
    // 10. TAIL & TAIL VARIANTS (4 ARTICULATED JOINTS)
    // ==========================================
    const tailJoints: THREE.Group[] = [];
    const tailType: TailType = appearance.tailType || 'sleek';

    const t0 = new THREE.Group();
    t0.name = 'TailJoint0';
    t0.position.set(0, 0.04, -0.28);
    body.add(t0);
    const m0 = new THREE.Mesh(geos.tail0, coatMaterial);
    m0.castShadow = true;
    t0.add(m0);
    tailJoints.push(t0);

    const t1 = new THREE.Group();
    t1.name = 'TailJoint1';
    t1.position.set(0, 0, -0.10);
    t0.add(t1);
    const m1 = new THREE.Mesh(geos.tail1, coatMaterial);
    m1.castShadow = true;
    t1.add(m1);
    tailJoints.push(t1);

    const t2 = new THREE.Group();
    t2.name = 'TailJoint2';
    t2.position.set(0, 0, -0.12);
    t1.add(t2);
    const m2 = new THREE.Mesh(geos.tail2, coatMaterial);
    m2.castShadow = true;
    t2.add(m2);
    tailJoints.push(t2);

    const t3 = new THREE.Group();
    t3.name = 'TailJoint3';
    t3.position.set(0, 0, -0.12);
    t2.add(t3);
    const m3 = new THREE.Mesh(geos.tail3, coatMaterial);
    m3.castShadow = true;
    t3.add(m3);
    tailJoints.push(t3);

    // Tail Style Adjustments
    if (tailType === 'bobtail' || tailType === 'stumpy') {
      t1.scale.set(0.6, 0.6, 0.5);
      t2.visible = false;
      t3.visible = false;
    } else if (tailType === 'crooked') {
      t2.rotation.y = 0.55;
      t2.rotation.x = -0.3;
    } else if (tailType === 'bushy_plume' || furStyle === 'long' || furStyle === 'fluffy' || furStyle === 'long_haired') {
      // Extra 3D plume fur meshes on tail joints
      tailJoints.forEach((j, idx) => {
        const plumeGeo = new THREE.ConeGeometry(0.04 + idx * 0.015, 0.14, 5);
        plumeGeo.rotateX(Math.PI / 2);
        const plume = new THREE.Mesh(plumeGeo, coatMaterial);
        plume.position.set(0, 0.02, -0.04);
        j.add(plume);
      });
    }

    // ==========================================
    // 11. BATTLE SCARS (VISIBLY RENDERED 3D MESHES)
    // ==========================================
    const scarType: ScarType = appearance.scarType || appearance.scar || 'none';
    const scarMat = new THREE.MeshBasicMaterial({ color: 0xb91c1c });

    if (scarType === 'eye_slash' || scarType === 'blind_eye_slash') {
      const slashGeo = new THREE.BoxGeometry(0.008, 0.065, 0.004);
      slashGeo.rotateZ(0.3);
      const slash = new THREE.Mesh(slashGeo, scarMat);
      slash.position.set(0.055, 0.05, 0.09);
      headGroup.add(slash);
    } else if (scarType === 'shoulder_scar' || scarType === 'shoulder_claw_marks') {
      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.BoxGeometry(0.006, 0.05, 0.004);
        sGeo.rotateZ(-0.4);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(0.13, 0.02 + i * 0.012, 0.12 - i * 0.01);
        body.add(sMesh);
      }
    } else if (scarType === 'chest_claw_marks' || scarType === 'chest_scar' || scarType === 'cross_scars') {
      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.BoxGeometry(0.06, 0.006, 0.004);
        sGeo.rotateZ(0.2);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(-0.02 + i * 0.015, -0.02 - i * 0.015, 0.21);
        body.add(sMesh);
      }
    } else if (scarType === 'muzzle_nick' || scarType === 'muzzle_scratch') {
      const nGeo = new THREE.BoxGeometry(0.012, 0.012, 0.01);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0.03, -0.01, 0.10);
      headGroup.add(nMesh);
    } else if (scarType === 'torn_ear' || scarType === 'torn_left_ear' || scarType === 'torn_right_ear') {
      const earTarget = scarType === 'torn_right_ear' ? rightEarGroup : leftEarGroup;
      earTarget.scale.set(0.8, 0.7, 0.8);
      const nGeo = new THREE.BoxGeometry(0.02, 0.02, 0.008);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0, 0.06, 0);
      earTarget.add(nMesh);
    } else if (scarType === 'tail_nick') {
      const nGeo = new THREE.BoxGeometry(0.02, 0.02, 0.01);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0, 0, -0.05);
      t1.add(nMesh);
    } else if (scarType === 'flank_scar' || scarType === 'battle_worn_all') {
      for (let i = 0; i < 4; i++) {
        const sGeo = new THREE.BoxGeometry(0.006, 0.06, 0.004);
        sGeo.rotateZ(-0.35);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(0.13, 0.01 + i * 0.014, -0.08 + i * 0.03);
        body.add(sMesh);
      }
    }

    // ==========================================
    // 12. ACCESSORIES & AURAS
    // ==========================================
    const accessoryGroup = new THREE.Group();
    accessoryGroup.name = 'AccessoryGroup';
    const accType: AccessoryType = appearance.accessoryType || appearance.accessory || 'none';

    if (accType === 'leaf_crown' || accType === 'oak_leaves') {
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const leafGeo = new THREE.ConeGeometry(0.02, 0.05, 3);
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        leaf.position.set(Math.cos(angle) * 0.09, 0.09, Math.sin(angle) * 0.06);
        leaf.rotation.z = Math.cos(angle) * 0.4;
        accessoryGroup.add(leaf);
      }
      headGroup.add(accessoryGroup);
    } else if (accType === 'blue_jay_feather' || accType === 'blue_feather' || accType === 'feather' || accType === 'cardinal_feather') {
      const featherColor = accType === 'cardinal_feather' ? 0xdc2626 : 0x0284c7;
      const featherMat = new THREE.MeshStandardMaterial({ color: featherColor, roughness: 0.5 });
      const fGeo = new THREE.BoxGeometry(0.015, 0.09, 0.004);
      const fMesh = new THREE.Mesh(fGeo, featherMat);
      fMesh.position.set(0.09, 0.14, -0.02);
      fMesh.rotation.z = -0.45;
      fMesh.rotation.x = -0.2;
      accessoryGroup.add(fMesh);
      headGroup.add(accessoryGroup);
    } else if (accType === 'holly_berries' || accType === 'poppy_flower' || accType === 'violet_flower') {
      const bColor = accType === 'violet_flower' ? 0xa855f7 : 0xef4444;
      const berryMat = new THREE.MeshStandardMaterial({ color: bColor, roughness: 0.3 });
      for (let i = 0; i < 3; i++) {
        const bGeo = new THREE.SphereGeometry(0.012, 8, 8);
        const berry = new THREE.Mesh(bGeo, berryMat);
        berry.position.set(0.07 + (i % 2) * 0.015, 0.09 + i * 0.01, 0.02);
        accessoryGroup.add(berry);
      }
      headGroup.add(accessoryGroup);
    } else if (accType === 'vine_collar' || accType === 'moss_shoulder_wrap' || accType === 'twig_charm') {
      const vineMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
      const torusGeo = new THREE.TorusGeometry(0.11, 0.015, 6, 16);
      torusGeo.rotateX(Math.PI / 2);
      const vine = new THREE.Mesh(torusGeo, vineMat);
      vine.position.set(0, -0.02, 0.16);
      body.add(vine);
    } else if (accType === 'viper_tooth_collar' || accType === 'leather_collar' || accType === 'bell_collar') {
      const collarColor = accType === 'leather_collar' ? 0x78350f : 0x1c1917;
      const collarMat = new THREE.MeshStandardMaterial({ color: collarColor, roughness: 0.7 });
      const torusGeo = new THREE.TorusGeometry(0.11, 0.014, 6, 16);
      torusGeo.rotateX(Math.PI / 2);
      const collar = new THREE.Mesh(torusGeo, collarMat);
      collar.position.set(0, -0.02, 0.16);

      if (accType === 'bell_collar') {
        const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        const bell = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), bellMat);
        bell.position.set(0, -0.04, 0.26);
        body.add(bell);
      } else if (accType === 'viper_tooth_collar') {
        const toothMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.3 });
        for (let i = 0; i < 5; i++) {
          const angle = (i / 4) * Math.PI - Math.PI / 2;
          const toothGeo = new THREE.ConeGeometry(0.01, 0.035, 4);
          toothGeo.rotateX(Math.PI);
          const tooth = new THREE.Mesh(toothGeo, toothMat);
          tooth.position.set(Math.sin(angle) * 0.11, -0.01, Math.cos(angle) * 0.11);
          collar.add(tooth);
        }
      }
      body.add(collar);
    }

    // Auras (StarClan starlight / Dark Forest shadow mist / Celestial)
    const auraGroup = new THREE.Group();
    auraGroup.name = 'AuraGroup';
    const auraType: AuraType = appearance.auraType || appearance.aura || 'none';

    if (auraType === 'starclan_starlight' || auraType === 'starclan_stars' || auraType === 'celestial_glow' || auraType === 'celestial_shimmer') {
      const auraMat = new THREE.MeshBasicMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.75,
        wireframe: true,
      });
      const starSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), auraMat);
      starSphere.position.set(0, 0.05, 0);
      auraGroup.add(starSphere);
      body.add(auraGroup);
    } else if (auraType === 'darkforest_shadow' || auraType === 'darkforest_smoke' || auraType === 'shadow_mist') {
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x991b1b,
        transparent: true,
        opacity: 0.65,
        wireframe: true,
      });
      const shadowSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), shadowMat);
      shadowSphere.position.set(0, 0.05, 0);
      auraGroup.add(shadowSphere);
      body.add(auraGroup);
    } else if (auraType === 'firefly_glow') {
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xa3e635,
        transparent: true,
        opacity: 0.7,
        wireframe: true,
      });
      const glowSphere = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), glowMat);
      glowSphere.position.set(0, 0.05, 0);
      auraGroup.add(glowSphere);
      body.add(auraGroup);
    }

    const rig: CatRigNodes = {
      root,
      body,
      torsoMesh,
      headGroup,
      neckGroup,
      headMesh,
      jawGroup,
      leftEyeMesh,
      rightEyeMesh,
      leftEarGroup,
      rightEarGroup,
      leftEarMesh,
      rightEarMesh,
      whiskerGroup,
      furGroup,
      leftFrontLeg,
      leftFrontForearm,
      rightFrontLeg,
      rightFrontForearm,
      leftBackLeg,
      leftBackShin,
      rightBackLeg,
      rightBackShin,
      tailJoints,
      accessoryGroup,
      auraGroup,
      preyMouthGroup,
    };

    return { group: root, rig };
  }

  /**
   * Builds high quality low-poly prey 3D models for mice, squirrels, rabbits, birds, voles, fish
   */
  public static buildPreyMesh(type: string): THREE.Group {
    const group = new THREE.Group();
    group.name = `Prey_${type}`;

    if (type === 'mouse' || type === 'vole') {
      const coatColor = type === 'mouse' ? 0xa8a29e : 0x78716c;
      const mat = new THREE.MeshStandardMaterial({ color: coatColor, roughness: 0.8 });
      const pinkMat = new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.5 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

      // Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), mat);
      body.rotateX(Math.PI / 2);
      group.add(body);

      // Ears
      const lEar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 8), pinkMat);
      lEar.position.set(0.025, 0.035, 0.02);
      lEar.rotateX(Math.PI / 4);
      group.add(lEar);

      const rEar = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.005, 8), pinkMat);
      rEar.position.set(-0.025, 0.035, 0.02);
      rEar.rotateX(Math.PI / 4);
      group.add(rEar);

      // Eyes
      const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), eyeMat);
      lEye.position.set(0.022, 0.02, 0.04);
      group.add(lEye);

      const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), eyeMat);
      rEye.position.set(-0.022, 0.02, 0.04);
      group.add(rEye);

      // Tail
      const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.006, 0.14, 4), pinkMat);
      tail.position.set(0, 0.01, -0.11);
      tail.rotateX(-Math.PI / 3);
      group.add(tail);

    } else if (type === 'rabbit') {
      const furMat = new THREE.MeshStandardMaterial({ color: 0xd6d3d1, roughness: 0.9 });
      const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfafaf9, roughness: 0.9 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1c1917 });

      // Body & Hindquarters
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), furMat);
      body.scale.set(0.9, 1.0, 1.4);
      group.add(body);

      // Head
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), furMat);
      head.position.set(0, 0.04, 0.08);
      group.add(head);

      // Long Rabbit Ears
      const lEar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.008), furMat);
      lEar.position.set(0.025, 0.12, 0.06);
      lEar.rotateZ(-0.15);
      group.add(lEar);

      const rEar = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.12, 0.008), furMat);
      rEar.position.set(-0.025, 0.12, 0.06);
      rEar.rotateZ(0.15);
      group.add(rEar);

      // Eyes
      const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), eyeMat);
      lEye.position.set(0.038, 0.05, 0.09);
      group.add(lEye);
      const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.007, 6, 6), eyeMat);
      rEye.position.set(-0.038, 0.05, 0.09);
      group.add(rEye);

      // Cotton Puff Tail
      const tail = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 6), whiteMat);
      tail.position.set(0, 0.03, -0.11);
      group.add(tail);

    } else if (type === 'squirrel') {
      const mat = new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.8 });
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

      // Body
      const body = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 6), mat);
      body.rotateX(Math.PI / 2.2);
      group.add(body);

      // Bushy tail
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.22, 5), mat);
      tail.position.set(0, 0.08, -0.06);
      tail.rotateX(-Math.PI / 1.5);
      group.add(tail);

      // Eyes
      const lEye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), eyeMat);
      lEye.position.set(0.03, 0.03, 0.04);
      group.add(lEye);
      const rEye = new THREE.Mesh(new THREE.SphereGeometry(0.006, 6, 6), eyeMat);
      rEye.position.set(-0.03, 0.03, 0.04);
      group.add(rEye);

    } else if (type === 'bird' || type === 'thrush') {
      const featherMat = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.7 });
      const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 7, 7), featherMat);
      body.scale.set(0.8, 0.85, 1.3);
      group.add(body);

      // Wings
      const lWing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.12), featherMat);
      lWing.position.set(0.06, 0.01, 0);
      group.add(lWing);
      const rWing = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.015, 0.12), featherMat);
      rWing.position.set(-0.06, 0.01, 0);
      group.add(rWing);

      // Beak
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.04, 4), beakMat);
      beak.position.set(0, 0.01, 0.08);
      beak.rotateX(Math.PI / 2);
      group.add(beak);

    } else if (type === 'fish') {
      const scaleMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.6, roughness: 0.2 });
      const finMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8 });

      // Body
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), scaleMat);
      body.scale.set(0.4, 0.9, 1.8);
      group.add(body);

      // Tail fin
      const tailFin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.08, 3), finMat);
      tailFin.position.set(0, 0, -0.09);
      tailFin.rotateZ(Math.PI / 2);
      group.add(tailFin);
    }

    return group;
  }
}
