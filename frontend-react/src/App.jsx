import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Award,
  Bot,
  Check,
  Clock,
  Coins,
  Compass,
  Copy,
  Eye,
  Flag,
  Gift,
  Globe,
  History,
  LayoutDashboard,
  Lightbulb,
  Loader2,
  LogIn,
  LogOut,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Trophy,
  XCircle,
  Undo2,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { ScenicBackground } from './components/ScenicBackground.jsx';
import { XiangqiBoard } from './components/XiangqiBoard.jsx';
import { AuthModal } from './components/AuthModal.jsx';
import { ProfileModal, renderUserAvatar } from './components/ProfileModal.jsx';
import { ToastNotification } from './components/ToastNotification.jsx';
import { GlobalChatDrawer } from './components/GlobalChatDrawer.jsx';
import {
  BET_TIERS,
  QuickMatchModal,
} from './components/QuickMatchModal.jsx';
import { XiangqiLobby } from './components/XiangqiLobby.jsx';
import { MatchHistoryModal } from './components/MatchHistoryModal.jsx';
import OnlineReadyOverlay from './components/OnlineReadyOverlay.jsx';
import PostMatchOverlay from './components/PostMatchOverlay.jsx';
import { RoomChatDrawer } from './components/RoomChatDrawer.jsx';
import { PlayerProfileModal } from './components/PlayerProfileModal.jsx';
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
    pathname === '/' ||
    pathname === '/lobby' ||
    (pathname === '/online' && !currentRoom) ||
    mode === 'lobby';

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
  }, [turn, winner, mode, currentRoom?.status, moveTimeLimit]);

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
  }, [currentRoom?.roomId, currentUser?.username]);

  useEffect(() => {
    if (!currentRoom?.roomId || currentRoom.status !== 'WAITING' || !currentUser?.username) {
      return undefined;
    }

    const handlePageExit = () => {
      leaveOnlineRoom(currentRoom.roomId, currentUser.username).catch(() => {});
    };

    window.addEventListener('beforeunload', handlePageExit);
    return () => window.removeEventListener('beforeunload', handlePageExit);
  }, [currentRoom?.roomId, currentRoom?.status, currentUser?.username]);

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
      } catch {}
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
  useEffect(() => {
    if (!winner || isLobbyView) {
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
  }, [winner, mode, currentRoom?.roomId, currentRoom?.redPlayer, currentRoom?.blackPlayer]);

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
      <header className="relative z-20 w-full px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 bg-[#10261c]/85 backdrop-blur-md border-b border-[#848156]/30">
        {currentRoom ? (
          <button
            onClick={handleExitRoom}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-red-950/70 hover:bg-red-900/80 border border-red-500/50 text-red-200 text-sm font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Thoát bàn</span>
          </button>
        ) : (
          <div
            onClick={() => {
              setCurrentRoom(null);
              navigate('/');
            }}
            className="flex items-center gap-3 cursor-pointer group select-none"
            title="Trở về Sảnh cờ chính"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center shadow-md border border-[#8a5a32] group-hover:scale-105 transition-transform">
              <span
                className="text-[#9e1c13] font-semibold text-xl leading-none"
                style={{
                  fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                }}
              >
                帥
              </span>
            </div>
            <div>
              <h1
                className="text-lg sm:text-xl font-bold tracking-wide text-[#f4ead5] flex items-center gap-2 group-hover:text-white transition-colors"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                VÔ DANH KỲ HỮU
              </h1>
            </div>
          </div>
        )}

        {/* Mode Switcher Pills */}
        {!currentRoom && !zenMode && (
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-[#0c1d15]/90 p-1 rounded-xl border border-[#848156]/30">
            <button
              onClick={() => {
                setCurrentRoom(null);
                navigate('/');
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/' || pathname === '/lobby'
                ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
                }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#a7f3d0]" />
              <span>Sảnh Cờ</span>
            </button>

            <button
              onClick={() => {
                navigate('/ai');
                loadBoardFromFen(INITIAL_FEN);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/ai'
                ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
                }`}
            >
              <Bot className="w-4 h-4 text-[#66c989]" />
              <span>Luyện tập với Bot</span>
            </button>

            <button
              onClick={() => {
                navigate('/puzzle');
                setActivePuzzle(PUZZLE_PRESETS[0]);
                loadBoardFromFen(PUZZLE_PRESETS[0].fen);
              }}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${pathname === '/puzzle'
                ? 'bg-[#25593f] text-[#e8f8ee] shadow border border-[#5ec485]/50'
                : 'text-[#c2baa3] hover:text-white hover:bg-white/5'
                }`}
            >
              <Compass className="w-4 h-4 text-[#f472b6]" />
              <span>Cờ Thế</span>
            </button>
          </nav>
        )}

        {/* User Account, Coins & Quick Play Bar */}
        {currentRoom ? (
          <button
            onClick={handleOpenRoomChat}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#153124] hover:bg-[#1e4432] border border-[#5ec485]/45 text-[#bbf7d0] text-sm font-bold transition cursor-pointer"
            title="Mở chat trong phòng"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
            {roomChatUnread > 0 && <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-[#10261c]">{roomChatUnread > 9 ? '9+' : roomChatUnread}</span>}
          </button>
        ) : (
        <div className="flex items-center gap-2">
          {/* Quick Match Lightning Button */}
          <button
            onClick={() => setShowQuickMatchModal(true)}
            title="Ghép trận online nhanh"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-stone-950 text-xs font-bold shadow-md flex items-center gap-1.5 transition-transform hover:scale-105 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Chơi Nhanh</span>
          </button>

          {/* User Coins Badge */}
          <div
            title="Số xu hiện có"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e2419] border border-[#facc15]/40 text-[#fef08a] text-xs font-bold shadow-inner"
          >
            <Coins className="w-4 h-4 text-[#fbbf24]" />
            <span className="font-mono">{userCoins?.toLocaleString('vi-VN')}</span>
            <span className="text-[10px] text-[#facc15] font-normal">xu</span>
          </div>

          {/* Daily Bonus Claim Button */}
          <button
            onClick={handleClaimDaily}
            disabled={claimingDaily}
            title="Điểm danh mỗi ngày nhận +10.000 xu"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#1b4332] hover:bg-[#245942] text-[#8ce8b1] border border-[#5ec485]/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            {claimingDaily ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fbbf24]" />
            ) : (
              <Gift className="w-3.5 h-3.5 text-[#fbbf24]" />
            )}
            <span>+10k xu</span>
          </button>

          {/* User Auth Info */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-white/10">
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition bg-black/25 hover:bg-black/45 px-2.5 py-1 rounded-xl border border-white/10"
                title={`Xem và sửa hồ sơ kỳ thủ: ${currentUser.totalMatches ?? 0} trận · Thắng ${currentUser.winRate ?? 0}%`}
              >
                {renderUserAvatar(currentUser.avatar, 'w-6 h-6', 'text-xs')}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#8ce8b1] max-w-[100px] truncate leading-tight">
                    {currentUser.displayName || currentUser.username}
                  </span>
                  <span className="text-[9px] text-[#fef08a] font-medium leading-tight">
                    {currentUser.totalMatches ?? 0} trận ({currentUser.winRate ?? 0}%)
                  </span>
                </div>
              </button>
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 rounded-lg text-red-300 hover:text-white hover:bg-red-950/50 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-[#92400e] hover:bg-[#b45309] text-[#fef3c7] border border-[#facc15]/40 flex items-center gap-1.5 transition cursor-pointer shadow"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Đăng nhập (+20k)</span>
            </button>
          )}

          {/* Match History Button */}
          <button
            onClick={() => setShowHistoryModal(true)}
            title="Xem lịch sử đấu và biên bản ván cờ"
            className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#93c5fd] border border-[#3b82f6]/40 transition cursor-pointer"
          >
            <History className="w-4 h-4 text-[#60a5fa]" />
          </button>

          {/* Friends & Direct Chat Button */}
          <button
            onClick={() => {
              setChatInitialTab('friends');
              setIsGlobalChatOpen(true);
            }}
            title="Kỳ hữu & Chat bạn bè"
            className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#7dd3fc] border border-[#38bdf8]/40 transition cursor-pointer"
          >
            <Users className="w-4 h-4 text-[#38bdf8]" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              soundFX.enabled = next;
            }}
            title="Bật/tắt âm thanh quân cờ"
            className="p-2 rounded-lg bg-[#153124] hover:bg-[#1e4432] text-[#d2cca6] border border-[#848156]/40 transition cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#66c989]" />
            ) : (
              <VolumeX className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {/* Zen Mode */}
          <button
            onClick={() => setZenMode((z) => !z)}
            title="Ẩn/hiện menu điều khiển"
            className={`p-2 rounded-lg text-xs font-semibold border transition cursor-pointer ${zenMode
              ? 'bg-[#25593f] text-[#8ce8b1] border-[#5ec485]'
              : 'bg-[#153124] text-[#d2cca6] border-[#848156]/40 hover:bg-[#1e4432]'
              }`}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        )}
      </header>

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
            onCreateRoom={async ({ roomName, preferredSide: sidePref, betCoins, timeLimitSeconds, moveTimeLimitSeconds }) => {
              if (!requireLogin()) return;

              const creator = currentUser?.username || playerName;
              setRoomActionLoading('Đang khởi tạo bàn cờ mới...');
              try {
                const rm = await createOnlineRoom(
                  creator,
                  roomName,
                  sidePref === 'auto' ? 'red' : sidePref,
                  betCoins,
                  timeLimitSeconds,
                  moveTimeLimitSeconds
                );
                setMyOnlineSide(sidePref === 'black' ? 'black' : 'red');
                setFlipped(sidePref === 'black');
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
      ) : (
        <main className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-5 px-3 sm:px-6 py-3 max-w-[1440px] w-full mx-auto">
          {/* LEFT PANEL */}
          {!zenMode && (
            <aside className={`${mode === 'online' ? 'hidden' : 'w-full lg:w-[310px] flex flex-col gap-3'} order-2 lg:order-1`}>
              {/* Black Player Card */}
              <div
                className={`rounded-2xl p-3.5 bg-[#11281e]/85 backdrop-blur-md border transition-all ${turn === 'black' && !winner
                  ? mode === 'online' && myOnlineSide !== 'black'
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-[#61c887] shadow-[0_0_20px_rgba(97,200,135,0.25)]'
                  : 'border-[#848156]/35'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => handleOpenPlayerProfile(currentRoom?.blackPlayer)}
                      className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: `conic-gradient(${getPlayerHealthColor('black')} ${turn === 'black' ? moveTimerPercent : 100}%, rgba(255,255,255,.12) 0)` }}
                      title="Xem hồ sơ đối thủ"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#6b4c30] shadow">
                        <span className="text-[#24201c] font-semibold text-xl" style={{ fontFamily: "'LXGW WenKai TC', 'KaiTi', '楷体', 'STKaiti', serif" }}>將</span>
                      </div>
                    </div>
                    {turn === 'black' && !winner && (
                      <span className={`w-2 h-2 rounded-full animate-ping ${mode === 'online' && myOnlineSide !== 'black' ? 'bg-red-500' : 'bg-[#61c887]'}`} />
                    )}
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold ${turn === 'black'
                      ? 'bg-[#204d37] text-[#8ce8b1] border border-[#5ec485]/40'
                      : 'bg-black/30 text-[#9ca89e]'
                      }`}
                  >
                    {formatClock(blackTime)}
                  </div>
                </div>

                {capturedByBlack.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                    {capturedByBlack.map((p, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full bg-[#edd3ae] text-[#9e1c13] font-semibold text-xs flex items-center justify-center shadow border border-[#6b4c30]/50"
                        style={{
                          fontFamily:
                            "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                        }}
                      >
                        {PIECE_CHARS[p.side][p.type]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Red Player Card */}
              <div
                className={`rounded-2xl p-3.5 bg-[#11281e]/85 backdrop-blur-md border transition-all ${turn === 'red' && !winner
                  ? mode === 'online' && myOnlineSide !== 'red'
                    ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.25)]'
                    : 'border-[#61c887] shadow-[0_0_20px_rgba(97,200,135,0.25)]'
                  : 'border-[#848156]/35'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      onClick={() => handleOpenPlayerProfile(currentRoom?.redPlayer)}
                      className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: `conic-gradient(${getPlayerHealthColor('red')} ${turn === 'red' ? moveTimerPercent : 100}%, rgba(255,255,255,.12) 0)` }}
                      title="Xem hồ sơ đối thủ"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#6b4c30] shadow">
                        <span className="text-[#9e1c13] font-semibold text-xl" style={{ fontFamily: "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif" }}>帥</span>
                      </div>
                    </div>
                    {turn === 'red' && !winner && (
                      <span className={`w-2 h-2 rounded-full animate-ping ${mode === 'online' && myOnlineSide !== 'red' ? 'bg-red-500' : 'bg-[#61c887]'}`} />
                    )}
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-lg font-mono text-sm font-bold ${turn === 'red'
                      ? 'bg-[#204d37] text-[#8ce8b1] border border-[#5ec485]/40'
                      : 'bg-black/30 text-[#9ca89e]'
                      }`}
                  >
                    {formatClock(redTime)}
                  </div>
                </div>

                {capturedByRed.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-wrap gap-1">
                    {capturedByRed.map((p, i) => (
                      <span
                        key={i}
                        className="w-6 h-6 rounded-full bg-[#edd3ae] text-[#24201c] font-semibold text-xs flex items-center justify-center shadow border border-[#6b4c30]/50"
                        style={{
                          fontFamily:
                            "'LXGW WenKai TC', 'KaiTi', 'Noto Serif TC', serif",
                        }}
                      >
                        {PIECE_CHARS[p.side][p.type]}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Mode-Specific Control Card */}
              <div className={`${mode === 'online' ? 'hidden' : 'rounded-2xl p-4 bg-[#11281e]/85 backdrop-blur-md border border-[#848156]/35 flex flex-col gap-3'}`}>
                {mode === 'ai' && (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae] flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-[#61c887]" />
                      Thiết lập Luyện tập với Bot
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {[1, 2, 3, 4].map((lv) => (
                        <button
                          key={lv}
                          onClick={() => setAiDifficulty(lv)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${aiDifficulty === lv
                            ? 'bg-[#25593f] text-[#8ce8b1] border-[#5ec485]'
                            : 'bg-black/25 text-[#c2baa3] border-white/10 hover:bg-white/5'
                            }`}
                        >
                          {DIFFICULTY_LABELS[lv]}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-xs text-[#c2baa3]">Chọn quân:</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setPlayerSide('red');
                            setFlipped(false);
                            loadBoardFromFen(INITIAL_FEN);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${playerSide === 'red'
                            ? 'bg-[#991b1b] text-white border border-red-400'
                            : 'bg-black/30 text-gray-300'
                            }`}
                        >
                          Đỏ (Đi Tiên)
                        </button>
                        <button
                          onClick={() => {
                            setPlayerSide('black');
                            setFlipped(true);
                            loadBoardFromFen(INITIAL_FEN);
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${playerSide === 'black'
                            ? 'bg-[#1f2937] text-white border border-gray-400'
                            : 'bg-black/30 text-gray-300'
                            }`}
                        >
                          Đen (Đi Hậu)
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {mode === 'puzzle' && (
                  <>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae] flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#f472b6]" />
                      Chọn Thế Cờ Giang Hồ
                    </div>
                    <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {PUZZLE_PRESETS.map((pz) => (
                        <button
                          key={pz.id}
                          onClick={() => {
                            setActivePuzzle(pz);
                            setShowPuzzleHint(false);
                            if (pz.id === 'screenshot-opening') {
                              loadScreenshotDemo();
                            } else {
                              loadBoardFromFen(pz.fen);
                            }
                          }}
                          className={`text-left p-2 rounded-xl border transition cursor-pointer ${activePuzzle.id === pz.id
                            ? 'bg-[#25593f]/90 border-[#5ec485] text-white'
                            : 'bg-black/25 border-white/10 text-[#d2cca6] hover:bg-white/5'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{pz.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#8ce8b1]">
                              {pz.difficulty}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b4c2b8] mt-0.5 line-clamp-1">
                            {pz.subtitle}
                          </p>
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[#d2cca6] bg-black/25 p-2.5 rounded-xl border border-white/5">
                      {activePuzzle.description}
                    </p>
                    <button
                      onClick={() => setShowPuzzleHint((s) => !s)}
                      className="text-xs text-[#fbbf24] hover:underline text-left font-medium cursor-pointer"
                    >
                      {showPuzzleHint
                        ? `💡 Bí quyết: ${activePuzzle.hint}`
                        : '💡 Xem gợi ý giải thế cờ'}
                    </button>

                    <div className="flex gap-1.5 pt-1">
                      <input
                        value={customFenInput}
                        onChange={(e) => setCustomFenInput(e.target.value)}
                        placeholder="Dán mã FEN thế cờ..."
                        className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-gray-400 focus:outline-none focus:border-[#5ec485]"
                      />
                      <button
                        onClick={() => {
                          if (customFenInput.trim()) {
                            loadBoardFromFen(customFenInput.trim());
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#25593f] text-xs font-semibold text-white hover:bg-[#2f6f4f] cursor-pointer"
                      >
                        Nạp
                      </button>
                    </div>
                  </>
                )}

                {mode === 'online' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#9ec4ae] flex items-center gap-1.5">
                        <Globe className="w-4 h-4 text-[#60a5fa]" />
                        Sảnh Kỳ Đài Online
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full ${backendConnected
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          }`}
                      >
                        {backendConnected ? '● Online' : '○ Đang nối'}
                      </span>
                    </div>

                    {onlineError && (
                      <div className="text-xs text-amber-300 bg-amber-950/50 border border-amber-500/30 rounded-lg p-2">
                        {onlineError}
                      </div>
                    )}

                    {/* Quick Match Feature in Lobby */}
                    <button
                      onClick={() => setShowQuickMatchModal(true)}
                      className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Zap className="w-4 h-4 fill-current text-yellow-300" />
                      <span>CHƠI NHANH (GHÉP BÀN TỰ ĐỘNG)</span>
                    </button>

                    {currentRoom ? (
                      <div className="bg-black/30 rounded-xl p-2.5 border border-[#5ec485]/40 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-[#8ce8b1]">
                              Phòng: {currentRoom.roomId}
                            </span>
                            {currentRoom.betCoins > 0 && (
                              <span className="ml-1.5 px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                                🪙 {formatCoinText(currentRoom.betCoins)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentRoom.roomId);
                              showToast({
                                type: 'success',
                                title: 'ĐÃ SAO CHÉP MÃ PHÒNG',
                                message: `Đã copy mã bàn: ${currentRoom.roomId}. Gửi mã này cho bạn bè cùng vào tỉ thí!`,
                              });
                            }}
                            className="text-[11px] flex items-center gap-1 text-[#d2cca6] hover:text-white cursor-pointer"
                          >
                            <Copy className="w-3 h-3" /> Copy mã
                          </button>
                        </div>
                        <div className="text-xs text-[#d2cca6]">
                          Bạn đang giữ vai trò:{' '}
                          <strong className="text-white">
                            {myOnlineSide === 'red'
                              ? 'Quân Đỏ (Tiên)'
                              : myOnlineSide === 'black'
                                ? 'Quân Đen (Hậu)'
                                : 'Khán giả'}
                          </strong>
                        </div>
                        <button
                          onClick={() => {
                            setCurrentRoom(null);
                            navigate('/');
                          }}
                          className="text-xs text-red-300 hover:underline text-left cursor-pointer"
                        >
                          ← Rời phòng về Sảnh
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Room creation with stakes */}
                        <div className="space-y-1.5 p-2 rounded-xl bg-black/25 border border-white/10">
                          <div className="text-[11px] font-bold text-[#c2baa3]">
                            Tạo Bàn Cược Mới:
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              value={newRoomName}
                              onChange={(e) => setNewRoomName(e.target.value)}
                              placeholder="Tên bàn cờ..."
                              className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2 py-1 text-xs text-white"
                            />
                            <select
                              value={selectedRoomBet}
                              onChange={(e) => setSelectedRoomBet(Number(e.target.value))}
                              className="bg-[#142d20] border border-white/20 rounded-lg px-1.5 py-1 text-xs text-[#fef08a] font-bold focus:outline-none"
                            >
                              {BET_TIERS.map((tier) => (
                                <option key={tier.value} value={tier.value} className="bg-[#12241b] text-white">
                                  {tier.short}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={handleCreateRoom}
                              className="px-2.5 py-1 rounded-lg bg-[#25593f] hover:bg-[#2e6c4d] text-xs font-bold text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tạo
                            </button>
                          </div>
                        </div>

                        {/* Join room by code */}
                        <div className="flex gap-1.5">
                          <input
                            value={roomCodeInput}
                            onChange={(e) =>
                              setRoomCodeInput(e.target.value.toUpperCase())
                            }
                            placeholder="Mã phòng (VD: VDKH01)..."
                            className="flex-1 bg-black/35 border border-white/15 rounded-lg px-2.5 py-1.5 text-xs text-white"
                          />
                          <button
                            onClick={async () => {
                              if (!roomCodeInput.trim()) return;
                              try {
                                const rm = await joinOnlineRoom(
                                  roomCodeInput.trim(),
                                  currentUser?.username || playerName,
                                  'auto'
                                );
                                const side =
                                  rm.redPlayer === (currentUser?.username || playerName)
                                    ? 'red'
                                    : rm.blackPlayer === (currentUser?.username || playerName)
                                      ? 'black'
                                      : 'spectator';
                                setMyOnlineSide(side);
                                setFlipped(side === 'black');
                                syncFromOnlineRoom(rm);
                                setOnlineError(null);
                              } catch {
                                setOnlineError('Không tìm thấy mã phòng này');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#1e40af] hover:bg-[#1d4ed8] text-xs font-bold text-white cursor-pointer"
                          >
                            Vào
                          </button>
                        </div>

                        {/* Available Rooms List */}
                        <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pt-1">
                          {onlineRooms.length === 0 ? (
                            <div className="text-center py-4 text-xs text-[#8fa195]">
                              Chưa có phòng nào. Hãy tạo bàn mới hoặc bấm "Chơi Nhanh"!
                            </div>
                          ) : (
                            onlineRooms.map((rm) => (
                              <div
                                key={rm.roomId}
                                className="flex items-center justify-between p-2 rounded-lg bg-black/25 border border-white/10 text-xs"
                              >
                                <div>
                                  <div className="font-bold text-[#f3ead8] flex items-center gap-1.5">
                                    <span>{rm.roomName}</span>
                                    {rm.betCoins > 0 ? (
                                      <span className="px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-300 font-bold text-[10px] border border-amber-500/30">
                                        🪙 {formatCoinText(rm.betCoins)}
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-black/40 text-gray-400 text-[10px]">
                                        Tự do
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-[#a7b5ab]">
                                    Đỏ: {rm.redPlayer || 'Trống'} • Đen:{' '}
                                    {rm.blackPlayer || 'Trống'}
                                  </div>
                                </div>
                                <button
                                  onClick={async () => {
                                    const joined = await joinOnlineRoom(
                                      rm.roomId,
                                      currentUser?.username || playerName,
                                      'auto'
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
                                  }}
                                  className="px-2.5 py-1 rounded bg-[#25593f] hover:bg-[#2f6f4f] text-white font-semibold cursor-pointer"
                                >
                                  Vào bàn
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Action Buttons Bar */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleUndo}
                    disabled={moveHistory.length === 0 || !!animatingMove}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] disabled:opacity-40 text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5 text-[#61c887]" />
                    Đi lại (Undo)
                  </button>

                  <button
                    onClick={handleHint}
                    disabled={!!winner || !!animatingMove}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] disabled:opacity-40 text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#fbbf24]" />
                    Gợi ý nước đi
                  </button>

                  <button
                    onClick={() => setFlipped((f) => !f)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#183829] hover:bg-[#214b37] text-xs font-semibold text-[#e6dec8] border border-[#848156]/40 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#60a5fa]" />
                    Xoay bàn cờ
                  </button>

                  <button
                    onClick={handleNewGame}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#25593f] hover:bg-[#2e6c4d] text-xs font-bold text-white border border-[#5ec485]/50 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Ván mới
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* CENTER: The Jade-Green Board */}
          <section className="relative flex flex-col items-center justify-center order-1 lg:order-2">
            {mode === 'online' && currentRoom && (
              <div className="w-full max-w-[550px] grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 mb-3 px-2 py-2 rounded-2xl bg-[#11281e]/90 border border-[#848156]/35 shadow-lg">
                {currentRoom.redPlayer ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      onClick={() => handleOpenPlayerProfile(currentRoom.redPlayer)}
                      className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: `conic-gradient(${getPlayerHealthColor('red')} ${turn === 'red' ? moveTimerPercent : 100}%, rgba(255,255,255,.12) 0)` }}
                      title="Xem hồ sơ quân Đỏ"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#b91c1c]">
                        <span className="text-[#9e1c13] font-semibold text-lg">帥</span>
                      </div>
                      {currentRoom.status === 'WAITING' && currentRoom.redReady && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#11281e] flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#f3ead8] truncate">{currentRoom.redPlayer}</div>
                      {currentRoom.status === 'WAITING' ? (
                        <div className="text-[10px] font-semibold leading-tight mt-0.5">
                          {currentRoom.redReady ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                              Đã sẵn sàng
                            </span>
                          ) : (
                            <span className="text-amber-300 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                              Chưa sẵn sàng
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={`text-[10px] ${turn === 'red' ? (isMySide('red') ? 'text-[#8ce8b1] font-bold' : 'text-red-400 font-bold') : 'text-[#8fa195]'}`}>{formatClock(redTime)}</div>
                      )}
                    </div>
                    {winner && winner !== 'draw' && resultStake > 0 && (
                      <div className={`shrink-0 flex items-center gap-1 text-lg font-black ${winner === 'red' ? 'text-yellow-300' : 'text-red-600'}`}>
                        {winner === 'red' ? <Trophy className="w-4 h-4 text-amber-300" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        {winner === 'red' ? '+' : '-'}{formatCoinText(resultStake)}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleInviteFriend}
                    className="flex items-center gap-2 text-left group cursor-pointer transition hover:scale-105"
                    title="Nhấn để mời bạn bè vào bàn"
                  >
                    <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#5ec485]/60 group-hover:border-[#5ec485] bg-[#163827]/70 group-hover:bg-[#1f4d36] flex items-center justify-center transition shadow">
                      <Plus className="w-5 h-5 text-[#8ce8b1] group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#8ce8b1] group-hover:text-white transition">
                        Mời bạn
                      </div>
                      <div className="text-[10px] text-[#8fa195]">
                        Nhấn để chia sẻ
                      </div>
                    </div>
                  </button>
                )}
                <span className="text-[10px] font-extrabold text-[#9ec4ae] px-2 py-1 rounded-full bg-white/5 border border-white/10">VS</span>
                {currentRoom.blackPlayer ? (
                  <div className="flex items-center justify-end gap-2 min-w-0 text-right">
                    {winner && winner !== 'draw' && resultStake > 0 && (
                      <div className={`shrink-0 flex items-center gap-1 text-lg font-black ${winner === 'black' ? 'text-yellow-300' : 'text-red-600'}`}>
                        {winner === 'black' ? <Trophy className="w-4 h-4 text-amber-300" /> : <XCircle className="w-4 h-4 text-red-600" />}
                        {winner === 'black' ? '+' : '-'}{formatCoinText(resultStake)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#f3ead8] truncate">{currentRoom.blackPlayer}</div>
                      {currentRoom.status === 'WAITING' ? (
                        <div className="text-[10px] font-semibold leading-tight mt-0.5 flex justify-end">
                          {currentRoom.blackReady ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              Đã sẵn sàng
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            </span>
                          ) : (
                            <span className="text-amber-300 animate-pulse flex items-center gap-1">
                              Chưa sẵn sàng
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className={`text-[10px] ${turn === 'black' ? (isMySide('black') ? 'text-[#8ce8b1] font-bold' : 'text-red-400 font-bold') : 'text-[#8fa195]'}`}>{formatClock(blackTime)}</div>
                      )}
                    </div>
                    <div
                      onClick={() => handleOpenPlayerProfile(currentRoom.blackPlayer)}
                      className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      style={{ background: `conic-gradient(${getPlayerHealthColor('black')} ${turn === 'black' ? moveTimerPercent : 100}%, rgba(255,255,255,.12) 0)` }}
                      title="Xem hồ sơ quân Đen"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#f5e4c8] to-[#cfa978] flex items-center justify-center border border-[#262422]">
                        <span className="text-[#24201c] font-semibold text-lg">將</span>
                      </div>
                      {currentRoom.status === 'WAITING' && currentRoom.blackReady && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#11281e] flex items-center justify-center shadow">
                          <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleInviteFriend}
                    className="flex items-center justify-end gap-2 text-right group cursor-pointer transition hover:scale-105"
                    title="Nhấn để mời bạn bè vào bàn"
                  >
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#8ce8b1] group-hover:text-white transition">
                        Mời bạn
                      </div>
                      <div className="text-[10px] text-[#8fa195]">
                        Nhấn để chia sẻ
                      </div>
                    </div>
                    <div className="w-11 h-11 rounded-full border-2 border-dashed border-[#5ec485]/60 group-hover:border-[#5ec485] bg-[#163827]/70 group-hover:bg-[#1f4d36] flex items-center justify-center transition shadow">
                      <Plus className="w-5 h-5 text-[#8ce8b1] group-hover:rotate-90 transition-transform duration-300" />
                    </div>
                  </button>
                )}
              </div>
            )}
            {mode === 'online' && currentRoom && (!currentRoom.redPlayer || !currentRoom.blackPlayer) && (
              <div className="mb-3 w-full max-w-lg px-4 py-2.5 rounded-2xl bg-[#142f22]/95 border border-[#5ec485]/60 shadow-lg flex items-center justify-between gap-3 text-xs animate-fade-in">
                <div className="flex items-center gap-2 text-[#f3ead8]">
                  <Users className="w-4 h-4 text-[#8ce8b1] shrink-0" />
                  <span>
                    Đang chờ bạn vào chơi! Mã phòng: <strong className="font-mono text-[#fef08a] text-sm bg-black/40 px-2 py-0.5 rounded border border-white/10">{currentRoom.roomId}</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(currentRoom.roomId);
                    showToast({
                      type: 'success',
                      title: 'ĐÃ SAO CHÉP MÃ PHÒNG',
                      message: `Đã sao chép mã phòng: ${currentRoom.roomId}. Hãy gửi mã này cho bạn bè!`,
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-[#25593f] hover:bg-[#2e6d4e] text-white font-bold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy mã</span>
                </button>
              </div>
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

            {winner && postMatchCountdown !== null && (
              <div className="w-full max-w-[550px] mt-3 py-2.5 px-4 rounded-2xl bg-[#11281e]/95 border border-[#5ec485]/40 text-xs font-semibold text-[#f3ead8] flex items-center justify-between shadow-xl animate-fade-in">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#61c887] animate-pulse shrink-0" />
                  <span>
                    Ván mới sẽ bắt đầu sau{' '}
                    <strong className="text-[#61c887] font-mono text-sm font-bold">
                      {postMatchCountdown}s
                    </strong>
                  </span>
                </div>
                <button
                  onClick={handleInstantNewGame}
                  className="px-3 py-1 rounded-xl bg-[#25593f] hover:bg-[#2f6f4f] text-white text-xs font-bold transition cursor-pointer shrink-0 shadow"
                >
                  Ván mới ngay
                </button>
              </div>
            )}
            {!winner && moveHistory.length > 0 && (
              <div className="w-full max-w-[550px] grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => {
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
                  }}
                  className="py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 text-red-200 border border-red-500/30 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5" /> Nhận thua
                </button>
                <button
                  onClick={() => {
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
                  }}
                  className="py-2.5 rounded-xl bg-black/30 hover:bg-black/45 text-[#d2cca6] border border-white/15 text-xs font-semibold cursor-pointer"
                >
                  Xin hòa
                </button>
              </div>
            )}
          </section>

          {/* RIGHT PANEL: Move History & Online Chat */}
          {!zenMode && (
            <aside className="w-full lg:w-[310px] flex flex-col gap-3 order-3">
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
