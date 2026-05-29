package com.worldcup.bet;

import com.worldcup.bet.entity.*;
import com.worldcup.bet.repository.*;
import com.worldcup.bet.service.impl.BetServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BetServiceTest {

    @Mock
    private MatchRepository matchRepository;
    @Mock
    private BetRepository betRepository;
    @Mock
    private WalletRepository walletRepository;
    @Mock
    private TransactionRepository transactionRepository;
    @Mock
    private SystemFundRepository systemFundRepository;

    @InjectMocks
    private BetServiceImpl betService;

    private Match match;
    private SystemFund fund;
    private UUID matchId;

    @BeforeEach
    public void setUp() {
        matchId = UUID.randomUUID();
        match = Match.builder()
                .apiMatchId(12345L)
                .homeTeam("Vietnam")
                .awayTeam("Argentina")
                .matchTime(LocalDateTime.now())
                .status("FINISHED")
                .homeScore(2)
                .awayScore(1)
                .poolAmount(new BigDecimal("30000.00")) // 3 người đặt cược: 30k
                .settled(false)
                .build();
        match.setId(matchId);

        fund = SystemFund.builder()
                .jackpotAmount(new BigDecimal("10000.00")) // Jackpot tích lũy cũ là 10k
                .platformFeeCollected(BigDecimal.ZERO)
                .build();
    }

    @Test
    public void testSettleMatchBets_NoWinner_PushedToJackpot() {
        // Mocking
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(systemFundRepository.findOrCreateSingleFund()).thenReturn(fund);
        when(betRepository.findWinningBets(matchId, 2, 1)).thenReturn(Collections.emptyList());

        // Execute
        betService.settleMatchBets(matchId);

        // Verify
        assertTrue(match.isSettled());
        
        // Pool: 30k, 10% fee = 3k. Net Pool: 27k.
        // Không ai trúng: Jackpot cũ 10k + Net Pool 27k = 37k. Phí thu: 3k.
        assertTrue(new BigDecimal("37000.00").compareTo(fund.getJackpotAmount()) == 0);
        assertTrue(new BigDecimal("3000.00").compareTo(fund.getPlatformFeeCollected()) == 0);

        verify(matchRepository, times(1)).save(match);
        verify(systemFundRepository, times(1)).save(fund);
        verify(walletRepository, never()).save(any());
    }

    @Test
    public void testSettleMatchBets_MultipleWinners_SharedEqually() {
        UUID userAId = UUID.randomUUID();
        UUID userBId = UUID.randomUUID();

        Bet betA = Bet.builder()
                .userId(userAId)
                .matchId(matchId)
                .predictedHomeScore(2)
                .predictedAwayScore(1)
                .betAmount(new BigDecimal("10000.00"))
                .settled(false)
                .build();
        betA.setId(UUID.randomUUID());

        Bet betB = Bet.builder()
                .userId(userBId)
                .matchId(matchId)
                .predictedHomeScore(2)
                .predictedAwayScore(1)
                .betAmount(new BigDecimal("10000.00"))
                .settled(false)
                .build();
        betB.setId(UUID.randomUUID());

        Wallet walletA = Wallet.builder().userId(userAId).balance(BigDecimal.ZERO).build();
        walletA.setId(UUID.randomUUID());
        Wallet walletB = Wallet.builder().userId(userBId).balance(BigDecimal.ZERO).build();
        walletB.setId(UUID.randomUUID());

        // Mocking
        when(matchRepository.findById(matchId)).thenReturn(Optional.of(match));
        when(systemFundRepository.findOrCreateSingleFund()).thenReturn(fund);
        when(betRepository.findWinningBets(matchId, 2, 1)).thenReturn(Arrays.asList(betA, betB));
        when(walletRepository.findByUserId(userAId)).thenReturn(Optional.of(walletA));
        when(walletRepository.findByUserId(userBId)).thenReturn(Optional.of(walletB));

        // Execute
        betService.settleMatchBets(matchId);

        // Verify
        assertTrue(match.isSettled());
        
        // Pool: 30k. Fee: 3k. Net Pool: 27k.
        // Jackpot cũ: 10k. Tổng chia: 27k + 10k = 37k.
        // Có 2 người thắng: Mỗi người nhận 37k / 2 = 18.5k (18500 VND).
        assertTrue(new BigDecimal("18500.00").compareTo(betA.getPayoutAmount()) == 0);
        assertTrue(new BigDecimal("18500.00").compareTo(betB.getPayoutAmount()) == 0);
        assertTrue(betA.isSettled());
        assertTrue(betB.isSettled());

        assertTrue(new BigDecimal("18500.00").compareTo(walletA.getBalance()) == 0);
        assertTrue(new BigDecimal("18500.00").compareTo(walletB.getBalance()) == 0);
        
        // Jackpot reset về 0
        assertTrue(BigDecimal.ZERO.compareTo(fund.getJackpotAmount()) == 0);
        // Phí thu: 3k
        assertTrue(new BigDecimal("3000.00").compareTo(fund.getPlatformFeeCollected()) == 0);

        verify(matchRepository, times(1)).save(match);
        verify(systemFundRepository, times(1)).save(fund);
        verify(walletRepository, times(2)).save(any());
        verify(transactionRepository, times(2)).save(any());
    }
}
