package com.worldcup.bet.service.impl;

import com.github.f4b6a3.uuid.UuidCreator;
import com.worldcup.bet.dto.BetRequest;
import com.worldcup.bet.entity.*;
import com.worldcup.bet.repository.*;
import com.worldcup.bet.service.BetService;
import com.worldcup.bet.service.WalletService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BetServiceImpl implements BetService {

    private final MatchRepository matchRepository;
    private final BetRepository betRepository;
    private final WalletRepository walletRepository;
    private final WalletService walletService;
    private final TransactionRepository transactionRepository;
    private final SystemFundRepository systemFundRepository;

    private static final BigDecimal FIXED_BET_AMOUNT = new BigDecimal("10000.00");

    @Override
    @Transactional
    public Bet placeBet(UUID userId, BetRequest request) {
        Match match = matchRepository.findById(request.getMatchId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trận đấu"));

        // Kiểm tra trận đấu chưa bắt đầu
        if (!"SCHEDULED".equals(match.getStatus()) || match.getMatchTime().isBefore(LocalDateTime.now(java.time.ZoneId.of("UTC")))) {
            throw new IllegalArgumentException("Trận đấu đã bắt đầu hoặc kết thúc, không thể đặt cược");
        }

        // Kiểm tra đã đặt cược tỉ số này chưa
        boolean alreadyBet = betRepository.existsByUserIdAndMatchIdAndPredictedHomeScoreAndPredictedAwayScore(
                userId, request.getMatchId(), request.getPredictedHomeScore(), request.getPredictedAwayScore());
        
        if (alreadyBet) {
            throw new IllegalArgumentException(String.format("Bạn đã đặt cược tỉ số %d - %d cho trận đấu này rồi",
                    request.getPredictedHomeScore(), request.getPredictedAwayScore()));
        }

        // Trừ tiền từ ví của người dùng (tự động kiểm tra số dư)
        String description = String.format("Đặt cược tỉ số %d-%d trận %s vs %s",
                request.getPredictedHomeScore(), request.getPredictedAwayScore(),
                match.getHomeTeam(), match.getAwayTeam());
        
        walletService.withdraw(userId, FIXED_BET_AMOUNT, description, "BET_PLACED");

        // Tạo vé cược mới
        Bet bet = Bet.builder()
                .userId(userId)
                .matchId(match.getId())
                .predictedHomeScore(request.getPredictedHomeScore())
                .predictedAwayScore(request.getPredictedAwayScore())
                .betAmount(FIXED_BET_AMOUNT)
                .build();
        
        Bet savedBet = betRepository.save(bet);

        // Cộng tiền vào pool trận đấu
        match.setPoolAmount(match.getPoolAmount().add(FIXED_BET_AMOUNT));
        matchRepository.save(match);

        return savedBet;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bet> getUserBets(UUID userId) {
        return betRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    @Transactional
    public void settleMatchBets(UUID matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy trận đấu"));

        if (match.isSettled() || !"FINISHED".equals(match.getStatus())) {
            return;
        }

        BigDecimal totalPool = match.getPoolAmount();
        if (totalPool.compareTo(BigDecimal.ZERO) <= 0) {
            match.setSettled(true);
            matchRepository.save(match);
            return; // Không có ai cược trận này
        }

        // 1. Trích phí hệ thống 10%
        BigDecimal platformFee = totalPool.multiply(new BigDecimal("0.10"));
        BigDecimal netPool = totalPool.subtract(platformFee);

        // Cập nhật doanh thu hệ thống
        SystemFund fund = systemFundRepository.findOrCreateSingleFund();
        fund.setPlatformFeeCollected(fund.getPlatformFeeCollected().add(platformFee));

        // 2. Tìm danh sách vé cược trúng tỉ số
        int actualHome = match.getHomeScore();
        int actualAway = match.getAwayScore();
        
        List<Bet> winningBets = betRepository.findWinningBets(matchId, actualHome, actualAway);

        if (winningBets.isEmpty()) {
            // Trường hợp không có ai thắng: Đẩy 90% số tiền cược vào Quỹ chung (Jackpot)
            fund.setJackpotAmount(fund.getJackpotAmount().add(netPool));
        } else {
            // Trường hợp có người thắng: Chia đều tiền thưởng Net Pool + Quỹ chung tích lũy cho các vé thắng
            BigDecimal currentJackpot = fund.getJackpotAmount();
            BigDecimal totalPayoutPool = netPool.add(currentJackpot);
            
            int winCount = winningBets.size();
            BigDecimal payoutPerBet = totalPayoutPool.divide(new BigDecimal(winCount), 2, RoundingMode.HALF_DOWN);

            // Reset Quỹ chung (Jackpot) vì đã được phân phối
            fund.setJackpotAmount(BigDecimal.ZERO);

            for (Bet bet : winningBets) {
                // Cập nhật trạng thái vé cược
                bet.setSettled(true);
                bet.setPayoutAmount(payoutPerBet);
                betRepository.save(bet);

                // Cộng tiền vào ví của User
                Wallet wallet = walletRepository.findByUserId(bet.getUserId())
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy ví người dùng"));
                wallet.setBalance(wallet.getBalance().add(payoutPerBet));
                walletRepository.save(wallet);

                // Ghi nhận lịch sử giao dịch ví (Tạo ID giao dịch bằng UUID v7)
                Transaction tx = Transaction.builder()
                        .walletId(wallet.getId())
                        .amount(payoutPerBet)
                        .type("WIN_PAYOUT")
                        .description(String.format("Thắng cược tỉ số %d-%d trận %s vs %s (Được chia từ Pool + Jackpot)", 
                                actualHome, actualAway, match.getHomeTeam(), match.getAwayTeam()))
                        .build();
                transactionRepository.save(tx);
            }
        }

        // 3. Đánh dấu tất cả các vé cược khác của trận này là đã quyết toán (thua cược)
        List<Bet> allBets = betRepository.findByMatchId(matchId);
        for (Bet bet : allBets) {
            if (!bet.isSettled()) {
                bet.setSettled(true);
                bet.setPayoutAmount(BigDecimal.ZERO);
                betRepository.save(bet);
            }
        }

        // 4. Cập nhật trạng thái trận đấu đã phân phối tiền thưởng
        match.setSettled(true);
        matchRepository.save(match);
        systemFundRepository.save(fund);
    }
}
