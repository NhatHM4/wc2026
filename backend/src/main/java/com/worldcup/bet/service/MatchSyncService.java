package com.worldcup.bet.service;

import com.worldcup.bet.entity.Match;

import java.util.List;

public interface MatchSyncService {
    List<Match> syncWorldCupMatches();
    List<Match> getAllMatches();
    List<Match> getMatchesByStatus(String status);
}
