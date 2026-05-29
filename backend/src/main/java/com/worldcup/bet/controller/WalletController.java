package com.worldcup.bet.controller;

import com.worldcup.bet.dto.TransactionRequest;
import com.worldcup.bet.entity.Transaction;
import com.worldcup.bet.entity.User;
import com.worldcup.bet.entity.Wallet;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Người dùng chưa đăng nhập");
        }
        return userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));
    }

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(Principal principal) {
        try {
            User user = getAuthenticatedUser(principal);
            Wallet wallet = walletService.getWalletByUserId(user.getId());
            return ResponseEntity.ok(Map.of("balance", wallet.getBalance()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(Principal principal, @RequestBody TransactionRequest request) {
        try {
            User user = getAuthenticatedUser(principal);
            Wallet wallet = walletService.deposit(user.getId(), request.getAmount(), "Nạp tiền giả lập vào tài khoản");
            return ResponseEntity.ok(Map.of(
                    "message", "Nạp tiền thành công",
                    "balance", wallet.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(Principal principal, @RequestBody TransactionRequest request) {
        try {
            User user = getAuthenticatedUser(principal);
            Wallet wallet = walletService.withdraw(user.getId(), request.getAmount(), "Rút tiền khỏi tài khoản");
            return ResponseEntity.ok(Map.of(
                    "message", "Rút tiền thành công",
                    "balance", wallet.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(Principal principal) {
        try {
            User user = getAuthenticatedUser(principal);
            List<Transaction> transactions = walletService.getTransactions(user.getId());
            return ResponseEntity.ok(transactions);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
