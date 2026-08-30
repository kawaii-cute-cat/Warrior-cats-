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

      if (cy > 0.35 && cz > 0.17 && cx > 0.018) {
        triGroups.leftEar.push(t);
      } else if (cy > 0.35 && cz > 0.17 && cx < -0.018) {
        triGroups.rightEar.push(t);
      } else if (cz > 0.15 && cy > 0.20) {
        triGroups.head.push(t);
      } else if (cz < -0.21 && cy > 0.23 && Math.abs(cx) < 0.04) {
        if (cz > -0.28) triGroups.tail0.push(t);
        else if (cz > -0.35) triGroups.tail1.push(t);
        else if (cz > -0.42) triGroups.tail2.push(t);
        else triGroups.tail3.push(t);
      } else if (cz > 0.02 && cx > 0.025 && cy < 0.26) {
        if (cy > 0.14) triGroups.frontLeftLegUpper.push(t);
        else triGroups.frontLeftForearm.push(t);
      } else if (cz > 0.02 && cx < -0.025 && cy < 0.26) {
        if (cy > 0.14) triGroups.frontRightLegUpper.push(t);
        else triGroups.frontRightForearm.push(t);
      } else if (cz < -0.10 && cx > 0.025 && cy < 0.26) {
        if (cy > 0.14) triGroups.backLeftLegUpper.push(t);
        else triGroups.backLeftShin.push(t);
      } else if (cz < -0.10 && cx < -0.025 && cy < 0.26) {
        if (cy > 0.14) triGroups.backRightLegUpper.push(t);
        else triGroups.backRightShin.push(t);
      } else {
        triGroups.torso.push(t);
      }
    }

    // Pivot offsets (in world meters)
    this.cachedSubGeometries = {
      torso: buildGeo(triGroups.torso, 0, 0.22, -0.02),
      head: buildGeo(triGroups.head, 0, 0.29, 0.22),
      leftEar: buildGeo(triGroups.leftEar, 0.037, 0.38, 0.218),
      rightEar: buildGeo(triGroups.rightEar, -0.037, 0.38, 0.218),
      frontLeftLegUpper: buildGeo(triGroups.frontLeftLegUpper, 0.052, 0.19, 0.086),
      frontLeftForearm: buildGeo(triGroups.frontLeftForearm, 0.047, 0.07, 0.099),
      frontRightLegUpper: buildGeo(triGroups.frontRightLegUpper, -0.052, 0.19, 0.086),
      frontRightForearm: buildGeo(triGroups.frontRightForearm, -0.047, 0.07, 0.099),
      backLeftLegUpper: buildGeo(triGroups.backLeftLegUpper, 0.051, 0.20, -0.144),
      backLeftShin: buildGeo(triGroups.backLeftShin, 0.060, 0.07, -0.141),
      backRightLegUpper: buildGeo(triGroups.backRightLegUpper, -0.051, 0.20, -0.144),
      backRightShin: buildGeo(triGroups.backRightShin, -0.060, 0.07, -0.141),
      tail0: buildGeo(triGroups.tail0, 0, 0.29, -0.21),
      tail1: buildGeo(triGroups.tail1, 0, 0.29, -0.28),
      tail2: buildGeo(triGroups.tail2, 0, 0.29, -0.35),
      tail3: buildGeo(triGroups.tail3, 0, 0.29, -0.42),
    };

    return this.cachedSubGeometries;
  }

  /**
   * Generates a sleek, contoured low-poly cheek fur tuft attached flush to the cheekbone.
   * Expands the silhouette outward and back along the jawline without intersecting the muzzle.
   * Directly inspired by stylized warrior cat cheek tufts.
   */
  private static createCheekFurGeometry(tier: 'medium' | 'fluffy' | 'extra_fluffy', isLeft: boolean): THREE.BufferGeometry {
    const sign = isLeft ? 1 : -1;

    if (tier === 'medium') {
      // Sleek, streamlined single-tier low-poly cheek tuft
      const w = 0.026;
      const l = 0.046;
      const d = 0.014;

      const positions = new Float32Array([
        // Top facet: Root to cheek flare to rear tip
        0, 0.005, 0.010,
        sign * w * 0.7, 0.0, 0.0,
        sign * w, -d * 0.6, -l * 0.5,

        // Outer lateral facet: Root to rear tip to trailing jaw point
        0, -d * 0.8, 0.005,
        sign * w, -d * 0.6, -l * 0.5,
        sign * w * 0.45, -d * 1.2, -l * 0.85,

        // Trailing blend facet: Cheek flare to trailing point to rear root
        sign * w, -d * 0.6, -l * 0.5,
        0, -d * 0.5, -l,
        sign * w * 0.45, -d * 1.2, -l * 0.85,

        // Underside jaw blend facet
        0, -d * 0.8, 0.005,
        sign * w * 0.45, -d * 1.2, -l * 0.85,
        0, -d * 0.5, -l,
      ]);

      const uvs = new Float32Array([
        0.58, 0.80,  0.64, 0.82,  0.68, 0.78,
        0.58, 0.74,  0.68, 0.78,  0.65, 0.72,
        0.68, 0.78,  0.60, 0.70,  0.65, 0.72,
        0.58, 0.74,  0.65, 0.72,  0.60, 0.70,
      ]);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      return geo;
    }

    // Multi-tiered layered longhair cheek fluff (upper flare + mid tuft + lower jaw tuft)
    const scale = tier === 'extra_fluffy' ? 1.25 : 1.0;
    const w1 = 0.038 * scale; // Upper cheekbone flare
    const w2 = 0.046 * scale; // Mid cheek tuft
    const w3 = 0.032 * scale; // Lower jaw tuft
    const l1 = 0.055 * scale;
    const l2 = 0.075 * scale;
    const l3 = 0.065 * scale;
    const d = 0.022 * scale;

    const positions = new Float32Array([
      // --- TIER 1: Upper Cheekbone Flare ---
      0, 0.012, 0.015,
      sign * w1 * 0.6, 0.006, 0.005,
      sign * w1, -d * 0.35, -l1 * 0.45,

      0, 0.012, 0.015,
      sign * w1, -d * 0.35, -l1 * 0.45,
      0, -d * 0.2, -l1 * 0.85,

      // --- TIER 2: Main Outer Cheek Tuft (Widest point of head silhouette) ---
      0, -d * 0.2, 0.010,
      sign * w2, -d * 0.75, -l2 * 0.5,
      sign * w1, -d * 0.35, -l1 * 0.45,

      0, -d * 0.2, 0.010,
      sign * w2 * 0.7, -d * 1.1, -l2 * 0.7,
      sign * w2, -d * 0.75, -l2 * 0.5,

      sign * w2, -d * 0.75, -l2 * 0.5,
      sign * w2 * 0.7, -d * 1.1, -l2 * 0.7,
      0, -d * 0.6, -l2,

      // --- TIER 3: Lower Jaw / Throat Feather ---
      0, -d * 0.65, 0.005,
      sign * w3, -d * 1.35, -l3 * 0.45,
      sign * w2 * 0.7, -d * 1.1, -l2 * 0.7,

      0, -d * 0.65, 0.005,
      0, -d * 0.9, -l3 * 0.9,
      sign * w3, -d * 1.35, -l3 * 0.45,

      sign * w3, -d * 1.35, -l3 * 0.45,
      0, -d * 0.9, -l3 * 0.9,
      0, -d * 0.6, -l2,
    ]);

    const uvs = new Float32Array([
      0.56, 0.84,  0.62, 0.85,  0.68, 0.82,
      0.56, 0.84,  0.68, 0.82,  0.62, 0.78,

      0.56, 0.78,  0.70, 0.80,  0.68, 0.82,
      0.56, 0.78,  0.66, 0.74,  0.70, 0.80,
      0.70, 0.80,  0.66, 0.74,  0.60, 0.72,

      0.56, 0.72,  0.66, 0.70,  0.66, 0.74,
      0.56, 0.72,  0.58, 0.68,  0.66, 0.70,
      0.66, 0.70,  0.58, 0.68,  0.60, 0.72,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates a feathered neck scruff collar wrapping around the feline neck.
   * Bridges head and torso with low-poly downward-angled tufts.
   */
  private static createNeckScruffGeometry(isFluffy: boolean): THREE.BufferGeometry {
    const scale = isFluffy ? 1.0 : 0.75;
    const w = 0.085 * scale;
    const h = 0.055 * scale;
    const fwd = 0.045 * scale;
    const back = 0.035 * scale;

    const positions = new Float32Array([
      // Left scruff tuft
      0, 0.02, -back,
      w * 0.8, -h * 0.2, -back * 0.5,
      w * 1.1, -h * 0.8, -back * 0.2,

      0, 0.02, -back,
      w * 1.1, -h * 0.8, -back * 0.2,
      w * 0.5, -h * 1.1, 0.0,

      // Right scruff tuft
      0, 0.02, -back,
      -w * 1.1, -h * 0.8, -back * 0.2,
      -w * 0.8, -h * 0.2, -back * 0.5,

      0, 0.02, -back,
      -w * 0.5, -h * 1.1, 0.0,
      -w * 1.1, -h * 0.8, -back * 0.2,

      // Lateral neck points to front shoulder bridge
      w * 0.5, -h * 1.1, 0.0,
      w * 0.7, -h * 0.7, fwd * 0.6,
      0, -h * 0.4, fwd * 0.8,

      -w * 0.5, -h * 1.1, 0.0,
      0, -h * 0.4, fwd * 0.8,
      -w * 0.7, -h * 0.7, fwd * 0.6,
    ]);

    const uvs = new Float32Array([
      0.35, 0.40,  0.42, 0.38,  0.48, 0.35,
      0.35, 0.40,  0.48, 0.35,  0.40, 0.30,

      0.35, 0.40,  0.48, 0.35,  0.42, 0.38,
      0.35, 0.40,  0.40, 0.30,  0.48, 0.35,

      0.40, 0.30,  0.44, 0.34,  0.30, 0.38,
      0.40, 0.30,  0.30, 0.38,  0.44, 0.34,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates a layered, scalloped V-shaped chest ruff.
   * Begins naturally beneath the throat, cascades downward in stylized pointed clumps,
   * and hugs the feline sternum seamlessly.
   */
  private static createLayeredChestRuffGeometry(level: 'medium' | 'fluffy' | 'extra_fluffy'): THREE.BufferGeometry {
    if (level === 'medium') {
      // Subtle, streamlined chest fullness
      const hw = 0.048;
      const h = 0.065;
      const curve = 0.024;

      const positions = new Float32Array([
        // Upper crest to mid chest V
        -hw, 0.015, 0,
        0, 0.025, curve * 0.8,
        -hw * 0.65, -h * 0.5, curve * 1.1,

        0, 0.025, curve * 0.8,
        hw, 0.015, 0,
        hw * 0.65, -h * 0.5, curve * 1.1,

        // Mid chest to central soft V-tip
        0, 0.025, curve * 0.8,
        hw * 0.65, -h * 0.5, curve * 1.1,
        0, -h * 0.95, curve * 0.9,

        0, 0.025, curve * 0.8,
        0, -h * 0.95, curve * 0.9,
        -hw * 0.65, -h * 0.5, curve * 1.1,
      ]);

      const uvs = new Float32Array([
        0.20, 0.72,  0.26, 0.76,  0.22, 0.66,
        0.26, 0.76,  0.32, 0.72,  0.30, 0.66,
        0.26, 0.76,  0.30, 0.66,  0.26, 0.60,
        0.26, 0.76,  0.26, 0.60,  0.22, 0.66,
      ]);

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.computeVertexNormals();
      return geo;
    }

    // Full layered scalloped chest ruff (3 distinct cascading tiers: Upper collar, Mid bib, Lower sternum V)
    const scale = level === 'extra_fluffy' ? 1.20 : 1.0;
    const hwTop = 0.068 * scale;
    const hwMid = 0.086 * scale;
    const h1 = 0.045 * scale;
    const h2 = 0.090 * scale;
    const h3 = 0.130 * scale;
    const fwd = 0.036 * scale;

    const positions = new Float32Array([
      // === TIER 1: Upper Throat Clumps (Hugs throat below chin) ===
      -hwTop, 0.018, 0.005,
      0, 0.028, fwd * 0.7,
      -hwTop * 0.55, -h1, fwd * 0.95,

      0, 0.028, fwd * 0.7,
      hwTop, 0.018, 0.005,
      hwTop * 0.55, -h1, fwd * 0.95,

      0, 0.028, fwd * 0.7,
      hwTop * 0.55, -h1, fwd * 0.95,
      0, -h1 * 1.1, fwd * 1.05,

      0, 0.028, fwd * 0.7,
      0, -h1 * 1.1, fwd * 1.05,
      -hwTop * 0.55, -h1, fwd * 0.95,

      // === TIER 2: Mid-Chest Layered Flakes (Scalloped lateral tufts) ===
      -hwMid, -h1 * 0.7, fwd * 0.4,
      -hwTop * 0.55, -h1, fwd * 0.95,
      -hwMid * 0.75, -h2 * 0.85, fwd * 0.9,

      hwTop * 0.55, -h1, fwd * 0.95,
      hwMid, -h1 * 0.7, fwd * 0.4,
      hwMid * 0.75, -h2 * 0.85, fwd * 0.9,

      -hwTop * 0.55, -h1, fwd * 0.95,
      0, -h1 * 1.1, fwd * 1.05,
      -hwMid * 0.35, -h2, fwd * 1.1,

      0, -h1 * 1.1, fwd * 1.05,
      hwTop * 0.55, -h1, fwd * 0.95,
      hwMid * 0.35, -h2, fwd * 1.1,

      0, -h1 * 1.1, fwd * 1.05,
      hwMid * 0.35, -h2, fwd * 1.1,
      -hwMid * 0.35, -h2, fwd * 1.1,

      // === TIER 3: Lower Sternum Cascading V-Taper ===
      -hwMid * 0.75, -h2 * 0.85, fwd * 0.9,
      -hwMid * 0.35, -h2, fwd * 1.1,
      0, -h3, fwd * 0.85,

      hwMid * 0.35, -h2, fwd * 1.1,
      hwMid * 0.75, -h2 * 0.85, fwd * 0.9,
      0, -h3, fwd * 0.85,

      -hwMid * 0.35, -h2, fwd * 1.1,
      hwMid * 0.35, -h2, fwd * 1.1,
      0, -h3, fwd * 0.85,
    ]);

    const uvs = new Float32Array([
      // Tier 1 UVs
      0.18, 0.75,  0.26, 0.78,  0.22, 0.72,
      0.26, 0.78,  0.34, 0.75,  0.30, 0.72,
      0.26, 0.78,  0.30, 0.72,  0.26, 0.68,
      0.26, 0.78,  0.26, 0.68,  0.22, 0.72,

      // Tier 2 UVs
      0.14, 0.70,  0.22, 0.72,  0.18, 0.64,
      0.30, 0.72,  0.38, 0.70,  0.34, 0.64,
      0.22, 0.72,  0.26, 0.68,  0.22, 0.62,
      0.26, 0.68,  0.30, 0.72,  0.30, 0.62,
      0.26, 0.68,  0.30, 0.62,  0.22, 0.62,

      // Tier 3 UVs
      0.18, 0.64,  0.22, 0.62,  0.26, 0.54,
      0.30, 0.62,  0.34, 0.64,  0.26, 0.54,
      0.22, 0.62,  0.30, 0.62,  0.26, 0.54,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates shoulder cape / chest transition fur attached to the body.
   * Seamlessly connects neck ruff across the clavicles, shoulders, and toward front legs.
   */
  private static createShoulderCapeFurGeometry(isExtraFluffy: boolean): THREE.BufferGeometry {
    const scale = isExtraFluffy ? 1.20 : 1.0;
    const w = 0.105 * scale;
    const fwd = 0.225;
    const back = 0.120;
    const h = 0.055 * scale;

    const positions = new Float32Array([
      // Left shoulder cape
      0, 0.035, fwd,
      w * 0.85, 0.010, fwd * 0.9,
      w * 1.05, -h * 0.7, back,

      0, 0.035, fwd,
      w * 1.05, -h * 0.7, back,
      0, -h * 0.9, fwd * 0.95,

      // Right shoulder cape
      0, 0.035, fwd,
      -w * 1.05, -h * 0.7, back,
      -w * 0.85, 0.010, fwd * 0.9,

      0, 0.035, fwd,
      0, -h * 0.9, fwd * 0.95,
      -w * 1.05, -h * 0.7, back,

      // Lower chest to front leg transition facets
      0, -h * 0.9, fwd * 0.95,
      w * 0.75, -h * 1.35, fwd * 0.75,
      0, -h * 1.45, fwd * 0.65,

      0, -h * 0.9, fwd * 0.95,
      0, -h * 1.45, fwd * 0.65,
      -w * 0.75, -h * 1.35, fwd * 0.75,
    ]);

    const uvs = new Float32Array([
      0.30, 0.60,  0.40, 0.58,  0.42, 0.50,
      0.30, 0.60,  0.42, 0.50,  0.32, 0.48,

      0.30, 0.60,  0.42, 0.50,  0.40, 0.58,
      0.30, 0.60,  0.32, 0.48,  0.42, 0.50,

      0.32, 0.48,  0.38, 0.42,  0.30, 0.40,
      0.32, 0.48,  0.30, 0.40,  0.38, 0.42,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates long-fur volume along the dorsal spine/back attached to the body.
   * Adds gentle, soft fullness along the backline without looking like a spiky mohawk.
   */
  private static createDorsalSpineFurGeometry(isExtraFluffy: boolean): THREE.BufferGeometry {
    const scale = isExtraFluffy ? 1.20 : 1.0;
    const hw = 0.075 * scale;
    const ridgeH = 0.022 * scale;

    // Spine spans from Z = +0.18 (withers) through Z = 0.0 (mid-back) to Z = -0.22 (sacrum)
    const positions = new Float32Array([
      // Segment 1: Withers to Mid-back (Left slope)
      0, 0.105 + ridgeH, 0.18,
      -hw, 0.075, 0.16,
      -hw * 1.05, 0.070, 0.0,

      0, 0.105 + ridgeH, 0.18,
      -hw * 1.05, 0.070, 0.0,
      0, 0.100 + ridgeH, 0.0,

      // Segment 1: Withers to Mid-back (Right slope)
      0, 0.105 + ridgeH, 0.18,
      hw * 1.05, 0.070, 0.0,
      hw, 0.075, 0.16,

      0, 0.105 + ridgeH, 0.18,
      0, 0.100 + ridgeH, 0.0,
      hw * 1.05, 0.070, 0.0,

      // Segment 2: Mid-back to Sacrum / Rump (Left slope)
      0, 0.100 + ridgeH, 0.0,
      -hw * 1.05, 0.070, 0.0,
      -hw * 0.90, 0.075, -0.22,

      0, 0.100 + ridgeH, 0.0,
      -hw * 0.90, 0.075, -0.22,
      0, 0.095 + ridgeH * 0.8, -0.22,

      // Segment 2: Mid-back to Sacrum / Rump (Right slope)
      0, 0.100 + ridgeH, 0.0,
      hw * 0.90, 0.075, -0.22,
      hw * 1.05, 0.070, 0.0,

      0, 0.100 + ridgeH, 0.0,
      0, 0.095 + ridgeH * 0.8, -0.22,
      hw * 0.90, 0.075, -0.22,
    ]);

    const uvs = new Float32Array([
      0.45, 0.55,  0.35, 0.55,  0.35, 0.35,
      0.45, 0.55,  0.35, 0.35,  0.45, 0.35,

      0.45, 0.55,  0.55, 0.35,  0.55, 0.55,
      0.45, 0.55,  0.45, 0.35,  0.55, 0.35,

      0.45, 0.35,  0.35, 0.35,  0.36, 0.18,
      0.45, 0.35,  0.36, 0.18,  0.45, 0.18,

      0.45, 0.35,  0.54, 0.18,  0.55, 0.35,
      0.45, 0.35,  0.45, 0.18,  0.54, 0.18,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates continuous layered flank fur along the sides of the torso.
   * Follows the torso from shoulder to mid-body to flank, expanding the silhouette.
   */
  private static createFlankFurGeometry(isLeft: boolean, isExtraFluffy: boolean): THREE.BufferGeometry {
    const sign = isLeft ? 1 : -1;
    const scale = isExtraFluffy ? 1.22 : 1.0;
    const outward = (0.016 * scale);
    const drop = (0.038 * scale);

    // Flank points along the torso length (Z: +0.16 -> 0.0 -> -0.18)
    const positions = new Float32Array([
      // Layer 1: Shoulder / Upper Flank Tuft
      sign * 0.088, 0.030, 0.16,
      sign * (0.096 + outward), -0.015 - drop * 0.6, 0.11,
      sign * 0.090, -0.060, 0.08,

      sign * 0.088, 0.030, 0.16,
      sign * 0.092, 0.020, 0.04,
      sign * (0.096 + outward), -0.015 - drop * 0.6, 0.11,

      // Layer 2: Mid-Torso Flank Tuft
      sign * 0.092, 0.020, 0.04,
      sign * (0.098 + outward * 1.1), -0.025 - drop, -0.02,
      sign * 0.092, -0.065, -0.05,

      sign * 0.092, 0.020, 0.04,
      sign * 0.090, 0.015, -0.10,
      sign * (0.098 + outward * 1.1), -0.025 - drop, -0.02,

      // Layer 3: Rear Flank / Hip Tuft
      sign * 0.090, 0.015, -0.10,
      sign * (0.095 + outward), -0.020 - drop * 0.85, -0.16,
      sign * 0.088, -0.060, -0.18,

      sign * 0.090, 0.015, -0.10,
      sign * 0.085, 0.010, -0.22,
      sign * (0.095 + outward), -0.020 - drop * 0.85, -0.16,
    ]);

    const uvs = new Float32Array([
      0.30, 0.48,  0.22, 0.42,  0.28, 0.38,
      0.30, 0.48,  0.30, 0.38,  0.22, 0.42,

      0.30, 0.38,  0.20, 0.30,  0.26, 0.26,
      0.30, 0.38,  0.30, 0.26,  0.20, 0.30,

      0.30, 0.26,  0.22, 0.20,  0.28, 0.16,
      0.30, 0.26,  0.30, 0.16,  0.22, 0.20,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates a flowing volumetric plume envelope segment for the tail joints.
   * Directly follows the 4 articulated tail chain bones, overlapping cleanly between joints
   * to eliminate all visible gaps during rotation and curling.
   */
  private static createTailPlumeGeometry(jointIndex: number, isExtraFluffy: boolean): THREE.BufferGeometry {
    const mult = isExtraFluffy ? 1.25 : 1.05;

    // Segment bounds: Starts at +0.015 to overlap the parent joint/body, extends to -0.075 (0.070m joint length)
    const zStart = 0.015;
    const zMid = -0.035;
    const zEnd = -0.075;

    let w1 = 0.055 * mult; // Start width
    let h1 = 0.048 * mult; // Start height
    let w2 = 0.076 * mult; // Mid width
    let h2 = 0.065 * mult; // Mid height
    let w3 = 0.082 * mult; // End width
    let h3 = 0.070 * mult; // End height

    if (jointIndex === 0) {
      // Base joint connected to rump
      w1 = 0.048 * mult;
      h1 = 0.042 * mult;
      w2 = 0.068 * mult;
      h2 = 0.058 * mult;
      w3 = 0.080 * mult;
      h3 = 0.068 * mult;
    } else if (jointIndex === 1) {
      // Main mid plume arch
      w1 = 0.080 * mult; // Seamlessly matches t0 end
      h1 = 0.068 * mult;
      w2 = 0.092 * mult;
      h2 = 0.078 * mult;
      w3 = 0.088 * mult;
      h3 = 0.075 * mult;
    } else if (jointIndex === 2) {
      // Plume apex
      w1 = 0.088 * mult; // Matches t1 end
      h1 = 0.075 * mult;
      w2 = 0.084 * mult;
      h2 = 0.072 * mult;
      w3 = 0.074 * mult;
      h3 = 0.062 * mult;
    } else if (jointIndex === 3) {
      // Tip joint: Smooth natural taper down to a soft rounded tip
      w1 = 0.074 * mult; // Matches t2 end
      h1 = 0.062 * mult;
      w2 = 0.052 * mult;
      h2 = 0.044 * mult;
      w3 = 0.030 * mult;
      h3 = 0.026 * mult;
    }

    const hw1 = w1 * 0.5;
    const hh1 = h1 * 0.5;
    const hw2 = w2 * 0.5;
    const hh2 = h2 * 0.5;
    const hw3 = w3 * 0.5;
    const hh3 = h3 * 0.5;

    // Helper: 8 vertices around an elliptical cross section
    const ring1 = [
      [0, hh1, zStart],
      [hw1 * 0.72, hh1 * 0.72, zStart],
      [hw1, 0, zStart],
      [hw1 * 0.72, -hh1 * 0.72, zStart],
      [0, -hh1, zStart],
      [-hw1 * 0.72, -hh1 * 0.72, zStart],
      [-hw1, 0, zStart],
      [-hw1 * 0.72, hh1 * 0.72, zStart],
    ];

    const ring2 = [
      [0, hh2, zMid],
      [hw2 * 0.72, hh2 * 0.72, zMid],
      [hw2, 0, zMid],
      [hw2 * 0.72, -hh2 * 0.72, zMid],
      [0, -hh2, zMid],
      [-hw2 * 0.72, -hh2 * 0.72, zMid],
      [-hw2, 0, zMid],
      [-hw2 * 0.72, hh2 * 0.72, zMid],
    ];

    const ring3 = [
      [0, hh3, zEnd],
      [hw3 * 0.72, hh3 * 0.72, zEnd],
      [hw3, 0, zEnd],
      [hw3 * 0.72, -hh3 * 0.72, zEnd],
      [0, -hh3, zEnd],
      [-hw3 * 0.72, -hh3 * 0.72, zEnd],
      [-hw3, 0, zEnd],
      [-hw3 * 0.72, hh3 * 0.72, zEnd],
    ];

    const positions: number[] = [];

    // Connect ring1 -> ring2 (8 quads = 16 triangles)
    for (let i = 0; i < 8; i++) {
      const next = (i + 1) % 8;
      positions.push(...ring1[i], ...ring1[next], ...ring2[next]);
      positions.push(...ring1[i], ...ring2[next], ...ring2[i]);
    }

    // Connect ring2 -> ring3 (8 quads = 16 triangles)
    for (let i = 0; i < 8; i++) {
      const next = (i + 1) % 8;
      positions.push(...ring2[i], ...ring2[next], ...ring3[next]);
      positions.push(...ring2[i], ...ring3[next], ...ring3[i]);
    }

    // End cap for tip joint
    if (jointIndex === 3) {
      const tipZ = zEnd - 0.025;
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        positions.push(...ring3[i], ...ring3[next], 0, 0, tipZ);
      }
    }

    const uvs: number[] = [];
    const triCount = positions.length / 9;
    const vBase = 0.85 + (jointIndex / 4) * 0.12;
    const vNext = 0.85 + ((jointIndex + 1) / 4) * 0.12;

    for (let i = 0; i < triCount; i++) {
      uvs.push(0.08, vBase, 0.16, vBase, 0.12, vNext);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  /**
   * Generates hind leg pantaloons / breeches and foreleg elbow feathering.
   * Flushly attached along the back of the feline limbs.
   */
  private static createLegFeatherGeometry(width: number, length: number, isLeft: boolean): THREE.BufferGeometry {
    const sign = isLeft ? 1 : -1;
    const hw = width * 0.5;
    const positions = new Float32Array([
      // Upper limb root to rear feather point
      0, 0.01, 0.005,
      sign * hw * 0.5, -length * 0.4, -width * 0.85,
      0, -length * 0.85, -width * 0.4,

      // Inner limb blend
      0, 0.01, 0.005,
      0, -length * 0.85, -width * 0.4,
      -sign * hw * 0.35, -length * 0.4, -width * 0.5,

      // Lower feather taper to hock/paw
      sign * hw * 0.5, -length * 0.4, -width * 0.85,
      0, -length, -width * 0.15,
      0, -length * 0.85, -width * 0.4,

      0, -length * 0.85, -width * 0.4,
      0, -length, -width * 0.15,
      -sign * hw * 0.35, -length * 0.4, -width * 0.5,
    ]);

    const uvs = new Float32Array([
      0.80, 0.22,  0.88, 0.18,  0.82, 0.12,
      0.80, 0.22,  0.82, 0.12,  0.76, 0.16,
      0.88, 0.18,  0.82, 0.08,  0.82, 0.12,
      0.82, 0.12,  0.82, 0.08,  0.76, 0.16,
    ]);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
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
    body.position.set(0, 0.22, -0.02);
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
    neckGroup.position.set(0, 0.05, 0.16);
    body.add(neckGroup);

    const headGroup = new THREE.Group();
    headGroup.name = 'HeadGroup';
    headGroup.position.set(0, 0.02, 0.08);
    headGroup.scale.set(headScale, headScale, headScale);
    neckGroup.add(headGroup);

    const headMesh = new THREE.Mesh(geos.head, coatMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // ==========================================
    // 3. 3D EYES EMBEDDED IN SKULL SOCKETS
    // ==========================================
    const buildEyeMesh = (isLeft: boolean, mat: THREE.Material) => {
      const eyeNode = new THREE.Group();
      // Elevated to upper-middle face naturally within the skull socket above the muzzle and below the brow
      eyeNode.position.set(isLeft ? 0.033 : -0.033, 0.014, 0.0285);
      eyeNode.rotation.y = isLeft ? 0.32 : -0.32;
      eyeNode.rotation.x = -0.08;
      eyeNode.rotation.z = isLeft ? 0.06 : -0.06;

      // 1. Dark feline eyeliner contour
      const rimGeo = new THREE.RingGeometry(0.007, 0.016, 12);
      const rimMat = new THREE.MeshBasicMaterial({ color: 0x18181b, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
      const rim = new THREE.Mesh(rimGeo, rimMat);
      eyeNode.add(rim);

      // 2. Glowing Iris Disc
      const irisGeo = new THREE.CircleGeometry(0.013, 12);
      const iris = new THREE.Mesh(irisGeo, mat);
      iris.position.z = 0.001;
      eyeNode.add(iris);

      // 3. Sharp Feline Slit Pupil
      const pupilGeo = new THREE.PlaneGeometry(0.0035, 0.018);
      const pupil = new THREE.Mesh(pupilGeo, pupilMat);
      pupil.position.z = 0.002;
      eyeNode.add(pupil);

      // 4. Subtle Gloss Highlight
      const glossGeo = new THREE.CircleGeometry(0.004, 8);
      const glossMat = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.75, transparent: true });
      const gloss = new THREE.Mesh(glossGeo, glossMat);
      gloss.position.set(0.0035, 0.004, 0.003);
      eyeNode.add(gloss);

      return { eyeNode, iris };
    };

    const { eyeNode: leftEyeGroup, iris: leftEyeMesh } = buildEyeMesh(true, eyeMatLeft);
    const { eyeNode: rightEyeGroup, iris: rightEyeMesh } = buildEyeMesh(false, eyeMatRight);
    headGroup.add(leftEyeGroup);
    headGroup.add(rightEyeGroup);

    // ==========================================
    // 4. MUZZLE & HEAD PROFILE VARIANTS
    // ==========================================
    const muzzleShape: MuzzleShape = appearance.muzzleShape || 'classic';
    if (muzzleShape === 'short_snub') {
      headGroup.scale.set(headScale * 1.06, headScale * 0.96, headScale * 0.90);
    } else if (muzzleShape === 'long_angular') {
      headGroup.scale.set(headScale * 0.92, headScale * 0.98, headScale * 1.10);
    } else if (muzzleShape === 'broad_tom') {
      headGroup.scale.set(headScale * 1.12, headScale * 1.04, headScale * 1.02);
    }

    // Mouth / Jaw Group (holds prey)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.03, 0.04);
    headGroup.add(jawGroup);

    const preyMouthGroup = new THREE.Group();
    preyMouthGroup.name = 'PreyMouthGroup';
    preyMouthGroup.position.set(0, 0, 0.04);
    jawGroup.add(preyMouthGroup);

    // ==========================================
    // 5. EARS & EAR SHAPE VARIANTS
    // ==========================================
    const leftEarGroup = new THREE.Group();
    leftEarGroup.name = 'LeftEarGroup';
    leftEarGroup.position.set(0.037, 0.09, -0.002);
    headGroup.add(leftEarGroup);

    const rightEarGroup = new THREE.Group();
    rightEarGroup.name = 'RightEarGroup';
    rightEarGroup.position.set(-0.037, 0.09, -0.002);
    headGroup.add(rightEarGroup);

    const leftEarMesh = new THREE.Mesh(geos.leftEar, coatMaterial);
    const rightEarMesh = new THREE.Mesh(geos.rightEar, coatMaterial);
    leftEarGroup.add(leftEarMesh);
    rightEarGroup.add(rightEarMesh);

    const earShape: EarShape = appearance.earShape || 'pricked';
    if (earShape === 'lynx_tufted') {
      // Sleek, delicate lynx tufts at ear tips
      const tuftGeo = new THREE.ConeGeometry(0.008, 0.045, 3);
      const lTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      lTuft.position.set(0, 0.075, 0);
      leftEarGroup.add(lTuft);

      const rTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      rTuft.position.set(0, 0.075, 0);
      rightEarGroup.add(rTuft);
    } else if (earShape === 'folded') {
      leftEarGroup.rotation.x = 0.55;
      rightEarGroup.rotation.x = 0.55;
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
        new THREE.Vector3(0.025, -0.015 + i * 0.005, 0.045),
        new THREE.Vector3(0.095, -0.008 + i * 0.007, 0.055 - i * 0.008),
      ];
      const lGeo = new THREE.BufferGeometry().setFromPoints(lPts);
      whiskerGroup.add(new THREE.Line(lGeo, whiskerMat));

      // Right whiskers
      const rPts = [
        new THREE.Vector3(-0.025, -0.015 + i * 0.005, 0.045),
        new THREE.Vector3(-0.095, -0.008 + i * 0.007, 0.055 - i * 0.008),
      ];
      const rGeo = new THREE.BufferGeometry().setFromPoints(rPts);
      whiskerGroup.add(new THREE.Line(rGeo, whiskerMat));
    }
    headGroup.add(whiskerGroup);

    // ==========================================
    // 7. VISIBLY MEANINGFUL FUR SILHOUETTES & COAT VOLUMES
    // ==========================================
    const furGroup = new THREE.Group();
    furGroup.name = 'FurGeometryGroup';
    const furStyle: FurStyle = appearance.furStyle || 'medium';

    const isShort = furStyle === 'short' || furStyle === 'very_short' || furStyle === 'short_smooth';
    const isMedium = furStyle === 'medium' || furStyle === 'medium_soft';
    const isLongOrFluffy =
      furStyle === 'long' ||
      furStyle === 'fluffy' ||
      furStyle === 'very_fluffy' ||
      furStyle === 'long_haired' ||
      furStyle === 'long_flowing' ||
      furStyle === 'thick_winter';
    const isExtraFluffy = furStyle === 'fluffy' || furStyle === 'very_fluffy' || furStyle === 'thick_winter';

    if (isShort) {
      // 1. SHORT / SLEEK: Clean, streamlined, close-fitting athletic low-poly feline
      body.scale.set(bodyWidth * 0.96, 0.98, 1.0);
    } else if (isMedium) {
      // 2. MEDIUM-FLUFFY: Soft woodland feline coat with subtly fuller cheeks, neck scruff, chest ruff, and fuller tail
      body.scale.set(bodyWidth * 1.03, 1.02, 1.0);

      // Streamlined cheek tufts flush with cheekbones
      const lCheekGeo = this.createCheekFurGeometry('medium', true);
      const lCheek = new THREE.Mesh(lCheekGeo, coatMaterial);
      lCheek.position.set(0.044, -0.010, 0.008);
      lCheek.rotation.set(0.04, 0.22, -0.12);
      lCheek.castShadow = true;
      headGroup.add(lCheek);

      const rCheekGeo = this.createCheekFurGeometry('medium', false);
      const rCheek = new THREE.Mesh(rCheekGeo, coatMaterial);
      rCheek.position.set(-0.044, -0.010, 0.008);
      rCheek.rotation.set(0.04, -0.22, 0.12);
      rCheek.castShadow = true;
      headGroup.add(rCheek);

      // Subtle neck scruff
      const neckScruffGeo = this.createNeckScruffGeometry(false);
      const neckScruff = new THREE.Mesh(neckScruffGeo, coatMaterial);
      neckScruff.position.set(0, 0.01, -0.02);
      neckScruff.castShadow = true;
      neckGroup.add(neckScruff);

      // Subtle streamlined soft chest ruff
      const medRuffGeo = this.createLayeredChestRuffGeometry('medium');
      const medRuff = new THREE.Mesh(medRuffGeo, coatMaterial);
      medRuff.position.set(0, -0.04, 0.035);
      medRuff.castShadow = true;
      neckGroup.add(medRuff);

    } else if (isLongOrFluffy) {
      // 3. FLUFFY / LONG-HAIRED: Full majestic feline coat with layered chest ruff, cheek fluff, flank feathers, and back fur
      const fluffMult = isExtraFluffy ? 1.10 : 1.06;
      body.scale.set(bodyWidth * fluffMult, 1.03, 1.0);

      // Sculpted layered cheek fluff (broadens the skull silhouette and trails back along jawline)
      const lCheekGeo = this.createCheekFurGeometry(isExtraFluffy ? 'extra_fluffy' : 'fluffy', true);
      const lCheek = new THREE.Mesh(lCheekGeo, coatMaterial);
      lCheek.position.set(0.044, -0.010, 0.008);
      lCheek.rotation.set(0.04, 0.24, -0.14);
      lCheek.castShadow = true;
      headGroup.add(lCheek);

      const rCheekGeo = this.createCheekFurGeometry(isExtraFluffy ? 'extra_fluffy' : 'fluffy', false);
      const rCheek = new THREE.Mesh(rCheekGeo, coatMaterial);
      rCheek.position.set(-0.044, -0.010, 0.008);
      rCheek.rotation.set(0.04, -0.24, 0.14);
      rCheek.castShadow = true;
      headGroup.add(rCheek);

      // Feathered neck scruff collar wrapping around the neck
      const neckScruffGeo = this.createNeckScruffGeometry(true);
      const neckScruff = new THREE.Mesh(neckScruffGeo, coatMaterial);
      neckScruff.position.set(0, 0.01, -0.02);
      neckScruff.castShadow = true;
      neckGroup.add(neckScruff);

      // Cascading layered V-shaped chest ruff (starts below chin, flows smoothly down throat and upper chest)
      const chestRuffGeo = this.createLayeredChestRuffGeometry(isExtraFluffy ? 'extra_fluffy' : 'fluffy');
      const chestRuff = new THREE.Mesh(chestRuffGeo, coatMaterial);
      chestRuff.position.set(0, -0.04, 0.035);
      chestRuff.castShadow = true;
      neckGroup.add(chestRuff);

      // Shoulder cape fur: Connects throat ruff to shoulders and chest transition
      const shoulderCapeGeo = this.createShoulderCapeFurGeometry(isExtraFluffy);
      const shoulderCape = new THREE.Mesh(shoulderCapeGeo, coatMaterial);
      shoulderCape.position.set(0, 0.02, 0.0);
      shoulderCape.castShadow = true;
      body.add(shoulderCape);

      // Dorsal spine fur: Gentle long-hair fullness along the backline
      const dorsalSpineGeo = this.createDorsalSpineFurGeometry(isExtraFluffy);
      const dorsalSpine = new THREE.Mesh(dorsalSpineGeo, coatMaterial);
      dorsalSpine.position.set(0, 0.01, 0.0);
      dorsalSpine.castShadow = true;
      body.add(dorsalSpine);

      // Flank fur: Layered lateral fur following shoulders -> mid-torso -> hips
      const lFlankGeo = this.createFlankFurGeometry(true, isExtraFluffy);
      const lFlank = new THREE.Mesh(lFlankGeo, coatMaterial);
      lFlank.castShadow = true;
      body.add(lFlank);

      const rFlankGeo = this.createFlankFurGeometry(false, isExtraFluffy);
      const rFlank = new THREE.Mesh(rFlankGeo, coatMaterial);
      rFlank.castShadow = true;
      body.add(rFlank);
    }

    body.add(furGroup);

    // ==========================================
    // 8. FRONT LEGS & ARTICULATION
    // ==========================================
    const leftFrontLeg = new THREE.Group();
    leftFrontLeg.name = 'LeftFrontLeg';
    leftFrontLeg.position.set(0.052, -0.03, 0.106);
    leftFrontLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(leftFrontLeg);

    const lFrontUpperMesh = new THREE.Mesh(geos.frontLeftLegUpper, coatMaterial);
    lFrontUpperMesh.castShadow = true;
    leftFrontLeg.add(lFrontUpperMesh);

    const leftFrontForearm = new THREE.Group();
    leftFrontForearm.name = 'LeftFrontForearm';
    leftFrontForearm.position.set(-0.005, -0.12, 0.013);
    leftFrontLeg.add(leftFrontForearm);

    const lFrontForearmMesh = new THREE.Mesh(geos.frontLeftForearm, coatMaterial);
    lFrontForearmMesh.castShadow = true;
    leftFrontForearm.add(lFrontForearmMesh);

    const rightFrontLeg = new THREE.Group();
    rightFrontLeg.name = 'RightFrontLeg';
    rightFrontLeg.position.set(-0.052, -0.03, 0.106);
    rightFrontLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(rightFrontLeg);

    const rFrontUpperMesh = new THREE.Mesh(geos.frontRightLegUpper, coatMaterial);
    rFrontUpperMesh.castShadow = true;
    rightFrontLeg.add(rFrontUpperMesh);

    const rightFrontForearm = new THREE.Group();
    rightFrontForearm.name = 'RightFrontForearm';
    rightFrontForearm.position.set(0.005, -0.12, 0.013);
    rightFrontLeg.add(rightFrontForearm);

    const rFrontForearmMesh = new THREE.Mesh(geos.frontRightForearm, coatMaterial);
    rFrontForearmMesh.castShadow = true;
    rightFrontForearm.add(rFrontForearmMesh);

    // Front leg fur feathering (longhair / fluffy only)
    if (isLongOrFluffy) {
      const lFrontFeatherGeo = this.createLegFeatherGeometry(0.024, 0.075, true);
      const lFrontFeather = new THREE.Mesh(lFrontFeatherGeo, coatMaterial);
      lFrontFeather.position.set(0, -0.045, -0.015);
      lFrontFeather.castShadow = true;
      leftFrontLeg.add(lFrontFeather);

      const rFrontFeatherGeo = this.createLegFeatherGeometry(0.024, 0.075, false);
      const rFrontFeather = new THREE.Mesh(rFrontFeatherGeo, coatMaterial);
      rFrontFeather.position.set(0, -0.045, -0.015);
      rFrontFeather.castShadow = true;
      rightFrontLeg.add(rFrontFeather);
    }

    // ==========================================
    // 9. BACK LEGS & ARTICULATION
    // ==========================================
    const leftBackLeg = new THREE.Group();
    leftBackLeg.name = 'LeftBackLeg';
    leftBackLeg.position.set(0.051, -0.02, -0.124);
    leftBackLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(leftBackLeg);

    const lBackUpperMesh = new THREE.Mesh(geos.backLeftLegUpper, coatMaterial);
    lBackUpperMesh.castShadow = true;
    leftBackLeg.add(lBackUpperMesh);

    const leftBackShin = new THREE.Group();
    leftBackShin.name = 'LeftBackShin';
    leftBackShin.position.set(0.009, -0.13, 0.003);
    leftBackLeg.add(leftBackShin);

    const lBackShinMesh = new THREE.Mesh(geos.backLeftShin, coatMaterial);
    lBackShinMesh.castShadow = true;
    leftBackShin.add(lBackShinMesh);

    const rightBackLeg = new THREE.Group();
    rightBackLeg.name = 'RightBackLeg';
    rightBackLeg.position.set(-0.051, -0.02, -0.124);
    rightBackLeg.scale.set(pawScale, legScaleY, pawScale);
    body.add(rightBackLeg);

    const rBackUpperMesh = new THREE.Mesh(geos.backRightLegUpper, coatMaterial);
    rBackUpperMesh.castShadow = true;
    rightBackLeg.add(rBackUpperMesh);

    const rightBackShin = new THREE.Group();
    rightBackShin.name = 'RightBackShin';
    rightBackShin.position.set(-0.009, -0.13, 0.003);
    rightBackLeg.add(rightBackShin);

    const rBackShinMesh = new THREE.Mesh(geos.backRightShin, coatMaterial);
    rBackShinMesh.castShadow = true;
    rightBackShin.add(rBackShinMesh);

    // Hind leg breeches / pantaloons (longhair / fluffy only)
    if (isLongOrFluffy) {
      const lBackFeatherGeo = this.createLegFeatherGeometry(0.034, 0.095, true);
      const lBackFeather = new THREE.Mesh(lBackFeatherGeo, coatMaterial);
      lBackFeather.position.set(0, -0.045, -0.022);
      lBackFeather.castShadow = true;
      leftBackLeg.add(lBackFeather);

      const rBackFeatherGeo = this.createLegFeatherGeometry(0.034, 0.095, false);
      const rBackFeather = new THREE.Mesh(rBackFeatherGeo, coatMaterial);
      rBackFeather.position.set(0, -0.045, -0.022);
      rBackFeather.castShadow = true;
      rightBackLeg.add(rBackFeather);
    }

    // ==========================================
    // 10. TAIL & TAIL VARIANTS (4 ARTICULATED JOINTS)
    // ==========================================
    const tailJoints: THREE.Group[] = [];
    const tailType: TailType = appearance.tailType || 'sleek';

    const t0 = new THREE.Group();
    t0.name = 'TailJoint0';
    t0.position.set(0, 0.07, -0.19);
    body.add(t0);
    const m0 = new THREE.Mesh(geos.tail0, coatMaterial);
    m0.castShadow = true;
    t0.add(m0);
    tailJoints.push(t0);

    const t1 = new THREE.Group();
    t1.name = 'TailJoint1';
    t1.position.set(0, 0, -0.07);
    t0.add(t1);
    const m1 = new THREE.Mesh(geos.tail1, coatMaterial);
    m1.castShadow = true;
    t1.add(m1);
    tailJoints.push(t1);

    const t2 = new THREE.Group();
    t2.name = 'TailJoint2';
    t2.position.set(0, 0, -0.07);
    t1.add(t2);
    const m2 = new THREE.Mesh(geos.tail2, coatMaterial);
    m2.castShadow = true;
    t2.add(m2);
    tailJoints.push(t2);

    const t3 = new THREE.Group();
    t3.name = 'TailJoint3';
    t3.position.set(0, 0, -0.07);
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
    } else if (isMedium && tailType !== 'bushy_plume' && tailType !== 'plume' && tailType !== 'bushy') {
      // Medium-fluffy: Subtle, natural tail fullness while retaining a clean tapered silhouette
      t0.scale.set(1.08, 1.08, 1.0);
      t1.scale.set(1.12, 1.12, 1.0);
      t2.scale.set(1.14, 1.14, 1.0);
      t3.scale.set(1.08, 1.08, 1.0);
    } else if (tailType === 'bushy_plume' || tailType === 'plume' || tailType === 'bushy' || isLongOrFluffy) {
      // Bushy plume tail: Volumetric joint expansion + contoured flowing plume meshes attached along joints
      t0.scale.set(1.14, 1.14, 1.0);
      t1.scale.set(1.24, 1.24, 1.0);
      t2.scale.set(1.28, 1.28, 1.0);
      t3.scale.set(1.18, 1.18, 1.0);

      const p0Geo = this.createTailPlumeGeometry(0, isExtraFluffy);
      const p0 = new THREE.Mesh(p0Geo, coatMaterial);
      p0.castShadow = true;
      t0.add(p0);

      const p1Geo = this.createTailPlumeGeometry(1, isExtraFluffy);
      const p1 = new THREE.Mesh(p1Geo, coatMaterial);
      p1.castShadow = true;
      t1.add(p1);

      const p2Geo = this.createTailPlumeGeometry(2, isExtraFluffy);
      const p2 = new THREE.Mesh(p2Geo, coatMaterial);
      p2.castShadow = true;
      t2.add(p2);

      const p3Geo = this.createTailPlumeGeometry(3, isExtraFluffy);
      const p3 = new THREE.Mesh(p3Geo, coatMaterial);
      p3.castShadow = true;
      t3.add(p3);
    }

    // ==========================================
    // 11. BATTLE SCARS (SURFACE-ATTACHED FELINE SCARS)
    // ==========================================
    const scarType: ScarType = appearance.scarType || appearance.scar || 'none';
    const scarMat = new THREE.MeshBasicMaterial({ color: 0x991b1b, side: THREE.DoubleSide });

    if (scarType === 'eye_slash' || scarType === 'blind_eye_slash') {
      const slashGeo = new THREE.PlaneGeometry(0.006, 0.042);
      slashGeo.rotateZ(0.28);
      const slash = new THREE.Mesh(slashGeo, scarMat);
      slash.position.set(0.034, 0.014, 0.032);
      slash.rotation.y = 0.28;
      headGroup.add(slash);
    } else if (scarType === 'shoulder_scar' || scarType === 'shoulder_claw_marks') {
      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.PlaneGeometry(0.005, 0.045);
        sGeo.rotateZ(-0.35);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(0.08, 0.02 + i * 0.012, 0.10 - i * 0.01);
        sMesh.rotation.y = Math.PI / 2;
        body.add(sMesh);
      }
    } else if (scarType === 'chest_claw_marks' || scarType === 'chest_scar' || scarType === 'cross_scars') {
      for (let i = 0; i < 3; i++) {
        const sGeo = new THREE.PlaneGeometry(0.04, 0.005);
        sGeo.rotateZ(0.18);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(-0.02 + i * 0.015, -0.01 - i * 0.012, 0.14);
        body.add(sMesh);
      }
    } else if (scarType === 'muzzle_nick' || scarType === 'muzzle_scratch') {
      const nGeo = new THREE.PlaneGeometry(0.01, 0.01);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0.022, -0.008, 0.048);
      headGroup.add(nMesh);
    } else if (scarType === 'torn_ear' || scarType === 'torn_left_ear' || scarType === 'torn_right_ear') {
      const earTarget = scarType === 'torn_right_ear' ? rightEarGroup : leftEarGroup;
      earTarget.scale.set(0.82, 0.72, 0.85);
      const nGeo = new THREE.PlaneGeometry(0.018, 0.018);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0, 0.05, 0.01);
      earTarget.add(nMesh);
    } else if (scarType === 'tail_nick') {
      const nGeo = new THREE.PlaneGeometry(0.016, 0.016);
      const nMesh = new THREE.Mesh(nGeo, scarMat);
      nMesh.position.set(0, 0, -0.03);
      t1.add(nMesh);
    } else if (scarType === 'flank_scar' || scarType === 'battle_worn_all') {
      for (let i = 0; i < 4; i++) {
        const sGeo = new THREE.PlaneGeometry(0.005, 0.05);
        sGeo.rotateZ(-0.32);
        const sMesh = new THREE.Mesh(sGeo, scarMat);
        sMesh.position.set(0.08, 0.01 + i * 0.014, -0.08 + i * 0.03);
        sMesh.rotation.y = Math.PI / 2;
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
