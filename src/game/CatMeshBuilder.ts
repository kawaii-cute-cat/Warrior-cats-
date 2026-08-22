import * as THREE from 'three';
import { CatAppearance, FurStyle } from '../types/game';

export interface CatRigNodes {
  root: THREE.Group;
  body: THREE.Group;
  torsoMesh: THREE.Mesh;
  chestMesh: THREE.Mesh;
  headGroup: THREE.Group;
  neckGroup: THREE.Group;
  headMesh: THREE.Mesh;
  snoutMesh: THREE.Mesh;
  noseMesh: THREE.Mesh;
  jawGroup: THREE.Group;
  jawMesh: THREE.Mesh;
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
  leftFrontPaw: THREE.Mesh;
  rightFrontLeg: THREE.Group;
  rightFrontForearm: THREE.Group;
  rightFrontPaw: THREE.Mesh;
  // Back legs
  leftBackLeg: THREE.Group;
  leftBackShin: THREE.Group;
  leftBackPaw: THREE.Mesh;
  rightBackLeg: THREE.Group;
  rightBackShin: THREE.Group;
  rightBackPaw: THREE.Mesh;
  // Tail segments (6 articulated chain nodes)
  tailJoints: THREE.Group[];
  // Accessory & Aura
  accessoryGroup: THREE.Group;
  auraGroup: THREE.Group;
  preyMouthGroup: THREE.Group;
}

export class CatMeshBuilder {
  /**
   * Generates a realistic high-definition procedural feline coat texture
   * with accurate markings, markings blending, chest blazes, mittens, and fur grain.
   */
  public static generateCatTexture(appearance: CatAppearance): THREE.CanvasTexture {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // 1. Base primary coat
    ctx.fillStyle = appearance.primaryColor;
    ctx.fillRect(0, 0, size, size);

    // 2. Underbelly & Chest soft gradient
    const underbellyGrad = ctx.createLinearGradient(0, size * 0.35, 0, size);
    underbellyGrad.addColorStop(0, 'transparent');
    underbellyGrad.addColorStop(0.6, appearance.underbellyColor || '#fffbeb');
    underbellyGrad.addColorStop(1, appearance.underbellyColor || '#fffbeb');
    ctx.fillStyle = underbellyGrad;
    ctx.fillRect(0, size * 0.35, size, size * 0.65);

    // 3. Markings application
    const markType = appearance.markingType;
    ctx.save();

    if (markType === 'classic_tabby') {
      ctx.strokeStyle = appearance.secondaryColor;
      ctx.fillStyle = appearance.secondaryColor;
      // Flank bullseye whorl
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.ellipse(size * 0.5, size * 0.5, 60 + i * 40, 40 + i * 28, 0.15, 0, Math.PI * 2);
        ctx.lineWidth = 16;
        ctx.stroke();
      }
      // Spine bars & butterfly shoulder markings
      for (let y = 30; y < size * 0.9; y += 40) {
        ctx.fillRect(size * 0.4, y, size * 0.2, 14);
      }
    } else if (markType === 'mackerel_tabby') {
      ctx.strokeStyle = appearance.secondaryColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      // Vertical tiger-like rib stripes
      for (let x = 30; x < size - 30; x += 28) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.quadraticCurveTo(x + (Math.sin(x) * 16), size * 0.5, x, size * 0.85);
        ctx.stroke();
      }
      // Spine continuous line
      ctx.fillStyle = appearance.secondaryColor;
      ctx.fillRect(size * 0.47, 15, size * 0.06, size * 0.9);
    } else if (markType === 'spotted') {
      ctx.fillStyle = appearance.secondaryColor;
      for (let y = 50; y < size - 50; y += 38) {
        for (let x = 50; x < size - 50; x += 42) {
          ctx.beginPath();
          const r = 9 + Math.random() * 11;
          ctx.arc(x + (Math.random() * 16 - 8), y + (Math.random() * 14 - 7), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (markType === 'ticked') {
      // Agouti fine ticking
      ctx.fillStyle = appearance.secondaryColor;
      for (let i = 0; i < 1200; i++) {
        const tx = Math.random() * size;
        const ty = Math.random() * size;
        ctx.fillRect(tx, ty, 2, 4);
      }
    } else if (markType === 'colorpoint') {
      // Dark points on face, ears, tail, paws
      const pointGrad = ctx.createRadialGradient(size * 0.5, size * 0.2, 15, size * 0.5, size * 0.2, size * 0.42);
      pointGrad.addColorStop(0, appearance.secondaryColor);
      pointGrad.addColorStop(0.85, 'transparent');
      ctx.fillStyle = pointGrad;
      ctx.fillRect(0, 0, size, size);

      // Paws dark gradient
      const pawGrad = ctx.createLinearGradient(0, size * 0.65, 0, size);
      pawGrad.addColorStop(0, 'transparent');
      pawGrad.addColorStop(1, appearance.secondaryColor);
      ctx.fillStyle = pawGrad;
      ctx.fillRect(0, size * 0.65, size, size * 0.35);
    } else if (markType === 'bicolor' || markType === 'mask_and_boots') {
      // White muzzle blaze, chest, belly, and 4 white paws
      ctx.fillStyle = appearance.underbellyColor || '#ffffff';
      // Blaze on forehead
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.05);
      ctx.lineTo(size * 0.38, size * 0.38);
      ctx.lineTo(size * 0.62, size * 0.38);
      ctx.closePath();
      ctx.fill();
      // White chest & belly shield
      ctx.beginPath();
      ctx.ellipse(size * 0.5, size * 0.65, size * 0.26, size * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (markType === 'van') {
      // High white with colored head cap and colored tail
      ctx.fillStyle = appearance.underbellyColor || '#ffffff';
      ctx.fillRect(0, 0, size, size);
      // Head color patch
      ctx.fillStyle = appearance.primaryColor;
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.15, size * 0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (markType === 'calico' || markType === 'patches') {
      const patchColors = [appearance.secondaryColor, '#18181b', appearance.underbellyColor || '#ffffff'];
      for (let i = 0; i < 22; i++) {
        ctx.fillStyle = patchColors[i % patchColors.length];
        ctx.beginPath();
        const px = Math.random() * size;
        const py = Math.random() * size;
        const pr = 40 + Math.random() * 50;
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (markType === 'tortoiseshell') {
      // Finely mottled mixture of black and ginger/amber
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = i % 2 === 0 ? appearance.secondaryColor : '#18181b';
        ctx.fillRect(Math.random() * size, Math.random() * size, 16 + Math.random() * 18, 12 + Math.random() * 16);
      }
    } else if (markType === 'white_chest') {
      ctx.fillStyle = appearance.underbellyColor || '#ffffff';
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.45);
      ctx.lineTo(size * 0.35, size * 0.7);
      ctx.lineTo(size * 0.65, size * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (markType === 'white_paws') {
      ctx.fillStyle = appearance.underbellyColor || '#ffffff';
      ctx.fillRect(0, size * 0.8, size, size * 0.2);
    } else if (markType === 'white_muzzle') {
      ctx.fillStyle = appearance.underbellyColor || '#ffffff';
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.25, size * 0.18, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // Natural fur strand micro-grain
    ctx.fillStyle = 'rgba(0, 0, 0, 0.035)';
    for (let i = 0; i < 3000; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 3);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Constructs the full, anatomically authentic 3D feline model
   */
  public static buildCat(appearance: CatAppearance): { group: THREE.Group; rig: CatRigNodes } {
    const root = new THREE.Group();
    root.name = 'CatRoot';

    const texture = this.generateCatTexture(appearance);
    const coatMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.78,
      metalness: 0.04,
    });

    const innerEarMaterial = new THREE.MeshStandardMaterial({
      color: 0xe89ca4, // Soft pinkish inner ear
      roughness: 0.6,
    });

    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xdf848c, // Feline pink nose pad
      roughness: 0.35,
    });

    const pawPadMaterial = new THREE.MeshStandardMaterial({
      color: 0x332222, // Soft dark paw beans
      roughness: 0.8,
    });

    // Eye materials with realistic depth and blindness handling
    const isBlindLeft = appearance.eyeState === 'blind_left' || appearance.eyeState === 'blind_both';
    const isBlindRight = appearance.eyeState === 'blind_right' || appearance.eyeState === 'blind_both';

    const eyeMatLeft = new THREE.MeshStandardMaterial({
      color: isBlindLeft ? 0xdbeafe : new THREE.Color(appearance.eyeColorLeft),
      roughness: isBlindLeft ? 0.6 : 0.08,
      metalness: isBlindLeft ? 0.0 : 0.15,
      emissive: appearance.eyeState === 'star_shine' ? new THREE.Color(0x38bdf8) : (appearance.eyeState === 'amber_glow' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)),
      emissiveIntensity: appearance.eyeState === 'star_shine' || appearance.eyeState === 'amber_glow' ? 0.7 : (isBlindLeft ? 0.15 : 0),
    });

    const eyeMatRight = new THREE.MeshStandardMaterial({
      color: isBlindRight ? 0xdbeafe : new THREE.Color(appearance.eyeColorRight),
      roughness: isBlindRight ? 0.6 : 0.08,
      metalness: isBlindRight ? 0.0 : 0.15,
      emissive: appearance.eyeState === 'star_shine' ? new THREE.Color(0x38bdf8) : (appearance.eyeState === 'amber_glow' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)),
      emissiveIntensity: appearance.eyeState === 'star_shine' || appearance.eyeState === 'amber_glow' ? 0.7 : (isBlindRight ? 0.15 : 0),
    });

    // ==========================================
    // SKELETAL PROPORTIONS & BODY TYPES
    // ==========================================
    // Proportions rule: "Large Warrior" is TALLER, longer legs, larger frame, athletic muscular physique - NOT OBESE/FAT!
    let overallScale = appearance.bodyScale || 1.0;
    let torsoWidth = 0.28;
    let torsoHeight = 0.32;
    let torsoLength = 0.64;
    let legHeight = 0.44 * (appearance.legLength || 1.0);
    let pawScale = 0.065 * (appearance.pawSize || 1.0);
    let shoulderWidth = 0.32;

    if (appearance.bodyType === 'kit') {
      overallScale *= 0.55;
      torsoWidth = 0.26;
      torsoLength = 0.42;
      legHeight *= 0.72;
      pawScale *= 1.2; // cute big kit paws
    } else if (appearance.bodyType === 'apprentice') {
      overallScale *= 0.82;
      torsoWidth = 0.25;
      torsoLength = 0.54;
      legHeight *= 0.9;
    } else if (appearance.bodyType === 'large_warrior') {
      // TALLER, muscular, long-legged, broad shoulders, athletic tomcat build!
      overallScale *= 1.22;
      torsoWidth = 0.31;
      torsoHeight = 0.35;
      torsoLength = 0.72;
      legHeight *= 1.22; // Longer legs!
      pawScale *= 1.25; // Bigger paws!
      shoulderWidth = 0.36; // Broad warrior shoulders!
    } else if (appearance.bodyType === 'slender_hunter' || appearance.bodyType === 'slim_hunter') {
      overallScale *= 1.02;
      torsoWidth = 0.24;
      torsoHeight = 0.30;
      torsoLength = 0.68;
      legHeight *= 1.12; // Long slender runner legs
      pawScale *= 0.95;
      shoulderWidth = 0.28;
    }

    root.scale.set(overallScale, overallScale, overallScale);

    // ==========================================
    // 1. MAIN BODY & TORSO
    // ==========================================
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = legHeight + 0.22;
    root.add(bodyGroup);

    // Thorax & Ribcage (Front main chest)
    const chestGeo = new THREE.SphereGeometry(torsoWidth * 1.05, 14, 14);
    chestGeo.scale(1.0, 1.15, 1.0);
    const chestMesh = new THREE.Mesh(chestGeo, coatMaterial);
    chestMesh.position.set(0, 0.04, 0.2);
    chestMesh.castShadow = true;
    chestMesh.receiveShadow = true;
    bodyGroup.add(chestMesh);

    // Abdomen / Loin (Tapered waist)
    const torsoGeo = new THREE.CylinderGeometry(torsoWidth * 0.88, torsoWidth * 0.95, torsoLength * 0.65, 12);
    torsoGeo.rotateX(Math.PI / 2);
    const torsoMesh = new THREE.Mesh(torsoGeo, coatMaterial);
    torsoMesh.position.set(0, 0.01, -0.05);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Hips / Pelvis
    const pelvisGeo = new THREE.SphereGeometry(torsoWidth * 0.96, 12, 12);
    pelvisGeo.scale(1.0, 1.08, 0.95);
    const pelvisMesh = new THREE.Mesh(pelvisGeo, coatMaterial);
    pelvisMesh.position.set(0, 0.02, -torsoLength * 0.42);
    pelvisMesh.castShadow = true;
    pelvisMesh.receiveShadow = true;
    bodyGroup.add(pelvisMesh);

    // Shoulders (Scapula bulges)
    const scapulaGeo = new THREE.SphereGeometry(0.09, 8, 8);
    scapulaGeo.scale(0.8, 1.4, 1.1);
    const leftScapula = new THREE.Mesh(scapulaGeo, coatMaterial);
    leftScapula.position.set(-shoulderWidth * 0.48, 0.06, 0.22);
    leftScapula.rotation.z = -0.15;
    bodyGroup.add(leftScapula);
    const rightScapula = new THREE.Mesh(scapulaGeo, coatMaterial);
    rightScapula.position.set(shoulderWidth * 0.48, 0.06, 0.22);
    rightScapula.rotation.z = 0.15;
    bodyGroup.add(rightScapula);

    // ==========================================
    // 2. NECK & HEAD GROUP
    // ==========================================
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.12, 0.32);
    neckGroup.rotation.x = -0.22; // Arched forward-up neck
    bodyGroup.add(neckGroup);

    // Neck geometry
    const neckGeo = new THREE.CylinderGeometry(0.13, 0.17, 0.24, 10);
    const neckMesh = new THREE.Mesh(neckGeo, coatMaterial);
    neckMesh.position.set(0, 0.08, 0.05);
    neckMesh.rotation.x = 0.4;
    neckMesh.castShadow = true;
    neckGroup.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.22, 0.15);
    neckGroup.add(headGroup);

    // Head Cranium (Feline rounded skull with cheek arches)
    const headRadius = appearance.bodyType === 'kit' ? 0.22 : 0.185;
    const headGeo = new THREE.SphereGeometry(headRadius, 16, 16);
    headGeo.scale(1.18, 1.02, 1.08);
    const headMesh = new THREE.Mesh(headGeo, coatMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Cheeks / Whisker Pads (Broad feline muzzle cheeks)
    const cheekGeo = new THREE.SphereGeometry(0.085, 10, 10);
    cheekGeo.scale(1.2, 0.9, 1.0);
    const leftCheek = new THREE.Mesh(cheekGeo, coatMaterial);
    leftCheek.position.set(-0.075, -0.03, 0.11);
    headGroup.add(leftCheek);
    const rightCheek = new THREE.Mesh(cheekGeo, coatMaterial);
    rightCheek.position.set(0.075, -0.03, 0.11);
    headGroup.add(rightCheek);

    // Snout / Muzzle length scaling (0.75x for short/snub, 1.0x normal, 1.35x long wildcat)
    const muzzleFactor = Math.max(0.7, Math.min(1.4, appearance.muzzleLength || 1.0));
    const snoutLength = 0.11 * muzzleFactor;
    const snoutWidth = 0.125 * (appearance.muzzleLength < 0.9 ? 1.15 : (appearance.muzzleLength > 1.15 ? 0.9 : 1.0));
    const snoutGeo = new THREE.BoxGeometry(snoutWidth, 0.09, snoutLength);
    const snoutMesh = new THREE.Mesh(snoutGeo, coatMaterial);
    snoutMesh.position.set(0, -0.035, 0.13 + snoutLength * 0.45);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Nose Pad (Triangular feline nose)
    const noseGeo = new THREE.ConeGeometry(0.028, 0.024, 6);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, noseMaterial);
    noseMesh.position.set(0, -0.015, 0.138 + snoutLength);
    headGroup.add(noseMesh);

    // JAW (Articulated lower mandible for bite/prey carry)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.065, 0.08);
    headGroup.add(jawGroup);

    const jawGeo = new THREE.BoxGeometry(0.095, 0.038, 0.11 * muzzleFactor);
    const jawMesh = new THREE.Mesh(jawGeo, coatMaterial);
    jawMesh.position.set(0, -0.01, 0.05 * muzzleFactor);
    jawGroup.add(jawMesh);

    // Mouth slot for carried prey
    const preyMouthGroup = new THREE.Group();
    preyMouthGroup.position.set(0, 0.01, 0.08 * muzzleFactor);
    jawGroup.add(preyMouthGroup);

    // ==========================================
    // 3. EYES (Almond Feline Orbits & Slit Pupils)
    // ==========================================
    const eyeGeo = new THREE.SphereGeometry(0.038, 14, 14);
    eyeGeo.scale(1.0, 1.28, 0.72);

    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMatLeft);
    leftEyeMesh.position.set(-0.076, 0.025, 0.135);
    leftEyeMesh.rotation.set(-0.05, -0.22, 0.12);
    headGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMatRight);
    rightEyeMesh.position.set(0.076, 0.025, 0.135);
    rightEyeMesh.rotation.set(-0.05, 0.22, -0.12);
    headGroup.add(rightEyeMesh);

    // Pupils (Vertical slit pupils, hidden if blind)
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const pupilGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.038, 6);

    if (!isBlindLeft) {
      const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
      leftPupil.position.set(-0.077, 0.025, 0.162);
      leftPupil.rotation.set(-0.05, -0.22, 0.12);
      headGroup.add(leftPupil);
    }
    if (!isBlindRight) {
      const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
      rightPupil.position.set(0.077, 0.025, 0.162);
      rightPupil.rotation.set(-0.05, 0.22, -0.12);
      headGroup.add(rightPupil);
    }

    // ==========================================
    // 4. EARS & EAR TUFTS
    // ==========================================
    const earSizeFactor = Math.max(0.7, Math.min(1.5, appearance.earSize || 1.0));
    const earBaseRadius = 0.085 * earSizeFactor;
    const earHeight = 0.155 * earSizeFactor;

    const isPointed = appearance.earShape === 'pointed';
    const isRounded = appearance.earShape === 'rounded';

    const earGeo = new THREE.ConeGeometry(earBaseRadius, earHeight, 5);
    if (isRounded) {
      earGeo.scale(1.2, 0.85, 0.6);
    } else if (isPointed) {
      earGeo.scale(0.9, 1.25, 0.45);
    } else {
      earGeo.scale(1.05, 1.0, 0.5);
    }

    const innerEarGeo = new THREE.ConeGeometry(earBaseRadius * 0.7, earHeight * 0.8, 4);
    innerEarGeo.scale(1.0, 1.0, 0.3);

    // Left Ear
    const leftEarGroup = new THREE.Group();
    leftEarGroup.position.set(-0.115, 0.16, -0.02);
    leftEarGroup.rotation.set(-0.15, -0.25, 0.38);
    headGroup.add(leftEarGroup);

    const leftEarMesh = new THREE.Mesh(earGeo, coatMaterial);
    leftEarMesh.position.y = earHeight * 0.45;
    leftEarMesh.castShadow = true;
    leftEarGroup.add(leftEarMesh);

    const leftInnerEar = new THREE.Mesh(innerEarGeo, innerEarMaterial);
    leftInnerEar.position.set(0, earHeight * 0.42, 0.015);
    leftEarGroup.add(leftInnerEar);

    // Right Ear
    const rightEarGroup = new THREE.Group();
    rightEarGroup.position.set(0.115, 0.16, -0.02);
    rightEarGroup.rotation.set(-0.15, 0.25, -0.38);
    headGroup.add(rightEarGroup);

    const rightEarMesh = new THREE.Mesh(earGeo, coatMaterial);
    rightEarMesh.position.y = earHeight * 0.45;
    rightEarMesh.castShadow = true;
    rightEarGroup.add(rightEarMesh);

    const rightInnerEar = new THREE.Mesh(innerEarGeo, innerEarMaterial);
    rightInnerEar.position.set(0, earHeight * 0.42, 0.015);
    rightEarGroup.add(rightInnerEar);

    // Lynx Ear Tufts (Optional feature / Ear Tuft checkbox)
    if (appearance.earTufts || appearance.earShape === 'tufted') {
      const tuftMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
      const tuftGeo = new THREE.ConeGeometry(0.018, 0.08, 4);

      const lTuft = new THREE.Mesh(tuftGeo, tuftMat);
      lTuft.position.set(0, earHeight * 0.95, 0);
      leftEarGroup.add(lTuft);

      const rTuft = new THREE.Mesh(tuftGeo, tuftMat);
      rTuft.position.set(0, earHeight * 0.95, 0);
      rightEarGroup.add(rTuft);
    }

    // WHISKERS (Delicate feline whisker arrays)
    const whiskerGroup = new THREE.Group();
    whiskerGroup.position.set(0, -0.035, 0.14 + snoutLength * 0.6);
    headGroup.add(whiskerGroup);

    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.8 });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const angle = (i - 1) * 0.18;
        const whiskerPoints = [
          new THREE.Vector3(side * 0.05, i * 0.012 - 0.01, 0),
          new THREE.Vector3(side * 0.22, i * 0.018 - 0.02 + Math.sin(angle) * 0.04, 0.04),
        ];
        const wGeo = new THREE.BufferGeometry().setFromPoints(whiskerPoints);
        const wLine = new THREE.Line(wGeo, whiskerMat);
        whiskerGroup.add(wLine);
      }
    }

    // ==========================================
    // 5. LAYERED FUR SILHOUETTE (Cheek tufts, Neck ruff, Chest mane, Tail fluff)
    // ==========================================
    const furGroup = new THREE.Group();
    root.add(furGroup);

    const isFluffy =
      appearance.furStyle === 'fluffy' ||
      appearance.furStyle === 'very_fluffy' ||
      appearance.furStyle === 'long' ||
      appearance.furStyle === 'long_flowing' ||
      appearance.furStyle === 'thick_winter';

    const isVeryFluffy = appearance.furStyle === 'very_fluffy' || appearance.furStyle === 'thick_winter';

    if (appearance.furStyle !== 'very_short' && appearance.furStyle !== 'short_smooth') {
      const cheekTuftScale = isVeryFluffy ? 1.6 : (isFluffy ? 1.25 : 0.8);
      const tuftGeo = new THREE.ConeGeometry(0.06 * cheekTuftScale, 0.14 * cheekTuftScale, 4);
      tuftGeo.scale(1.2, 0.6, 1.0);

      // Left cheek fur tuft
      const leftCheekTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      leftCheekTuft.position.set(-0.16, -0.04, 0.02);
      leftCheekTuft.rotation.set(0.2, 0.2, 1.1);
      headGroup.add(leftCheekTuft);

      // Right cheek fur tuft
      const rightCheekTuft = new THREE.Mesh(tuftGeo, coatMaterial);
      rightCheekTuft.position.set(0.16, -0.04, 0.02);
      rightCheekTuft.rotation.set(0.2, -0.2, -1.1);
      headGroup.add(rightCheekTuft);

      // Neck Ruff & Chest Apron
      if (isFluffy) {
        const ruffGeo = new THREE.ConeGeometry(0.24, 0.28, 8);
        ruffGeo.scale(1.25, 0.8, 1.1);
        const ruffMesh = new THREE.Mesh(ruffGeo, coatMaterial);
        ruffMesh.position.set(0, 0.02, 0.12);
        ruffMesh.rotation.x = -0.6;
        neckGroup.add(ruffMesh);

        // Fluffy chest apron
        const chestTuftGeo = new THREE.SphereGeometry(0.16 * (isVeryFluffy ? 1.3 : 1.0), 8, 8);
        chestTuftGeo.scale(1.1, 1.3, 0.8);
        const chestTuft = new THREE.Mesh(chestTuftGeo, coatMaterial);
        chestTuft.position.set(0, -0.08, 0.28);
        bodyGroup.add(chestTuft);
      }
    }

    // ==========================================
    // 6. DIGITIGRADE LEGS & DETAILED PAWS
    // ==========================================
    const legRadius = 0.055 * (appearance.pawSize || 1.0);
    const upperLegGeo = new THREE.CylinderGeometry(legRadius * 1.15, legRadius * 0.92, legHeight * 0.55, 8);
    const forearmGeo = new THREE.CylinderGeometry(legRadius * 0.92, legRadius * 0.82, legHeight * 0.55, 8);

    // Realistic rounded 4-toed feline paw
    const pawWidth = legRadius * 2.2 * (appearance.pawSize || 1.0);
    const pawLength = 0.12 * (appearance.pawSize || 1.0);
    const pawGeo = new THREE.BoxGeometry(pawWidth, 0.052, pawLength);

    // --- FRONT LEFT LEG ---
    const leftFrontLeg = new THREE.Group();
    leftFrontLeg.position.set(-shoulderWidth * 0.48, -0.04, 0.22);
    bodyGroup.add(leftFrontLeg);

    const lfUpper = new THREE.Mesh(upperLegGeo, coatMaterial);
    lfUpper.position.y = -legHeight * 0.27;
    lfUpper.castShadow = true;
    leftFrontLeg.add(lfUpper);

    const leftFrontForearm = new THREE.Group();
    leftFrontForearm.position.set(0, -legHeight * 0.55, 0);
    leftFrontLeg.add(leftFrontForearm);

    const lfLower = new THREE.Mesh(forearmGeo, coatMaterial);
    lfLower.position.y = -legHeight * 0.25;
    lfLower.castShadow = true;
    leftFrontForearm.add(lfLower);

    const leftFrontPaw = new THREE.Mesh(pawGeo, coatMaterial);
    leftFrontPaw.position.set(0, -legHeight * 0.52, 0.025);
    leftFrontPaw.castShadow = true;
    leftFrontForearm.add(leftFrontPaw);

    // Paw pad bean
    const beanGeo = new THREE.SphereGeometry(0.02, 6, 6);
    beanGeo.scale(1.2, 0.5, 1.0);
    const lfBean = new THREE.Mesh(beanGeo, pawPadMaterial);
    lfBean.position.set(0, -0.025, 0);
    leftFrontPaw.add(lfBean);

    // --- FRONT RIGHT LEG ---
    const rightFrontLeg = new THREE.Group();
    rightFrontLeg.position.set(shoulderWidth * 0.48, -0.04, 0.22);
    bodyGroup.add(rightFrontLeg);

    const rfUpper = new THREE.Mesh(upperLegGeo, coatMaterial);
    rfUpper.position.y = -legHeight * 0.27;
    rfUpper.castShadow = true;
    rightFrontLeg.add(rfUpper);

    const rightFrontForearm = new THREE.Group();
    rightFrontForearm.position.set(0, -legHeight * 0.55, 0);
    rightFrontLeg.add(rightFrontForearm);

    const rfLower = new THREE.Mesh(forearmGeo, coatMaterial);
    rfLower.position.y = -legHeight * 0.25;
    rfLower.castShadow = true;
    rightFrontForearm.add(rfLower);

    const rightFrontPaw = new THREE.Mesh(pawGeo, coatMaterial);
    rightFrontPaw.position.set(0, -legHeight * 0.52, 0.025);
    rightFrontPaw.castShadow = true;
    rightFrontForearm.add(rightFrontPaw);

    const rfBean = new THREE.Mesh(beanGeo, pawPadMaterial);
    rfBean.position.set(0, -0.025, 0);
    rightFrontPaw.add(rfBean);

    // --- HIND LEGS (Curved muscular thighs & hocks) ---
    const thighGeo = new THREE.CylinderGeometry(legRadius * 1.6, legRadius * 1.1, legHeight * 0.6, 8);
    const shinGeo = new THREE.CylinderGeometry(legRadius * 1.0, legRadius * 0.78, legHeight * 0.55, 8);

    // Left Back Leg
    const leftBackLeg = new THREE.Group();
    leftBackLeg.position.set(-torsoWidth * 0.55, 0.0, -torsoLength * 0.4);
    bodyGroup.add(leftBackLeg);

    const lbThigh = new THREE.Mesh(thighGeo, coatMaterial);
    lbThigh.position.y = -legHeight * 0.28;
    lbThigh.rotation.x = -0.24;
    lbThigh.castShadow = true;
    leftBackLeg.add(lbThigh);

    const leftBackShin = new THREE.Group();
    leftBackShin.position.set(0, -legHeight * 0.55, -0.06);
    leftBackLeg.add(leftBackShin);

    const lbShin = new THREE.Mesh(shinGeo, coatMaterial);
    lbShin.position.y = -legHeight * 0.25;
    lbShin.rotation.x = 0.4;
    lbShin.castShadow = true;
    leftBackShin.add(lbShin);

    const leftBackPaw = new THREE.Mesh(pawGeo, coatMaterial);
    leftBackPaw.position.set(0, -legHeight * 0.52, 0.04);
    leftBackPaw.castShadow = true;
    leftBackShin.add(leftBackPaw);

    const lbBean = new THREE.Mesh(beanGeo, pawPadMaterial);
    lbBean.position.set(0, -0.025, 0);
    leftBackPaw.add(lbBean);

    // Right Back Leg
    const rightBackLeg = new THREE.Group();
    rightBackLeg.position.set(torsoWidth * 0.55, 0.0, -torsoLength * 0.4);
    bodyGroup.add(rightBackLeg);

    const rbThigh = new THREE.Mesh(thighGeo, coatMaterial);
    rbThigh.position.y = -legHeight * 0.28;
    rbThigh.rotation.x = -0.24;
    rbThigh.castShadow = true;
    rightBackLeg.add(rbThigh);

    const rightBackShin = new THREE.Group();
    rightBackShin.position.set(0, -legHeight * 0.55, -0.06);
    rightBackLeg.add(rightBackShin);

    const rbShin = new THREE.Mesh(shinGeo, coatMaterial);
    rbShin.position.y = -legHeight * 0.25;
    rbShin.rotation.x = 0.4;
    rbShin.castShadow = true;
    rightBackShin.add(rbShin);

    const rightBackPaw = new THREE.Mesh(pawGeo, coatMaterial);
    rightBackPaw.position.set(0, -legHeight * 0.52, 0.04);
    rightBackPaw.castShadow = true;
    rightBackShin.add(rightBackPaw);

    const rbBean = new THREE.Mesh(beanGeo, pawPadMaterial);
    rbBean.position.set(0, -0.025, 0);
    rightBackPaw.add(rbBean);

    // ==========================================
    // 7. MANDATORY MULTI-JOINTED ARTICULATED TAIL
    // ==========================================
    // Non-negotiable visible tail: 6 segments, natural feline length (0.75m base), expressive curve chain!
    const tailJoints: THREE.Group[] = [];
    const baseTailTotalLen = 0.76 * (appearance.tailLength || 1.0);
    const numSegments = 6;
    const tailSegLen = baseTailTotalLen / numSegments;
    const baseThickness = 0.044 * (appearance.tailThickness || 1.0) * (isVeryFluffy ? 1.7 : (isFluffy ? 1.35 : 1.0));

    let prevParent: THREE.Group = bodyGroup;
    for (let i = 0; i < numSegments; i++) {
      const joint = new THREE.Group();
      if (i === 0) {
        // Firm attachment at sacrum/pelvis with natural upward-arching angle
        joint.position.set(0, 0.08, -torsoLength * 0.48);
        joint.rotation.x = 0.55; // Initial upward/outward arch
      } else {
        joint.position.set(0, 0.015, -tailSegLen);
      }
      prevParent.add(joint);
      tailJoints.push(joint);

      const radTop = baseThickness * (1.0 - (i / numSegments) * 0.35);
      const radBot = baseThickness * (1.0 - ((i + 1) / numSegments) * 0.35);

      const segGeo = new THREE.CylinderGeometry(radTop, radBot, tailSegLen, 8);
      segGeo.rotateX(Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, coatMaterial);
      segMesh.position.z = -tailSegLen * 0.5;
      segMesh.castShadow = true;
      joint.add(segMesh);

      // Tail Tip Tuft at final joint
      if (i === numSegments - 1) {
        const tipGeo = new THREE.SphereGeometry(radBot * 1.15, 8, 8);
        const tipMesh = new THREE.Mesh(tipGeo, coatMaterial);
        tipMesh.position.z = -tailSegLen;
        joint.add(tipMesh);
      }

      prevParent = joint;
    }

    // ==========================================
    // 8. ACCESSORIES
    // ==========================================
    const accessoryGroup = new THREE.Group();
    headGroup.add(accessoryGroup);

    if (appearance.accessory === 'oak_leaves') {
      const leafGeo = new THREE.PlaneGeometry(0.08, 0.12);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, side: THREE.DoubleSide });
      const leaf1 = new THREE.Mesh(leafGeo, leafMat);
      leaf1.position.set(-0.1, 0.14, 0.04);
      leaf1.rotation.set(0.2, 0.5, 0.8);
      accessoryGroup.add(leaf1);
    } else if (appearance.accessory === 'blue_feather' || appearance.accessory === 'cardinal_feather') {
      const featherColor = appearance.accessory === 'blue_feather' ? 0x2563eb : 0xdc2626;
      const featherGeo = new THREE.ConeGeometry(0.035, 0.22, 4);
      featherGeo.scale(1.0, 1.0, 0.15);
      const featherMat = new THREE.MeshStandardMaterial({ color: featherColor });
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(0.14, 0.15, -0.02);
      feather.rotation.set(-0.2, 0, -0.6);
      accessoryGroup.add(feather);
    } else if (appearance.accessory === 'violet_flower' || appearance.accessory === 'poppy_flower') {
      const flowerColor = appearance.accessory === 'violet_flower' ? 0x9333ea : 0xe11d48;
      const flowerGeo = new THREE.TorusGeometry(0.04, 0.016, 8, 8);
      const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(0, 0.2, 0.05);
      flower.rotation.x = Math.PI / 2;
      accessoryGroup.add(flower);
    } else if (appearance.accessory === 'leather_collar' || appearance.accessory === 'bell_collar') {
      const collarGeo = new THREE.TorusGeometry(0.17, 0.022, 6, 16);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.3 });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.set(0, -0.06, 0.05);
      collar.rotation.x = Math.PI / 2;
      neckGroup.add(collar);

      if (appearance.accessory === 'bell_collar') {
        const bellGeo = new THREE.SphereGeometry(0.032, 8, 8);
        const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });
        const bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.set(0, -0.1, 0.2);
        neckGroup.add(bell);
      }
    } else if (appearance.accessory === 'moss_shoulder_wrap') {
      const mossGeo = new THREE.TorusGeometry(0.26, 0.05, 6, 12);
      const mossMat = new THREE.MeshStandardMaterial({ color: 0x3f6212, roughness: 0.95 });
      const moss = new THREE.Mesh(mossGeo, mossMat);
      moss.position.set(0, 0.05, 0.15);
      bodyGroup.add(moss);
    } else if (appearance.accessory === 'holly_berries') {
      const berryGeo = new THREE.SphereGeometry(0.025, 6, 6);
      const berryMat = new THREE.MeshStandardMaterial({ color: 0xe11d48 });
      const b1 = new THREE.Mesh(berryGeo, berryMat);
      b1.position.set(-0.08, 0.16, 0.08);
      headGroup.add(b1);
      const b2 = new THREE.Mesh(berryGeo, berryMat);
      b2.position.set(-0.11, 0.15, 0.07);
      headGroup.add(b2);
    }

    // ==========================================
    // 9. SCARS
    // ==========================================
    const scarMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });

    if (appearance.scar === 'torn_left_ear' || appearance.scar === 'battle_worn_all') {
      leftEarMesh.scale.set(0.7, 0.55, 0.9);
      leftEarMesh.position.y = earHeight * 0.22;
      const notch = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 3), scarMat);
      notch.position.set(-0.02, earHeight * 0.45, 0);
      leftEarGroup.add(notch);
    }
    if (appearance.scar === 'torn_right_ear' || appearance.scar === 'battle_worn_all') {
      rightEarMesh.scale.set(0.7, 0.55, 0.9);
      rightEarMesh.position.y = earHeight * 0.22;
      const notch = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.05, 3), scarMat);
      notch.position.set(0.02, earHeight * 0.45, 0);
      rightEarGroup.add(notch);
    }
    if (appearance.scar === 'muzzle_scratch' || appearance.scar === 'battle_worn_all') {
      const scarGeo = new THREE.BoxGeometry(0.012, 0.09, 0.02);
      const scar = new THREE.Mesh(scarGeo, scarMat);
      scar.position.set(0.04, -0.01, 0.14 + snoutLength * 0.5);
      scar.rotation.z = 0.4;
      headGroup.add(scar);
    }
    if (appearance.scar === 'shoulder_claw_marks' || appearance.scar === 'battle_worn_all') {
      for (let i = 0; i < 3; i++) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.13, 0.012), scarMat);
        mark.position.set(-shoulderWidth * 0.52, 0.05, 0.16 + i * 0.038);
        mark.rotation.z = -0.35;
        bodyGroup.add(mark);
      }
    }
    if (appearance.scar === 'blind_eye_slash' || appearance.scar === 'battle_worn_all') {
      const slash = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.16, 0.02), scarMat);
      slash.position.set(0.09, 0.04, 0.14);
      slash.rotation.z = 0.3;
      slash.rotation.x = -0.15;
      headGroup.add(slash);
    }
    if (appearance.scar === 'cross_scars') {
      const slash1 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.18, 0.014), scarMat);
      slash1.position.set(0, 0.04, 0.28);
      slash1.rotation.z = 0.6;
      bodyGroup.add(slash1);
      const slash2 = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.18, 0.014), scarMat);
      slash2.position.set(0, 0.04, 0.28);
      slash2.rotation.z = -0.6;
      bodyGroup.add(slash2);
    }
    if (appearance.scar === 'chest_scar') {
      const slash = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.22, 0.014), scarMat);
      slash.position.set(0.03, 0.02, 0.26);
      slash.rotation.z = 0.45;
      bodyGroup.add(slash);
    }
    if (appearance.scar === 'flank_scar') {
      for (let i = 0; i < 3; i++) {
        const mark = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.14, 0.012), scarMat);
        mark.position.set(shoulderWidth * 0.52, -0.02, -0.1 + i * 0.04);
        mark.rotation.z = 0.35;
        bodyGroup.add(mark);
      }
    }
    if (appearance.scar === 'tail_nick' || appearance.scar === 'battle_worn_all') {
      if (tailJoints.length > 3) {
        const nick = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.06, 3), scarMat);
        nick.position.set(0.03, 0.05, 0);
        tailJoints[tailJoints.length - 2].add(nick);
      }
    }

    // ==========================================
    // 10. SPECIAL AURAS (Visual-only cosmetics)
    // ==========================================
    const auraGroup = new THREE.Group();
    root.add(auraGroup);

    if (appearance.aura === 'starclan_stars' || appearance.aura === 'celestial_shimmer') {
      const starGeo = new THREE.BufferGeometry();
      const starCount = 35;
      const positions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1.8;
        positions[i * 3 + 1] = Math.random() * 1.4;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({
        color: appearance.aura === 'starclan_stars' ? 0x93c5fd : 0xa78bfa,
        size: 0.07,
        transparent: true,
        opacity: 0.9,
      });
      const stars = new THREE.Points(starGeo, starMat);
      auraGroup.add(stars);
    } else if (appearance.aura === 'darkforest_smoke') {
      const smokeGeo = new THREE.BufferGeometry();
      const smokeCount = 30;
      const positions = new Float32Array(smokeCount * 3);
      for (let i = 0; i < smokeCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1.6;
        positions[i * 3 + 1] = Math.random() * 1.0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.6;
      }
      smokeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const smokeMat = new THREE.PointsMaterial({
        color: 0x18181b,
        size: 0.12,
        transparent: true,
        opacity: 0.7,
      });
      const smoke = new THREE.Points(smokeGeo, smokeMat);
      auraGroup.add(smoke);
    }

    const rig: CatRigNodes = {
      root,
      body: bodyGroup,
      torsoMesh,
      chestMesh,
      headGroup,
      neckGroup,
      headMesh,
      snoutMesh,
      noseMesh,
      jawGroup,
      jawMesh,
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
      leftFrontPaw,
      rightFrontLeg,
      rightFrontForearm,
      rightFrontPaw,
      leftBackLeg,
      leftBackShin,
      leftBackPaw,
      rightBackLeg,
      rightBackShin,
      rightBackPaw,
      tailJoints,
      accessoryGroup,
      auraGroup,
      preyMouthGroup,
    };

    return { group: root, rig };
  }

  /**
   * Builds distinct 3D visual models for caught and carried prey items
   */
  public static buildPreyMesh(type: 'mouse' | 'rabbit' | 'bird' | 'fish' | 'vole' | 'squirrel'): THREE.Group {
    const group = new THREE.Group();
    group.name = `Prey_${type}`;

    if (type === 'mouse' || type === 'vole') {
      const color = type === 'mouse' ? 0x9ca3af : 0x78350f;
      const bodyGeo = new THREE.SphereGeometry(0.08, 8, 8);
      bodyGeo.scale(0.8, 0.7, 1.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      const earGeo = new THREE.SphereGeometry(0.025, 6, 6);
      const earMat = new THREE.MeshStandardMaterial({ color: 0xf472b6 });
      const leftEar = new THREE.Mesh(earGeo, earMat);
      leftEar.position.set(-0.04, 0.05, 0.06);
      group.add(leftEar);
      const rightEar = new THREE.Mesh(earGeo, earMat);
      rightEar.position.set(0.04, 0.05, 0.06);
      group.add(rightEar);

      // Tail
      const tailGeo = new THREE.CylinderGeometry(0.008, 0.004, 0.18, 4);
      tailGeo.rotateX(Math.PI / 2);
      const tailMesh = new THREE.Mesh(tailGeo, earMat);
      tailMesh.position.set(0, -0.01, -0.16);
      group.add(tailMesh);
    } else if (type === 'rabbit') {
      const bodyGeo = new THREE.SphereGeometry(0.14, 8, 8);
      bodyGeo.scale(0.9, 0.9, 1.3);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      // Long ears
      const earGeo = new THREE.CylinderGeometry(0.015, 0.025, 0.2, 5);
      const earMat = new THREE.MeshStandardMaterial({ color: 0xb45309 });
      const leftEar = new THREE.Mesh(earGeo, earMat);
      leftEar.position.set(-0.05, 0.16, 0.08);
      leftEar.rotation.z = -0.2;
      group.add(leftEar);
      const rightEar = new THREE.Mesh(earGeo, earMat);
      rightEar.position.set(0.05, 0.16, 0.08);
      rightEar.rotation.z = 0.2;
      group.add(rightEar);

      // Fluffy puff tail
      const tailGeo = new THREE.SphereGeometry(0.04, 6, 6);
      const tailMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
      const tailMesh = new THREE.Mesh(tailGeo, tailMat);
      tailMesh.position.set(0, 0.05, -0.18);
      group.add(tailMesh);
    } else if (type === 'fish') {
      const bodyGeo = new THREE.SphereGeometry(0.1, 8, 8);
      bodyGeo.scale(0.4, 0.8, 1.8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.6, roughness: 0.2 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      // Tail fin
      const finGeo = new THREE.ConeGeometry(0.08, 0.12, 3);
      finGeo.scale(0.1, 1.0, 1.0);
      const finMesh = new THREE.Mesh(finGeo, bodyMat);
      finMesh.position.set(0, 0, -0.22);
      finMesh.rotation.x = Math.PI / 2;
      group.add(finMesh);
    } else {
      // Bird / Squirrel
      const bodyGeo = new THREE.SphereGeometry(0.1, 8, 8);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
      const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
      group.add(bodyMesh);

      // Beak
      const beakGeo = new THREE.ConeGeometry(0.025, 0.06, 4);
      const beakMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b });
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.position.set(0, 0.01, 0.12);
      beak.rotation.x = Math.PI / 2;
      group.add(beak);
    }

    return group;
  }
}
