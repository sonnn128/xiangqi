import React, { useEffect, useRef, useState } from 'react';
import {
  Coins,
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
  postDirectMessage,
  removeFriend,
} from '../services/onlineService.js';

export function FriendsChatModal({
  isOpen,
  onClose,
  currentUser,
  onOpenAuth,
  onChallengeFriend,
}) {
  const [activeTab, setActiveTab] = useState('friends'); // 'friends', 'chat'
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [friendUsernameInput, setFriendUsernameInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Direct Chat State
  const [directMessages, setDirectMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef(null);

  // Load friend list
  const loadFriends = () => {
    if (!currentUser?.username) return;
    fetchFriends(currentUser.username)
      .then((data) => setFriends(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen && currentUser?.username) {
      loadFriends();
    }
  }, [isOpen, currentUser?.username]);

  // Load direct conversation when friend selected
  useEffect(() => {
    if (selectedFriend && currentUser?.username) {
      fetchDirectChat(currentUser.username, selectedFriend.username)
        .then((data) => setDirectMessages(data || []))
        .catch(() => {});
    } else {
      setDirectMessages([]);
    }
  }, [selectedFriend, currentUser?.username]);

  // Auto-scroll direct chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [directMessages.length, activeTab]);

  // Listen to incoming direct messages via websocket event
  useEffect(() => {
    const handleDirectMessage = (e) => {
      const msg = e.detail;
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
    };

    const handleFriendUpdate = () => {
      loadFriends();
    };

    window.addEventListener('xiangqi_direct_chat', handleDirectMessage);
    window.addEventListener('xiangqi_friend_update', handleFriendUpdate);
    return () => {
      window.removeEventListener('xiangqi_direct_chat', handleDirectMessage);
      window.removeEventListener('xiangqi_friend_update', handleFriendUpdate);
    };
  }, [selectedFriend]);

  if (!isOpen) return null;

  const handleAddFriend = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.();
      return;
    }
    const target = friendUsernameInput.trim();
    if (!target) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await addFriend(currentUser.username, target);
      setSuccessMsg(`Đã kết bạn với ${target} thành công! 🎉`);
      setFriendUsernameInput('');
      loadFriends();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể kết bạn, vui lòng kiểm tra lại tên tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendName) => {
    if (!confirm(`Bạn có chắc muốn hủy kết bạn với ${friendName}?`)) return;
    try {
      await removeFriend(currentUser.username, friendName);
      loadFriends();
      if (selectedFriend?.username === friendName) {
        setSelectedFriend(null);
        setActiveTab('friends');
      }
    } catch {
      // ignore
    }
  };

  const handleSendDirectMessage = async (e) => {
    if (e) e.preventDefault();
    const text = chatInput.trim();
    if (!text || !selectedFriend || chatSending) return;

    setChatSending(true);
    try {
      const saved = await postDirectMessage(
        currentUser.username,
        selectedFriend.username,
        text
      );
      setChatInput('');
      if (saved) {
        setDirectMessages((prev) => [...prev, saved]);
      }
    } catch {
      // ignore
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in text-[#f3ead8]">
      <div className="relative w-full max-w-2xl h-[560px] rounded-3xl bg-[#112319] border border-[#848156]/40 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#142d20] border-b border-[#848156]/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center text-white shadow">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-xl font-bold tracking-wide text-[#fef3c7]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                KỲ HỮU TRI KỶ • BẠN BÈ
              </h2>
              <p className="text-xs text-[#9ec4ae]">
                Kết bạn, trò chuyện riêng 1-1 và thách đấu kỳ thủ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 pb-2 bg-[#0e1f16] border-b border-white/5 flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('friends')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-[#25593f] text-white border border-[#5ec485]/40 shadow'
                : 'text-[#c2baa3] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Danh Sách Bạn Bè ({friends.length})</span>
          </button>

          {selectedFriend && (
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'chat'
                  ? 'bg-[#25593f] text-white border border-[#5ec485]/40 shadow'
                  : 'text-[#c2baa3] hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Chat Với {selectedFriend.username}</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!currentUser ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-xs text-[#8fa195]">
              <UserPlus className="w-12 h-12 text-[#5ec485]/30 mb-2" />
              <p className="text-sm font-bold text-[#fef3c7]">
                Đăng nhập để kết bạn và nhắn tin riêng
              </p>
              <p className="mt-1 text-[#7d8f83]">
                Mỗi tài khoản đăng ký mới nhận ngay 20.000 xu khởi nghiệp!
              </p>
              <button
                onClick={onOpenAuth}
                className="mt-4 px-4 py-2 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] text-white font-bold transition cursor-pointer"
              >
                Đăng Nhập / Đăng Ký
              </button>
            </div>
          ) : activeTab === 'friends' ? (
            /* TAB 1: FRIENDS LIST */
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-4">
              {/* Add Friend Form */}
              <form
                onSubmit={handleAddFriend}
                className="p-3 rounded-2xl bg-black/35 border border-white/10 flex flex-col gap-2"
              >
                <div className="text-xs font-bold text-[#c2baa3] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Thêm bạn bè mới:</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendUsernameInput}
                    onChange={(e) => setFriendUsernameInput(e.target.value)}
                    placeholder="Nhập tên tài khoản kỳ thủ muốn kết bạn..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#38bdf8]"
                  />
                  <button
                    type="submit"
                    disabled={loading || !friendUsernameInput.trim()}
                    className="px-4 py-2 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-xs font-bold text-white transition cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Đang gửi...' : 'Kết Bạn'}
                  </button>
                </div>
                {errorMsg && (
                  <p className="text-[11px] text-red-300">{errorMsg}</p>
                )}
                {successMsg && (
                  <p className="text-[11px] text-emerald-300">{successMsg}</p>
                )}
              </form>

              {/* Friends List */}
              <div className="flex-1 flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae]">
                  Bạn bè của bạn ({friends.length})
                </span>

                {friends.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-[#8fa195]">
                    <Users className="w-10 h-10 text-[#5ec485]/30 mb-2" />
                    <p className="text-sm font-semibold text-[#f3ead8]">
                      Bạn chưa có người bạn nào
                    </p>
                    <p className="text-xs text-[#7d8f83] mt-1">
                      Hãy nhập tên tài khoản ở trên để kết bạn và cùng nhau so tài!
                    </p>
                  </div>
                ) : (
                  friends.map((f) => (
                    <div
                      key={f.username}
                      className="p-3 rounded-2xl bg-black/35 hover:bg-black/50 border border-white/10 hover:border-[#5ec485]/40 transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-[#edd3ae] to-[#a37941] flex items-center justify-center border border-[#ffdb9e]/60 shadow">
                          <span
                            className="text-base font-bold text-[#8b1810]"
                            style={{ fontFamily: "'LXGW WenKai TC', 'KaiTi', serif" }}
                          >
                            帥
                          </span>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>{f.username}</span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-[#fef08a] font-mono mt-0.5">
                            <Coins className="w-3 h-3 text-[#fbbf24]" />
                            <span>{f.coins?.toLocaleString('vi-VN')} xu</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedFriend(f);
                            setActiveTab('chat');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-[#1e3a2b] hover:bg-[#25593f] text-[#8ce8b1] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#38bdf8]" />
                          <span>Chat</span>
                        </button>
                        <button
                          onClick={() => {
                            onClose();
                            onChallengeFriend?.(f.username);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Swords className="w-3.5 h-3.5" />
                          <span>Thách đấu</span>
                        </button>
                        <button
                          onClick={() => handleRemoveFriend(f.username)}
                          title="Hủy kết bạn"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: DIRECT CHAT 1-1 */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Friend Info Bar */}
              <div className="px-4 py-2 bg-[#0c1a12] border-b border-white/5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-bold text-[#fef3c7]">
                    Đang trò chuyện với: <strong>{selectedFriend?.username}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onChallengeFriend?.(selectedFriend?.username);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#25593f] hover:bg-[#2f6f4f] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Swords className="w-3 h-3" />
                  <span>Mời vào bàn cờ</span>
                </button>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {directMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-xs text-[#8fa195]">
                    <Sparkles className="w-8 h-8 text-[#5ec485]/30 mb-2" />
                    <p>Chưa có tin nhắn nào với {selectedFriend?.username}.</p>
                    <p className="text-[11px] text-[#6f8276] mt-1">
                      Hãy gửi lời chào mở đầu câu chuyện nhé!
                    </p>
                  </div>
                ) : (
                  directMessages.map((m, idx) => {
                    const isMe = m.sender === currentUser.username;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="text-[10px] text-[#7d8f83] mb-0.5 px-1">
                          {isMe ? 'Bạn' : m.sender}
                        </div>
                        <div
                          className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                            isMe
                              ? 'bg-[#15803d] text-white rounded-tr-xs'
                              : 'bg-black/45 text-[#f3ead8] rounded-tl-xs border border-white/10'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <form
                onSubmit={handleSendDirectMessage}
                className="p-3 bg-[#142d20] border-t border-[#848156]/30 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder={`Gửi tin nhắn riêng tới ${selectedFriend?.username}...`}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-black/45 border border-white/15 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#38bdf8]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || chatSending}
                  className="p-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white disabled:opacity-40 transition cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

