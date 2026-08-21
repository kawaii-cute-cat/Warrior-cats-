const PROHIBITED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'dick', 'cock', 'pussy', 'nigger', 'nigga', 'faggot', 'whore', 'slut'
];

export class ChatFilter {
  /**
   * Cleans text up to 400 characters by selectively replacing only prohibited words
   * with '[filtered]' while preserving the surrounding sentence and roleplay.
   */
  public static filterText(rawText: string): { filteredText: string; hadProfanity: boolean } {
    if (!rawText) return { filteredText: '', hadProfanity: false };

    // Strict 400 character limit enforcement
    const truncated = rawText.slice(0, 400);

    let hadProfanity = false;
    const words = truncated.split(/(\s+|[.,!?;:()]+)/);

    const processed = words.map((token) => {
      const cleanToken = token.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (PROHIBITED_WORDS.includes(cleanToken)) {
        hadProfanity = true;
        return '[filtered]';
      }
      return token;
    });

    return {
      filteredText: processed.join(''),
      hadProfanity,
    };
  }

  /**
   * Parses roleplay command syntax (e.g. /me leaps forward, /shout, /roll)
   */
  public static parseCommand(text: string): {
    isCommand: boolean;
    commandType?: 'me' | 'shout' | 'whisper' | 'roll';
    targetPlayer?: string;
    body: string;
  } {
    const trimmed = text.trim();
    if (trimmed.startsWith('/me ')) {
      return { isCommand: true, commandType: 'me', body: trimmed.slice(4) };
    }
    if (trimmed.startsWith('/shout ')) {
      return { isCommand: true, commandType: 'shout', body: trimmed.slice(7) };
    }
    if (trimmed.startsWith('/roll')) {
      const rollVal = Math.floor(Math.random() * 100) + 1;
      return { isCommand: true, commandType: 'roll', body: `rolled a [${rollVal}/100]` };
    }
    if (trimmed.startsWith('/w ') || trimmed.startsWith('/whisper ')) {
      const parts = trimmed.split(' ');
      const target = parts[1];
      const body = parts.slice(2).join(' ');
      return { isCommand: true, commandType: 'whisper', targetPlayer: target, body };
    }
    return { isCommand: false, body: text };
  }
}
