import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, ClanId, ClanRole } from '../types/game';
import { ChatFilter } from '../game/ChatFilter';
import { MessageSquare, Send, ChevronDown, ChevronUp, Users, Shield } from 'lucide-react';
import { CLAN_LORE } from '../constants/clans';

interface ChatBoxProps {
  myPlayerId: string;
  myName: string;
  myClan: ClanId;
  myRole: ClanRole;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  myPlayerId,
  myName,
  myClan,
  myRole,
  messages,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'local' | 'clan' | 'rp' | 'whisper' | 'all'>('all');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // Apply selective profanity filter without destroying sentence
    const { filteredText } = ChatFilter.filterText(inputText.trim());
    const parsed = ChatFilter.parseCommand(filteredText);

    let channel: ChatMessage['channel'] = 'local';
    let textToSend = filteredText;

    if (parsed.isCommand) {
      if (parsed.commandType === 'me') {
        channel = 'rp';
        textToSend = `* ${myName} ${parsed.body} *`;
      } else if (parsed.commandType === 'roll') {
        channel = 'rp';
        textToSend = `* ${myName} ${parsed.body} *`;
      } else if (parsed.commandType === 'shout') {
        channel = 'local';
        textToSend = `[SHOUT] ${myName}: ${parsed.body.toUpperCase()}!`;
      } else if (parsed.commandType === 'whisper') {
        channel = 'whisper';
        textToSend = `[Whisper to ${parsed.targetPlayer}]: ${parsed.body}`;
      }
    } else {
      if (selectedChannel === 'clan') channel = 'clan';
      if (selectedChannel === 'rp') channel = 'rp';
    }

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      senderId: myPlayerId,
      senderName: myName,
      senderClan: myClan,
      senderRole: myRole,
      text: textToSend,
      channel,
      timestamp: Date.now(),
    };

    onSendMessage(newMsg);
    setInputText('');
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedChannel === 'all') return true;
    return m.channel === selectedChannel;
  });

  return (
    <div className="fixed bottom-4 left-4 z-30 w-80 sm:w-96 flex flex-col font-sans select-none pointer-events-auto">
      {/* CHAT HEADER */}
      <div className="flex items-center justify-between bg-stone-900/90 backdrop-blur-md border-t border-x border-stone-700/60 px-3 py-2 rounded-t-2xl shadow-xl">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-stone-200">Clan Chat</span>
          <span className="text-[10px] text-stone-400 bg-stone-800 px-1.5 py-0.5 rounded-full">
            {filteredMessages.length}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Channel Selector Chips */}
          {(['all', 'local', 'clan', 'rp'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setSelectedChannel(ch)}
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md transition ${
                selectedChannel === ch
                  ? 'bg-amber-500 text-stone-950 shadow'
                  : 'bg-stone-800 text-stone-400 hover:text-stone-200'
              }`}
            >
              {ch}
            </button>
          ))}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-stone-400 hover:text-stone-200 p-1 rounded transition"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* CHAT BODY & INPUT */}
      {!isMinimized && (
        <div className="bg-stone-950/85 backdrop-blur-md border-b border-x border-stone-700/60 p-2.5 rounded-b-2xl shadow-2xl flex flex-col">
          {/* MESSAGE LOG SCROLLER */}
          <div ref={scrollRef} className="h-44 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin text-xs">
            {filteredMessages.map((msg) => {
              const isMe = msg.senderId === myPlayerId;
              const clanBadge = CLAN_LORE[msg.senderClan]?.badgeIcon || '🐾';

              if (msg.channel === 'system') {
                return (
                  <div key={msg.id} className="text-amber-300 italic text-[11px] bg-amber-950/30 p-1 rounded border border-amber-500/20">
                    📢 {msg.text}
                  </div>
                );
              }

              if (msg.channel === 'rp') {
                return (
                  <div key={msg.id} className="text-purple-300 italic text-[11px] bg-purple-950/20 p-1 rounded">
                    {msg.text}
                  </div>
                );
              }

              return (
                <div key={msg.id} className="leading-tight break-words">
                  <span className="text-stone-400 mr-1">{clanBadge}</span>
                  <span className={`font-bold mr-1 ${isMe ? 'text-amber-400' : 'text-stone-200'}`}>
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-stone-400 mr-1.5">[{msg.senderRole}]</span>
                  <span className="text-stone-300">{msg.text}</span>
                </div>
              );
            })}
          </div>

          {/* QUICK RP BUTTONS */}
          <div className="flex gap-1 my-1.5 pt-1 border-t border-stone-800">
            <button
              onClick={() => setInputText('/me stalks forward into the bracken...')}
              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-purple-300 px-1.5 py-0.5 rounded font-mono"
            >
              /me
            </button>
            <button
              onClick={() => setInputText('/roll')}
              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-emerald-300 px-1.5 py-0.5 rounded font-mono"
            >
              /roll
            </button>
            <button
              onClick={() => setInputText('/shout Danger on the border!')}
              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-rose-300 px-1.5 py-0.5 rounded font-mono"
            >
              /shout
            </button>
          </div>

          {/* INPUT FORM (Up to 400 Characters) */}
          <form onSubmit={handleSend} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={400}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type message or /me action (max 400 chars)..."
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-2.5 py-1.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-400 pr-12"
              />
              <span className="absolute right-2 top-1.5 text-[9px] font-mono text-stone-400">
                {inputText.length}/400
              </span>
            </div>
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 p-2 rounded-xl transition shadow"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
