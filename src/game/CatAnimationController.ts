import * as THREE from 'three';
import { AnimationState } from '../types/game';
import { CatRigNodes } from './CatMeshBuilder';

export class CatAnimationController {
  private rig: CatRigNodes;
  private state: AnimationState = 'idle';
  private animTime: number = 0;
  private transitionAlpha: number = 1.0;

  constructor(rig: CatRigNodes) {
    this.rig = rig;
  }

  public setState(newState: AnimationState) {
    if (this.state !== newState) {
      this.state = newState;
      this.animTime = 0;
    }
  }

  public getState(): AnimationState {
    return this.state;
  }

  public update(delta: number, speedRatio: number = 1.0) {
    this.animTime += delta;
    const t = this.animTime;
    const {
      body,
      headGroup,
      neckGroup,
      jawGroup,
      leftFrontLeg,
      leftFrontForearm,
      rightFrontLeg,
      rightFrontForearm,
      leftBackLeg,
      leftBackShin,
      rightBackLeg,
      rightBackShin,
      leftEarGroup,
      rightEarGroup,
      tailJoints,
      auraGroup,
    } = this.rig;

    // Reset base rotations for blending
    const baseBodyY = 0.42;

    // Animate Aura particles if present
    if (auraGroup && auraGroup.children.length > 0) {
      auraGroup.rotation.y += delta * 0.5;
    }

    switch (this.state) {
      case 'idle': {
        // Subtle breathing
        body.position.y = baseBodyY + Math.sin(t * 2.2) * 0.015;
        body.rotation.set(0, 0, 0);

        neckGroup.rotation.x = Math.sin(t * 1.5) * 0.03;
        headGroup.rotation.y = Math.sin(t * 0.7) * 0.08;
        headGroup.rotation.z = Math.sin(t * 0.5) * 0.02;

        // Ear twitches occasionally
        const earTwitch = Math.sin(t * 5) > 0.96 ? 0.2 : 0;
        leftEarGroup.rotation.z = 0.35 + earTwitch;
        rightEarGroup.rotation.z = -0.35 - (Math.sin(t * 4.2) > 0.95 ? 0.18 : 0);

        // Legs upright
        leftFrontLeg.rotation.x = 0;
        leftFrontForearm.rotation.x = 0;
        rightFrontLeg.rotation.x = 0;
        rightFrontForearm.rotation.x = 0;
        leftBackLeg.rotation.x = 0;
        leftBackShin.rotation.x = 0.2;
        rightBackLeg.rotation.x = 0;
        rightBackShin.rotation.x = 0.2;

        // Gentle tail swish
        tailJoints.forEach((joint, idx) => {
          joint.rotation.y = Math.sin(t * 1.8 + idx * 0.4) * 0.15;
          joint.rotation.x = 0.35 + Math.sin(t * 1.2 + idx * 0.2) * 0.08;
        });

        jawGroup.rotation.x = 0;
        break;
      }

      case 'walk': {
        const freq = 6.0 * speedRatio;
        const walkCycle = t * freq;

        body.position.y = baseBodyY + Math.abs(Math.sin(walkCycle)) * 0.03;
        body.rotation.z = Math.sin(walkCycle) * 0.04;
        body.rotation.x = Math.sin(walkCycle * 2) * 0.02;

        headGroup.position.y = 0.14 + Math.sin(walkCycle) * 0.02;
        headGroup.rotation.x = Math.sin(walkCycle) * 0.04;

        // Feline 4-beat diagonal gait
        leftFrontLeg.rotation.x = Math.sin(walkCycle) * 0.45;
        leftFrontForearm.rotation.x = Math.max(0, -Math.sin(walkCycle) * 0.5);

        rightFrontLeg.rotation.x = Math.sin(walkCycle + Math.PI) * 0.45;
        rightFrontForearm.rotation.x = Math.max(0, -Math.sin(walkCycle + Math.PI) * 0.5);

        leftBackLeg.rotation.x = Math.sin(walkCycle + Math.PI * 0.7) * 0.4;
        leftBackShin.rotation.x = 0.2 + Math.max(0, Math.sin(walkCycle + Math.PI * 0.7) * 0.4);

        rightBackLeg.rotation.x = Math.sin(walkCycle + Math.PI * 1.7) * 0.4;
        rightBackShin.rotation.x = 0.2 + Math.max(0, Math.sin(walkCycle + Math.PI * 1.7) * 0.4);

        tailJoints.forEach((joint, idx) => {
          joint.rotation.y = Math.sin(walkCycle + idx * 0.5) * 0.22;
          joint.rotation.x = 0.4 + Math.sin(walkCycle * 0.5) * 0.1;
        });
        break;
      }

      case 'run':
      case 'sprint': {
        const freq = (this.state === 'sprint' ? 14.0 : 10.5) * speedRatio;
        const runCycle = t * freq;
        const amp = this.state === 'sprint' ? 0.7 : 0.55;

        // Spine bounding leap
        body.position.y = baseBodyY + Math.sin(runCycle) * 0.08;
        body.rotation.x = Math.sin(runCycle) * 0.12;

        headGroup.rotation.x = -Math.sin(runCycle) * 0.1;

        // Gallop cycle: forelegs bound together with slight offset
        leftFrontLeg.rotation.x = Math.sin(runCycle) * amp;
        leftFrontForearm.rotation.x = Math.max(0, -Math.sin(runCycle) * amp * 1.2);

        rightFrontLeg.rotation.x = Math.sin(runCycle + 0.3) * amp;
        rightFrontForearm.rotation.x = Math.max(0, -Math.sin(runCycle + 0.3) * amp * 1.2);

        leftBackLeg.rotation.x = -Math.sin(runCycle) * amp;
        leftBackShin.rotation.x = 0.3 + Math.max(0, -Math.sin(runCycle) * amp);

        rightBackLeg.rotation.x = -Math.sin(runCycle + 0.3) * amp;
        rightBackShin.rotation.x = 0.3 + Math.max(0, -Math.sin(runCycle + 0.3) * amp);

        // Trailing aerodynamic tail
        tailJoints.forEach((joint, idx) => {
          joint.rotation.y = Math.sin(runCycle * 0.5 + idx * 0.3) * 0.12;
          joint.rotation.x = 0.15 + Math.sin(runCycle + idx * 0.4) * 0.18;
        });
        break;
      }

      case 'sneak': {
        const freq = 4.0 * speedRatio;
        const sneakCycle = t * freq;

        // Low belly stalk
        body.position.y = baseBodyY - 0.14 + Math.abs(Math.sin(sneakCycle)) * 0.015;
        body.rotation.x = 0.05;
        neckGroup.rotation.x = 0.2;
        headGroup.rotation.x = -0.15; // Eyes fixed ahead on prey

        leftFrontLeg.rotation.x = Math.sin(sneakCycle) * 0.35;
        leftFrontForearm.rotation.x = Math.max(0, -Math.sin(sneakCycle) * 0.4);
        rightFrontLeg.rotation.x = Math.sin(sneakCycle + Math.PI) * 0.35;
        rightFrontForearm.rotation.x = Math.max(0, -Math.sin(sneakCycle + Math.PI) * 0.4);

        leftBackLeg.rotation.x = Math.sin(sneakCycle + Math.PI * 0.7) * 0.35;
        rightBackLeg.rotation.x = Math.sin(sneakCycle + Math.PI * 1.7) * 0.35;

        // Tail held low and still
        tailJoints.forEach((joint, idx) => {
          joint.rotation.x = -0.1;
          joint.rotation.y = Math.sin(t * 3.5 + idx) * 0.08;
        });
        break;
      }

      case 'pounce_windup': {
        // Butt wiggle & rear coil
        body.position.y = baseBodyY - 0.18;
        body.rotation.x = 0.22;
        body.rotation.z = Math.sin(t * 18) * 0.06; // Eager butt wiggle!

        headGroup.rotation.x = -0.18;
        tailJoints.forEach((joint) => {
          joint.rotation.y = Math.sin(t * 20) * 0.25;
          joint.rotation.x = -0.2;
        });

        leftFrontLeg.rotation.x = 0.4;
        rightFrontLeg.rotation.x = 0.4;
        leftBackLeg.rotation.x = -0.5;
        rightBackLeg.rotation.x = -0.5;
        break;
      }

      case 'pounce_leap':
      case 'jump': {
        body.position.y = baseBodyY + 0.15;
        body.rotation.x = -0.25;

        leftFrontLeg.rotation.x = -0.6;
        rightFrontLeg.rotation.x = -0.6;
        leftBackLeg.rotation.x = 0.5;
        rightBackLeg.rotation.x = 0.5;

        tailJoints.forEach((joint) => {
          joint.rotation.x = 0.5;
        });
        break;
      }

      case 'claw_swipe': {
        const swipeCycle = Math.sin(Math.min(Math.PI, t * 10));
        body.rotation.y = swipeCycle * 0.3;
        body.position.y = baseBodyY + 0.05;

        // Left foreleg slashes out forward and across
        leftFrontLeg.rotation.x = -0.8 * swipeCycle;
        leftFrontLeg.rotation.z = -0.5 * swipeCycle;
        leftFrontForearm.rotation.x = -0.6 * swipeCycle;

        headGroup.rotation.y = -0.2 * swipeCycle;
        jawGroup.rotation.x = swipeCycle * 0.4; // snarl
        break;
      }

      case 'bite': {
        const biteCycle = Math.sin(Math.min(Math.PI, t * 12));
        neckGroup.position.z = 0.36 + biteCycle * 0.15;
        jawGroup.rotation.x = Math.sin(t * 14) > 0 ? 0.5 : 0.05;
        break;
      }

      case 'sit': {
        body.position.y = baseBodyY - 0.12;
        body.rotation.x = -0.4;

        leftFrontLeg.rotation.x = 0.38;
        rightFrontLeg.rotation.x = 0.38;
        leftFrontForearm.rotation.x = -0.05;
        rightFrontForearm.rotation.x = -0.05;

        leftBackLeg.rotation.x = -0.85;
        leftBackShin.rotation.x = 1.1;
        rightBackLeg.rotation.x = -0.85;
        rightBackShin.rotation.x = 1.1;

        headGroup.rotation.x = 0.35;
        // Tail wrapped around paws
        tailJoints.forEach((joint, idx) => {
          joint.rotation.x = 0.2;
          joint.rotation.y = 0.4 + idx * 0.15;
        });
        break;
      }

      case 'lay_down':
      case 'sleep': {
        body.position.y = baseBodyY - 0.28;
        body.rotation.z = this.state === 'sleep' ? 0.2 : 0;
        body.rotation.x = 0;

        leftFrontLeg.rotation.x = -0.7;
        rightFrontLeg.rotation.x = -0.7;
        leftBackLeg.rotation.x = 0.8;
        rightBackLeg.rotation.x = 0.8;

        headGroup.position.y = 0.05;
        headGroup.rotation.x = this.state === 'sleep' ? 0.35 : 0.1;

        tailJoints.forEach((joint) => {
          joint.rotation.x = 0.1;
          joint.rotation.y = 0.3;
        });
        break;
      }

      case 'groom': {
        body.position.y = baseBodyY - 0.12;
        body.rotation.x = -0.4;
        leftFrontLeg.rotation.x = -0.6; // Paw raised to head
        leftFrontForearm.rotation.x = -0.8;

        headGroup.rotation.x = 0.4;
        headGroup.rotation.z = Math.sin(t * 5) * 0.15;
        jawGroup.rotation.x = Math.sin(t * 10) > 0 ? 0.2 : 0; // Licking motion
        break;
      }

      case 'hiss':
      case 'snarl': {
        body.position.y = baseBodyY - 0.06;
        body.rotation.x = 0.1;
        neckGroup.rotation.x = -0.2;
        headGroup.rotation.x = 0.3;

        jawGroup.rotation.x = 0.45; // Wide open feline hiss
        leftEarGroup.rotation.z = 0.7; // Flattened ears
        rightEarGroup.rotation.z = -0.7;

        tailJoints.forEach((joint, idx) => {
          joint.rotation.y = Math.sin(t * 8 + idx) * 0.35;
          joint.rotation.x = 0.6;
        });
        break;
      }

      case 'hurt': {
        body.position.y = baseBodyY - 0.08;
        body.rotation.z = 0.2;
        headGroup.rotation.x = -0.3;
        jawGroup.rotation.x = 0.4;
        break;
      }

      case 'die': {
        body.position.y = baseBodyY - 0.32;
        body.rotation.z = 1.4; // Collapse sideways
        body.rotation.x = 0.2;
        leftFrontLeg.rotation.x = 0.4;
        rightFrontLeg.rotation.x = -0.3;
        leftBackLeg.rotation.x = 0.5;
        rightBackLeg.rotation.x = -0.2;
        headGroup.rotation.y = 0.4;
        jawGroup.rotation.x = 0.2;
        break;
      }
    }
  }
}
