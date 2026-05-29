package com.worldcup.bet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "matches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Match extends BaseEntity {

    @Column(name = "api_match_id", nullable = false, unique = true)
    private Long apiMatchId;

    @Column(name = "home_team", nullable = false)
    private String homeTeam;

    @Column(name = "away_team", nullable = false)
    private String awayTeam;

    @Column(name = "match_time", nullable = false)
    private LocalDateTime matchTime;

    @Column(nullable = false)
    private String status; // SCHEDULED, IN_PLAY, FINISHED

    @Column(name = "home_score")
    private Integer homeScore;

    @Column(name = "away_score")
    private Integer awayScore;

    @Column(name = "pool_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal poolAmount;

    @Column(nullable = false)
    private boolean settled;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.poolAmount == null) {
            this.poolAmount = BigDecimal.ZERO;
        }
        this.settled = false;
    }
}
