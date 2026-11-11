import React, { useEffect, useRef, useState } from 'react';
import {
  Coins,
  Globe,
  MessageSquare,
  Plus,
  Send,
  Sparkles,
  Swords,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  addFriend,
  fetchDirectChat,
  fetchFriends,
  fetchGlobalChat,
  postDirectMessage,
  postGlobalChat,
  removeFriend,
} from '../services/onlineService.js';
import { renderUserAvatar } from './ProfileModal.jsx';

const GLOBAL_QUICK_MESSAGES = [
  'Chào toàn thể kỳ hữu! ☕',
  'Có ai giao lưu ván 10k xu không? ⚔️',
  'Tìm cao thủ cờ thế! 🏆',
  'Chúc anh em một ngày thắng lợi! 🎉',
];

export function GlobalChatDrawer({
  isOpen,
  onToggle,
  currentUser,
  userCoins,
  onOpenAuth,
  onChallengeFriend,
  initialTab = 'global',
}) {
  const [activeTab, setActiveTab] = useState('global'); // 'global', 'friends'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Friends & Direct Chat State
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [friendLoading, setFriendLoading] = useState(false);
  const [friendMsg, setFriendMsg] = useState(null);
  const [directMessages, setDirectMessages] = useState([]);
  const [directChatInput, setDirectChatInput] = useState('');
  const [directChatSending, setDirectChatSending] = useState(false);
  const directChatEndRef = useRef(null);
  const directInputRef = useRef(null);

  // Autofocus input when drawer opens or tab switches
  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'global') {
        setTimeout(() => inputRef.current?.focus(), 120);
      } else if (activeTab === 'friends' && selectedFriend) {
        setTimeout(() => directInputRef.current?.focus(), 120);
      }
    }
  }, [isOpen, activeTab, selectedFriend]);

  // Sync initial tab when drawer opens
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Load Global Chat History
  useEffect(() => {
    fetchGlobalChat()
      .then((data) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(() => {});
  }, []);

  // Auto-scroll global messages
  useEffect(() => {
    if (isOpen && activeTab === 'global') {
      setUnreadCount(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isOpen, activeTab]);

  // Load Friends List
  const loadFriendsList = () => {
    if (!currentUser?.username) return;
    fetchFriends(currentUser.username)
      .then((list) => setFriends(list || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen && currentUser?.username) {
      loadFriendsList();
    }
  }, [isOpen, currentUser?.username]);

  // Load Direct Messages when a friend is selected
  useEffect(() => {
    if (selectedFriend && currentUser?.username) {
      fetchDirectChat(currentUser.username, selectedFriend.username)
        .then((chats) => setDirectMessages(chats || []))
        .catch(() => {});
    } else {
      setDirectMessages([]);
    }
  }, [selectedFriend, currentUser?.username]);

  // Auto-scroll direct chat
  useEffect(() => {
    if (activeTab === 'friends' && selectedFriend) {
      directChatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages.length, selectedFriend, activeTab]);

  // Periodic refresh for active global chat
  useEffect(() => {
    if (!isOpen || activeTab !== 'global') return;
    const interval = setInterval(() => {
      fetchGlobalChat()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setMessages((prev) => (prev.length === data.length ? prev : data));
          }
        })
        .catch(() => {});
    }, 2800);
    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  // Real-time Event Listeners (Global & Direct chat)
  useEffect(() => {
    const handleGlobalMessage = (event) => {
      const newMsg = event.detail;
      if (!newMsg) return;
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            (newMsg.id && m.id === newMsg.id) ||
            (m.sender === newMsg.sender &&
              m.message === newMsg.message &&
              Math.abs(new Date(m.timestamp || 0) - new Date(newMsg.timestamp || 0)) < 2500)
        );
        if (exists) return prev;
        return [...prev, newMsg];
      });
      if (!isOpen || activeTab !== 'global') {
        setUnreadCount((c) => c + 1);
      }
    };

    const handleDirectMessage = (event) => {
      const msg = event.detail;
      if (!msg) return;
      if (
        selectedFriend &&
        (msg.sender === selectedFriend.username ||
          msg.recipient === selectedFriend.username)
      ) {
        setDirectMessages((prev) => {
          const exists = prev.some(
            (m) =>
              m.id === msg.id ||
              (m.sender === msg.sender &&
                m.message === msg.message &&
                Math.abs(new Date(m.timestamp || 0) - new Date(msg.timestamp || 0)) < 2000)
          );
          if (exists) return prev;
          return [...prev, msg];
        });
      }
      loadFriendsList();
    };

    window.addEventListener('xiangqi_global_chat', handleGlobalMessage);
    window.addEventListener('xiangqi_direct_chat', handleDirectMessage);
    return () => {
      window.removeEventListener('xiangqi_global_chat', handleGlobalMessage);
      window.removeEventListener('xiangqi_direct_chat', handleDirectMessage);
    };
  }, [isOpen, activeTab, selectedFriend]);

  // Send Global Message
  const handleSendGlobal = async (textToSend) => {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    if (!currentUser) {
      onOpenAuth?.();
      return;
    }

    // Clear input immediately so user can type the next message right away without waiting!
    if (!textToSend) {
      setInput('');
    }
    inputRef.current?.focus();

    setSending(true);
    try {
      const createdMsg = await postGlobalChat(currentUser.username, text, userCoins);
      if (createdMsg) {
        setMessages((prev) => {
          const exists = prev.some(
            (m) =>
              (createdMsg.id && m.id === createdMsg.id) ||
              (m.sender === createdMsg.sender &&
                m.message === createdMsg.message &&
                Math.abs(new Date(m.timestamp || 0) - new Date(createdMsg.timestamp || 0)) < 2500)
          );
          if (exists) return prev;
          return [...prev, createdMsg];
        });
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Add Friend
  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    const target = friendUsernameInput.trim();
    if (!target) return;

    setFriendLoading(true);
    setFriendMsg(null);
    try {
      await addFriend(currentUser.username, target);
      setFriendMsg({ type: 'success', text: `Đã kết bạn với @${target}!` });
      setFriendUsernameInput('');
      loadFriendsList();
    } catch (err) {
      setFriendMsg({ type: 'error', text: err.message || 'Không thể kết bạn' });
    } finally {
      setFriendLoading(false);
    }
  };

  // Remove Friend
  const handleRemoveFriend = async (friendUsername) => {
    if (!confirm(`Hủy kết bạn với @${friendUsername}?`)) return;
    try {
      await removeFriend(currentUser.username, friendUsername);
      loadFriendsList();
      if (selectedFriend?.username === friendUsername) {
        setSelectedFriend(null);
      }
    } catch {
      // ignore
    }
  };

  // Send Direct Message
  const handleSendDirect = async (e) => {
    if (e) e.preventDefault();
    const text = directChatInput.trim();
    if (!text || !selectedFriend || directChatSending) return;

    setDirectChatInput('');
    directInputRef.current?.focus();

    setDirectChatSending(true);
    try {
      const saved = await postDirectMessage(
        currentUser.username,
        selectedFriend.username,
        text
      );
      if (saved) {
        setDirectMessages((prev) => [...prev, saved]);
      }
    } catch {
      // ignore
    } finally {
      setDirectChatSending(false);
      directInputRef.current?.focus();
    }
  };

  const formatCoins = (c) => {
    if (!c && c !== 0) return '20k';
    if (c >= 1000000) return `${(c / 1000000).toFixed(1)}M`;
    if (c >= 1000) return `${Math.floor(c / 1000)}k`;
    return `${c}`;
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Floating Toggle Button (Bottom-Right) */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-[#1b4332]/95 hover:bg-[#245942] text-[#fef08a] border border-[#5ec485]/60 shadow-[0_8px_25px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-[#8ce8b1]" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold animate-pulse">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-xs font-bold tracking-wide">
            Kỳ Hữu & Trò Chuyện
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </button>
      )}

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-[94vw] sm:w-[420px] h-[540px] rounded-3xl bg-[#0e2117]/95 backdrop-blur-xl border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-fade-in">
          {/* Header with Tabs */}
          <div className="px-3.5 py-2.5 bg-[#142d20]/95 border-b border-[#848156]/30 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveTab('global');
                  setSelectedFriend(null);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'global'
                    ? 'bg-[#25593f] text-[#fef3c7] border border-[#5ec485]/50 shadow'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#60a5fa]" />
                <span>Kênh Thế Giới</span>
              </button>

              <button
                onClick={() => setActiveTab('friends')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === 'friends'
                    ? 'bg-[#25593f] text-[#fef3c7] border border-[#5ec485]/50 shadow'
                    : 'text-stone-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span>Bạn Bè</span>
                {currentUser && friends.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] text-[#8ce8b1]">
                    {friends.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={onToggle}
              className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Thu nhỏ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Balance / Auth bar */}
          <div className="px-3.5 py-1.5 bg-[#0a1811] border-b border-white/5 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1 text-[#fef08a]">
              <Coins className="w-3.5 h-3.5 text-yellow-400" />
              <span>
                Số dư:{' '}
                <strong>{userCoins?.toLocaleString('vi-VN')} xu</strong>
              </span>
            </div>
            {!currentUser && (
              <button
                onClick={onOpenAuth}
                className="text-xs text-[#8ce8b1] hover:underline font-semibold cursor-pointer"
              >
                Đăng nhập để chat
              </button>
            )}
          </div>

          {/* TAB 1: KÊNH THẾ GIỚI */}
          {activeTab === 'global' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Messages list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8fa195] px-4">
                    <Sparkles className="w-8 h-8 text-[#5ec485]/40 mb-2" />
                    <p>Chưa có tin nhắn nào trên kênh thế giới.</p>
                    <p className="text-[11px] text-[#6f8276] mt-1">
                      Hãy gửi lời chào đầu tiên tới toàn thể kỳ hữu!
                    </p>
                  </div>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = currentUser && m.sender === currentUser.username;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[10px]">
                          <span
                            className={`font-bold ${
                              isMe ? 'text-[#8ce8b1]' : 'text-[#f5d499]'
                            }`}
                          >
                            {m.sender}
                          </span>
                          {m.coins != null && (
                            <span className="px-1.5 py-0.2 rounded-full bg-[#1b3a2a] text-[#fef08a] border border-[#facc15]/30 text-[9px] font-mono">
                              🪙 {formatCoins(m.coins)}
                            </span>
                          )}
                          <span className="text-[#6b7c72]">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>

                        <div
                          className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
                            isMe
                              ? 'bg-[#25593f] text-[#f4ead5] rounded-tr-xs border border-[#5ec485]/40'
                              : 'bg-black/45 text-[#e5e0d3] rounded-tl-xs border border-white/10'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Chat Presets */}
              <div className="px-3 py-1.5 bg-[#0a1811]/90 border-t border-white/5 flex gap-1.5 overflow-x-auto">
                {GLOBAL_QUICK_MESSAGES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendGlobal(q)}
                    disabled={sending}
                    className="whitespace-nowrap px-2.5 py-1 rounded-full bg-black/40 hover:bg-[#25593f] text-[10px] text-[#c2baa3] hover:text-white border border-white/10 transition cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendGlobal();
                }}
                className="p-2.5 bg-[#142d20] border-t border-[#848156]/30 flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendGlobal();
                    }
                  }}
                  placeholder={
                    currentUser
                      ? 'Gửi tin nhắn lên kênh thế giới...'
                      : 'Đăng nhập để tham gia chat thế giới...'
                  }
                  disabled={!currentUser}
                  className="flex-1 px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#5ec485] disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!currentUser || !input.trim() || sending}
                  className="p-2 rounded-xl bg-[#25593f] hover:bg-[#2f6f4f] disabled:opacity-40 text-white transition cursor-pointer"
                  title="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: BẠN BÈ & CHAT RIÊNG */}
          {activeTab === 'friends' && (
            <div className="flex-1 flex flex-col min-h-0">
              {!currentUser ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-stone-300">
                  <Users className="w-12 h-12 text-[#fbbf24]/50 mb-3" />
                  <h4 className="text-base font-bold text-white mb-1">
                    Kỳ Hữu Tri Kỷ
                  </h4>
                  <p className="text-xs text-stone-400 mb-4 max-w-xs">
                    Đăng nhập để kết bạn, chat riêng 1-1 và gửi lời thách đấu tỉ thí cờ tướng!
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md cursor-pointer"
                  >
                    Đăng nhập ngay
                  </button>
                </div>
              ) : selectedFriend ? (
                /* 1-1 Direct Conversation with Selected Friend */
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Direct Chat Top Bar */}
                  <div className="px-3.5 py-2 bg-[#12281d] border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedFriend(null)}
                        className="text-xs text-[#8ce8b1] hover:underline font-bold cursor-pointer"
                      >
                        ← Danh sách
                      </button>
                      <span className="text-stone-500">|</span>
                      {renderUserAvatar(selectedFriend.avatar, 'w-6 h-6', 'text-xs')}
                      <span className="text-xs font-bold text-white">
                        {selectedFriend.displayName || selectedFriend.username}
                      </span>
                    </div>

                    <button
                      onClick={() => onChallengeFriend?.(selectedFriend.username)}
                      title="Gửi lời thách đấu bàn cờ"
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-yellow-600 text-stone-950 text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow"
                    >
                      <Swords className="w-3 h-3" />
                      <span>Thách đấu</span>
                    </button>
                  </div>

                  {/* Direct Messages List */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {directMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-xs text-stone-400">
                        <MessageSquare className="w-8 h-8 text-stone-600 mb-2" />
                        <p>Bắt đầu cuộc trò chuyện riêng với {selectedFriend.username}!</p>
                      </div>
                    ) : (
                      directMessages.map((d, i) => {
                        const isMe = d.sender === currentUser.username;
                        return (
                          <div
                            key={i}
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                          >
                            <span className="text-[10px] text-stone-400 mb-0.5">
                              {isMe ? 'Bạn' : d.sender} • {formatTime(d.timestamp)}
                            </span>
                            <div
                              className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs leading-relaxed break-words ${
                                isMe
                                  ? 'bg-[#25593f] text-[#f4ead5] rounded-tr-xs border border-[#5ec485]/40'
                                  : 'bg-black/50 text-[#e5e0d3] rounded-tl-xs border border-white/10'
                              }`}
                            >
                              {d.message}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={directChatEndRef} />
                  </div>

                  {/* Direct Message Input */}
                  <form
                    onSubmit={handleSendDirect}
                    className="p-2.5 bg-[#142d20] border-t border-[#848156]/30 flex items-center gap-2"
                  >
                    <input
                      ref={directInputRef}
                      type="text"
                      value={directChatInput}
                      onChange={(e) => setDirectChatInput(e.target.value)}
                      placeholder={`Nhắn riêng cho ${selectedFriend.username}...`}
                      className="flex-1 px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#5ec485]"
                    />
                    <button
                      type="submit"
                      disabled={!directChatInput.trim() || directChatSending}
                      className="p-2 rounded-xl bg-[#25593f] hover:bg-[#2f6f4f] disabled:opacity-40 text-white cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                /* Friends List View */
                <div className="flex-1 flex flex-col min-h-0 p-3 space-y-3 overflow-y-auto">
                  {/* Add Friend Input */}
                  <form onSubmit={handleAddFriend} className="flex gap-2">
                    <input
                      type="text"
                      value={friendUsernameInput}
                      onChange={(e) => setFriendUsernameInput(e.target.value)}
                      placeholder="Nhập tên tài khoản bạn bè..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-[#5ec485]"
                    />
                    <button
                      type="submit"
                      disabled={friendLoading || !friendUsernameInput.trim()}
                      className="px-3 py-1.5 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] disabled:opacity-40 text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </button>
                  </form>

                  {friendMsg && (
                    <div
                      className={`text-xs px-3 py-1.5 rounded-xl ${
                        friendMsg.type === 'success'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : 'bg-red-950 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {friendMsg.text}
                    </div>
                  )}

                  {/* Friends List */}
                  <div className="space-y-2 flex-1">
                    {friends.length === 0 ? (
                      <div className="py-8 text-center text-xs text-stone-400">
                        <UserCheck className="w-8 h-8 text-stone-600 mx-auto mb-2" />
                        <p>Bạn chưa có bạn bè nào trong danh sách.</p>
                        <p className="text-[11px] text-stone-500 mt-1">
                          Nhập tên tài khoản ở trên để kết bạn cùng tỉ thí cờ nhé!
                        </p>
                      </div>
                    ) : (
                      friends.map((f, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-2xl bg-black/35 border border-white/10 hover:border-white/20 transition flex items-center justify-between gap-2"
                        >
                          <div
                            onClick={() => setSelectedFriend(f)}
                            className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                          >
                            {renderUserAvatar(f.avatar, 'w-9 h-9', 'text-sm')}
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-white truncate">
                                {f.displayName || f.username}
                              </div>
                              <div className="text-[10px] text-stone-400 font-mono">
                                @{f.username}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setSelectedFriend(f)}
                              title="Nhắn tin riêng"
                              className="p-1.5 rounded-lg bg-[#25593f] hover:bg-[#2e6d4e] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span className="text-[10px]">Chat</span>
                            </button>

                            <button
                              onClick={() => onChallengeFriend?.(f.username)}
                              title="Thách đấu"
                              className="p-1.5 rounded-lg bg-[#92400e] hover:bg-[#b45309] text-[#fef3c7] text-xs font-semibold cursor-pointer"
                            >
                              <Swords className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleRemoveFriend(f.username)}
                              title="Hủy kết bạn"
                              className="p-1.5 rounded-lg text-red-400 hover:text-red-200 hover:bg-red-950/40 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
