import { DeathRecord, PlayerRuntimeState } from '../types/game';
import { soundEngine } from '../audio/SoundEngine';

export class LeaderNineLivesSystem {
  /**
   * Processes player lethal damage event
   */
  public static handleLethalDamage(
    player: PlayerRuntimeState,
    cause: string,
    location: string
  ): {
    resurrectedImmediately: boolean;
    remainingLives: number;
    message: string;
    record: DeathRecord;
  } {
    const isLeader = player.character.role === 'Leader';
    soundEngine.playLifeLostSting();

    const record: DeathRecord = {
      lifeNumber: isLeader ? player.character.leaderLives : 1,
      timestamp: new Date().toLocaleTimeString(),
      cause,
      location,
    };
    player.character.deathHistory.unshift(record);

    if (isLeader && player.character.leaderLives > 1) {
      player.character.leaderLives -= 1;
      player.health = player.maxHealth;
      player.stamina = player.maxStamina;
      player.isDead = false;

      return {
        resurrectedImmediately: true,
        remainingLives: player.character.leaderLives,
        message: `StarClan restored your spirit! ${player.character.leaderLives} of 9 lives remaining.`,
        record,
      };
    } else {
      player.isDead = true;
      player.health = 0;
      if (isLeader) player.character.leaderLives = 0;

      return {
        resurrectedImmediately: false,
        remainingLives: isLeader ? 0 : 0,
        message: isLeader
          ? 'Your final life has faded. Your spirit ascends towards the starry skies...'
          : 'Your strength failed you. Your spirit now wanders between realms...',
        record,
      };
    }
  }
}
