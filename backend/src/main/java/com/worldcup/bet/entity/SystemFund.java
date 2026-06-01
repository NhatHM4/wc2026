package com.worldcup.bet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "system_fund")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemFund extends BaseEntity {

    @Column(name = "jackpot_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal jackpotAmount;

    @Column(name = "platform_fee_collected", nullable = false, precision = 15, scale = 2)
    private BigDecimal platformFeeCollected;

    @Column(name = "system_mode")
    private String systemMode; // REAL, SIMULATION

    @Column(name = "encrypt_mode", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private boolean encryptMode = false;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        if (this.jackpotAmount == null) {
            this.jackpotAmount = BigDecimal.ZERO;
        }
        if (this.platformFeeCollected == null) {
            this.platformFeeCollected = BigDecimal.ZERO;
        }
        if (this.systemMode == null) {
            this.systemMode = "SIMULATION";
        }
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
