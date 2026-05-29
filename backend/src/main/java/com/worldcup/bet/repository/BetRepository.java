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
}
