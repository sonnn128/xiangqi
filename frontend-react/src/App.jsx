import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ScenicBackground } from './components/ScenicBackground.jsx';
import { XiangqiBoard } from './components/XiangqiBoard.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { ProfileModal } from './components/ProfileModal.jsx';
import { ToastNotification } from './components/ToastNotification.jsx';
import { GlobalChatDrawer } from './components/GlobalChatDrawer.jsx';
import {
  BET_TIERS,
  QuickMatchModal,
} from './components/QuickMatchModal.jsx';
import { XiangqiLobby } from './components/XiangqiLobby.jsx';
import { MatchHistoryModal } from './components/MatchHistoryModal.jsx';
import { DuplicateTabModal } from './components/DuplicateTabModal.jsx';
import { TopNavBar } from './components/TopNavBar.jsx';
import { PlayerVersusBar } from './components/PlayerVersusBar.jsx';
import { GameActionBar } from './components/GameActionBar.jsx';
import { GameSidebar } from './components/GameSidebar.jsx';
import { useSingleTabSession } from './hooks/useSingleTabSession.js';
import OnlineReadyOverlay from './components/OnlineReadyOverlay.jsx';
import PostMatchOverlay from './components/PostMatchOverlay.jsx';
import { RoomChatDrawer } from './components/RoomChatDrawer.jsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.jsx';
import { BoardEditor } from './components/BoardEditor.jsx';
import {
  INITIAL_FEN,
  PIECE_CHARS,
  PUZZLE_PRESETS,
  SCREENSHOT_FEN,
  applyMove,
  getAllLegalMoves,
  getLegalMovesForSquare,
  getPositionKey,
  isInCheck,
  parseFen,
} from './engine/xiangqiEngine.js';
import { findBestMove } from './engine/aiEngine.js';
import { soundFX } from './utils/sound.js';
import {
  claimDailyBonus,
  connectRoomWebSocket,
  createOnlineRoom,
  fetchProfile,
  fetchRoomById,
  fetchRooms,
  fetchUserCoins,
  joinOnlineRoom,
  kickOnlinePlayer,
  leaveOnlineRoom,
  postDirectMessage,
  quickMatchRoom,
  sendOnlineFinish,
  sendOnlineMove,
  sendOnlineReady,
  sendOnlineReset,
  sendOnlineUndo,
  resolveOnlineReadyTimeout,
} from './services/onlineService.js';

const DIFFICULTY_LABELS = {
  1: 'Tập Sự (Dễ)',
  2: 'Kỳ Thủ (Vừa)',
  3: 'Cao Thủ (Khó)',
  4: 'Đại Sư (Rất Khó)',
};

const SLIDE_DURATION_MS = 460;

function formatCoinText(c) {
  if (!c && c !== 0) return '0 xu';
  if (c >= 1000000) return `${(c / 1000000).toFixed(c % 1000000 === 0 ? 0 : 1)}M xu`;
  if (c >= 1000) return `${Math.floor(c / 1000)}k xu`;
  return `${c} xu`;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [mode, setMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      if (p === '/ai') return 'ai';
      if (p === '/local') return 'local';
      if (p === '/puzzle') return 'puzzle';
      if (p === '/editor') return 'editor';
      if (p.startsWith('/online')) return 'online';
      if (p === '/' || p === '/lobby') return 'lobby';
    }
    return 'lobby';
  });
  const [zenMode, setZenMode] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [showViLabels, setShowViLabels] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [board, setBoard] = useState(() => parseFen(INITIAL_FEN).board);
  const [turn, setTurn] = useState('red');
  const [selectedPos, setSelectedPos] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);
  const [moveHistory, setMoveHistory] = useState([]);
  const [hintMove, setHintMove] = useState(null);
  const [animatingMove, setAnimatingMove] = useState(null);

  const [inCheckSide, setInCheckSide] = useState(null);
  const [winner, setWinner] = useState(null);
  const [winReason, setWinReason] = useState(null);

  const [aiDifficulty, setAiDifficulty] = useState(2);
  const [playerSide, setPlayerSide] = useState('red');
  const [aiThinking, setAiThinking] = useState(false);

  const [activePuzzle, setActivePuzzle] = useState(PUZZLE_PRESETS[0]);
  const [customFenInput, setCustomFenInput] = useState('');
  const [showPuzzleHint, setShowPuzzleHint] = useState(false);

  const [redTime, setRedTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [moveTime, setMoveTime] = useState(60);

  // User & Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('xiangqi_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userCoins, setUserCoins] = useState(() => {
    return currentUser?.coins ?? 20000;
  });

  const [playerName, setPlayerName] = useState(() => {
    return (
      currentUser?.displayName ||
      currentUser?.username ||
      localStorage.getItem('xiangqi_player_name') ||
      `Kỳ Hữu ${Math.floor(100 + Math.random() * 900)}`
    );
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showQuickMatchModal, setShowQuickMatchModal] = useState(false);
  const [quickMatchLoading, setQuickMatchLoading] = useState(false);
  const [roomActionLoading, setRoomActionLoading] = useState(null);
  const [joiningRoomId, setJoiningRoomId] = useState(null);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [isGlobalChatOpen, setIsGlobalChatOpen] = useState(false);
  const [chatInitialTab, setChatInitialTab] = useState('global');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [toast, setToast] = useState(null);
  const showToast = (toastData) => {
    setToast({ id: Date.now(), ...toastData });
  };

  // Multi-tab single active session enforcement via custom hook
  const { isDuplicateTab, claimActiveTab, setIsDuplicateTab } = useSingleTabSession(
    currentUser?.username
  );

  const handleReclaimTab = () => {
    claimActiveTab();
    if (currentRoom?.roomId) {
      fetchRoomDetails(currentRoom.roomId)
        .then((updated) => syncFromOnlineRoom(updated))
        .catch(() => { });
    }
  };

  const handleExitDuplicateTab = () => {
    setIsDuplicateTab(false);
    setCurrentRoom(null);
    setMode('lobby');
    navigate('/online');
  };

  const requireLogin = () => {
    if (currentUser) return true;

    showToast({
      type: 'warning',
      title: 'YÊU CẦU ĐĂNG NHẬP',
      message: 'Vui lòng đăng nhập trước khi bắt đầu chơi.',
      actionText: 'Đăng nhập ngay',
      onAction: () => setShowAuthModal(true),
    });
    setShowAuthModal(true);
    return false;
  };

  // Online Room State
  const [onlineRooms, setOnlineRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [myOnlineSide, setMyOnlineSide] = useState('red');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedRoomBet, setSelectedRoomBet] = useState(10000);
  const [chatMessages, setChatMessages] = useState([]);
  const [isRoomChatOpen, setIsRoomChatOpen] = useState(false);
  const [roomChatUnread, setRoomChatUnread] = useState(0);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [onlineError, setOnlineError] = useState(null);
  const [backendConnected, setBackendConnected] = useState(false);
  const autoResetRoomRef = useRef(null);
  const prevRoomStatusRef = useRef(currentRoom?.status);
  const [postMatchCountdown, setPostMatchCountdown] = useState(null);
  const postMatchTimerRef = useRef(null);

  const isLobbyView =
    (pathname === '/' ||
      pathname === '/lobby' ||
      (pathname === '/online' && !currentRoom) ||
      mode === 'lobby') &&
    pathname !== '/editor' &&
    mode !== 'editor';

  // Khi ở Sảnh chính (Lobby), không bao giờ lưu trạng thái kết thúc hay đếm ngược
  useEffect(() => {
    if (isLobbyView) {
      setWinner(null);
      setWinReason(null);
      setPostMatchCountdown(null);
      if (postMatchTimerRef.current) {
        clearInterval(postMatchTimerRef.current);
        postMatchTimerRef.current = null;
      }
    }
  }, [isLobbyView]);

  // Âm hiệu "XÈNH!" khi trận đấu bắt đầu (trạng thái phòng chuyển sang PLAYING)
  useEffect(() => {
    if (
      mode === 'online' &&
      currentRoom?.status === 'PLAYING' &&
      prevRoomStatusRef.current &&
      prevRoomStatusRef.current !== 'PLAYING'
    ) {
      soundFX.playBattleStart();
    }
    prevRoomStatusRef.current = currentRoom?.status;
  }, [mode, currentRoom?.status]);

  // Âm hiệu gõ cửa "Cốc... cốc!" khi có người vào bàn & "Cạch - cộc" khi người đi ra
  const prevPlayersRef = useRef({ roomId: null, redPlayer: null, blackPlayer: null });
  useEffect(() => {
    if (mode !== 'online' || !currentRoom) {
      if (prevPlayersRef.current.roomId) {
        soundFX.playDoorLeave();
      }
      prevPlayersRef.current = { roomId: null, redPlayer: null, blackPlayer: null };
      return;
    }

    const myName = currentUser?.username || playerName;
    const { roomId, redPlayer, blackPlayer } = currentRoom;
    const prev = prevPlayersRef.current;

    // Khi người chơi vừa vào phòng mới
    if (prev.roomId !== roomId) {
      soundFX.playDoorKnock();
    } else {
      // Khi đang ở trong phòng và có kỳ hữu khác vào bàn
      const redJoined = !prev.redPlayer && redPlayer && redPlayer !== myName;
      const blackJoined = !prev.blackPlayer && blackPlayer && blackPlayer !== myName;
      if (redJoined || blackJoined) {
        soundFX.playDoorKnock();
        const joinedName = redJoined ? redPlayer : blackPlayer;
        showToast({
          type: 'info',
          title: 'KỲ HỮU VÀO BÀN',
          message: `${joinedName} đã bước vào bàn đấu.`,
        });
      }

      // Khi đang ở trong phòng và có kỳ hữu rời bàn
      const redLeft = prev.redPlayer && !redPlayer && prev.redPlayer !== myName;
      const blackLeft = prev.blackPlayer && !blackPlayer && prev.blackPlayer !== myName;
      if (redLeft || blackLeft) {
        soundFX.playDoorLeave();
        const leftName = redLeft ? prev.redPlayer : prev.blackPlayer;
        showToast({
          type: 'warning',
          title: 'KỲ HỮU RỜI BÀN',
          message: `${leftName || 'Đối thủ'} đã rời khỏi bàn đấu.`,
        });
      }
    }

    prevPlayersRef.current = { roomId, redPlayer, blackPlayer };
  }, [mode, currentRoom?.roomId, currentRoom?.redPlayer, currentRoom?.blackPlayer, currentUser?.username, playerName]);


  // Persist user and player name
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('xiangqi_user', JSON.stringify(currentUser));
      setPlayerName(currentUser.username);
    } else {
      localStorage.removeItem('xiangqi_user');
      localStorage.setItem('xiangqi_player_name', playerName);
    }
  }, [currentUser, playerName]);

  // Sync user profile, stats & coins from backend when user is logged in
  useEffect(() => {
    if (currentUser?.username) {
      fetchProfile(currentUser.username)
        .then((profile) => {
          if (profile) {
            setUserCoins(profile.coins ?? 20000);
            setCurrentUser((prev) => ({
              ...(prev || {}),
              ...profile,
            }));
          }
        })
        .catch(() => {
          fetchUserCoins(currentUser.username)
            .then((c) => {
              setUserCoins(c);
              setCurrentUser((prev) => (prev ? { ...prev, coins: c } : null));
            })
            .catch(() => { });
        });
    }
  }, [currentUser?.username]);

  // Synchronize URL route with game mode and online rooms
  useEffect(() => {
    if (pathname === '/ai') {
      setMode('ai');
    } else if (pathname === '/local') {
      setMode('local');
    } else if (pathname === '/puzzle') {
      setMode('puzzle');
    } else if (pathname === '/editor') {
      setMode('editor');
    } else if (pathname === '/' || pathname === '/lobby') {
      setMode('lobby');
    } else if (pathname === '/online') {
      setMode('online');
    } else if (pathname.startsWith('/online/')) {
      setMode('online');
      const targetRoomId = pathname.slice('/online/'.length).trim();
      if (targetRoomId && currentRoom?.roomId !== targetRoomId) {
        const userToUse = currentUser?.username || playerName;
        joinOnlineRoom(targetRoomId, userToUse, 'auto')
          .then((room) => {
            const side =
              room.redPlayer === userToUse
                ? 'red'
                : room.blackPlayer === userToUse
                  ? 'black'
                  : 'spectator';
            setMyOnlineSide(side);
            setFlipped(side === 'black');
            syncFromOnlineRoom(room);
          })
          .catch(() => {
            fetchRoomById(targetRoomId)
              .then((room) => {
                setMyOnlineSide('spectator');
                setFlipped(false);
                syncFromOnlineRoom(room);
              })
              .catch(() => {
                setOnlineError('Phòng cờ không tồn tại hoặc đã đóng');
                navigate('/online', { replace: true });
              });
          });
      }
    }
  }, [pathname, currentUser?.username, playerName]);

  // Timer loop
  const moveTimeLimit = mode === 'online'
    ? Number(currentRoom?.moveTimeLimitSeconds) || 60
    : 60;

  useEffect(() => {
    setMoveTime(moveTimeLimit);
  }, [turn, moveTimeLimit]);

  useEffect(() => {
    if (winner) return;
    if (winner || isDuplicateTab) return;
    if (isLobbyView) return;
    if (mode === 'online' && currentRoom?.status !== 'PLAYING') return;
    if (mode === 'puzzle') return;

    const timer = setInterval(() => {
      if (turn === 'red') {
        setRedTime((prev) => {
          if (prev <= 1) {
            setWinner('black');
            setWinReason('Đỏ hết thời gian');
            return 0;
          }
          return prev - 1;
        });
        setMoveTime((prev) => {
          if (prev <= 1) {
            setWinner('black');
            setWinReason('Đỏ hết thời gian cho một nước');
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setWinner('red');
            setWinReason('Đen hết thời gian');
            return 0;
          }
          return prev - 1;
        });
        setMoveTime((prev) => {
          if (prev <= 1) {
            setWinner('red');
            setWinReason('Đen hết thời gian cho một nước');
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [turn, winner, mode, currentRoom?.status, moveTimeLimit, isLobbyView, isDuplicateTab]);

// Trigger AI move
useEffect(() => {
  if (winner || animatingMove) return;
  const isAiTurn =
    (mode === 'ai' && turn !== playerSide) ||
    (mode === 'puzzle' && turn === 'black');

  if (!isAiTurn) return;

  setAiThinking(true);
  const timeout = setTimeout(() => {
    const best = findBestMove(
      board,
      turn,
      mode === 'puzzle' ? 3 : aiDifficulty
    );
    setAiThinking(false);
    if (best) {
      executeMove(best.from, best.to, false);
    } else {
      const winSide = turn === 'red' ? 'black' : 'red';
      setWinner(winSide);
      setWinReason('Chiếu bí / Hết nước đi');
      soundFX.playVictory();
    }
  }, 450);

  return () => clearTimeout(timeout);
}, [board, turn, mode, playerSide, winner, aiDifficulty, animatingMove]);

const refreshRooms = async () => {
  setRoomsLoading(true);
  try {
    const list = await fetchRooms();
    setOnlineRooms(list);
    setBackendConnected(true);
    setOnlineError(null);
  } catch {
    setBackendConnected(false);
  } finally {
    setRoomsLoading(false);
  }
};

// WebSocket connection: maintains room sync and global chat events
useEffect(() => {
  if (isDuplicateTab) return undefined;

  refreshRooms();

  const disconnect = connectRoomWebSocket(
    currentRoom?.roomId || '',
    (updatedRoom) => {
      syncFromOnlineRoom(updatedRoom);
    },
    (roomsList) => {
      setOnlineRooms(roomsList);
      setBackendConnected(true);
      setRoomsLoading(false);
    },
    (globalMsg) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('xiangqi_global_chat', { detail: globalMsg })
        );
      }
    },
    currentUser?.username || null
  );

    return () => {
      disconnect();
    };
  }, [currentRoom?.roomId, currentUser?.username, isDuplicateTab]);

  useEffect(() => {
    if (!currentRoom?.roomId || currentRoom.status !== 'WAITING' || !currentUser?.username || isDuplicateTab) {
      return undefined;
    }

    const handlePageExit = () => {
      if (isDuplicateTab) return;
      leaveOnlineRoom(currentRoom.roomId, currentUser.username).catch(() => {});
    };

    window.addEventListener('beforeunload', handlePageExit);
    return () => window.removeEventListener('beforeunload', handlePageExit);
  }, [currentRoom?.roomId, currentRoom?.status, currentUser?.username, isDuplicateTab]);

const syncFromOnlineRoom = (room) => {
  if (!room) return;

  const username = currentUser?.username || playerName;
  const wasParticipant =
    currentRoom &&
    (currentRoom.redPlayer === username || currentRoom.blackPlayer === username);
  const isStillParticipant =
    room.redPlayer === username || room.blackPlayer === username;

  if (mode === 'online' && wasParticipant && !isStillParticipant) {
    setCurrentRoom(null);
    setMode('lobby');
    navigate('/online');
    showToast({
      type: 'warning',
      title: 'ĐÃ RỜI KHỎI BÀN',
      message: 'Bạn chưa sẵn sàng đúng hạn nên đã được đưa ra khỏi bàn.',
    });
    return;
  }

  setCurrentRoom(room);
  const mySide =
    room.redPlayer === username
      ? 'red'
      : room.blackPlayer === username
        ? 'black'
        : 'spectator';
  setMyOnlineSide(mySide);
  setFlipped(mySide === 'black');

  const roomTimeLimit = Number(room?.timeLimitSeconds) || 600;
  const isRoomInit =
    !currentRoom ||
    currentRoom.roomId !== room.roomId ||
    room.status === 'WAITING' ||
    (room.moveHistoryJson === '[]' && room.status !== 'PLAYING');

  if (isRoomInit) {
    setRedTime(room.redTimeRemaining != null ? Number(room.redTimeRemaining) : roomTimeLimit);
    setBlackTime(room.blackTimeRemaining != null ? Number(room.blackTimeRemaining) : roomTimeLimit);
  } else {
    if (typeof room.redTimeRemaining === 'number') {
      setRedTime(Number(room.redTimeRemaining));
    }
    if (typeof room.blackTimeRemaining === 'number') {
      setBlackTime(Number(room.blackTimeRemaining));
    }
  }
  if (room?.roomId && !window.location.pathname.includes(room.roomId)) {
    navigate(`/online/${room.roomId}`, { replace: true });
  }
  const parsed = parseFen(room.fen || INITIAL_FEN);
  let remoteMove = null;
  try {
    const incomingMoves = JSON.parse(room.moveHistoryJson || '[]');
    const previousMoves = currentRoom?.roomId === room.roomId
      ? JSON.parse(currentRoom.moveHistoryJson || '[]')
      : [];
    const latestMove = incomingMoves[incomingMoves.length - 1];
    if (
      currentRoom?.roomId === room.roomId &&
      incomingMoves.length > previousMoves.length &&
      latestMove &&
      (myOnlineSide === 'spectator' || latestMove.side !== myOnlineSide)
    ) {
      remoteMove = {
        from: { row: Number(latestMove.fromRow), col: Number(latestMove.fromCol) },
        to: { row: Number(latestMove.toRow), col: Number(latestMove.toCol) },
        piece: {
          type: String(latestMove.piece || 'p').toLowerCase(),
          side: latestMove.side || 'red',
        },
        captured: latestMove.captured
          ? { type: String(latestMove.captured).toLowerCase(), side: latestMove.side === 'red' ? 'black' : 'red' }
          : null,
      };
    }
  } catch {
    remoteMove = null;
  }

  setBoard(parsed.board);
  setTurn(room.currentTurn || parsed.turn);
  if (remoteMove) {
    setAnimatingMove(remoteMove);
    soundFX.playSlide();
    setTimeout(() => {
      setAnimatingMove(null);
      soundFX.playMove();
    }, SLIDE_DURATION_MS);
  }
  setSelectedPos(null);
  setLegalMoves([]);

  if (room.winner) {
    setWinner(room.winner);
    setWinReason(room.winReason || 'Kết thúc');

    // Refresh coins if bet was active
    if (room.betCoins && room.betCoins > 0 && currentUser?.username) {
      setTimeout(() => {
        fetchUserCoins(currentUser.username).then((c) => {
          setUserCoins(c);
          setCurrentUser((prev) => (prev ? { ...prev, coins: c } : null));
        });
      }, 800);
    }
  } else {
    setWinner(null);
    setWinReason(null);
  }

  try {
    const rawMoves = JSON.parse(room.moveHistoryJson || '[]');
    const mappedMoves = rawMoves.map((m) => ({
      from: { row: Number(m.fromRow), col: Number(m.fromCol) },
      to: { row: Number(m.toRow), col: Number(m.toCol) },
      piece: {
        type: String(m.piece || 'p').toLowerCase(),
        side: m.side || 'red',
      },
      captured: m.captured
        ? {
          type: String(m.captured).toLowerCase(),
          side: m.side === 'red' ? 'black' : 'red',
        }
        : null,
      notation: String(m.notation || ''),
      fenBefore: String(m.fenBefore || INITIAL_FEN),
      fenAfter: String(m.fenAfter || room.fen),
    }));
    setMoveHistory(mappedMoves);
  } catch {
    setMoveHistory([]);
  }

  try {
    const rawChats = JSON.parse(room.chatHistoryJson || '[]');
    const previousChats = currentRoom?.roomId === room.roomId
      ? JSON.parse(currentRoom.chatHistoryJson || '[]')
      : [];
    if (
      currentRoom?.roomId === room.roomId &&
      rawChats.length > previousChats.length &&
      !isRoomChatOpen &&
      rawChats[rawChats.length - 1]?.sender !== (currentUser?.username || playerName)
    ) {
      setRoomChatUnread((count) => count + (rawChats.length - previousChats.length));
    }
    setChatMessages(rawChats);
  } catch {
    setChatMessages([]);
  }

  if (isInCheck(parsed.board, 'red')) {
    setInCheckSide('red');
  } else if (isInCheck(parsed.board, 'black')) {
    setInCheckSide('black');
  } else {
    setInCheckSide(null);
  }
};

const loadBoardFromFen = (fen, customLastMove = null) => {
  const { board: newBoard, turn: newTurn } = parseFen(fen);
  setBoard(newBoard);
  setTurn(newTurn);
  setSelectedPos(null);
  setLegalMoves([]);
  setMoveHistory(customLastMove ? [customLastMove] : []);
  setHintMove(null);
  setAnimatingMove(null);
  setWinner(null);
  setWinReason(null);
  setInCheckSide(
    isInCheck(newBoard, 'red')
      ? 'red'
      : isInCheck(newBoard, 'black')
        ? 'black'
        : null
  );
  setRedTime(600);
  setBlackTime(600);
};

const handlePlayCustomFenWithAi = (customFen, startingTurn = 'red') => {
  loadBoardFromFen(customFen);
  setTurn(startingTurn);
  setPlayerSide(startingTurn);
  setFlipped(startingTurn === 'black');
  setMode('ai');
  navigate('/ai');
  soundFX.playBattleStart();
  showToast({
    type: 'info',
    title: 'LUYỆN TẬP CỜ THẾ VỚI BOT',
    message: `Đã nạp thế cờ tùy chỉnh. Bạn cầm quân ${startingTurn === 'red' ? 'ĐỎ' : 'ĐEN'}.`,
  });
};

const loadScreenshotDemo = () => {
  const { board: newBoard } = parseFen(SCREENSHOT_FEN);
  const demoMove = {
    from: { row: 0, col: 8 },
    to: { row: 0, col: 7 },
    piece: { type: 'r', side: 'black' },
    captured: null,
    notation: 'Xe 9 bình 8',
    fenBefore: INITIAL_FEN,
    fenAfter: SCREENSHOT_FEN,
  };
  setBoard(newBoard);
  setTurn('red');
  setMoveHistory([
    {
      from: { row: 7, col: 7 },
      to: { row: 7, col: 4 },
      piece: { type: 'c', side: 'red' },
      captured: null,
      notation: 'Pháo 2 bình 5',
      fenBefore: INITIAL_FEN,
      fenAfter: SCREENSHOT_FEN,
    },
    {
      from: { row: 0, col: 7 },
      to: { row: 2, col: 5 },
      piece: { type: 'n', side: 'black' },
      captured: null,
      notation: 'Mã 8 tiến 7',
      fenBefore: INITIAL_FEN,
      fenAfter: SCREENSHOT_FEN,
    },
    {
      from: { row: 9, col: 7 },
      to: { row: 7, col: 5 },
      piece: { type: 'n', side: 'red' },
      captured: null,
      notation: 'Mã 2 tiến 3',
      fenBefore: INITIAL_FEN,
      fenAfter: SCREENSHOT_FEN,
    },
    demoMove,
  ]);
  setAnimatingMove({
    from: { row: 0, col: 8 },
    to: { row: 0, col: 7 },
    piece: { type: 'r', side: 'black' },
    captured: null,
  });
  soundFX.playSlide();
  setTimeout(() => {
    setAnimatingMove(null);
    soundFX.playMove();
  }, SLIDE_DURATION_MS);
  setSelectedPos(null);
  setLegalMoves([]);
  setWinner(null);
  setWinReason(null);
};

const executeMove = async (from, to, isLocalUserAction = true) => {
  const movingPiece = board[from.row][from.col];
  if (!movingPiece) return;

  const { nextBoard, nextTurn, move } = applyMove(
    board,
    from,
    to,
    moveHistory.length + 1
  );

  // Start smooth gliding animation & motion sound (Phần 2: Cờ trong quá trình đi đến đích)
  setAnimatingMove({
    from,
    to,
    piece: movingPiece,
    captured: move.captured,
  });
  soundFX.playSlide();
  setInCheckSide(null);

  setBoard(nextBoard);
  setTurn(nextTurn);
  setSelectedPos(null);
  setLegalMoves([]);
  setHintMove(null);
  setMoveHistory((prev) => [...prev, move]);

  const nextInCheck = isInCheck(nextBoard, nextTurn);
  const remainingMoves = getAllLegalMoves(nextBoard, nextTurn);
  let detectedWinner = null;
  let detectedReason = null;

  const normalizeFen = (fen) => String(fen || '').trim().split(/\s+/).slice(0, 2).join(' ');
  const initialPosition = moveHistory[0]?.fenBefore
    ? normalizeFen(moveHistory[0].fenBefore)
    : getPositionKey(board, turn);
  const positionHistory = [
    initialPosition,
    ...moveHistory.map((historyMove) => normalizeFen(historyMove.fenAfter)),
  ];
  const nextPosition = getPositionKey(nextBoard, nextTurn);
  const repetitionCount = positionHistory.filter((key) => key === nextPosition).length + 1;

  if (remainingMoves.length === 0) {
    detectedWinner = movingPiece.side;
    detectedReason = nextInCheck
      ? 'Chiếu bí (Tuyệt sát)'
      : 'Vây bí (Hết nước đi)';
  } else if (repetitionCount >= 3) {
    detectedWinner = 'draw';
    detectedReason = 'Hòa do lặp lại thế cờ 3 lần (chiếu liên tục)';
  }

  // Play landing sound & show check/victory
  setTimeout(() => {
    setAnimatingMove(null);
    setInCheckSide(nextInCheck ? nextTurn : null);

    if (detectedWinner) {
      setWinner(detectedWinner);
      setWinReason(detectedReason);
      if (/tuyệt|sát|chiếu bí/i.test(detectedReason || '')) {
        soundFX.playCheck();
      } else {
        soundFX.playVictory();
      }
    } else if (nextInCheck) {
      soundFX.playCheck();
    } else if (move.captured) {
      soundFX.playCapture();
    } else {
      soundFX.playMove();
    }
  }, SLIDE_DURATION_MS);

  if (mode === 'online' && currentRoom && isLocalUserAction) {
    try {
      const updated = await sendOnlineMove(currentRoom.roomId, {
        player: currentUser?.username || playerName,
        side: movingPiece.side,
        fromRow: from.row,
        fromCol: from.col,
        toRow: to.row,
        toCol: to.col,
        piece: movingPiece.type,
        captured: move.captured ? move.captured.type : null,
        notation: move.notation,
        nextFen: move.fenAfter,
        nextTurn,
        winner: detectedWinner,
        winReason: detectedReason,
        redTimeRemaining: redTime,
        blackTimeRemaining: blackTime,
      });
      syncFromOnlineRoom(updated);
    } catch {
      setOnlineError('Không thể đồng bộ nước đi tới máy chủ');
    }
  }
};

const handleSquareClick = (r, c) => {
  if (winner || aiThinking || animatingMove) return;
  if (mode === 'ai' && turn !== playerSide) return;
  if (mode === 'online' && currentRoom) {
    if (currentRoom.status !== 'PLAYING') return;
    if (myOnlineSide === 'spectator') return;
    if (turn !== myOnlineSide) return;
  }

  const clickedPiece = board[r][c];

  if (
    selectedPos &&
    legalMoves.some((m) => m.row === r && m.col === c)
  ) {
    executeMove(selectedPos, { row: r, col: c }, true);
    return;
  }

  if (clickedPiece && clickedPiece.side === turn) {
    soundFX.playSelect();
    if (selectedPos?.row === r && selectedPos?.col === c) {
      setSelectedPos(null);
      setLegalMoves([]);
    } else {
      const valid = getLegalMovesForSquare(board, r, c);
      setSelectedPos({ row: r, col: c });
      setLegalMoves(valid);
    }
    return;
  }

  if (clickedPiece) {
    soundFX.playSelect();
  }
  setSelectedPos(null);
  setLegalMoves([]);
};

const handleUndo = async () => {
  if (animatingMove) return;
  if (mode === 'online' && currentRoom) {
    const updated = await sendOnlineUndo(currentRoom.roomId);
    syncFromOnlineRoom(updated);
    return;
  }

  if (moveHistory.length === 0) return;
  const stepsBack =
    mode === 'ai' && turn === playerSide && moveHistory.length >= 2 ? 2 : 1;
  const targetIdx = moveHistory.length - stepsBack;
  const targetMove = moveHistory[targetIdx];

  const { board: restoredBoard, turn: restoredTurn } = parseFen(
    targetMove.fenBefore
  );
  setBoard(restoredBoard);
  setTurn(restoredTurn);
  setMoveHistory((prev) => prev.slice(0, targetIdx));
  setSelectedPos(null);
  setLegalMoves([]);
  setWinner(null);
  setWinReason(null);
  setHintMove(null);
  setInCheckSide(
    isInCheck(restoredBoard, 'red')
      ? 'red'
      : isInCheck(restoredBoard, 'black')
        ? 'black'
        : null
  );
};

const handleHint = () => {
  if (winner || animatingMove) return;
  const best = findBestMove(board, turn, 3);
  if (best) {
    setHintMove(best);
    setSelectedPos(best.from);
    setLegalMoves(getLegalMovesForSquare(board, best.from.row, best.from.col));
    soundFX.playSelect();
  }
};

const handleInviteFriend = async () => {
  soundFX.playSelect();
  const roomId = currentRoom?.roomId;
  if (!roomId) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Cờ Tướng - Mời Bạn Vào Bàn Đấu',
        text: `Vào tỉ thí Cờ Tướng cùng mình nhé! Mã phòng: ${roomId}`,
        url: `${window.location.origin}/online/${roomId}`,
      });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  navigator.clipboard.writeText(roomId);
  showToast({
    type: 'success',
    title: 'ĐÃ SAO CHÉP MÃ PHÒNG',
    message: `Đã sao chép mã phòng: ${roomId}. Hãy gửi mã này cho bạn bè để cùng vào tỉ thí!`,
  });
};

const handleNewGame = async () => {
  if (mode === 'online' && currentRoom) {
    const updated = await sendOnlineReset(currentRoom.roomId);
    syncFromOnlineRoom(updated);
    return;
  }
  soundFX.playBattleStart();
  if (mode === 'puzzle') {
    loadBoardFromFen(activePuzzle.fen);
    return;
  }
  if (mode === 'ai' || mode === 'local') {
    const nextSide = playerSide === 'red' ? 'black' : 'red';
    setPlayerSide(nextSide);
    setFlipped(nextSide === 'black');
  }
  loadBoardFromFen(INITIAL_FEN);
};

const handleAutoNewGame = async () => {
  if (postMatchTimerRef.current) {
    clearInterval(postMatchTimerRef.current);
    postMatchTimerRef.current = null;
  }
  setPostMatchCountdown(null);

  if (mode === 'online' && currentRoom?.roomId) {
    try {
      const updated = await sendOnlineReset(currentRoom.roomId);
      syncFromOnlineRoom(updated);
    } catch (err) {
      console.error('Failed to reset online room:', err);
    }
    return;
  }
  handleNewGame();
};

const handleInstantNewGame = () => {
  soundFX.playSelect();
  handleAutoNewGame();
};

const handlePostMatchLeave = async () => {
  if (postMatchTimerRef.current) {
    clearInterval(postMatchTimerRef.current);
    postMatchTimerRef.current = null;
  }
  setPostMatchCountdown(null);
  if (currentRoom?.roomId && (currentUser?.username || playerName)) {
    try {
      await leaveOnlineRoom(currentRoom.roomId, currentUser?.username || playerName);
    } catch { }
  }
  setCurrentRoom(null);
  setMode('lobby');
  navigate('/online');
};

const handleContinueWaitingInRoom = async () => {
  if (postMatchTimerRef.current) {
    clearInterval(postMatchTimerRef.current);
    postMatchTimerRef.current = null;
  }
  setPostMatchCountdown(null);
  setWinner(null);
  setWinReason(null);
  if (mode === 'online' && currentRoom?.roomId) {
    try {
      const resetRoom = await sendOnlineReset(currentRoom.roomId);
      syncFromOnlineRoom(resetRoom);
    } catch (err) {
      console.error('Failed to reset room to waiting:', err);
    }
  } else {
    handleNewGame();
  }
};

// 20-giây đếm ngược khi ván cờ kết thúc: CHỈ xuất hiện khi có đủ 2 người trong phòng!
// Nếu có người rời bàn, chỉ còn 1 người, hoặc đang ở sảnh -> HỦY đếm ngược ngay lập tức
  // 20-giây đếm ngược khi ván cờ kết thúc: CHỈ xuất hiện khi có đủ 2 người trong phòng!
  // Nếu có người rời bàn, chỉ còn 1 người, hoặc đang ở sảnh, hoặc tab bị duplicate -> HỦY đếm ngược ngay lập tức
  useEffect(() => {
    if (!winner || isLobbyView || isDuplicateTab) {
      setPostMatchCountdown(null);
      if (postMatchTimerRef.current) {
        clearInterval(postMatchTimerRef.current);
        postMatchTimerRef.current = null;
      }
      return;
    }

    // Ở chế độ Online: CHỈ đếm ngược nếu phòng có đủ cả 2 người chơi!
    if (mode === 'online') {
      const hasTwo = Boolean(currentRoom?.redPlayer && currentRoom?.blackPlayer);
      if (!hasTwo) {
        setPostMatchCountdown(null);
        if (postMatchTimerRef.current) {
          clearInterval(postMatchTimerRef.current);
          postMatchTimerRef.current = null;
        }
        return;
      }
    }

    setPostMatchCountdown(20);

    if (postMatchTimerRef.current) {
      clearInterval(postMatchTimerRef.current);
    }

    postMatchTimerRef.current = setInterval(() => {
      setPostMatchCountdown((prev) => {
        if (prev === null) return null;
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(postMatchTimerRef.current);
          postMatchTimerRef.current = null;
          handleAutoNewGame();
          return 0;
        }
        // Âm thanh "tụt tụt" theo từng giây đếm ngược
        soundFX.playCountdownTick();
        return next;
      });
    }, 1000);

    return () => {
      if (postMatchTimerRef.current) {
        clearInterval(postMatchTimerRef.current);
        postMatchTimerRef.current = null;
      }
    };
  }, [winner, mode, currentRoom?.roomId, currentRoom?.redPlayer, currentRoom?.blackPlayer, isLobbyView, isDuplicateTab]);

const handleSetOnlineReady = async (ready) => {
  if (!currentRoom) return;
  try {
    const updated = await sendOnlineReady(
      currentRoom.roomId,
      currentUser?.username || playerName,
      ready
    );
    syncFromOnlineRoom(updated);
  } catch (err) {
    showToast({
      type: 'error',
      title: 'LỖI SẴN SÀNG',
      message: err.message || 'Không thể cập nhật trạng thái sẵn sàng.',
    });
  }
};

const handleReadyTimeout = async () => {
  if (!currentRoom) return;

  const roomId = currentRoom.roomId;
  const username = currentUser?.username || playerName;
  const wasParticipant =
    currentRoom.redPlayer === username || currentRoom.blackPlayer === username;

  try {
    const updated = await resolveOnlineReadyTimeout(roomId);
    const isStillParticipant =
      updated.redPlayer === username || updated.blackPlayer === username;

    if (wasParticipant && !isStillParticipant) {
      setCurrentRoom(null);
      setMode('lobby');
      navigate('/online');
      showToast({
        type: 'warning',
        title: 'ĐÃ RỜI KHỎI BÀN',
        message: 'Bạn chưa sẵn sàng đúng hạn nên đã được đưa ra khỏi bàn.',
      });
      return;
    }

    syncFromOnlineRoom(updated);
  } catch (err) {
    showToast({
      type: 'error',
      title: 'LỖI XỬ LÝ SẴN SÀNG',
      message: err.message || 'Không thể xử lý thời gian chuẩn bị.',
    });
  }
};

const performExitRoom = async () => {
  const room = currentRoom;
  const userToLeave = currentUser?.username || playerName;
  setRoomActionLoading('Đang rời bàn cờ...');
  try {
    if (room?.status === 'PLAYING' && myOnlineSide !== 'spectator') {
      const winner = myOnlineSide === 'red' ? 'black' : 'red';
      try {
        await sendOnlineFinish(
          room.roomId,
          winner,
          `${myOnlineSide === 'red' ? 'Đỏ' : 'Đen'} rời bàn và nhận thua`
        );
      } catch (err) {
        showToast({
          type: 'error',
          title: 'CHƯA THỂ RỜI BÀN',
          message: err.message || 'Không thể xác nhận thua với máy chủ. Vui lòng thử lại.',
        });
        return;
      }
    }

    if (room?.roomId && userToLeave) {
      try {
        await leaveOnlineRoom(room.roomId, userToLeave);
      } catch {
        // Navigation should still work if the leave request cannot complete.
      }
    }

    soundFX.playDoorLeave();
    setCurrentRoom(null);
    setMode('lobby');
    navigate('/');
  } finally {
    setRoomActionLoading(null);
  }
};

const handleExitRoom = () => {
  const hasTwoPlayers = Boolean(currentRoom?.redPlayer && currentRoom?.blackPlayer);

  // Nếu trong bàn chỉ còn 1 người (chưa có đối thủ hoặc đối thủ đã rời bàn), thoát ra ngay không cần xác nhận
  if (!hasTwoPlayers) {
    performExitRoom();
    return;
  }

  const myUsername = currentUser?.username || playerName;
  const isRed = currentRoom?.redPlayer === myUsername;
  const isBlack = currentRoom?.blackPlayer === myUsername;
  const isMyReady = isRed ? currentRoom?.redReady : isBlack ? currentRoom?.blackReady : false;

  // Nếu chưa sẵn sàng hoặc chỉ là khán giả đang xem cờ, thoát ra ngay lập tức không cần xác nhận
  if ((currentRoom?.status === 'WAITING' && !isMyReady) || (!isRed && !isBlack)) {
    performExitRoom();
    return;
  }

  const message = currentRoom?.status === 'WAITING'
    ? 'Bạn có chắc muốn thoát bàn này không? Ghế của bạn sẽ được giải phóng.'
    : 'Bạn có chắc muốn rời bàn không? Bạn sẽ bị xử thua và đối thủ sẽ thắng.';

  showToast({
    type: 'warning',
    title: 'XÁC NHẬN RỜI BÀN',
    message,
    actionText: 'Thoát bàn',
    cancelText: 'Ở lại',
    persistent: true,
    onAction: performExitRoom,
  });
};

const performKickPlayer = async (roomId, targetPlayer) => {
  if (!currentUser?.username || !targetPlayer) return;

  try {
    const updated = await kickOnlinePlayer(roomId, currentUser.username, targetPlayer);
    setOnlineRooms((rooms) => rooms.map((room) => room.roomId === updated.roomId ? updated : room));
    showToast({
      type: 'success',
      title: 'ĐÃ ĐÁ NGƯỜI CHƠI',
      message: `${targetPlayer} đã được đưa ra khỏi phòng.`,
    });
  } catch (err) {
    showToast({
      type: 'error',
      title: 'KHÔNG THỂ ĐÁ NGƯỜI CHƠI',
      message: err.message || 'Chỉ chủ phòng mới có quyền thực hiện thao tác này.',
    });
  }
};

const handleKickPlayer = (roomId, targetPlayer) => {
  showToast({
    type: 'warning',
    title: 'XÁC NHẬN ĐÁ NGƯỜI CHƠI',
    message: `Bạn có chắc muốn đá ${targetPlayer} khỏi bàn không?`,
    actionText: 'Đá người chơi',
    cancelText: 'Hủy',
    persistent: true,
    onAction: () => performKickPlayer(roomId, targetPlayer),
  });
};

const handleOpenRoomChat = () => {
  setIsRoomChatOpen(true);
  setRoomChatUnread(0);
};

const handleOpenPlayerProfile = (username) => {
  if (mode === 'online' && username && username !== (currentUser?.username || playerName)) {
    setSelectedPlayer(username);
  }
};

const handleClaimDaily = async () => {
  if (!currentUser) {
    showToast({
      type: 'warning',
      title: 'YÊU CẦU ĐĂNG NHẬP',
      message: 'Vui lòng đăng nhập để nhận thưởng 10.000 xu điểm danh mỗi ngày!',
      actionText: 'Đăng nhập ngay',
      onAction: () => setShowAuthModal(true),
    });
    return;
  }
  setClaimingDaily(true);
  try {
    const newCoins = await claimDailyBonus(currentUser.username);
    setUserCoins(newCoins);
    setCurrentUser((prev) => (prev ? { ...prev, coins: newCoins } : null));
    showToast({
      type: 'reward',
      title: 'ĐIỂM DANH THÀNH CÔNG 🎉',
      message: `Bạn nhận được +10.000 xu danh vọng hôm nay! Số dư: ${newCoins.toLocaleString('vi-VN')} xu.`,
      rewardAmount: 10000,
    });
  } catch (err) {
    showToast({
      type: 'warning',
      title: 'ĐÃ ĐIỂM DANH HÔM NAY',
      message: err.message || 'Hôm nay bạn đã nhận thưởng điểm danh rồi! Hãy quay lại vào ngày mai nhé.',
    });
  } finally {
    setClaimingDaily(false);
  }
};

const handleQuickMatch = async (betAmount) => {
  if (!requireLogin()) return;

  setQuickMatchLoading(true);
  setOnlineError(null);
  const userToUse = currentUser?.username || playerName;
  try {
    const room = await quickMatchRoom(userToUse, betAmount);
    setMode('online');
    setShowQuickMatchModal(false);
    const side =
      room.redPlayer === userToUse
        ? 'red'
        : room.blackPlayer === userToUse
          ? 'black'
          : 'spectator';
    setMyOnlineSide(side);
    setFlipped(side === 'black');
    syncFromOnlineRoom(room);
    navigate(`/online/${room.roomId}`);
  } catch (err) {
    setOnlineError(err.message || 'Không thể tìm trận nhanh lúc này');
    showToast({
      type: 'error',
      title: 'LỖI TÌM TRẬN NHANH',
      message: err.message || 'Không thể tìm trận nhanh lúc này, vui lòng thử lại sau!',
    });
  } finally {
    setQuickMatchLoading(false);
  }
};

const handleCreateRoom = async () => {
  if (!requireLogin()) return;

  const creator = currentUser?.username || playerName;
  const name = newRoomName.trim() || `Kỳ đài của ${creator}`;
  if (selectedRoomBet > userCoins && currentUser) {
    showToast({
      type: 'warning',
      title: 'KHÔNG ĐỦ XU CƯỢC',
      message: `Số dư của bạn không đủ mức cược ${formatCoinText(selectedRoomBet)}!`,
    });
    return;
  }
  try {
    const rm = await createOnlineRoom(
      creator,
      name,
      'red',
      selectedRoomBet
    );
    setMyOnlineSide('red');
    setFlipped(false);
    syncFromOnlineRoom(rm);
    setOnlineError(null);
    setNewRoomName('');
    navigate(`/online/${rm.roomId}`);
  } catch {
    setOnlineError('Không thể tạo phòng trên Server');
    showToast({
      type: 'error',
      title: 'LỖI TẠO BÀN CỜ',
      message: 'Không thể tạo phòng trên Server, vui lòng thử lại sau!',
    });
  }
};

const handleChallengeFriend = async (friendUsername) => {
  if (!currentUser) {
    showToast({
      type: 'warning',
      title: 'YÊU CẦU ĐĂNG NHẬP',
      message: 'Vui lòng đăng nhập để mở bàn thách đấu bạn bè!',
      actionText: 'Đăng nhập',
      onAction: () => setShowAuthModal(true),
    });
    return;
  }
  try {
    const room = await createOnlineRoom(
      currentUser.username,
      `Thách đấu: ${currentUser.username} vs ${friendUsername}`,
      'red',
      10000
    );
    try {
      await postDirectMessage(
        currentUser.username,
        friendUsername,
        `Mình mở bàn cờ thách đấu bạn nè! Mã bàn: ${room.roomId}`
      );
    } catch {
      // ignore
    }

    setMode('online');
    setMyOnlineSide('red');
    setFlipped(false);
    syncFromOnlineRoom(room);
    navigate(`/online/${room.roomId}`);
  } catch {
    showToast({
      type: 'error',
      title: 'LỖI THÁCH ĐẤU',
      message: 'Không thể tạo bàn thách đấu, vui lòng thử lại sau!',
    });
  }
};

const handleLogout = () => {
  setCurrentUser(null);
  setPlayerName(`Kỳ Hữu ${Math.floor(100 + Math.random() * 900)}`);
  setUserCoins(20000);
};

const formatClock = (sec) => {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const capturedByRed = moveHistory
  .filter((m) => m.piece.side === 'red' && m.captured)
  .map((m) => m.captured);
const capturedByBlack = moveHistory
  .filter((m) => m.piece.side === 'black' && m.captured)
  .map((m) => m.captured);

const lastMove =
  moveHistory.length > 0 ? moveHistory[moveHistory.length - 1] : null;

const moveTimerPercent = Math.max(0, Math.min(100, (moveTime / Math.max(1, moveTimeLimit)) * 100));
const resultStake = Number(currentRoom?.betCoins || 0);

const isMySide = (side) => {
  if (mode === 'online') {
    if (myOnlineSide === 'spectator') return side === 'red';
    return myOnlineSide === side;
  }
  if (mode === 'ai') return playerSide === side;
  if (mode === 'puzzle') return side === 'red';
  return side === 'red';
};

const getPlayerHealthColor = (side) => {
  if (mode === 'online' && myOnlineSide === 'spectator') {
    return side === 'red' ? '#ef4444' : '#61c887';
  }
  return isMySide(side) ? '#61c887' : '#ef4444';
};

const handleConfirmSurrender = () => {
  showToast({
    type: 'warning',
    title: 'XÁC NHẬN ĐẦU HÀNG',
    message: 'Bạn có chắc muốn nhận thua ván đấu này không?',
    actionText: 'Nhận thua',
    cancelText: 'Hủy',
    persistent: true,
    onAction: async () => {
      const winSide = turn === 'red' ? 'black' : 'red';
      setWinner(winSide);
      setWinReason(`${turn === 'red' ? 'Đỏ' : 'Đen'} nhận thua`);
      if (mode === 'online' && currentRoom) {
        await sendOnlineFinish(currentRoom.roomId, winSide, 'Đầu hàng');
      }
    },
  });
};

const handleConfirmDraw = () => {
  showToast({
    type: 'warning',
    title: 'XÁC NHẬN XIN HÒA',
    message: 'Bạn có chắc muốn gửi yêu cầu hòa cờ không?',
    actionText: 'Xin hòa',
    cancelText: 'Hủy',
    persistent: true,
    onAction: async () => {
      setWinner('draw');
      setWinReason('Hai bên đồng ý Hòa cờ');
      if (mode === 'online' && currentRoom) {
        await sendOnlineFinish(currentRoom.roomId, 'draw', 'Hòa cờ');
      }
    },
  });
};

useEffect(() => {
  const isGameRoute =
    pathname === '/ai' ||
    pathname === '/local' ||
    pathname === '/puzzle' ||
    pathname.startsWith('/online/');

  if (!currentUser && isGameRoute) {
    setCurrentRoom(null);
    setMode('lobby');
    navigate('/', { replace: true });
    setShowAuthModal(true);
  }
}, [currentUser, navigate, pathname]);

return (
  <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden">
    <ScenicBackground />

    {/* Top Navigation Bar */}
    <TopNavBar
      currentRoom={currentRoom}
      handleExitRoom={handleExitRoom}
      onNavigateHome={() => {
        setCurrentRoom(null);
        navigate('/');
      }}
      zenMode={zenMode}
      setZenMode={setZenMode}
      pathname={pathname}
      onSelectLobby={() => {
        setCurrentRoom(null);
        navigate('/');
      }}
      onSelectAi={() => {
        navigate('/ai');
        loadBoardFromFen(INITIAL_FEN);
      }}
      onSelectPuzzle={() => {
        navigate('/puzzle');
        setActivePuzzle(PUZZLE_PRESETS[0]);
        loadBoardFromFen(PUZZLE_PRESETS[0].fen);
      }}
      onSelectEditor={() => {
        setCurrentRoom(null);
        navigate('/editor');
        setMode('editor');
      }}
      handleOpenRoomChat={handleOpenRoomChat}
      roomChatUnread={roomChatUnread}
      onOpenQuickMatch={() => setShowQuickMatchModal(true)}
      userCoins={userCoins}
      handleClaimDaily={handleClaimDaily}
      claimingDaily={claimingDaily}
      currentUser={currentUser}
      onOpenProfile={() => setShowProfileModal(true)}
      handleLogout={handleLogout}
      onOpenAuth={() => setShowAuthModal(true)}
      onOpenHistory={() => setShowHistoryModal(true)}
      onOpenFriends={() => {
        setChatInitialTab('friends');
        setIsGlobalChatOpen(true);
      }}
      soundEnabled={soundEnabled}
      onToggleSound={() => {
        const next = !soundEnabled;
        setSoundEnabled(next);
        soundFX.enabled = next;
      }}
    />

    {/* Main Content Area */}
    {isLobbyView ? (
      <main className="relative z-10 flex-1 py-4">
        <XiangqiLobby
          currentUser={currentUser}
          userCoins={userCoins}
          playerName={playerName}
          onlineRooms={onlineRooms}
          backendConnected={backendConnected}
          loadingRooms={roomsLoading}
          joiningRoomId={joiningRoomId}
          onRefreshRooms={refreshRooms}
          onQuickMatch={() => {
            if (requireLogin()) setShowQuickMatchModal(true);
          }}
          onJoinRoom={async (roomId, preferredSide) => {
            if (!requireLogin()) return;

            setJoiningRoomId(roomId);
            setRoomActionLoading('Đang kết nối vào bàn cờ...');
            try {
              const joined = await joinOnlineRoom(
                roomId,
                currentUser?.username || playerName,
                preferredSide || 'auto'
              );
              const side =
                joined.redPlayer === (currentUser?.username || playerName)
                  ? 'red'
                  : joined.blackPlayer === (currentUser?.username || playerName)
                    ? 'black'
                    : 'spectator';
              setMyOnlineSide(side);
              setFlipped(side === 'black');
              syncFromOnlineRoom(joined);
              navigate(`/online/${joined.roomId}`);
            } catch (err) {
              showToast({
                type: 'error',
                title: 'KHÔNG THỂ VÀO PHÒNG',
                message: err.message || 'Không thể vào phòng này, vui lòng thử lại sau!',
              });
            } finally {
              setJoiningRoomId(null);
              setRoomActionLoading(null);
            }
          }}
          onKickPlayer={handleKickPlayer}
          onCreateRoom={async ({ roomName, betCoins, timeLimitSeconds, moveTimeLimitSeconds }) => {
            if (!requireLogin()) return;

            const creator = currentUser?.username || playerName;
            setRoomActionLoading('Đang khởi tạo bàn cờ mới...');
            try {
              const rm = await createOnlineRoom(
                creator,
                roomName,
                'red',
                betCoins,
                timeLimitSeconds,
                moveTimeLimitSeconds
              );
              setMyOnlineSide('red');
              setFlipped(false);
              syncFromOnlineRoom(rm);
              navigate(`/online/${rm.roomId}`);
            } catch {
              showToast({
                type: 'error',
                title: 'LỖI TẠO BÀN CỜ',
                message: 'Không thể tạo phòng trên Server, vui lòng thử lại sau!',
              });
            } finally {
              setRoomActionLoading(null);
            }
          }}
          onSelectMode={(target) => {
            if (!requireLogin()) return;

            if (target === 'ai') {
              navigate('/ai');
              loadBoardFromFen(INITIAL_FEN);
              soundFX.playBattleStart();
            } else if (target === 'local') {
              navigate('/local');
              loadBoardFromFen(INITIAL_FEN);
              soundFX.playBattleStart();
            } else if (target === 'puzzle') {
              navigate('/puzzle');
              setActivePuzzle(PUZZLE_PRESETS[0]);
              loadBoardFromFen(PUZZLE_PRESETS[0].fen);
              soundFX.playBattleStart();
            } else if (target === 'editor') {
              navigate('/editor');
              setMode('editor');
              soundFX.playSelect();
            } else if (target === 'online') {
              navigate('/');
            }
          }}
          showToast={showToast}
          onOpenAuth={() => setShowAuthModal(true)}
          onClaimDaily={handleClaimDaily}
          onOpenGlobalChat={() => {
            setChatInitialTab('global');
            setIsGlobalChatOpen(true);
          }}
          onOpenHistory={() => setShowHistoryModal(true)}
          onOpenFriends={() => {
            setChatInitialTab('friends');
            setIsGlobalChatOpen(true);
          }}
        />
      </main>
    ) : mode === 'editor' ? (
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        <BoardEditor
          onPlayWithAi={handlePlayCustomFenWithAi}
          showToast={showToast}
        />
      </main>
    ) : (
      <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-5 px-3 sm:px-6 py-3 max-w-[1440px] w-full mx-auto">
        {/* LEFT PANEL */}
        {!zenMode && (
          <GameSidebar
            mode={mode}
            turn={turn}
            winner={winner}
            myOnlineSide={myOnlineSide}
            currentRoom={currentRoom}
            handleOpenPlayerProfile={handleOpenPlayerProfile}
            getPlayerHealthColor={getPlayerHealthColor}
            moveTimerPercent={moveTimerPercent}
            formatClock={formatClock}
            blackTime={blackTime}
            redTime={redTime}
            capturedByBlack={capturedByBlack}
            capturedByRed={capturedByRed}
            aiDifficulty={aiDifficulty}
            setAiDifficulty={setAiDifficulty}
            playerSide={playerSide}
            setPlayerSide={setPlayerSide}
            setFlipped={setFlipped}
            loadBoardFromFen={loadBoardFromFen}
            activePuzzle={activePuzzle}
            setActivePuzzle={setActivePuzzle}
            showPuzzleHint={showPuzzleHint}
            setShowPuzzleHint={setShowPuzzleHint}
            loadScreenshotDemo={loadScreenshotDemo}
            customFenInput={customFenInput}
            setCustomFenInput={setCustomFenInput}
            handleUndo={handleUndo}
            moveHistoryLength={moveHistory.length}
            animatingMove={animatingMove}
            handleHint={handleHint}
            handleNewGame={handleNewGame}
          />
        )}

        {/* CENTER: The Jade-Green Board */}
        <section className="relative flex flex-col items-center justify-center order-1 lg:order-2">
          {mode === 'online' && (
            <PlayerVersusBar
              currentRoom={currentRoom}
              turn={turn}
              winner={winner}
              resultStake={resultStake}
              redTime={redTime}
              blackTime={blackTime}
              formatClock={formatClock}
              formatCoinText={formatCoinText}
              getPlayerHealthColor={getPlayerHealthColor}
              moveTimerPercent={moveTimerPercent}
              isMySide={isMySide}
              handleOpenPlayerProfile={handleOpenPlayerProfile}
              handleInviteFriend={handleInviteFriend}
              showToast={showToast}
            />
          )}

          <XiangqiBoard
            board={board}
            turn={turn}
            selectedPos={selectedPos}
            legalMoves={legalMoves}
            lastMove={lastMove}
            hintMove={hintMove}
            flipped={flipped}
            showViLabels={showViLabels}
            animatingMove={animatingMove}
            inCheckSide={inCheckSide}
            winner={winner}
            winReason={winReason}
            mySide={mode === 'online' ? myOnlineSide : null}
            onSquareClick={handleSquareClick}
          >
            {winner && (
              <PostMatchOverlay
                winner={winner}
                winReason={winReason}
                mode={mode}
                mySide={mode === 'online' ? myOnlineSide : playerSide}
                resultStake={resultStake}
                countdown={postMatchCountdown}
                hasTwoPlayers={mode !== 'online' || Boolean(currentRoom?.redPlayer && currentRoom?.blackPlayer)}
                onStartNewGameNow={handleInstantNewGame}
                onContinueWaiting={handleContinueWaitingInRoom}
                onLeave={mode === 'online' ? handlePostMatchLeave : null}
              />
            )}

            {mode === 'online' &&
              currentRoom &&
              currentRoom.status === 'WAITING' &&
              (currentRoom.redPlayer === (currentUser?.username || playerName) ||
                currentRoom.blackPlayer === (currentUser?.username || playerName)) && (
                <OnlineReadyOverlay
                  currentRoom={currentRoom}
                  currentUser={currentUser}
                  playerName={playerName}
                  onSetReady={handleSetOnlineReady}
                  onReadyTimeout={handleReadyTimeout}
                  onCopyRoomCode={(id) => {
                    navigator.clipboard.writeText(id);
                    showToast({
                      type: 'success',
                      title: 'ĐÃ SAO CHÉP MÃ PHÒNG',
                      message: `Đã copy mã bàn: ${id}. Gửi mã này cho bạn bè cùng vào tỉ thí!`,
                    });
                  }}
                />
              )}
          </XiangqiBoard>

          <GameActionBar
            winner={winner}
            postMatchCountdown={postMatchCountdown}
            handleInstantNewGame={handleInstantNewGame}
            moveHistoryLength={moveHistory.length}
            onConfirmSurrender={handleConfirmSurrender}
            onConfirmDraw={handleConfirmDraw}
          />
        </section>

        {/* RIGHT PANEL */}
        {!zenMode && (
          <aside className={`${mode === 'online' ? 'hidden' : 'w-full lg:w-[310px] flex flex-col gap-3'} order-3`}>
          </aside>
        )}
      </main>
    )}

    {/* Global World & Friends Chat Drawer */}
    <GlobalChatDrawer
      isOpen={isGlobalChatOpen}
      onToggle={() => setIsGlobalChatOpen((v) => !v)}
      currentUser={currentUser}
      userCoins={userCoins}
      onOpenAuth={() => setShowAuthModal(true)}
      onChallengeFriend={handleChallengeFriend}
      initialTab={chatInitialTab}
    />

    {isRoomChatOpen && currentRoom && (
      <RoomChatDrawer
        currentRoom={currentRoom}
        currentUser={currentUser}
        playerName={playerName}
        messages={chatMessages}
        onRoomUpdated={syncFromOnlineRoom}
        onClose={() => setIsRoomChatOpen(false)}
      />
    )}

    <PlayerProfileModal
      username={selectedPlayer}
      isOpen={Boolean(selectedPlayer)}
      onClose={() => setSelectedPlayer(null)}
      canKick={Boolean(
        currentRoom?.status === 'WAITING' &&
        currentUser?.username &&
        (currentRoom.hostPlayer
          ? currentRoom.hostPlayer === currentUser.username
          : currentRoom.redPlayer === currentUser.username)
      )}
      onKick={(targetPlayer) => {
        setSelectedPlayer(null);
        handleKickPlayer(currentRoom.roomId, targetPlayer);
      }}
    />

    {/* User Profile Modal */}
    <ProfileModal
      isOpen={showProfileModal}
      onClose={() => setShowProfileModal(false)}
      currentUser={currentUser}
      onUserUpdated={(updatedUser) => {
        setCurrentUser(updatedUser);
        setPlayerName(updatedUser.displayName || updatedUser.username);
      }}
    />

    {/* Quick Match Modal */}
    <QuickMatchModal
      isOpen={showQuickMatchModal}
      onClose={() => setShowQuickMatchModal(false)}
      onConfirm={handleQuickMatch}
      userCoins={userCoins}
      loading={quickMatchLoading}
      showToast={showToast}
    />

    {/* Auth Register & Login Modal */}
    <AuthModal
      isOpen={showAuthModal}
      onClose={() => setShowAuthModal(false)}
      onAuthSuccess={(user) => {
        setCurrentUser(user);
        setUserCoins(user.coins ?? 20000);
        setPlayerName(user.displayName || user.username);
      }}
    />

    {/* Match History & Replay Modal */}
    <MatchHistoryModal
      isOpen={showHistoryModal}
      onClose={() => setShowHistoryModal(false)}
      currentUser={currentUser}
      playerName={playerName}
    />

    {/* Professional In-App Toast Notification */}
    <ToastNotification
      toast={toast}
      onDismiss={() => setToast(null)}
    />

    {/* Duplicate Multi-Tab Session Overlay */}
    <DuplicateTabModal
      isOpen={isDuplicateTab}
      username={currentUser?.username}
      onReclaim={handleReclaimTab}
      onExit={handleExitDuplicateTab}
    />

    {/* Global Network Action Loading Overlay */}
    {roomActionLoading && (
      <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in p-4">
        <div className="flex flex-col items-center p-6 rounded-3xl bg-[#0f241a] border border-[#5ec485]/50 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-w-xs text-center text-[#f3ead8]">
          <div className="relative w-16 h-16 flex items-center justify-center mb-3">
            <div className="absolute inset-0 rounded-full border-4 border-[#5ec485]/20 border-t-[#5ec485] animate-spin" />
            <span className="text-2xl font-bold text-[#fef08a] font-serif select-none">帥</span>
          </div>
          <h3 className="text-base font-bold text-[#fef3c7]">{roomActionLoading}</h3>
          <p className="text-xs text-[#8ce8b1] mt-1.5">Đang đồng bộ trạng thái với máy chủ...</p>
        </div>
      </div>
    )}
  </div>
);
}
