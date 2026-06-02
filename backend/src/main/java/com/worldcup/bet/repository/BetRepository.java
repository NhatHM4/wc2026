package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Bet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BetRepository extends JpaRepository<Bet, UUID> {
    List<Bet> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Bet> findByMatchId(UUID matchId);

    @Query("SELECT b FROM Bet b WHERE b.matchId = :matchId " +
           "AND b.predictedHomeScore = :homeScore AND b.predictedAwayScore = :awayScore")
    List<Bet> findWinningBets(@Param("matchId") UUID matchId, 
                             @Param("homeScore") int homeScore, 
                             @Param("awayScore") int awayScore);

    boolean existsByUserIdAndMatchIdAndPredictedHomeScoreAndPredictedAwayScore(
            UUID userId, UUID matchId, Integer predictedHomeScore, Integer predictedAwayScore);

    @Query("SELECT COUNT(b) FROM Bet b JOIN Match m ON b.matchId = m.id WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000")
    long countBetsOnRealMatches();

    @Query("SELECT SUM(b.betAmount) FROM Bet b JOIN Match m ON b.matchId = m.id WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000")
    java.math.BigDecimal sumRealBetAmount();

    @Query("SELECT SUM(b.payoutAmount) FROM Bet b JOIN Match m ON b.matchId = m.id WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000 AND b.settled = true AND b.payoutAmount IS NOT NULL")
    java.math.BigDecimal sumRealPayoutAmount();

    @Query("SELECT COUNT(b) FROM Bet b WHERE b.matchId = :matchId AND b.settled = true AND b.payoutAmount > 0")
    long countWinningBetsByMatchId(@Param("matchId") UUID matchId);
}
