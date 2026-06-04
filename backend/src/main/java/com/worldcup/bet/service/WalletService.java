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
    Wallet withdraw(UUID userId, BigDecimal amount, String description, String type);
    List<Transaction> getTransactions(UUID userId);
    Transaction createPendingDeposit(UUID userId, BigDecimal amount, String description);
    boolean completePendingDeposit(String addInfo, BigDecimal amount, String bankTxId);
    void updateTransactionStatus(UUID transactionId, String status);
    Transaction getTransactionById(UUID transactionId);
}
