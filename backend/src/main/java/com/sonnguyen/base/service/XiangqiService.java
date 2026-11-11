package com.sonnguyen.base.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sonnguyen.base.model.*;
import com.sonnguyen.base.exception.CommonException;
import com.sonnguyen.base.payload.request.XiangqiMoveRequest;
import com.sonnguyen.base.payload.request.XiangqiRoomActionRequest;
import com.sonnguyen.base.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

@Service
@RequiredArgsConstructor
public class XiangqiService {

    public static final String INITIAL_FEN = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

    private final GameRoomRepository gameRoomRepository;
    private final UserRepository userRepository;
    private final XiangqiMatchRepository matchRepository;
    private final FriendshipRepository friendshipRepository;
    private final DirectMessageRepository directMessageRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    // Realtime Global Chat in-memory history (last 100 messages)
    private final List<Map<String, Object>> globalChatHistory = new CopyOnWriteArrayList<>();

    @PostConstruct
    public void initDefaultRooms() {
        if (!gameRoomRepository.existsById("VDKH01")) {
            GameRoom defaultRoom = GameRoom.builder()
                    .roomId("VDKH01")
                    .roomName("Vô Danh Kỳ Đài #1 (Cược 1k)")
                    .redPlayer(null)
                    .blackPlayer(null)
                    .status("WAITING")
                    .currentTurn("red")
                    .fen(INITIAL_FEN)
                    .moveHistoryJson("[]")
                    .chatHistoryJson("[]")
                    .timeLimitSeconds(600)
                    .betCoins(1000L)
                    .updatedAt(Instant.now())
                    .build();
            gameRoomRepository.save(defaultRoom);
        }
        if (!gameRoomRepository.existsById("VDKH02")) {
            GameRoom room2 = GameRoom.builder()
                    .roomId("VDKH02")
                    .roomName("Long Hổ Tranh Hùng #2 (Cược 5k)")
                    .redPlayer(null)
                    .blackPlayer(null)
                    .status("WAITING")
                    .currentTurn("red")
                    .fen(INITIAL_FEN)
                    .moveHistoryJson("[]")
                    .chatHistoryJson("[]")
                    .timeLimitSeconds(900)
                    .moveTimeLimitSeconds(60)
                    .betCoins(5000L)
                    .updatedAt(Instant.now())
                    .build();
            gameRoomRepository.save(room2);
        }
        if (globalChatHistory.isEmpty()) {
            Map<String, Object> welcome = new LinkedHashMap<>();
            welcome.put("id", UUID.randomUUID().toString());
            welcome.put("sender", "Hệ Thống");
            welcome.put("message", "Chào mừng các kỳ thủ đến với Kỳ Đài Vô Danh Kỳ Hữu! Chúc anh em kỳ nghệ thăng hoa! ☕");
            welcome.put("coins", 999999999L);
            welcome.put("timestamp", Instant.now().toEpochMilli());
            globalChatHistory.add(welcome);
        }
    }

    public List<GameRoom> listRooms() {
        List<GameRoom> rooms = gameRoomRepository.findAll();
        List<GameRoom> emptyRooms = new ArrayList<>();
        Set<String> activePlayers = new HashSet<>();

        rooms.sort(Comparator.comparing(
                GameRoom::getUpdatedAt,
                Comparator.nullsLast(Comparator.reverseOrder())
        ));

        for (GameRoom room : rooms) {
            if ("FINISHED".equals(room.getStatus())) continue;

            boolean changed = false;
            if (room.getRedPlayer() != null
                    && (userRepository.findByUsername(room.getRedPlayer()) == null
                    || !activePlayers.add(room.getRedPlayer()))) {
                room.setRedPlayer(null);
                room.setRedReady(false);
                changed = true;
            }
            if (room.getBlackPlayer() != null
                    && (userRepository.findByUsername(room.getBlackPlayer()) == null
                    || !activePlayers.add(room.getBlackPlayer()))) {
                room.setBlackPlayer(null);
                room.setBlackReady(false);
                changed = true;
            }

            if (changed) {
                room.setRedReady(false);
                room.setBlackReady(false);
                room.setStatus("WAITING");
                room.setCurrentTurn("red");
                room.setFen(INITIAL_FEN);
                room.setMoveHistoryJson("[]");
                room.setWinner(null);
                room.setWinReason(null);
                room.setUpdatedAt(Instant.now());
            }

            if (room.getRedPlayer() == null && room.getBlackPlayer() == null) {
                emptyRooms.add(room);
            } else if (changed) {
                gameRoomRepository.save(room);
            }
        }

        if (!emptyRooms.isEmpty()) {
            gameRoomRepository.deleteAll(emptyRooms);
            rooms.removeAll(emptyRooms);
        }

        rooms.removeIf(room -> "FINISHED".equals(room.getStatus()));

        return rooms;
    }

    public GameRoom getRoom(String roomId) {
        return gameRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phòng: " + roomId));
    }

    public GameRoom createRoom(XiangqiRoomActionRequest req) {
        releasePlayerFromOtherRooms(req.getPlayerName(), null);
        String roomId = generateRoomCode();
        String side = req.getPreferredSide() != null ? req.getPreferredSide().toLowerCase() : "red";
        String red = "black".equals(side) ? null : req.getPlayerName();
        String black = "black".equals(side) ? req.getPlayerName() : null;

        GameRoom room = GameRoom.builder()
                .roomId(roomId)
                .roomName(req.getRoomName() != null && !req.getRoomName().isBlank()
                        ? req.getRoomName()
                        : "Kỳ đài của " + req.getPlayerName())
                .hostPlayer(req.getPlayerName())
                .redPlayer(red)
                .blackPlayer(black)
                .status("WAITING")
                .currentTurn("red")
                .fen(INITIAL_FEN)
                .moveHistoryJson("[]")
                .chatHistoryJson("[]")
                .timeLimitSeconds(req.getTimeLimitSeconds() != null ? req.getTimeLimitSeconds() : 600)
                .moveTimeLimitSeconds(req.getMoveTimeLimitSeconds() != null ? req.getMoveTimeLimitSeconds() : 60)
                .redTimeRemaining(req.getTimeLimitSeconds() != null ? req.getTimeLimitSeconds() : 600)
                .blackTimeRemaining(req.getTimeLimitSeconds() != null ? req.getTimeLimitSeconds() : 600)
                .betCoins(req.getBetCoins() != null ? req.getBetCoins() : 0L)
                .updatedAt(Instant.now())
                .build();

        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom quickMatch(XiangqiRoomActionRequest req) {
        Long targetBet = req.getBetCoins() != null ? req.getBetCoins() : 1000L;
        String player = req.getPlayerName();

        List<GameRoom> rooms = gameRoomRepository.findAll();
        for (GameRoom r : rooms) {
            if ("WAITING".equals(r.getStatus())) {
                boolean sameBet = Objects.equals(r.getBetCoins(), targetBet);
                boolean hasSpace = r.getRedPlayer() == null || r.getBlackPlayer() == null;
                boolean notSamePlayer = !Objects.equals(r.getRedPlayer(), player) && !Objects.equals(r.getBlackPlayer(), player);

                if (sameBet && hasSpace && notSamePlayer) {
                    return joinRoom(r.getRoomId(), req);
                }
            }
        }

        req.setRoomName("Ghép Nhanh • " + formatCoins(targetBet));
        req.setPreferredSide("auto");
        return createRoom(req);
    }

    public GameRoom joinRoom(String roomId, XiangqiRoomActionRequest req) {
        GameRoom room = getRoom(roomId);
        String player = req.getPlayerName();
        String pref = req.getPreferredSide() != null ? req.getPreferredSide().toLowerCase() : "auto";

        if (!"spectator".equals(pref)) {
            releasePlayerFromOtherRooms(player, roomId);
        }

        if (player.equals(room.getRedPlayer()) || player.equals(room.getBlackPlayer())) {
            return room;
        }

        if ("red".equals(pref)) {
            if (room.getRedPlayer() == null) {
                room.setRedPlayer(player);
            } else if (room.getBlackPlayer() == null) {
                room.setBlackPlayer(player);
            }
        } else if ("black".equals(pref)) {
            if (room.getBlackPlayer() == null) {
                room.setBlackPlayer(player);
            } else if (room.getRedPlayer() == null) {
                room.setRedPlayer(player);
            }
        } else if ("spectator".equals(pref)) {
            // spectator
        } else {
            if (room.getRedPlayer() == null) {
                room.setRedPlayer(player);
            } else if (room.getBlackPlayer() == null) {
                room.setBlackPlayer(player);
            }
        }

        // Status remains WAITING until both sides are ready
        room.setStatus("WAITING");
        room.setRedReady(false);
        room.setBlackReady(false);

        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom leaveRoom(String roomId, String player) {
        GameRoom room = getRoom(roomId);
        if ("PLAYING".equals(room.getStatus())) {
            String winner = player != null && player.equals(room.getRedPlayer()) ? "black" : "red";
            String winReason = (player != null && player.equals(room.getRedPlayer()) ? "Đỏ" : "Đen") + " rời bàn và nhận thua";
            room.setWinner(winner);
            room.setWinReason(winReason);
            settleCoins(room, winner);
            recordMatchHistory(room, winner, winReason);
        }

        boolean removed = false;
        if (player != null && player.equals(room.getRedPlayer())) {
            room.setRedPlayer(null);
            room.setRedReady(false);
            removed = true;
        }
        if (player != null && player.equals(room.getBlackPlayer())) {
            room.setBlackPlayer(null);
            room.setBlackReady(false);
            removed = true;
        }
        if (!removed) return room;

        if (room.getRedPlayer() == null && room.getBlackPlayer() == null) {
            gameRoomRepository.delete(room);
            try {
                messagingTemplate.convertAndSend("/topic/rooms", listRooms());
            } catch (Exception ignored) {
            }
            return null;
        }

        room.setStatus("WAITING");
        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom kickPlayer(String roomId, String owner, String targetPlayer) {
        GameRoom room = getRoom(roomId);
        String roomOwner = room.getHostPlayer() != null ? room.getHostPlayer() : room.getRedPlayer();

        if (!Objects.equals(roomOwner, owner)) {
            throw new CommonException("Chỉ chủ phòng mới được đá người chơi!", HttpStatus.FORBIDDEN);
        }
        if ("PLAYING".equals(room.getStatus())) {
            throw new CommonException("Không thể đá người chơi khi ván đấu đã bắt đầu!", HttpStatus.BAD_REQUEST);
        }
        if (Objects.equals(roomOwner, targetPlayer)) {
            throw new CommonException("Không thể tự đá chủ phòng!", HttpStatus.BAD_REQUEST);
        }

        boolean removed = false;
        if (Objects.equals(room.getRedPlayer(), targetPlayer)) {
            room.setRedPlayer(null);
            room.setRedReady(false);
            removed = true;
        }
        if (Objects.equals(room.getBlackPlayer(), targetPlayer)) {
            room.setBlackPlayer(null);
            room.setBlackReady(false);
            removed = true;
        }
        if (!removed) {
            throw new CommonException("Không tìm thấy người chơi trong phòng!", HttpStatus.BAD_REQUEST);
        }

        room.setStatus("WAITING");
        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom makeMove(String roomId, XiangqiMoveRequest moveReq) {
        GameRoom room = getRoom(roomId);
        List<Map<String, Object>> history = parseJsonList(room.getMoveHistoryJson());

        Map<String, Object> moveEntry = new LinkedHashMap<>();
        moveEntry.put("side", moveReq.getSide());
        moveEntry.put("fromRow", moveReq.getFromRow());
        moveEntry.put("fromCol", moveReq.getFromCol());
        moveEntry.put("toRow", moveReq.getToRow());
        moveEntry.put("toCol", moveReq.getToCol());
        moveEntry.put("piece", moveReq.getPiece());
        moveEntry.put("captured", moveReq.getCaptured());
        moveEntry.put("notation", moveReq.getNotation());
        moveEntry.put("fenBefore", room.getFen());
        moveEntry.put("fenAfter", moveReq.getNextFen());
        moveEntry.put("timestamp", Instant.now().toEpochMilli());

        history.add(moveEntry);
        room.setMoveHistoryJson(toJson(history));

        String nextPosition = normalizePositionKey(moveReq.getNextFen());
        long repetitionCount = normalizePositionKey(room.getFen()).equals(nextPosition) ? 1 : 0;
        for (Map<String, Object> historyMove : history) {
            repetitionCount += normalizePositionKey(historyMove.get("fenAfter"))
                .equals(nextPosition) ? 1 : 0;
        }

        if (moveReq.getNextFen() != null && !moveReq.getNextFen().isBlank()) {
            room.setFen(moveReq.getNextFen());
        }
        if (moveReq.getNextTurn() != null && !moveReq.getNextTurn().isBlank()) {
            room.setCurrentTurn(moveReq.getNextTurn());
        } else {
            room.setCurrentTurn("red".equals(room.getCurrentTurn()) ? "black" : "red");
        }

        if (moveReq.getRedTimeRemaining() != null) {
            room.setRedTimeRemaining(moveReq.getRedTimeRemaining());
        }
        if (moveReq.getBlackTimeRemaining() != null) {
            room.setBlackTimeRemaining(moveReq.getBlackTimeRemaining());
        }

        String winner = moveReq.getWinner();
        String winReason = moveReq.getWinReason();
        if ((winner == null || winner.isBlank()) && repetitionCount >= 3) {
            winner = "draw";
            winReason = "Hòa do lặp lại thế cờ 3 lần (chiếu liên tục)";
        }

        if (winner != null && !winner.isBlank()) {
            room.setWinner(winner);
            room.setWinReason(winReason);
            room.setStatus("FINISHED");
            settleCoins(room, winner);
            recordMatchHistory(room, winner, winReason);
        } else {
            room.setStatus("PLAYING");
        }

        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom undoMove(String roomId, XiangqiRoomActionRequest req) {
        GameRoom room = getRoom(roomId);
        List<Map<String, Object>> history = parseJsonList(room.getMoveHistoryJson());
        if (!history.isEmpty()) {
            Map<String, Object> lastMove = history.remove(history.size() - 1);
            Object fenBefore = lastMove.get("fenBefore");
            Object side = lastMove.get("side");
            if (fenBefore != null) {
                room.setFen(fenBefore.toString());
            }
            if (side != null) {
                room.setCurrentTurn(side.toString());
            }
            room.setMoveHistoryJson(toJson(history));
            room.setWinner(null);
            room.setWinReason(null);
            room.setStatus("PLAYING");
            room.setUpdatedAt(Instant.now());
            room = gameRoomRepository.save(room);
            broadcastRoomUpdate(room);
        }
        return room;
    }

    public GameRoom resignOrFinish(String roomId, XiangqiRoomActionRequest req) {
        GameRoom room = getRoom(roomId);
        room.setWinner(req.getWinner());
        room.setWinReason(req.getWinReason() != null ? req.getWinReason() : "Đầu hàng");
        room.setStatus("FINISHED");
        room.setUpdatedAt(Instant.now());

        if (req.getWinner() != null) {
            settleCoins(room, req.getWinner());
            recordMatchHistory(room, req.getWinner(), room.getWinReason());
        }

        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom resetRoom(String roomId) {
        GameRoom room = getRoom(roomId);
        room.setFen(INITIAL_FEN);
        room.setCurrentTurn("red");
        room.setMoveHistoryJson("[]");
        room.setWinner(null);
        room.setWinReason(null);
        room.setRedReady(false);
        room.setBlackReady(false);
        int limit = room.getTimeLimitSeconds() != null ? room.getTimeLimitSeconds() : 600;
        room.setRedTimeRemaining(limit);
        room.setBlackTimeRemaining(limit);
        room.setStatus("WAITING");
        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom setPlayerReady(String roomId, String player, boolean ready) {
        GameRoom room = getRoom(roomId);
        if (player != null && player.equals(room.getRedPlayer())) {
            room.setRedReady(ready);
        } else if (player != null && player.equals(room.getBlackPlayer())) {
            room.setBlackReady(ready);
        }

        if (room.getRedPlayer() != null && room.getBlackPlayer() != null
                && Boolean.TRUE.equals(room.getRedReady())
                && Boolean.TRUE.equals(room.getBlackReady())) {
            room.setStatus("PLAYING");
        } else if (!"FINISHED".equals(room.getStatus())) {
            room.setStatus("WAITING");
        }

        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom resolveReadyTimeout(String roomId) {
        GameRoom room = getRoom(roomId);
        boolean hasBothPlayers = room.getRedPlayer() != null && room.getBlackPlayer() != null;
        boolean redReady = Boolean.TRUE.equals(room.getRedReady());
        boolean blackReady = Boolean.TRUE.equals(room.getBlackReady());

        if (hasBothPlayers && redReady != blackReady) {
            if (redReady) {
                room.setBlackPlayer(null);
                room.setBlackReady(false);
            } else {
                room.setRedPlayer(room.getBlackPlayer());
                room.setRedReady(true);
                room.setBlackPlayer(null);
                room.setBlackReady(false);
            }
            room.setStatus("WAITING");
        } else if (hasBothPlayers && redReady && blackReady) {
            room.setStatus("PLAYING");
        } else if (hasBothPlayers) {
            // Neither pressed ready in 20s -> unready players are kicked
            room.setBlackPlayer(null);
            room.setBlackReady(false);
            room.setRedReady(false);
            room.setStatus("WAITING");
        }

        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    public GameRoom addChatMessage(String roomId, XiangqiRoomActionRequest req) {
        GameRoom room = getRoom(roomId);
        List<Map<String, Object>> chats = parseJsonList(room.getChatHistoryJson());

        Map<String, Object> entry = new LinkedHashMap<>();
        entry.put("sender", req.getPlayerName());
        entry.put("message", req.getMessage());
        entry.put("timestamp", Instant.now().toEpochMilli());
        chats.add(entry);

        room.setChatHistoryJson(toJson(chats));
        room.setUpdatedAt(Instant.now());
        GameRoom saved = gameRoomRepository.save(room);
        broadcastRoomUpdate(saved);
        return saved;
    }

    // Realtime Global Chat
    public List<Map<String, Object>> getGlobalChatHistory() {
        return new ArrayList<>(globalChatHistory);
    }

    public Map<String, Object> sendGlobalChat(String sender, String message, Long coins) {
        if (message == null || message.trim().isBlank()) return null;

        Map<String, Object> msg = new LinkedHashMap<>();
        msg.put("id", UUID.randomUUID().toString());
        msg.put("sender", (sender != null && !sender.isBlank()) ? sender : "Kỳ Hữu");
        msg.put("message", message.trim());
        msg.put("coins", coins != null ? coins : 20000L);
        msg.put("timestamp", Instant.now().toEpochMilli());

        globalChatHistory.add(msg);
        if (globalChatHistory.size() > 100) {
            globalChatHistory.remove(0);
        }

        try {
            messagingTemplate.convertAndSend("/topic/global-chat", msg);
        } catch (Exception ignored) {
        }
        return msg;
    }

    // User Coin Management
    public Long getUserCoins(String username) {
        if (username == null || username.isBlank()) return 20000L;
        User user = userRepository.findByUsername(username);
        return (user != null && user.getCoins() != null) ? user.getCoins() : 20000L;
    }

    public Long claimDailyReward(String username) {
        if (username == null || username.isBlank()) {
            throw new CommonException("Vui lòng đăng nhập để nhận thưởng điểm danh!", HttpStatus.BAD_REQUEST);
        }
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new CommonException("Không tìm thấy thông tin tài khoản người dùng!", HttpStatus.BAD_REQUEST);
        }

        LocalDate today = LocalDate.now();
        if (user.getLastDailyClaimDate() != null && user.getLastDailyClaimDate().isEqual(today)) {
            throw new CommonException("Hôm nay bạn đã nhận thưởng điểm danh rồi! Hãy quay lại vào ngày mai nhé.", HttpStatus.BAD_REQUEST);
        }

        Long current = user.getCoins() != null ? user.getCoins() : 0L;
        user.setCoins(current + 10000L);
        user.setLastDailyClaimDate(today);
        userRepository.save(user);
        return user.getCoins();
    }

    private void settleCoins(GameRoom room, String winner) {
        Long bet = room.getBetCoins();
        if (bet == null || bet <= 0) return;

        String winnerPlayer = "red".equalsIgnoreCase(winner) ? room.getRedPlayer() : ("black".equalsIgnoreCase(winner) ? room.getBlackPlayer() : null);
        String loserPlayer = "red".equalsIgnoreCase(winner) ? room.getBlackPlayer() : ("black".equalsIgnoreCase(winner) ? room.getRedPlayer() : null);

        if (winnerPlayer != null && loserPlayer != null && !winnerPlayer.equalsIgnoreCase(loserPlayer)) {
            User winnerUser = userRepository.findByUsername(winnerPlayer);
            User loserUser = userRepository.findByUsername(loserPlayer);

            if (winnerUser != null) {
                winnerUser.setCoins((winnerUser.getCoins() != null ? winnerUser.getCoins() : 20000L) + bet);
                userRepository.save(winnerUser);
            }
            if (loserUser != null) {
                long cur = loserUser.getCoins() != null ? loserUser.getCoins() : 20000L;
                loserUser.setCoins(Math.max(0L, cur - bet));
                userRepository.save(loserUser);
            }
        }
    }

    // Match History Recording & Retrieval
    private void recordMatchHistory(GameRoom room, String winner, String winReason) {
        try {
            List<Map<String, Object>> moves = parseJsonList(room.getMoveHistoryJson());
            XiangqiMatch match = XiangqiMatch.builder()
                    .roomId(room.getRoomId())
                    .roomName(room.getRoomName())
                    .redPlayer(room.getRedPlayer())
                    .blackPlayer(room.getBlackPlayer())
                    .winner(winner)
                    .winReason(winReason)
                    .betCoins(room.getBetCoins() != null ? room.getBetCoins() : 0L)
                    .totalMoves(moves.size())
                    .moveHistoryJson(room.getMoveHistoryJson())
                    .finishedAt(Instant.now())
                    .build();
            matchRepository.save(match);
        } catch (Exception ignored) {
        }
    }

    public List<XiangqiMatch> getUserMatchHistory(String username) {
        if (username == null || username.isBlank()) {
            return matchRepository.findTop30ByOrderByFinishedAtDesc();
        }
        return matchRepository.findByUser(username);
    }

    public XiangqiMatch getMatchDetails(Long matchId) {
        return matchRepository.findById(matchId).orElse(null);
    }

    // Friends & Social System
    public List<Map<String, Object>> getFriendsList(String username) {
        List<Friendship> friendships = friendshipRepository.findAcceptedFriends(username);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Friendship f : friendships) {
            String friendName = f.getUserA().equalsIgnoreCase(username) ? f.getUserB() : f.getUserA();
            User friendUser = userRepository.findByUsername(friendName);
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("friendshipId", f.getId());
            map.put("username", friendName);
            map.put("coins", friendUser != null && friendUser.getCoins() != null ? friendUser.getCoins() : 20000L);
            map.put("status", "ACCEPTED");
            map.put("online", true);
            result.add(map);
        }
        return result;
    }

    public boolean addFriend(String fromUser, String toUser) {
        if (fromUser == null || toUser == null || fromUser.equalsIgnoreCase(toUser)) return false;
        User target = userRepository.findByUsername(toUser);
        if (target == null) return false;

        Optional<Friendship> existing = friendshipRepository.findBetween(fromUser, toUser);
        if (existing.isPresent()) {
            return false;
        }

        Friendship f = Friendship.builder()
                .userA(fromUser)
                .userB(toUser)
                .requestedBy(fromUser)
                .status("ACCEPTED")
                .createdAt(Instant.now())
                .build();
        friendshipRepository.save(f);

        try {
            messagingTemplate.convertAndSend("/topic/friends/" + toUser, Map.of("type", "FRIEND_ADDED", "username", fromUser));
            messagingTemplate.convertAndSend("/topic/friends/" + fromUser, Map.of("type", "FRIEND_ADDED", "username", toUser));
        } catch (Exception ignored) {
        }
        return true;
    }

    public boolean removeFriend(String user1, String user2) {
        Optional<Friendship> existing = friendshipRepository.findBetween(user1, user2);
        existing.ifPresent(friendshipRepository::delete);
        return true;
    }

    // Direct 1-on-1 Chat
    public List<DirectMessage> getDirectConversation(String user1, String user2) {
        if (user1 == null || user2 == null) return Collections.emptyList();
        return directMessageRepository.findConversation(user1, user2);
    }

    public DirectMessage sendDirectMessage(String sender, String recipient, String text) {
        if (text == null || text.trim().isBlank()) return null;
        DirectMessage msg = DirectMessage.builder()
                .sender(sender)
                .recipient(recipient)
                .message(text.trim())
                .timestamp(Instant.now())
                .build();
        DirectMessage saved = directMessageRepository.save(msg);

        try {
            messagingTemplate.convertAndSend("/topic/chat/direct/" + recipient, saved);
            messagingTemplate.convertAndSend("/topic/chat/direct/" + sender, saved);
        } catch (Exception ignored) {
        }
        return saved;
    }

    private void broadcastRoomUpdate(GameRoom room) {
        try {
            messagingTemplate.convertAndSend("/topic/room/" + room.getRoomId(), room);
            messagingTemplate.convertAndSend("/topic/rooms", listRooms());
        } catch (Exception ignored) {
        }
    }

    private String generateRoomCode() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        Random rnd = new Random();
        StringBuilder sb = new StringBuilder("VD");
        for (int i = 0; i < 4; i++) {
            sb.append(chars.charAt(rnd.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String formatCoins(Long coins) {
        if (coins == null || coins == 0) return "Miễn phí";
        if (coins >= 1000000) return (coins / 1000000) + "M xu";
        if (coins >= 1000) return (coins / 1000) + "k xu";
        return coins + " xu";
    }

    public Map<String, Object> getUserProfile(String username) {
        User user = userRepository.findByUsername(username);
        Map<String, Object> profile = new HashMap<>();
        profile.put("username", username);
        profile.put("displayName", user != null && user.getDisplayName() != null ? user.getDisplayName() : username);
        profile.put("birthDate", user != null && user.getBirthDate() != null ? user.getBirthDate() : "");
        profile.put("avatar", user != null && user.getAvatar() != null ? user.getAvatar() : "avatar_1");
        profile.put("coins", user != null && user.getCoins() != null ? user.getCoins() : 20000L);
        LocalDate today = LocalDate.now();
        boolean claimedDailyToday = user != null && user.getLastDailyClaimDate() != null && user.getLastDailyClaimDate().isEqual(today);
        profile.put("claimedDailyToday", claimedDailyToday);
        profile.put("lastDailyClaimDate", user != null && user.getLastDailyClaimDate() != null ? user.getLastDailyClaimDate().toString() : "");

        // Match statistics
        int totalMatches = 0;
        int wins = 0;
        int losses = 0;
        int draws = 0;
        try {
            List<XiangqiMatch> userMatches = matchRepository.findByUser(username);
            if (userMatches != null) {
                totalMatches = userMatches.size();
                for (XiangqiMatch m : userMatches) {
                    String winner = m.getWinner();
                    if ("draw".equalsIgnoreCase(winner)) {
                        draws++;
                    } else if ("red".equalsIgnoreCase(winner)) {
                        if (username.equalsIgnoreCase(m.getRedPlayer())) {
                            wins++;
                        } else {
                            losses++;
                        }
                    } else if ("black".equalsIgnoreCase(winner)) {
                        if (username.equalsIgnoreCase(m.getBlackPlayer())) {
                            wins++;
                        } else {
                            losses++;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }

        double winRate = totalMatches > 0 ? Math.round((wins * 100.0 / totalMatches) * 10.0) / 10.0 : 0.0;
        profile.put("totalMatches", totalMatches);
        profile.put("wins", wins);
        profile.put("losses", losses);
        profile.put("draws", draws);
        profile.put("winRate", winRate);

        return profile;
    }

    public Map<String, Object> updateUserProfile(String username, String displayName, String birthDate, String avatar) {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            user = new User();
            user.setUsername(username);
            user.setCoins(20000L);
        }
        if (displayName != null && !displayName.trim().isEmpty()) {
            user.setDisplayName(displayName.trim());
        }
        if (birthDate != null) {
            user.setBirthDate(birthDate.trim());
        }
        if (avatar != null && !avatar.trim().isEmpty()) {
            user.setAvatar(avatar.trim());
        }
        userRepository.save(user);
        return getUserProfile(username);
    }

    private List<Map<String, Object>> parseJsonList(String json) {
        if (json == null || json.isBlank()) {
            return new ArrayList<>();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "[]";
        }
    }

    private void releasePlayerFromOtherRooms(String player, String exceptRoomId) {
        if (player == null || player.isBlank()) return;

        for (GameRoom room : gameRoomRepository.findAll()) {
            if (Objects.equals(room.getRoomId(), exceptRoomId)
                    || "FINISHED".equals(room.getStatus())) {
                continue;
            }

            boolean removed = false;
            if (player.equals(room.getRedPlayer())) {
                room.setRedPlayer(null);
                removed = true;
            }
            if (player.equals(room.getBlackPlayer())) {
                room.setBlackPlayer(null);
                removed = true;
            }

            if (removed) {
                room.setRedReady(false);
                room.setBlackReady(false);
                room.setStatus("WAITING");
                room.setCurrentTurn("red");
                room.setFen(INITIAL_FEN);
                room.setMoveHistoryJson("[]");
                room.setWinner(null);
                room.setWinReason(null);
                room.setUpdatedAt(Instant.now());
                GameRoom saved = gameRoomRepository.save(room);
                broadcastRoomUpdate(saved);
            }
        }
    }

    private String normalizePositionKey(Object fen) {
        if (fen == null) return "";
        String[] parts = fen.toString().trim().split("\\s+");
        return parts.length >= 2 ? parts[0] + " " + parts[1] : fen.toString().trim();
    }
}
