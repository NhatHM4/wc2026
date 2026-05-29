package com.worldcup.bet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction extends BaseEntity {

    @Column(name = "wallet_id", nullable = false)
    private UUID walletId;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false)
    private String type; // DEPOSIT, WITHDRAW, BET_PLACED, WIN_PAYOUT

    @Column
    private String description;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }
}
