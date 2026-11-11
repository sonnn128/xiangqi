package com.sonnguyen.base.model;

import jakarta.persistence.*;
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
@Table(name = "xiangqi_matches")
public class XiangqiMatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String roomId;
    private String roomName;
    private String redPlayer;
    private String blackPlayer;
    private String winner; // red, black, draw
    private String winReason;
    private Long betCoins;
    private Integer totalMoves;

    @Column(columnDefinition = "TEXT")
    private String moveHistoryJson;

    private Instant finishedAt;
}

