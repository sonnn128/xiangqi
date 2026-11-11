package com.sonnguyen.base.payload.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class XiangqiMoveRequest {
    private String player;
    private String side; // red or black
    private int fromRow;
    private int fromCol;
    private int toRow;
    private int toCol;
    private String piece;
    private String captured;
    private String notation;
    private String nextFen;
    private String nextTurn;
    private String winner;
    private String winReason;
    private Integer redTimeRemaining;
    private Integer blackTimeRemaining;
}

