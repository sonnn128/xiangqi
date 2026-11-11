package com.sonnguyen.base.controller;

import com.sonnguyen.base.model.DirectMessage;
import com.sonnguyen.base.model.GameRoom;
import com.sonnguyen.base.model.XiangqiMatch;
import com.sonnguyen.base.payload.request.XiangqiMoveRequest;
import com.sonnguyen.base.payload.request.XiangqiRoomActionRequest;
import com.sonnguyen.base.payload.response.ApiResponse;
import com.sonnguyen.base.service.XiangqiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/xiangqi")
@RequiredArgsConstructor
public class XiangqiController {

    private final XiangqiService xiangqiService;

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<GameRoom>>> listRooms() {
        return ResponseEntity.ok(
                ApiResponse.<List<GameRoom>>builder()
                        .success(true)
                        .message("Danh sách phòng cờ")
                        .data(xiangqiService.listRooms())
                        .build()
        );
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ApiResponse<GameRoom>> getRoom(@PathVariable String roomId) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Thông tin phòng cờ")
                        .data(xiangqiService.getRoom(roomId))
                        .build()
        );
    }

    @PostMapping("/rooms")
    public ResponseEntity<ApiResponse<GameRoom>> createRoom(@RequestBody XiangqiRoomActionRequest req) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Tạo phòng thành công")
                        .data(xiangqiService.createRoom(req))
                        .build()
        );
    }

    @PostMapping("/quick-match")
    public ResponseEntity<ApiResponse<GameRoom>> quickMatch(@RequestBody XiangqiRoomActionRequest req) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Tìm trận thành công")
                        .data(xiangqiService.quickMatch(req))
                        .build()
        );
    }

    @PostMapping("/rooms/{roomId}/join")
    public ResponseEntity<ApiResponse<GameRoom>> joinRoom(
            @PathVariable String roomId,
            @RequestBody XiangqiRoomActionRequest req
    ) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Vào phòng thành công")
                        .data(xiangqiService.joinRoom(roomId, req))
                        .build()
        );
    }

        @PostMapping("/rooms/{roomId}/leave")
        public ResponseEntity<ApiResponse<GameRoom>> leaveRoom(
                        @PathVariable String roomId,
                        @RequestBody XiangqiRoomActionRequest req
        ) {
                return ResponseEntity.ok(
                                ApiResponse.<GameRoom>builder()
                                                .success(true)
                                                .message("Đã rời phòng")
                                                .data(xiangqiService.leaveRoom(roomId, req.getPlayerName()))
                                                .build()
                );
        }

        @PostMapping("/rooms/{roomId}/kick")
        public ResponseEntity<ApiResponse<GameRoom>> kickPlayer(
                        @PathVariable String roomId,
                        @RequestBody XiangqiRoomActionRequest req
        ) {
                return ResponseEntity.ok(
                                ApiResponse.<GameRoom>builder()
                                                .success(true)
                                                .message("Đã đá người chơi khỏi phòng")
                                                .data(xiangqiService.kickPlayer(roomId, req.getPlayerName(), req.getTargetPlayer()))
                                                .build()
                );
        }

    @PostMapping("/rooms/{roomId}/ready")
    public ResponseEntity<ApiResponse<GameRoom>> setReady(
            @PathVariable String roomId,
            @RequestBody XiangqiRoomActionRequest req
    ) {
        boolean ready = req.getReady() != null ? req.getReady() : true;
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Cập nhật trạng thái sẵn sàng")
                        .data(xiangqiService.setPlayerReady(roomId, req.getPlayerName(), ready))
                        .build()
        );
    }

        @PostMapping("/rooms/{roomId}/ready-timeout")
        public ResponseEntity<ApiResponse<GameRoom>> resolveReadyTimeout(@PathVariable String roomId) {
                return ResponseEntity.ok(
                                ApiResponse.<GameRoom>builder()
                                                .success(true)
                                                .message("Đã xử lý thời gian chuẩn bị")
                                                .data(xiangqiService.resolveReadyTimeout(roomId))
                                                .build()
                );
        }

    @PostMapping("/rooms/{roomId}/move")
    public ResponseEntity<ApiResponse<GameRoom>> makeMove(
            @PathVariable String roomId,
            @RequestBody XiangqiMoveRequest req
    ) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Đi quân thành công")
                        .data(xiangqiService.makeMove(roomId, req))
                        .build()
        );
    }

    @PostMapping("/rooms/{roomId}/undo")
    public ResponseEntity<ApiResponse<GameRoom>> undoMove(
            @PathVariable String roomId,
            @RequestBody(required = false) XiangqiRoomActionRequest req
    ) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Đã hoàn tác nước cờ")
                        .data(xiangqiService.undoMove(roomId, req))
                        .build()
        );
    }

    @PostMapping("/rooms/{roomId}/finish")
    public ResponseEntity<ApiResponse<GameRoom>> finishRoom(
            @PathVariable String roomId,
            @RequestBody XiangqiRoomActionRequest req
    ) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Kết thúc ván cờ")
                        .data(xiangqiService.resignOrFinish(roomId, req))
                        .build()
        );
    }

    @PostMapping("/rooms/{roomId}/reset")
    public ResponseEntity<ApiResponse<GameRoom>> resetRoom(@PathVariable String roomId) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Ván cờ mới đã sẵn sàng")
                        .data(xiangqiService.resetRoom(roomId))
                        .build()
        );
    }

    @PostMapping("/rooms/{roomId}/chat")
    public ResponseEntity<ApiResponse<GameRoom>> addChat(
            @PathVariable String roomId,
            @RequestBody XiangqiRoomActionRequest req
    ) {
        return ResponseEntity.ok(
                ApiResponse.<GameRoom>builder()
                        .success(true)
                        .message("Gửi tin nhắn thành công")
                        .data(xiangqiService.addChatMessage(roomId, req))
                        .build()
        );
    }

    // Realtime Global Chat Endpoints
    @GetMapping("/global-chat")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getGlobalChat() {
        return ResponseEntity.ok(
                ApiResponse.<List<Map<String, Object>>>builder()
                        .success(true)
                        .message("Lịch sử chat thế giới")
                        .data(xiangqiService.getGlobalChatHistory())
                        .build()
        );
    }

    @PostMapping("/global-chat")
    public ResponseEntity<ApiResponse<Map<String, Object>>> postGlobalChat(@RequestBody Map<String, Object> req) {
        String sender = (String) req.get("sender");
        String message = (String) req.get("message");
        Long coins = req.get("coins") != null ? Long.valueOf(req.get("coins").toString()) : 20000L;
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Đã gửi chat thế giới")
                        .data(xiangqiService.sendGlobalChat(sender, message, coins))
                        .build()
        );
    }

    // Coins & Daily Reward
    @GetMapping("/coins")
    public ResponseEntity<ApiResponse<Long>> getCoins(@RequestParam String username) {
        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Số dư xu")
                        .data(xiangqiService.getUserCoins(username))
                        .build()
        );
    }

    @PostMapping("/daily-reward")
    public ResponseEntity<ApiResponse<Long>> claimDailyReward(@RequestParam String username) {
        return ResponseEntity.ok(
                ApiResponse.<Long>builder()
                        .success(true)
                        .message("Đã nhận 10.000 xu điểm danh hàng ngày!")
                        .data(xiangqiService.claimDailyReward(username))
                        .build()
        );
    }

    // Profile Endpoints
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProfile(@RequestParam String username) {
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Thông tin cá nhân")
                        .data(xiangqiService.getUserProfile(username))
                        .build()
        );
    }

    @PostMapping("/profile")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProfile(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String displayName = payload.get("displayName");
        String birthDate = payload.get("birthDate");
        String avatar = payload.get("avatar");
        return ResponseEntity.ok(
                ApiResponse.<Map<String, Object>>builder()
                        .success(true)
                        .message("Cập nhật thông tin thành công!")
                        .data(xiangqiService.updateUserProfile(username, displayName, birthDate, avatar))
                        .build()
        );
    }

    // Match History Endpoints
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<XiangqiMatch>>> getMatchHistory(
            @RequestParam(required = false) String username
    ) {
        return ResponseEntity.ok(
                ApiResponse.<List<XiangqiMatch>>builder()
                        .success(true)
                        .message("Lịch sử thi đấu")
                        .data(xiangqiService.getUserMatchHistory(username))
                        .build()
        );
    }

    @GetMapping("/history/{matchId}")
    public ResponseEntity<ApiResponse<XiangqiMatch>> getMatchDetails(@PathVariable Long matchId) {
        return ResponseEntity.ok(
                ApiResponse.<XiangqiMatch>builder()
                        .success(true)
                        .message("Chi tiết ván cờ")
                        .data(xiangqiService.getMatchDetails(matchId))
                        .build()
        );
    }

    // Friends Endpoints
    @GetMapping("/friends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFriends(@RequestParam String username) {
        return ResponseEntity.ok(
                ApiResponse.<List<Map<String, Object>>>builder()
                        .success(true)
                        .message("Danh sách bạn bè")
                        .data(xiangqiService.getFriendsList(username))
                        .build()
        );
    }

    @PostMapping("/friends/add")
    public ResponseEntity<ApiResponse<Boolean>> addFriend(@RequestBody Map<String, String> req) {
        String fromUser = req.get("fromUser");
        String toUser = req.get("toUser");
        boolean ok = xiangqiService.addFriend(fromUser, toUser);
        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .success(ok)
                        .message(ok ? "Đã kết bạn thành công!" : "Không tìm thấy người chơi hoặc đã là bạn bè")
                        .data(ok)
                        .build()
        );
    }

    @PostMapping("/friends/remove")
    public ResponseEntity<ApiResponse<Boolean>> removeFriend(@RequestBody Map<String, String> req) {
        String user1 = req.get("user1");
        String user2 = req.get("user2");
        boolean ok = xiangqiService.removeFriend(user1, user2);
        return ResponseEntity.ok(
                ApiResponse.<Boolean>builder()
                        .success(true)
                        .message("Đã hủy kết bạn")
                        .data(ok)
                        .build()
        );
    }

    // Direct Messages Endpoints
    @GetMapping("/direct-chat")
    public ResponseEntity<ApiResponse<List<DirectMessage>>> getDirectChat(
            @RequestParam String user1,
            @RequestParam String user2
    ) {
        return ResponseEntity.ok(
                ApiResponse.<List<DirectMessage>>builder()
                        .success(true)
                        .message("Lịch sử tin nhắn riêng")
                        .data(xiangqiService.getDirectConversation(user1, user2))
                        .build()
        );
    }

    @PostMapping("/direct-chat")
    public ResponseEntity<ApiResponse<DirectMessage>> postDirectMessage(@RequestBody Map<String, String> req) {
        String sender = req.get("sender");
        String recipient = req.get("recipient");
        String message = req.get("message");
        return ResponseEntity.ok(
                ApiResponse.<DirectMessage>builder()
                        .success(true)
                        .message("Đã gửi tin nhắn riêng")
                        .data(xiangqiService.sendDirectMessage(sender, recipient, message))
                        .build()
        );
    }

    // WebSocket STOMP endpoints
    @MessageMapping("/room/{roomId}/move")
    public void wsMove(@DestinationVariable String roomId, @Payload XiangqiMoveRequest req) {
        xiangqiService.makeMove(roomId, req);
    }

    @MessageMapping("/room/{roomId}/ready")
    public void wsReady(@DestinationVariable String roomId, @Payload XiangqiRoomActionRequest req) {
        boolean ready = req.getReady() != null ? req.getReady() : true;
        xiangqiService.setPlayerReady(roomId, req.getPlayerName(), ready);
    }

    @MessageMapping("/room/{roomId}/chat")
    public void wsChat(@DestinationVariable String roomId, @Payload XiangqiRoomActionRequest req) {
        xiangqiService.addChatMessage(roomId, req);
    }

    @MessageMapping("/chat/global")
    public void wsGlobalChat(@Payload Map<String, Object> req) {
        String sender = (String) req.get("sender");
        String message = (String) req.get("message");
        Long coins = req.get("coins") != null ? Long.valueOf(req.get("coins").toString()) : 20000L;
        xiangqiService.sendGlobalChat(sender, message, coins);
    }

    @MessageMapping("/chat/direct")
    public void wsDirectChat(@Payload Map<String, String> req) {
        String sender = req.get("sender");
        String recipient = req.get("recipient");
        String message = req.get("message");
        xiangqiService.sendDirectMessage(sender, recipient, message);
    }
}
