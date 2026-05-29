package com.worldcup.bet.controller;

import com.worldcup.bet.dto.BetRequest;
import com.worldcup.bet.entity.Bet;
import com.worldcup.bet.entity.User;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.service.BetService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bets")
@RequiredArgsConstructor
public class BetController {

    private final BetService betService;
    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    private User getAuthenticatedUser(Principal principal) {
        if (principal == null) {
            throw new IllegalArgumentException("Người dùng chưa đăng nhập");
        }
        return userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng"));
    }

    @PostMapping
    public ResponseEntity<?> placeBet(Principal principal, @RequestBody BetRequest request) {
        try {
            User user = getAuthenticatedUser(principal);
            Bet bet = betService.placeBet(user.getId(), request);
            return ResponseEntity.ok(Map.of(
                    "message", "Đặt cược thành công!",
                    "bet", bet
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBets(Principal principal) {
        try {
            User user = getAuthenticatedUser(principal);
            List<Bet> bets = betService.getUserBets(user.getId());
            return ResponseEntity.ok(bets);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/settle/{matchId}")
    public ResponseEntity<?> forceSettleMatch(@PathVariable("matchId") UUID matchId) {
        try {
            betService.settleMatchBets(matchId);
            return ResponseEntity.ok(Map.of("message", "Thanh toán cược trận đấu thành công!"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/match/{matchId}")
    public ResponseEntity<?> getMatchBetsDetail(@PathVariable("matchId") UUID matchId) {
        try {
            String sql = "SELECT b.id, b.predicted_home_score, b.predicted_away_score, b.bet_amount, b.created_at, u.username " +
                         "FROM bets b " +
                         "JOIN users u ON b.user_id = u.id " +
                         "WHERE b.match_id = ? " +
                         "ORDER BY b.created_at DESC";
                         
            @SuppressWarnings("unchecked")
            List<Object[]> results = entityManager.createNativeQuery(sql)
                    .setParameter(1, matchId)
                    .getResultList();

            List<Map<String, Object>> list = new ArrayList<>();
            for (Object[] row : results) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", row[0]);
                map.put("predictedHomeScore", row[1]);
                map.put("predictedAwayScore", row[2]);
                map.put("betAmount", row[3]);
                map.put("createdAt", row[4]);
                map.put("username", row[5]);
                list.add(map);
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
