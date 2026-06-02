package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {
    Optional<Match> findByApiMatchId(Long apiMatchId);
    List<Match> findAllByOrderByMatchTimeAsc();
    List<Match> findByStatusOrderByMatchTimeAsc(String status);

    @Query("SELECT SUM(m.poolAmount) FROM Match m WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000 AND m.settled = false")
    BigDecimal sumRealPoolAmountBySettledFalse();

    @Query("SELECT m FROM Match m WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000 AND m.settled = true ORDER BY m.matchTime DESC")
    List<Match> findSettledRealMatchesOrderByMatchTimeDesc();

    @Query("SELECT m FROM Match m WHERE m.apiMatchId > 100004 AND m.apiMatchId < 1000000000 AND m.settled = true ORDER BY m.matchTime ASC")
    List<Match> findSettledRealMatchesOrderByMatchTimeAsc();
}
