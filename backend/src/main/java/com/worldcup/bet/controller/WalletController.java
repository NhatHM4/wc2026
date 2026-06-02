package com.worldcup.bet.controller;

import com.worldcup.bet.dto.TransactionRequest;
import com.worldcup.bet.entity.Transaction;
import com.worldcup.bet.entity.User;
import com.worldcup.bet.entity.Wallet;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.service.WalletService;
import com.worldcup.bet.service.VietQrService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;
    private final UserRepository userRepository;
    private final VietQrService vietQrService;

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
            String desc = request.getDescription() != null ? request.getDescription() : "Nạp tiền giả lập vào tài khoản";
            Wallet wallet = walletService.deposit(user.getId(), request.getAmount(), desc);
            return ResponseEntity.ok(Map.of(
                    "message", "Nạp tiền thành công",
                    "balance", wallet.getBalance()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/deposit/qr")
    public ResponseEntity<?> generateDepositQR(Principal principal, @RequestBody TransactionRequest request) {
        try {
            if (request.getAmount() == null || request.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Số tiền nạp phải lớn hơn 0");
            }
            User user = getAuthenticatedUser(principal);
            
            // 1. Tạo nội dung chuyển khoản addInfo
            String sanitizedUsername = user.getUsername().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            String addInfo = "WC2026 NAP " + sanitizedUsername;
            
            // 2. Tạo giao dịch PENDING trước trong DB
            Transaction pendingTx = walletService.createPendingDeposit(user.getId(), request.getAmount(), addInfo);
            
            // 3. Gọi VietQR API sinh mã QR
            Map<String, Object> qrDetails = vietQrService.generateQrCode(request.getAmount(), user.getUsername());
            
            // 4. Bổ sung transactionId vào kết quả trả về
            Map<String, Object> response = new java.util.HashMap<>(qrDetails);
            response.put("transactionId", pendingTx.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/transactions/{id}/status")
    public ResponseEntity<?> getTransactionStatus(@PathVariable("id") UUID transactionId) {
        try {
            Transaction tx = walletService.getTransactionById(transactionId);
            
            // Tự động kiểm tra quá hạn 5 phút (300 giây)
            if ("PENDING".equals(tx.getStatus())) {
                java.time.Duration duration = java.time.Duration.between(tx.getCreatedAt(), java.time.LocalDateTime.now());
                if (duration.getSeconds() > 300) {
                    walletService.updateTransactionStatus(transactionId, "EXPIRED");
                    return ResponseEntity.ok(Map.of("status", "EXPIRED"));
                }
            }
            
            return ResponseEntity.ok(Map.of("status", tx.getStatus()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/transactions/{id}/cancel")
    public ResponseEntity<?> cancelTransaction(@PathVariable("id") UUID transactionId) {
        try {
            Transaction tx = walletService.getTransactionById(transactionId);
            if ("PENDING".equals(tx.getStatus())) {
                walletService.updateTransactionStatus(transactionId, "CANCELLED");
                return ResponseEntity.ok(Map.of("message", "Đã hủy giao dịch thành công"));
            }
            return ResponseEntity.badRequest().body(Map.of("message", "Giao dịch không ở trạng thái chờ"));
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
