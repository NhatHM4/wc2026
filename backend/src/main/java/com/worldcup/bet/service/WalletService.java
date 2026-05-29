package com.worldcup.bet.service;

import com.worldcup.bet.entity.Transaction;
import com.worldcup.bet.entity.Wallet;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface WalletService {
    Wallet createWallet(UUID userId);
    Wallet getWalletByUserId(UUID userId);
    Wallet deposit(UUID userId, BigDecimal amount, String description);
    Wallet withdraw(UUID userId, BigDecimal amount, String description);
    List<Transaction> getTransactions(UUID userId);
}
