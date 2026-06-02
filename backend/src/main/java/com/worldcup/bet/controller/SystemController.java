package com.worldcup.bet.controller;

import com.worldcup.bet.entity.SystemFund;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.repository.BetRepository;
import com.worldcup.bet.repository.TransactionRepository;
import com.worldcup.bet.repository.WalletRepository;
import com.worldcup.bet.repository.MatchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemFundRepository systemFundRepository;
    private final UserRepository userRepository;
    private final BetRepository betRepository;
    private final TransactionRepository transactionRepository;
    private final WalletRepository walletRepository;
    private final MatchRepository matchRepository;

    @GetMapping("/fund")
    public ResponseEntity<?> getSystemFund() {
        SystemFund fund = systemFundRepository.findOrCreateSingleFund();
        return ResponseEntity.ok(fund);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getSystemStats() {
        try {
            SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            
            long totalUsers = userRepository.count();
            long totalBetsCount = betRepository.countBetsOnRealMatches();
            
            BigDecimal totalBetsAmount = betRepository.sumRealBetAmount();
            if (totalBetsAmount == null) totalBetsAmount = BigDecimal.ZERO;
            
            BigDecimal totalPayoutsAmount = betRepository.sumRealPayoutAmount();
            if (totalPayoutsAmount == null) totalPayoutsAmount = BigDecimal.ZERO;
            
            BigDecimal totalDepositsAmount = transactionRepository.sumAmountByTypeAndStatus("DEPOSIT", "SUCCESS");
            if (totalDepositsAmount == null) totalDepositsAmount = BigDecimal.ZERO;

            BigDecimal totalWithdrawalsAmount = transactionRepository.sumAmountByTypeAndStatus("WITHDRAW", "SUCCESS");
            if (totalWithdrawalsAmount == null) {
                totalWithdrawalsAmount = BigDecimal.ZERO;
            } else {
                totalWithdrawalsAmount = totalWithdrawalsAmount.abs();
            }

            BigDecimal totalActiveMatchPools = matchRepository.sumRealPoolAmountBySettledFalse();
            if (totalActiveMatchPools == null) totalActiveMatchPools = BigDecimal.ZERO;
            
            BigDecimal totalWalletsBalance = walletRepository.sumBalance();
            if (totalWalletsBalance == null) totalWalletsBalance = BigDecimal.ZERO;

            // Dynamically calculate platform fee collected and jackpot amount for real matches
            BigDecimal platformFeeCollected = BigDecimal.ZERO;
            BigDecimal jackpotAmount = BigDecimal.ZERO;
            List<com.worldcup.bet.entity.Match> settledRealMatches = matchRepository.findSettledRealMatchesOrderByMatchTimeAsc();
            for (com.worldcup.bet.entity.Match m : settledRealMatches) {
                BigDecimal pool = m.getPoolAmount();
                if (pool.compareTo(BigDecimal.ZERO) <= 0) continue;
                
                BigDecimal fee = pool.multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_DOWN);
                BigDecimal netPool = pool.subtract(fee);
                
                platformFeeCollected = platformFeeCollected.add(fee);
                
                long winnersCount = betRepository.countWinningBetsByMatchId(m.getId());
                if (winnersCount == 0) {
                    jackpotAmount = jackpotAmount.add(netPool);
                } else {
                    jackpotAmount = BigDecimal.ZERO; // Reset distributed jackpot
                }
            }

            Map<String, Object> stats = new java.util.HashMap<>();
            stats.put("totalUsers", totalUsers);
            stats.put("totalBetsCount", totalBetsCount);
            stats.put("totalBetsAmount", totalBetsAmount);
            stats.put("totalPayoutsAmount", totalPayoutsAmount);
            stats.put("totalDepositsAmount", totalDepositsAmount);
            stats.put("totalWithdrawalsAmount", totalWithdrawalsAmount);
            stats.put("totalActiveMatchPools", totalActiveMatchPools);
            stats.put("totalWalletsBalance", totalWalletsBalance);
            stats.put("jackpotAmount", jackpotAmount);
            stats.put("platformFeeCollected", platformFeeCollected);
            stats.put("systemMode", fund.getSystemMode());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getSystemHistory() {
        try {
            // 1. Settle Logs (Lịch sử chia thưởng & Quỹ hệ thống) từ các trận đấu đã quyết toán
            List<com.worldcup.bet.entity.Match> settledMatches = matchRepository.findSettledRealMatchesOrderByMatchTimeDesc();
            
            List<Map<String, Object>> settleLogs = settledMatches.stream().map(match -> {
                BigDecimal pool = match.getPoolAmount();
                BigDecimal platformFee = pool.multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_DOWN);
                BigDecimal netPool = pool.subtract(platformFee);
                
                long winnersCount = betRepository.countWinningBetsByMatchId(match.getId());
                
                Map<String, Object> log = new java.util.HashMap<>();
                log.put("matchId", match.getId());
                log.put("homeTeam", match.getHomeTeam());
                log.put("awayTeam", match.getAwayTeam());
                log.put("homeScore", match.getHomeScore());
                log.put("awayScore", match.getAwayScore());
                log.put("matchTime", match.getMatchTime());
                log.put("poolAmount", pool);
                log.put("platformFee", platformFee);
                log.put("netPool", netPool);
                log.put("winnersCount", winnersCount);
                log.put("rolledToJackpot", winnersCount == 0 && pool.compareTo(BigDecimal.ZERO) > 0);
                
                return log;
            }).toList();

            // 2. Admin Reset Logs
            List<com.worldcup.bet.entity.Transaction> resets = transactionRepository.findAdminResets();
            List<Map<String, Object>> adminResetLogs = resets.stream().map(tx -> {
                String username = "N/A";
                Optional<com.worldcup.bet.entity.Wallet> walletOpt = walletRepository.findById(tx.getWalletId());
                if (walletOpt.isPresent()) {
                    Optional<com.worldcup.bet.entity.User> userOpt = userRepository.findById(walletOpt.get().getUserId());
                    if (userOpt.isPresent()) {
                        username = userOpt.get().getUsername();
                    }
                }
                
                Map<String, Object> log = new java.util.HashMap<>();
                log.put("id", tx.getId());
                log.put("username", username);
                log.put("amount", tx.getAmount().abs());
                log.put("description", tx.getDescription());
                log.put("createdAt", tx.getCreatedAt());
                return log;
            }).toList();

            Map<String, Object> history = new java.util.HashMap<>();
            history.put("settleLogs", settleLogs);
            history.put("adminResetLogs", adminResetLogs);
            
            return ResponseEntity.ok(history);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
