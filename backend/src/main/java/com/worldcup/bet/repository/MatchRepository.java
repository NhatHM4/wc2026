package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Match;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {
    Optional<Match> findByApiMatchId(Long apiMatchId);
    List<Match> findAllByOrderByMatchTimeAsc();
    List<Match> findByStatusOrderByMatchTimeAsc(String status);
}
