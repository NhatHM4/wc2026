package com.worldcup.bet.service;

import com.worldcup.bet.dto.BetRequest;
import com.worldcup.bet.dto.PayoutSimulationResult;
import com.worldcup.bet.entity.Bet;

import java.util.List;
import java.util.UUID;

public interface BetService {
    Bet placeBet(UUID userId, BetRequest request);
    List<Bet> getUserBets(UUID userId);
    void settleMatchBets(UUID matchId);
    PayoutSimulationResult simulateMatchPayout(UUID matchId, int homeScore, int awayScore);
}
