package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId);
    Optional<Transaction> findByDescriptionAndAmountAndStatus(String description, BigDecimal amount, String status);
    boolean existsByBankTxId(String bankTxId);
    Optional<Transaction> findByBankTxId(String bankTxId);
}
