import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, Send, X } from 'lucide-react';
import { sendOnlineChat } from '../services/onlineService.js';

const QUICK_CHATS = [
  'Xin chào kỳ hữu! 👋',
  'Nước cờ cao minh quá! 👏',
  'Đợi mình suy nghĩ chút nhé! 🤔',
  'Đa tạ chỉ giáo! 🙏',
];

export function RoomChatDrawer({
  currentRoom,
  currentUser,
  playerName,
  messages = [],
  onRoomUpdated,
  onClose,
}) {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const username = currentUser?.username || playerName;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMessage = async (message) => {
    const text = message.trim();
    if (!text || sending || !currentRoom?.roomId) return;

    setSending(true);
    try {
      const updated = await sendOnlineChat(currentRoom.roomId, username, text);
      setInput('');
      onRoomUpdated(updated);
    } catch {
      // The room websocket will recover the latest messages on the next update.
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-end justify-end p-3 sm:p-5 bg-black/25"
      onClick={onClose}
      role="presentation"
    >
      <section
        className="w-full max-w-sm h-[min(560px,calc(100vh-2rem))] rounded-2xl bg-[#10261c]/[.98] border border-[#5ec485]/45 shadow-[0_20px_70px_rgba(0,0,0,.65)] flex flex-col overflow-hidden animate-fade-in"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#153124]">
          <div className="flex items-center gap-2 text-[#e8f8ee]">
            <MessageSquare className="w-4 h-4 text-[#61c887]" />
            <div>
              <h2 className="text-sm font-bold">Trò chuyện trong phòng</h2>
              <p className="text-[10px] text-[#8fa195]">{currentRoom?.roomId}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#9fb0a5] hover:text-white hover:bg-white/10" title="Đóng chat">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#8fa195] text-center px-6">
              Gửi lời chào đầu tiên tới đối thủ của bạn.
            </div>
          ) : (
            messages.map((chat, index) => {
              const isMine = chat.sender === username;
              return (
                <div key={`${chat.timestamp || index}-${index}`} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[84%] rounded-2xl px-3 py-2 ${isMine ? 'bg-[#256044] text-white rounded-br-md' : 'bg-black/30 text-[#f3ead8] rounded-bl-md'}`}>
                    <div className="text-[10px] font-bold text-[#9de5b7] mb-0.5">{isMine ? 'Bạn' : chat.sender}</div>
                    <div className="text-xs leading-relaxed break-words">{chat.message}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-3 pt-2 border-t border-white/10">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {QUICK_CHATS.map((quickChat) => (
              <button key={quickChat} onClick={() => sendMessage(quickChat)} className="shrink-0 px-2 py-1 rounded-lg bg-black/25 border border-white/10 text-[10px] text-[#c2d5c8] hover:bg-white/10">
                {quickChat}
              </button>
            ))}
          </div>
          <form onSubmit={(event) => { event.preventDefault(); sendMessage(input); }} className="flex gap-2 pb-3">
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Nhập tin nhắn..." className="min-w-0 flex-1 px-3 py-2 rounded-xl bg-black/35 border border-white/10 text-xs text-white placeholder:text-[#718579] focus:outline-none focus:border-[#5ec485]" />
            <button type="submit" disabled={!input.trim() || sending} className="p-2 rounded-xl bg-[#2b7650] hover:bg-[#369461] disabled:opacity-40 text-white" title="Gửi tin nhắn">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
