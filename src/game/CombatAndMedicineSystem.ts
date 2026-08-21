import { HerbItem, HerbType, Injury, PlayerRuntimeState } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

export interface CombatResult {
  damageDealt: number;
  isCritical: boolean;
  inflictedInjury?: Injury;
  staminaUsed: number;
  message: string;
}

export class CombatAndMedicineSystem {
  /**
   * Executes an attack action and returns combat results
   */
  public static executeAttack(
    type: 'claw_swipe' | 'pounce' | 'bite',
    attacker: PlayerRuntimeState,
    isTargetBlocking: boolean = false
  ): CombatResult {
    let baseDamage = 12;
    let staminaCost = 15;
    let isCritical = Math.random() < 0.2;

    if (type === 'claw_swipe') {
      baseDamage = 14;
      staminaCost = 12;
      soundEngine.playClawSwipe();
    } else if (type === 'pounce') {
      baseDamage = 22;
      staminaCost = 25;
      soundEngine.playPounce();
    } else if (type === 'bite') {
      baseDamage = 28;
      staminaCost = 30;
      soundEngine.playGrowl();
    }

    if (isCritical) {
      baseDamage = Math.round(baseDamage * 1.5);
    }

    if (isTargetBlocking) {
      baseDamage = Math.max(2, Math.round(baseDamage * 0.25));
    }

    // Chance to inflict injury
    let inflictedInjury: Injury | undefined = undefined;
    if (!isTargetBlocking && Math.random() < 0.35) {
      if (type === 'claw_swipe') {
        inflictedInjury = {
          id: `injury_${Date.now()}`,
          name: 'Claw Scratches',
          type: 'scratch',
          severity: 1,
          curedByHerb: 'dock',
          description: 'Abrasive stinging scratches across shoulders.',
          timeRemaining: 180,
        };
      } else if (type === 'pounce') {
        inflictedInjury = {
          id: `injury_${Date.now()}`,
          name: 'Sprained Joint',
          type: 'sprain',
          severity: 2,
          curedByHerb: 'horsetail',
          description: 'Limping gait; movement speed reduced by 30%.',
          timeRemaining: 240,
        };
      } else if (type === 'bite') {
        inflictedInjury = {
          id: `injury_${Date.now()}`,
          name: 'Bleeding Bite Wound',
          type: 'bleeding',
          severity: 3,
          curedByHerb: 'marigold',
          description: 'Open puncture wound slowly draining vitality.',
          timeRemaining: 120,
        };
      }
    }

    return {
      damageDealt: baseDamage,
      isCritical,
      inflictedInjury,
      staminaUsed: staminaCost,
      message: `${isCritical ? 'CRITICAL HIT! ' : ''}${type.replace('_', ' ').toUpperCase()} dealt ${baseDamage} damage!`,
    };
  }

  /**
   * Applies an herb to cure an active injury
   */
  public static treatInjury(
    herbType: HerbType,
    player: PlayerRuntimeState
  ): { success: boolean; message: string; healedInjuryId?: string } {
    const herbIdx = player.herbs.findIndex((h) => h.type === herbType && h.quantity > 0);
    if (herbIdx === -1) {
      return { success: false, message: 'You do not have this herb in your pouch!' };
    }

    // Find matching injury
    const injuryIdx = player.injuries.findIndex((inj) => inj.curedByHerb === herbType);
    if (injuryIdx !== -1) {
      const cured = player.injuries[injuryIdx];
      player.injuries.splice(injuryIdx, 1);
      player.herbs[herbIdx].quantity -= 1;
      player.health = Math.min(player.maxHealth, player.health + 25);
      soundEngine.playPurr();

      return {
        success: true,
        message: `Successfully treated ${cured.name}! Health restored by 25.`,
        healedInjuryId: cured.id,
      };
    } else {
      // General soothing herb consumption
      player.herbs[herbIdx].quantity -= 1;
      player.health = Math.min(player.maxHealth, player.health + 15);
      player.stamina = Math.min(player.maxStamina, player.stamina + 25);
      soundEngine.playPurr();

      return {
        success: true,
        message: `Chewed soothing ${herbType}. Restored +15 HP and +25 Stamina.`,
      };
    }
  }
}
