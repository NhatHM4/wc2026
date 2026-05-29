package com.worldcup.bet.repository;

import com.worldcup.bet.entity.SystemFund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.UUID;

@Repository
public interface SystemFundRepository extends JpaRepository<SystemFund, UUID> {
    
    default SystemFund findOrCreateSingleFund() {
        SystemFund fund = findAll().stream().findFirst().orElseGet(() -> {
            SystemFund newFund = SystemFund.builder()
                    .jackpotAmount(BigDecimal.ZERO)
                    .platformFeeCollected(BigDecimal.ZERO)
                    .systemMode("SIMULATION")
                    .build();
            return save(newFund);
        });
        if (fund.getSystemMode() == null) {
            fund.setSystemMode("SIMULATION");
            fund = save(fund);
        }
        return fund;
    }
}
