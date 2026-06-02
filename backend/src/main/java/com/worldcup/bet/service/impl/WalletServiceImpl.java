package com.worldcup.bet.service.impl;

import com.worldcup.bet.entity.Transaction;
import com.worldcup.bet.entity.Wallet;
import com.worldcup.bet.repository.TransactionRepository;
import com.worldcup.bet.repository.WalletRepository;
import com.worldcup.bet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class WalletServiceImpl implements WalletService {

    private final WalletRepository walletRepository;
    private final TransactionRepository transactionRepository;
    private final com.worldcup.bet.repository.UserRepository userRepository;

    @Override
    @Transactional
    public Wallet createWallet(UUID userId) {
        if (walletRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Ví đã tồn tại cho người dùng này");
        }
        Wallet wallet = Wallet.builder()
                .userId(userId)
                .balance(BigDecimal.ZERO)
                .build();
        return walletRepository.save(wallet);
    }

    @Override
    @Transactional(readOnly = true)
    public Wallet getWalletByUserId(UUID userId) {
        return walletRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ví của người dùng"));
    }

    @Override
    @Transactional
    public Wallet deposit(UUID userId, BigDecimal amount, String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }
        Wallet wallet = getWalletByUserId(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type("DEPOSIT")
                .description(description != null ? description : "Nạp tiền giả lập vào tài khoản")
                .build();
        transactionRepository.save(transaction);

        return wallet;
    }

    @Override
    @Transactional
    public Wallet withdraw(UUID userId, BigDecimal amount, String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền rút phải lớn hơn 0");
        }
        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("Số dư không đủ để thực hiện giao dịch");
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        walletRepository.save(wallet);

        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount.negate())
                .type("WITHDRAW")
                .description(description != null ? description : "Rút tiền khỏi tài khoản")
                .build();
        transactionRepository.save(transaction);

        return wallet;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Transaction> getTransactions(UUID userId) {
        return walletRepository.findByUserId(userId)
                .map(wallet -> transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId()))
                .orElse(Collections.emptyList());
    }

    @Override
    @Transactional
    public Transaction createPendingDeposit(UUID userId, BigDecimal amount, String description) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
        }
        Wallet wallet = getWalletByUserId(userId);

        String finalDescription = description;
        if (finalDescription == null) {
            finalDescription = generateUniqueCode();
        }

        Transaction transaction = Transaction.builder()
                .walletId(wallet.getId())
                .amount(amount)
                .type("DEPOSIT")
                .description(finalDescription)
                .status("PENDING")
                .build();

        return transactionRepository.save(transaction);
    }

    @Override
    @Transactional
    public boolean completePendingDeposit(String addInfo, BigDecimal amount, String bankTxId) {
        if (transactionRepository.existsByBankTxId(bankTxId)) {
            return false;
        }

        List<Transaction> pendingTxs = transactionRepository
                .findByDescriptionAndAmountAndStatusOrderByCreatedAtAsc(addInfo, amount, "PENDING");

        if (!pendingTxs.isEmpty()) {
            Transaction tx = pendingTxs.get(0);
            tx.setStatus("SUCCESS");
            tx.setBankTxId(bankTxId);
            transactionRepository.save(tx);

            Wallet wallet = walletRepository.findById(tx.getWalletId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ví"));
            wallet.setBalance(wallet.getBalance().add(amount));
            walletRepository.save(wallet);
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public void updateTransactionStatus(UUID transactionId, String status) {
        Transaction transaction = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));
        transaction.setStatus(status);
        transactionRepository.save(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public Transaction getTransactionById(UUID transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy giao dịch"));
    }

    private String generateUniqueCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        java.security.SecureRandom random = new java.security.SecureRandom();
        while (true) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            String code = sb.toString();
            if (!transactionRepository.existsByDescriptionAndStatus(code, "PENDING")) {
                return code;
            }
        }
    }
}
