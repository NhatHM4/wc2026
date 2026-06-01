package com.worldcup.bet.controller;

import com.worldcup.bet.entity.Match;
import com.worldcup.bet.entity.User;
import com.worldcup.bet.repository.MatchRepository;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.repository.WalletRepository;
import com.worldcup.bet.service.BetService;
import com.worldcup.bet.service.MatchSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final MatchRepository matchRepository;
    private final BetService betService;
    private final PasswordEncoder passwordEncoder;
    private final SystemFundRepository systemFundRepository;
    private final MatchSyncService matchSyncService;
    private final WalletRepository walletRepository;

    // Lấy danh sách tất cả người dùng (không trả về mật khẩu)
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        try {
            List<Map<String, Object>> users = userRepository.findAll().stream().map(u -> Map.of(
                    "id", (Object) u.getId(),
                    "username", (Object) u.getUsername(),
                    "role", (Object) u.getRole(),
                    "approved", (Object) u.isApproved(),
                    "createdAt", (Object) u.getCreatedAt())).toList();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Phê duyệt tài khoản người dùng
    @PostMapping("/users/{userId}/approve")
    public ResponseEntity<?> approveUser(@PathVariable("userId") UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Không tìm thấy người dùng"));

            user.setApproved(true);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Đã phê duyệt tài khoản '" + user.getUsername() + "' thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Reset mật khẩu của người dùng bất kỳ
    @PostMapping("/users/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String userIdStr = request.get("userId");
            String newPassword = request.get("newPassword");

            if (userIdStr == null || userIdStr.isEmpty()) {
                throw new IllegalArgumentException("Không tìm thấy ID người dùng");
            }
            if (newPassword == null || newPassword.trim().isEmpty()) {
                throw new IllegalArgumentException("Mật khẩu mới không được để trống");
            }

            UUID userId = UUID.fromString(userIdStr);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Không tìm thấy người dùng"));

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity
                    .ok(Map.of("message", "Đã reset mật khẩu cho người dùng '" + user.getUsername() + "' thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Cập nhật tỉ số trận đấu và quyết toán tiền thưởng (Chỉ cho phép ở chế độ GIẢ
    // LẬP)
    @PutMapping("/matches/{matchId}/result")
    public ResponseEntity<?> updateResultAndSettle(
            @PathVariable("matchId") UUID matchId,
            @RequestBody Map<String, Object> body) {
        try {
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if ("REAL".equals(fund.getSystemMode())) {
                throw new IllegalArgumentException(
                        "Hệ thống đang ở chế độ THỰC TẾ. Không thể cập nhật tỉ số thủ công. Vui lòng chuyển sang chế độ GIẢ LẬP trong phần Cấu hình để test.");
            }

            Match match = matchRepository.findById(matchId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Không tìm thấy trận đấu"));

            String status = (String) body.get("status");
            Integer homeScore = (Integer) body.get("homeScore");
            Integer awayScore = (Integer) body.get("awayScore");

            if (status != null) {
                match.setStatus(status.toUpperCase());
            }
            if (homeScore != null) {
                match.setHomeScore(homeScore);
            }
            if (awayScore != null) {
                match.setAwayScore(awayScore);
            }

            Match updatedMatch = matchRepository.save(match);

            // Nếu trận đấu chuyển thành FINISHED và chưa được quyết toán, tự động chạy trả
            // thưởng
            if ("FINISHED".equals(updatedMatch.getStatus()) && !updatedMatch.isSettled()) {
                betService.settleMatchBets(updatedMatch.getId());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Cập nhật kết quả trận đấu và thanh toán thành công!",
                    "match", updatedMatch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Tạo trận đấu mới thủ công
    @PostMapping("/matches")
    public ResponseEntity<?> createMatch(@RequestBody Map<String, String> request) {
        try {
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if ("REAL".equals(fund.getSystemMode())) {
                throw new IllegalArgumentException("Hệ thống đang ở chế độ THỰC TẾ. Không thể tạo trận đấu thủ công. Vui lòng chuyển sang chế độ GIẢ LẬP.");
            }

            String homeTeam = request.get("homeTeam");
            String awayTeam = request.get("awayTeam");
            String matchTimeStr = request.get("matchTime");

            if (homeTeam == null || homeTeam.trim().isEmpty()) {
                throw new IllegalArgumentException("Tên đội nhà không được để trống");
            }
            if (awayTeam == null || awayTeam.trim().isEmpty()) {
                throw new IllegalArgumentException("Tên đội khách không được để trống");
            }
            if (matchTimeStr == null || matchTimeStr.trim().isEmpty()) {
                throw new IllegalArgumentException("Thời gian trận đấu không được để trống");
            }

            LocalDateTime matchTime = LocalDateTime.parse(matchTimeStr);

            // Sinh apiMatchId duy nhất bằng cách lấy timestamp hiện tại
            Long apiMatchId = System.currentTimeMillis();

            Match match = Match.builder()
                    .apiMatchId(apiMatchId)
                    .homeTeam(homeTeam)
                    .awayTeam(awayTeam)
                    .matchTime(matchTime)
                    .status("SCHEDULED")
                    .poolAmount(BigDecimal.ZERO)
                    .settled(false)
                    .build();

            Match savedMatch = matchRepository.save(match);

            return ResponseEntity.ok(Map.of(
                    "message", "Đã tạo trận đấu mới thành công!",
                    "match", savedMatch));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Thay đổi chế độ hệ thống (REAL hoặc SIMULATION)
    @PostMapping("/system/mode")
    public ResponseEntity<?> setSystemMode(@RequestBody Map<String, String> request) {
        try {
            String mode = request.get("mode");
            if (mode == null || (!"REAL".equalsIgnoreCase(mode) && !"SIMULATION".equalsIgnoreCase(mode))) {
                throw new IllegalArgumentException("Chế độ không hợp lệ. Chỉ chấp nhận 'REAL' hoặc 'SIMULATION'");
            }

            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            fund.setSystemMode(mode.toUpperCase());
            systemFundRepository.save(fund);

            return ResponseEntity.ok(Map.of(
                    "message",
                    "Đã chuyển hệ thống sang chế độ " + (mode.equalsIgnoreCase("REAL") ? "THỰC TẾ" : "GIẢ LẬP")
                            + " thành công!",
                    "systemMode", fund.getSystemMode()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Thay đổi chế độ mã hóa dữ liệu
    @PostMapping("/system/encrypt-mode")
    public ResponseEntity<?> setEncryptMode(@RequestBody Map<String, Boolean> request) {
        try {
            Boolean enabled = request.get("encryptMode");
            if (enabled == null) {
                throw new IllegalArgumentException("Cấu hình mã hóa không hợp lệ");
            }

            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            fund.setEncryptMode(enabled);
            systemFundRepository.save(fund);

            return ResponseEntity.ok(Map.of(
                    "message", "Đã " + (enabled ? "BẬT" : "TẮT") + " chế độ mã hóa dữ liệu thành công!",
                    "encryptMode", fund.isEncryptMode()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Đồng bộ tỉ số và trả thưởng từ API bóng đá ngay lập tức
    @PostMapping("/sync-matches")
    public ResponseEntity<?> forceSyncMatches() {
        try {
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if ("SIMULATION".equals(fund.getSystemMode())) {
                throw new IllegalArgumentException("Hệ thống đang ở chế độ GIẢ LẬP. Không thể đồng bộ từ API.");
            }

            // Bước 1: Đồng bộ dữ liệu mới nhất từ API
            List<Match> matches = matchSyncService.syncWorldCupMatches();

            // Bước 2: Quét các trận đã kết thúc để chia thưởng
            int settledCount = 0;
            for (Match match : matches) {
                if ("FINISHED".equals(match.getStatus()) && !match.isSettled()) {
                    betService.settleMatchBets(match.getId());
                    settledCount++;
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Đồng bộ và quyết toán thành công từ Football API!",
                    "count", matches.size(),
                    "settledCount", settledCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // Reset số dư ví của người dùng về 0
    @PostMapping("/users/{userId}/reset-balance")
    public ResponseEntity<?> resetUserBalance(@PathVariable("userId") UUID userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Không tìm thấy người dùng"));

            com.worldcup.bet.entity.Wallet wallet = walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Không tìm thấy ví của người dùng"));

            wallet.setBalance(BigDecimal.ZERO);
            walletRepository.save(wallet);

            return ResponseEntity.ok(Map.of("message", "Đã reset số dư của tài khoản '" + user.getUsername() + "' về 0 VND thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
