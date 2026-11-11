package com.sonnguyen.base.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "xiangqi_rooms")
public class GameRoom {
    @Id
    private String roomId;

    private String roomName;

    private String hostPlayer;

    private String redPlayer;

    private String blackPlayer;

    private String status; // WAITING, PLAYING, FINISHED

    private String currentTurn; // red, black

    @Column(length = 512)
    private String fen;

    @Column(columnDefinition = "TEXT")
    private String moveHistoryJson;

    @Column(columnDefinition = "TEXT")
    private String chatHistoryJson;

    private String winner; // red, black, draw, or null

    private String winReason;

    private Integer timeLimitSeconds;

    private Integer moveTimeLimitSeconds;

    private Integer redTimeRemaining;

    private Integer blackTimeRemaining;

    @Builder.Default
    private Long betCoins = 0L;

    @Builder.Default
    private Boolean redReady = false;

    @Builder.Default
    private Boolean blackReady = false;

    private Instant updatedAt;
}
