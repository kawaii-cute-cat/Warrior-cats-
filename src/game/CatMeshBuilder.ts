import * as THREE from 'three';
import { CatAppearance } from '../types/game';

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
  // Tail segments
  tailJoints: THREE.Group[];
  // Accessory & Aura
  accessoryGroup: THREE.Group;
  auraGroup: THREE.Group;
  preyMouthGroup: THREE.Group;
}

export class CatMeshBuilder {
  /**
   * Generates a procedural feline texture canvas with accurate tabby stripes,
   * calico patches, tortoiseshell swirls, colorpoints, and masks.
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

    // 2. Underbelly & Chest gradient
    const underbellyGrad = ctx.createLinearGradient(0, size * 0.4, 0, size);
    underbellyGrad.addColorStop(0, 'transparent');
    underbellyGrad.addColorStop(1, appearance.underbellyColor);
    ctx.fillStyle = underbellyGrad;
    ctx.fillRect(0, size * 0.3, size, size * 0.7);

    // 3. Markings application
    const markType = appearance.markingType;
    ctx.save();

    if (markType === 'classic_tabby') {
      ctx.fillStyle = appearance.secondaryColor;
      // Flank bullseye whorl
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(size * 0.5, size * 0.45, 60 + i * 35, 40 + i * 25, 0.2, 0, Math.PI * 2);
        ctx.lineWidth = 14;
        ctx.strokeStyle = appearance.secondaryColor;
        ctx.stroke();
      }
      // Spine bars
      for (let y = 30; y < size * 0.9; y += 45) {
        ctx.fillRect(size * 0.42, y, size * 0.16, 16);
      }
    } else if (markType === 'mackerel_tabby') {
      ctx.fillStyle = appearance.secondaryColor;
      ctx.strokeStyle = appearance.secondaryColor;
      ctx.lineWidth = 12;
      // Vertical tiger-like ribs
      for (let x = 40; x < size - 40; x += 36) {
        ctx.beginPath();
        ctx.moveTo(x, 40);
        ctx.quadraticCurveTo(x + (Math.random() * 20 - 10), size * 0.5, x, size * 0.85);
        ctx.stroke();
      }
      // Spine line
      ctx.fillRect(size * 0.46, 20, size * 0.08, size * 0.9);
    } else if (markType === 'spotted') {
      ctx.fillStyle = appearance.secondaryColor;
      for (let y = 60; y < size - 60; y += 40) {
        for (let x = 60; x < size - 60; x += 45) {
          ctx.beginPath();
          const r = 10 + Math.random() * 12;
          ctx.arc(x + (Math.random() * 20 - 10), y + (Math.random() * 15 - 7.5), r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (markType === 'colorpoint') {
      // Dark points on face, ears, paws, tail
      const pointGrad = ctx.createRadialGradient(size * 0.5, size * 0.2, 20, size * 0.5, size * 0.2, size * 0.45);
      pointGrad.addColorStop(0, appearance.secondaryColor);
      pointGrad.addColorStop(0.8, 'transparent');
      ctx.fillStyle = pointGrad;
      ctx.fillRect(0, 0, size, size);

      // Paws dark gradient at bottom
      const pawGrad = ctx.createLinearGradient(0, size * 0.7, 0, size);
      pawGrad.addColorStop(0, 'transparent');
      pawGrad.addColorStop(1, appearance.secondaryColor);
      ctx.fillStyle = pawGrad;
      ctx.fillRect(0, size * 0.7, size, size * 0.3);
    } else if (markType === 'calico' || markType === 'patches') {
      // Ginger, black, and white organic patches
      const patchColors = [appearance.secondaryColor, '#1c1917', appearance.underbellyColor];
      for (let i = 0; i < 18; i++) {
        ctx.fillStyle = patchColors[i % patchColors.length];
        ctx.beginPath();
        const px = Math.random() * size;
        const py = Math.random() * size;
        const pr = 35 + Math.random() * 55;
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (markType === 'tortoiseshell') {
      // Finely mottled mixture of black and ginger
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = i % 2 === 0 ? appearance.secondaryColor : '#1c1917';
        ctx.fillRect(Math.random() * size, Math.random() * size, 14 + Math.random() * 20, 10 + Math.random() * 18);
      }
    } else if (markType === 'bicolor' || markType === 'mask_and_boots') {
      // White muzzle, chest, belly, and 4 white boots
      ctx.fillStyle = appearance.underbellyColor;
      // White face blaze
      ctx.beginPath();
      ctx.moveTo(size * 0.5, size * 0.05);
      ctx.lineTo(size * 0.35, size * 0.4);
      ctx.lineTo(size * 0.65, size * 0.4);
      ctx.closePath();
      ctx.fill();
      // White chest shield
      ctx.beginPath();
      ctx.arc(size * 0.5, size * 0.6, size * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Subtle fur texture grain overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
    for (let i = 0; i < 2000; i++) {
      ctx.fillRect(Math.random() * size, Math.random() * size, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  /**
   * Constructs the full 3D feline model with modular anatomy hierarchy
   */
  public static buildCat(appearance: CatAppearance): { group: THREE.Group; rig: CatRigNodes } {
    const root = new THREE.Group();
    root.name = 'CatRoot';

    const texture = this.generateCatTexture(appearance);
    const coatMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.75,
      metalness: 0.05,
    });

    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0xe08f97, // Soft feline pink nose
      roughness: 0.4,
    });

    const eyeMatLeft = new THREE.MeshStandardMaterial({
      color: appearance.eyeState === 'blind_left' || appearance.eyeState === 'blind_both' ? 0xd1d5db : new THREE.Color(appearance.eyeColorLeft),
      roughness: 0.1,
      metalness: 0.1,
      emissive: appearance.eyeState === 'star_shine' ? new THREE.Color(0x38bdf8) : (appearance.eyeState === 'amber_glow' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)),
      emissiveIntensity: appearance.eyeState === 'star_shine' || appearance.eyeState === 'amber_glow' ? 0.6 : 0,
    });

    const eyeMatRight = new THREE.MeshStandardMaterial({
      color: appearance.eyeState === 'blind_right' || appearance.eyeState === 'blind_both' ? 0xd1d5db : new THREE.Color(appearance.eyeColorRight),
      roughness: 0.1,
      metalness: 0.1,
      emissive: appearance.eyeState === 'star_shine' ? new THREE.Color(0x38bdf8) : (appearance.eyeState === 'amber_glow' ? new THREE.Color(0xf59e0b) : new THREE.Color(0x000000)),
      emissiveIntensity: appearance.eyeState === 'star_shine' || appearance.eyeState === 'amber_glow' ? 0.6 : 0,
    });

    // Body Proportions based on age/build
    let scaleMult = appearance.bodyScale || 1.0;
    let torsoWidth = 0.32;
    let torsoHeight = 0.34;
    let torsoLength = 0.62;
    let legHeight = 0.42 * appearance.legLength;

    if (appearance.bodyType === 'kit') {
      scaleMult *= 0.55;
      torsoWidth = 0.36;
      torsoLength = 0.45;
      legHeight *= 0.75;
    } else if (appearance.bodyType === 'apprentice') {
      scaleMult *= 0.8;
      torsoWidth = 0.28;
      torsoLength = 0.54;
    } else if (appearance.bodyType === 'large_warrior') {
      scaleMult *= 1.18;
      torsoWidth = 0.38;
      torsoHeight = 0.38;
    } else if (appearance.bodyType === 'slim_hunter') {
      torsoWidth = 0.26;
      torsoLength = 0.65;
    }

    // MAIN BODY (Center of Mass)
    const bodyGroup = new THREE.Group();
    bodyGroup.position.y = legHeight + 0.18;
    root.add(bodyGroup);

    // Torso (Main back & flanks)
    const torsoGeo = new THREE.CapsuleGeometry(torsoWidth, torsoLength, 8, 16);
    torsoGeo.rotateX(Math.PI / 2);
    const torsoMesh = new THREE.Mesh(torsoGeo, coatMaterial);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bodyGroup.add(torsoMesh);

    // Chest (Front broad thorax)
    const chestGeo = new THREE.SphereGeometry(torsoWidth * 1.08, 12, 12);
    chestGeo.scale(1.0, 1.1, 0.9);
    const chestMesh = new THREE.Mesh(chestGeo, coatMaterial);
    chestMesh.position.set(0, 0.03, 0.22);
    chestMesh.castShadow = true;
    bodyGroup.add(chestMesh);

    // NECK & HEAD GROUP
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, 0.1, 0.36);
    bodyGroup.add(neckGroup);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.14, 0.12);
    neckGroup.add(headGroup);

    // Head Skull Mesh (Feline diamond/rounded shape)
    const headScale = appearance.bodyType === 'kit' ? 0.22 : 0.18;
    const headGeo = new THREE.SphereGeometry(headScale, 14, 14);
    headGeo.scale(1.15, 0.98, 1.05);
    const headMesh = new THREE.Mesh(headGeo, coatMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Snout / Muzzle
    const snoutLen = 0.11 * appearance.muzzleLength;
    const snoutGeo = new THREE.BoxGeometry(0.12, 0.09, snoutLen);
    const snoutMesh = new THREE.Mesh(snoutGeo, coatMaterial);
    snoutMesh.position.set(0, -0.04, 0.13 + snoutLen * 0.4);
    snoutMesh.castShadow = true;
    headGroup.add(snoutMesh);

    // Nose Pad
    const noseGeo = new THREE.ConeGeometry(0.026, 0.022, 5);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, noseMaterial);
    noseMesh.position.set(0, -0.015, 0.14 + snoutLen);
    headGroup.add(noseMesh);

    // JAW (Opening for bites / carrying prey)
    const jawGroup = new THREE.Group();
    jawGroup.position.set(0, -0.07, 0.08);
    headGroup.add(jawGroup);

    const jawGeo = new THREE.BoxGeometry(0.09, 0.04, 0.1);
    const jawMesh = new THREE.Mesh(jawGeo, coatMaterial);
    jawMesh.position.set(0, 0, 0.05);
    jawGroup.add(jawMesh);

    // Prey in mouth slot
    const preyMouthGroup = new THREE.Group();
    preyMouthGroup.position.set(0, -0.01, 0.1);
    jawGroup.add(preyMouthGroup);

    // EYES (Stylized almond shaped with pupil depths)
    const eyeGeo = new THREE.SphereGeometry(0.038, 12, 12);
    eyeGeo.scale(1.0, 1.25, 0.7);

    const leftEyeMesh = new THREE.Mesh(eyeGeo, eyeMatLeft);
    leftEyeMesh.position.set(-0.072, 0.02, 0.13);
    leftEyeMesh.rotation.y = -0.25;
    headGroup.add(leftEyeMesh);

    const rightEyeMesh = new THREE.Mesh(eyeGeo, eyeMatRight);
    rightEyeMesh.position.set(0.072, 0.02, 0.13);
    rightEyeMesh.rotation.y = 0.25;
    headGroup.add(rightEyeMesh);

    // Pupils
    const pupilGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.035, 6);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.073, 0.02, 0.155);
    leftPupil.rotation.y = -0.25;
    headGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.073, 0.02, 0.155);
    rightPupil.rotation.y = 0.25;
    headGroup.add(rightPupil);

    // EARS
    const earSize = 0.09 * appearance.earSize;
    const earGeo = new THREE.ConeGeometry(earSize, 0.14 * appearance.earSize, 4);
    earGeo.scale(1.1, 1.0, 0.5);

    const leftEarGroup = new THREE.Group();
    leftEarGroup.position.set(-0.11, 0.15, -0.02);
    leftEarGroup.rotation.z = 0.35;
    leftEarGroup.rotation.y = -0.2;
    headGroup.add(leftEarGroup);

    const leftEarMesh = new THREE.Mesh(earGeo, coatMaterial);
    leftEarMesh.position.y = 0.06;
    leftEarMesh.castShadow = true;
    leftEarGroup.add(leftEarMesh);

    const rightEarGroup = new THREE.Group();
    rightEarGroup.position.set(0.11, 0.15, -0.02);
    rightEarGroup.rotation.z = -0.35;
    rightEarGroup.rotation.y = 0.2;
    headGroup.add(rightEarGroup);

    const rightEarMesh = new THREE.Mesh(earGeo, coatMaterial);
    rightEarMesh.position.y = 0.06;
    rightEarMesh.castShadow = true;
    rightEarGroup.add(rightEarMesh);

    // WHISKERS
    const whiskerGroup = new THREE.Group();
    whiskerGroup.position.set(0, -0.03, 0.16);
    headGroup.add(whiskerGroup);

    const whiskerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75 });
    for (let side of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const whiskerPoints = [
          new THREE.Vector3(side * 0.04, i * 0.015 - 0.01, 0),
          new THREE.Vector3(side * 0.18, i * 0.02 - 0.02, 0.02),
        ];
        const whiskerGeo = new THREE.BufferGeometry().setFromPoints(whiskerPoints);
        const whiskerLine = new THREE.Line(whiskerGeo, whiskerMat);
        whiskerGroup.add(whiskerLine);
      }
    }

    // FRONT LEGS
    const legRadius = 0.06 * appearance.pawSize;
    const upperLegGeo = new THREE.CylinderGeometry(legRadius * 1.1, legRadius * 0.9, legHeight * 0.55, 8);
    const forearmGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius * 0.8, legHeight * 0.55, 8);
    const pawGeo = new THREE.BoxGeometry(legRadius * 2.1 * appearance.pawSize, 0.05, 0.11 * appearance.pawSize);

    // Left Front
    const leftFrontLeg = new THREE.Group();
    leftFrontLeg.position.set(-torsoWidth * 0.65, -0.05, 0.24);
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
    leftFrontPaw.position.set(0, -legHeight * 0.52, 0.02);
    leftFrontPaw.castShadow = true;
    leftFrontForearm.add(leftFrontPaw);

    // Right Front
    const rightFrontLeg = new THREE.Group();
    rightFrontLeg.position.set(torsoWidth * 0.65, -0.05, 0.24);
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
    rightFrontPaw.position.set(0, -legHeight * 0.52, 0.02);
    rightFrontPaw.castShadow = true;
    rightFrontForearm.add(rightFrontPaw);

    // HIND LEGS (Thighs & Hocks)
    const thighGeo = new THREE.CylinderGeometry(legRadius * 1.5, legRadius * 1.0, legHeight * 0.6, 8);
    const shinGeo = new THREE.CylinderGeometry(legRadius * 0.9, legRadius * 0.75, legHeight * 0.55, 8);

    // Left Back
    const leftBackLeg = new THREE.Group();
    leftBackLeg.position.set(-torsoWidth * 0.65, -0.02, -0.22);
    bodyGroup.add(leftBackLeg);
    const lbThigh = new THREE.Mesh(thighGeo, coatMaterial);
    lbThigh.position.y = -legHeight * 0.28;
    lbThigh.rotation.x = -0.2;
    lbThigh.castShadow = true;
    leftBackLeg.add(lbThigh);

    const leftBackShin = new THREE.Group();
    leftBackShin.position.set(0, -legHeight * 0.55, -0.05);
    leftBackLeg.add(leftBackShin);
    const lbShin = new THREE.Mesh(shinGeo, coatMaterial);
    lbShin.position.y = -legHeight * 0.25;
    lbShin.rotation.x = 0.35;
    lbShin.castShadow = true;
    leftBackShin.add(lbShin);

    const leftBackPaw = new THREE.Mesh(pawGeo, coatMaterial);
    leftBackPaw.position.set(0, -legHeight * 0.52, 0.04);
    leftBackPaw.castShadow = true;
    leftBackShin.add(leftBackPaw);

    // Right Back
    const rightBackLeg = new THREE.Group();
    rightBackLeg.position.set(torsoWidth * 0.65, -0.02, -0.22);
    bodyGroup.add(rightBackLeg);
    const rbThigh = new THREE.Mesh(thighGeo, coatMaterial);
    rbThigh.position.y = -legHeight * 0.28;
    rbThigh.rotation.x = -0.2;
    rbThigh.castShadow = true;
    rightBackLeg.add(rbThigh);

    const rightBackShin = new THREE.Group();
    rightBackShin.position.set(0, -legHeight * 0.55, -0.05);
    rightBackLeg.add(rightBackShin);
    const rbShin = new THREE.Mesh(shinGeo, coatMaterial);
    rbShin.position.y = -legHeight * 0.25;
    rbShin.rotation.x = 0.35;
    rbShin.castShadow = true;
    rightBackShin.add(rbShin);

    const rightBackPaw = new THREE.Mesh(pawGeo, coatMaterial);
    rightBackPaw.position.set(0, -legHeight * 0.52, 0.04);
    rightBackPaw.castShadow = true;
    rightBackShin.add(rightBackPaw);

    // TAIL CHAIN (5 joints for expressive feline motion)
    const tailJoints: THREE.Group[] = [];
    const tailSegLen = (0.13 * appearance.tailLength) / 5;
    const tailThickness = 0.045 * appearance.tailThickness;

    let prevParent: THREE.Group = bodyGroup;
    for (let i = 0; i < 5; i++) {
      const joint = new THREE.Group();
      if (i === 0) {
        joint.position.set(0, 0.08, -0.32);
        joint.rotation.x = 0.4;
      } else {
        joint.position.set(0, 0.02, -tailSegLen);
      }
      prevParent.add(joint);
      tailJoints.push(joint);

      const radTop = tailThickness * (1.0 - (i / 5) * 0.3);
      const radBot = tailThickness * (1.0 - ((i + 1) / 5) * 0.3);
      const segGeo = new THREE.CylinderGeometry(radTop, radBot, tailSegLen, 6);
      segGeo.rotateX(Math.PI / 2);
      const segMesh = new THREE.Mesh(segGeo, coatMaterial);
      segMesh.position.z = -tailSegLen * 0.5;
      segMesh.castShadow = true;
      joint.add(segMesh);

      prevParent = joint;
    }

    // ACCESSORIES
    const accessoryGroup = new THREE.Group();
    headGroup.add(accessoryGroup);

    if (appearance.accessory === 'oak_leaves') {
      const leafGeo = new THREE.PlaneGeometry(0.07, 0.1);
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d7c0f, side: THREE.DoubleSide });
      const leaf1 = new THREE.Mesh(leafGeo, leafMat);
      leaf1.position.set(-0.09, 0.12, 0.02);
      leaf1.rotation.set(0.2, 0.5, 0.8);
      accessoryGroup.add(leaf1);
    } else if (appearance.accessory === 'blue_feather' || appearance.accessory === 'cardinal_feather') {
      const featherColor = appearance.accessory === 'blue_feather' ? 0x2563eb : 0xdc2626;
      const featherGeo = new THREE.ConeGeometry(0.03, 0.18, 3);
      featherGeo.scale(1.0, 1.0, 0.15);
      const featherMat = new THREE.MeshStandardMaterial({ color: featherColor });
      const feather = new THREE.Mesh(featherGeo, featherMat);
      feather.position.set(0.12, 0.14, -0.03);
      feather.rotation.set(-0.2, 0, -0.6);
      accessoryGroup.add(feather);
    } else if (appearance.accessory === 'violet_flower' || appearance.accessory === 'poppy_flower') {
      const flowerColor = appearance.accessory === 'violet_flower' ? 0x9333ea : 0xe11d48;
      const flowerGeo = new THREE.TorusGeometry(0.035, 0.015, 6, 8);
      const flowerMat = new THREE.MeshStandardMaterial({ color: flowerColor });
      const flower = new THREE.Mesh(flowerGeo, flowerMat);
      flower.position.set(0, 0.18, 0.05);
      flower.rotation.x = Math.PI / 2;
      accessoryGroup.add(flower);
    } else if (appearance.accessory === 'leather_collar' || appearance.accessory === 'bell_collar') {
      const collarGeo = new THREE.TorusGeometry(0.18, 0.02, 6, 16);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.3 });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.position.set(0, -0.08, 0.05);
      collar.rotation.x = Math.PI / 2;
      neckGroup.add(collar);

      if (appearance.accessory === 'bell_collar') {
        const bellGeo = new THREE.SphereGeometry(0.03, 8, 8);
        const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        const bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.set(0, -0.11, 0.22);
        neckGroup.add(bell);
      }
    }

    // SCARS
    if (appearance.scar === 'torn_left_ear') {
      leftEarMesh.scale.set(0.8, 0.65, 0.9);
      leftEarMesh.position.y = 0.03;
    } else if (appearance.scar === 'torn_right_ear') {
      rightEarMesh.scale.set(0.8, 0.65, 0.9);
      rightEarMesh.position.y = 0.03;
    } else if (appearance.scar === 'muzzle_scratch') {
      const scarGeo = new THREE.PlaneGeometry(0.06, 0.012);
      const scarMat = new THREE.MeshBasicMaterial({ color: 0x7f1d1d, side: THREE.DoubleSide });
      const scarMesh = new THREE.Mesh(scarGeo, scarMat);
      scarMesh.position.set(0.04, -0.02, 0.17);
      scarMesh.rotation.z = -0.4;
      headGroup.add(scarMesh);
    }

    // AURA EFFECT PARTICLES
    const auraGroup = new THREE.Group();
    root.add(auraGroup);

    if (appearance.aura === 'starclan_stars' || appearance.aura === 'celestial_shimmer') {
      const starGeo = new THREE.BufferGeometry();
      const count = 30;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1.4;
        positions[i * 3 + 1] = Math.random() * 1.2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.4;
      }
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const starMat = new THREE.PointsMaterial({
        color: 0x93c5fd,
        size: 0.07,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      });
      const starPoints = new THREE.Points(starGeo, starMat);
      auraGroup.add(starPoints);
    } else if (appearance.aura === 'darkforest_smoke') {
      const smokeGeo = new THREE.BufferGeometry();
      const count = 25;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 1.2;
        positions[i * 3 + 1] = Math.random() * 0.8;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.2;
      }
      smokeGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const smokeMat = new THREE.PointsMaterial({
        color: 0x6b21a8,
        size: 0.12,
        transparent: true,
        opacity: 0.6,
      });
      const smokePoints = new THREE.Points(smokeGeo, smokeMat);
      auraGroup.add(smokePoints);
    }

    root.scale.set(scaleMult, scaleMult, scaleMult);

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
   * Builds visual 3D Prey model for in-mouth carrying or world spawning
   */
  public static buildPreyMesh(type: 'mouse' | 'rabbit' | 'bird' | 'fish' | 'vole' | 'squirrel'): THREE.Group {
    const group = new THREE.Group();
    group.name = `Prey_${type}`;

    if (type === 'mouse' || type === 'vole') {
      const color = type === 'mouse' ? 0x9ca3af : 0x78350f;
      const bodyGeo = new THREE.SphereGeometry(0.08, 8, 8);
      bodyGeo.scale(0.8, 0.7, 1.4);
      const bodyMat = new THREE.MeshStandardMaterial({ color });
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
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706 });
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
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
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
