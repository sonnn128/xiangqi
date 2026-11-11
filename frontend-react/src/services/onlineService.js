import { Client } from '@stomp/stompjs';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

// Auth API
export async function loginUser(username, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Đăng nhập thất bại');
  }
  return json.data;
}

export async function registerUser(username, password) {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Đăng ký thất bại');
  }
  return json;
}

export async function fetchUserCoins(username) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/xiangqi/coins?username=${encodeURIComponent(username)}`);
    if (!res.ok) return 20000;
    const json = await res.json();
    return json.data ?? 20000;
  } catch {
    return 20000;
  }
}

export async function claimDailyBonus(username) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/daily-reward?username=${encodeURIComponent(username)}`, {
    method: 'POST',
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Không thể nhận xu');
  }
  return json.data;
}

export async function fetchProfile(username) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/profile?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Không thể tải thông tin cá nhân');
  const json = await res.json();
  return json.data;
}

export async function updateProfile({ username, displayName, birthDate, avatar }) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName, birthDate, avatar }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Cập nhật thất bại');
  }
  return json.data;
}

// Room & Game API
export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms`);
  if (!res.ok) throw new Error('Không thể tải danh sách phòng');
  const json = await res.json();
  return json.data || [];
}

export async function fetchRoomById(roomId) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${encodeURIComponent(roomId)}`);
  if (!res.ok) throw new Error('Không thể tìm thấy phòng');
  const json = await res.json();
  return json.data;
}

export async function createOnlineRoom(
  playerName,
  roomName,
  preferredSide = 'red',
  betCoins = 0,
  timeLimitSeconds = 600,
  moveTimeLimitSeconds = 60
) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerName,
      roomName,
      preferredSide,
      timeLimitSeconds,
      moveTimeLimitSeconds,
      betCoins,
    }),
  });
  if (!res.ok) throw new Error('Không thể tạo phòng');
  const json = await res.json();
  return json.data;
}

export async function quickMatchRoom(playerName, betCoins = 1000) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/quick-match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerName,
      betCoins,
    }),
  });
  if (!res.ok) throw new Error('Không thể tìm trận nhanh');
  const json = await res.json();
  return json.data;
}

export async function joinOnlineRoom(
  roomId,
  playerName,
  preferredSide = 'auto'
) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, preferredSide }),
  });
  if (!res.ok) throw new Error('Không thể vào phòng');
  const json = await res.json();
  return json.data;
}

export function leaveOnlineRoom(roomId, playerName) {
  return fetch(`${API_BASE}/api/v1/xiangqi/rooms/${encodeURIComponent(roomId)}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName }),
    keepalive: true,
  });
}

export async function kickOnlinePlayer(roomId, owner, targetPlayer) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${encodeURIComponent(roomId)}/kick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName: owner, targetPlayer }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Không thể đá người chơi');
  }
  return json.data;
}

export async function sendOnlineMove(roomId, payload) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Không thể gửi nước đi');
  const json = await res.json();
  return json.data;
}

export async function sendOnlineUndo(roomId) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/undo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error('Không thể hoàn tác');
  const json = await res.json();
  return json.data;
}

export async function sendOnlineReset(roomId) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/reset`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Không thể tạo ván mới');
  const json = await res.json();
  return json.data;
}

export async function sendOnlineReady(roomId, playerName, ready = true) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, ready }),
  });
  if (!res.ok) throw new Error('Không thể cập nhật trạng thái sẵn sàng');
  const json = await res.json();
  return json.data;
}

export async function resolveOnlineReadyTimeout(roomId) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/ready-timeout`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Không thể xử lý thời gian chuẩn bị');
  const json = await res.json();
  return json.data;
}

export async function sendOnlineFinish(roomId, winner, winReason) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winner, winReason }),
  });
  if (!res.ok) throw new Error('Không thể kết thúc ván cờ');
  const json = await res.json();
  return json.data;
}

export async function sendOnlineChat(roomId, playerName, message) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/rooms/${roomId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ playerName, message }),
  });
  if (!res.ok) throw new Error('Không thể gửi tin nhắn');
  const json = await res.json();
  return json.data;
}

// Global Chat API
export async function fetchGlobalChat() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/xiangqi/global-chat`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function postGlobalChat(sender, message, coins = 20000) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/global-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, message, coins }),
  });
  if (!res.ok) throw new Error('Không thể gửi chat thế giới');
  const json = await res.json();
  return json.data;
}

// Match History API
export async function fetchMatchHistory(username) {
  try {
    const url = username
      ? `${API_BASE}/api/v1/xiangqi/history?username=${encodeURIComponent(username)}`
      : `${API_BASE}/api/v1/xiangqi/history`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function fetchMatchDetails(matchId) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/history/${matchId}`);
  if (!res.ok) throw new Error('Không thể tải chi tiết ván cờ');
  const json = await res.json();
  return json.data;
}

// Friends API
export async function fetchFriends(username) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/xiangqi/friends?username=${encodeURIComponent(username)}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function addFriend(fromUser, toUser) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/friends/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fromUser, toUser }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || 'Không thể gửi kết bạn');
  }
  return json.data;
}

export async function removeFriend(user1, user2) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/friends/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user1, user2 }),
  });
  const json = await res.json();
  return json.data;
}

// Direct Chat API
export async function fetchDirectChat(user1, user2) {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/xiangqi/direct-chat?user1=${encodeURIComponent(
        user1
      )}&user2=${encodeURIComponent(user2)}`
    );
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function postDirectMessage(sender, recipient, message) {
  const res = await fetch(`${API_BASE}/api/v1/xiangqi/direct-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender, recipient, message }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error('Không thể gửi tin nhắn riêng');
  return json.data;
}

export function getWebSocketUrl() {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    const url = new URL(import.meta.env.VITE_API_BASE_URL);
    const wsProto = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProto}//${url.host}/ws-xiangqi`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws-xiangqi`;
  }
  return `ws://localhost:8081/ws-xiangqi`;
}

export function connectRoomWebSocket(
  roomId,
  onRoomUpdate,
  onRoomsListUpdate,
  onGlobalChatUpdate,
  username = null
) {
  const brokerURL = getWebSocketUrl();

  const client = new Client({
    brokerURL,
    reconnectDelay: 2500,
    onConnect: () => {
      if (roomId) {
        client.subscribe(`/topic/room/${roomId}`, (message) => {
          try {
            const data = JSON.parse(message.body);
            onRoomUpdate?.(data);
          } catch {
            // ignore
          }
        });
      }
      if (onRoomsListUpdate) {
        client.subscribe('/topic/rooms', (message) => {
          try {
            const list = JSON.parse(message.body);
            onRoomsListUpdate(list);
          } catch {
            // ignore
          }
        });
      }
      // Always subscribe to global chat
      client.subscribe('/topic/global-chat', (message) => {
        try {
          const msg = JSON.parse(message.body);
          onGlobalChatUpdate?.(msg);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('xiangqi_global_chat', { detail: msg })
            );
          }
        } catch {
          // ignore
        }
      });

      // Subscribe to private direct messages and friend updates if logged in
      if (username) {
        client.subscribe(`/topic/chat/direct/${username}`, (message) => {
          try {
            const msg = JSON.parse(message.body);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('xiangqi_direct_chat', { detail: msg })
              );
            }
          } catch {
            // ignore
          }
        });

        client.subscribe(`/topic/friends/${username}`, (message) => {
          try {
            const ev = JSON.parse(message.body);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(
                new CustomEvent('xiangqi_friend_update', { detail: ev })
              );
            }
          } catch {
            // ignore
          }
        });
      }
    },
  });

  client.activate();
  return () => {
    client.deactivate();
  };
}
