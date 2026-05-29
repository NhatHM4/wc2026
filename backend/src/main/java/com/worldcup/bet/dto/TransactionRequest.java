package com.worldcup.bet.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class TransactionRequest {
    private BigDecimal amount;
}
