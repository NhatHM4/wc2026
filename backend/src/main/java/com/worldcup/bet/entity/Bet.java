package com.worldcup.bet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bet extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "match_id", nullable = false)
    private UUID matchId;

    @Column(name = "predicted_home_score", nullable = false)
    private Integer predictedHomeScore;

    @Column(name = "predicted_away_score", nullable = false)
    private Integer predictedAwayScore;

    @Column(name = "bet_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal betAmount;

    @Column(nullable = false)
    private boolean settled;

    @Column(name = "payout_amount", precision = 15, scale = 2)
    private BigDecimal payoutAmount;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.betAmount == null) {
            this.betAmount = new BigDecimal("10000.00"); // Mặc định và cố định 10,000 VND
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
        this.settled = false;
    }
}
