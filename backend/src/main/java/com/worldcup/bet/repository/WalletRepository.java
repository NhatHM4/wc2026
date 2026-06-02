package com.worldcup.bet.repository;

import com.worldcup.bet.entity.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, UUID> {
    Optional<Wallet> findByUserId(UUID userId);

    @org.springframework.data.jpa.repository.Query("SELECT SUM(w.balance) FROM Wallet w")
    java.math.BigDecimal sumBalance();
}
