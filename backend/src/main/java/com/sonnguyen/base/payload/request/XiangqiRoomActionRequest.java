package com.sonnguyen.base.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XiangqiRoomActionRequest {
    private String roomName;
    private String playerName;
    private String targetPlayer;
    private String preferredSide; // red, black, or auto
    private String message;
    private String winner;
    private String winReason;
    private String previousFen;
    private String previousTurn;
    private Integer timeLimitSeconds;
    private Integer moveTimeLimitSeconds;
    private Long betCoins;
    private Boolean ready;
}
