package com.worldcup.bet.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class BetRequest {
    private UUID matchId;
    private Integer predictedHomeScore;
    private Integer predictedAwayScore;
}
