package com.worldcup.bet.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PayoutSimulationResult {
    private UUID matchId;
    private String homeTeam;
    private String awayTeam;
    private int homeScore;
    private int awayScore;
    private BigDecimal poolAmount;
    private BigDecimal platformFee;
    private BigDecimal netPool;
    private BigDecimal accumulatedJackpot;
    private BigDecimal totalPayoutPool;
    private int winningBetsCount;
    private BigDecimal payoutPerBet;
    private List<WinnerDetail> winners;
    private List<LoserDetail> losers;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class WinnerDetail {
        private String username;
        private BigDecimal payoutAmount;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class LoserDetail {
        private String username;
        private String predictedScore;
    }
}
