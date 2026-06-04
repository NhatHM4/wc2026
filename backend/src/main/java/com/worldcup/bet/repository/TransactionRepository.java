package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findByWalletIdOrderByCreatedAtDesc(UUID walletId);
    List<Transaction> findByDescriptionAndAmountAndStatusOrderByCreatedAtAsc(String description, BigDecimal amount, String status);
    boolean existsByBankTxId(String bankTxId);
    Optional<Transaction> findByBankTxId(String bankTxId);
    boolean existsByDescriptionAndStatus(String description, String status);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.type = :type AND t.status = :status")
    BigDecimal sumAmountByTypeAndStatus(@Param("type") String type, @Param("status") String status);

    @Query("SELECT t FROM Transaction t WHERE t.type = 'WITHDRAW' AND t.description LIKE '%Reset%' ORDER BY t.createdAt DESC")
    List<Transaction> findAdminResets();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE Transaction t SET t.type = 'BET_PLACED' WHERE t.type = 'WITHDRAW' AND t.description LIKE 'Đặt cược%'")
    int migrateLegacyBetTransactionsToBetPlaced();
}
