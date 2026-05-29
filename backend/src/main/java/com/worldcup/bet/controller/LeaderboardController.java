package com.worldcup.bet.controller;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
@RequiredArgsConstructor
public class LeaderboardController {

    @PersistenceContext
    private EntityManager entityManager;

    @GetMapping
    public ResponseEntity<?> getLeaderboard(@RequestParam(value = "sortBy", defaultValue = "win_rate") String sortBy) {
        // Truy vấn tổng số trận đấu tham gia, số trận thắng, số trận thua và tổng tiền ăn (payout) của mỗi user (loại trừ OWNER/ADMIN)
        String sql = "SELECT u.id, u.username, " +
                     "COALESCE(m.total_matches, 0) as total_matches, " +
                     "COALESCE(m.win_matches, 0) as win_matches, " +
                     "COALESCE(m.loss_matches, 0) as loss_matches, " +
                     "COALESCE(m.total_win_amount, 0) as total_win_amount " +
                     "FROM users u " +
                     "LEFT JOIN (" +
                     "  SELECT sub.user_id, " +
                     "  COUNT(sub.match_id) as total_matches, " +
                     "  SUM(sub.is_win) as win_matches, " +
                     "  SUM(CASE WHEN sub.is_win = 0 THEN 1 ELSE 0 END) as loss_matches, " +
                     "  SUM(sub.match_win_amount) as total_win_amount " +
                     "  FROM (" +
                     "    SELECT b.user_id, b.match_id, " +
                     "    MAX(CASE WHEN b.payout_amount > 0 THEN 1 ELSE 0 END) as is_win, " +
                     "    SUM(b.payout_amount) as match_win_amount " +
                     "    FROM bets b " +
                     "    WHERE b.settled = true " +
                     "    GROUP BY b.user_id, b.match_id" +
                     "  ) sub " +
                     "  GROUP BY sub.user_id" +
                     ") m ON u.id = m.user_id " +
                     "WHERE u.role <> 'OWNER'";

        List<Object[]> results = entityManager.createNativeQuery(sql).getResultList();

        List<Map<String, Object>> list = new ArrayList<>();

        for (Object[] row : results) {
            Map<String, Object> map = new HashMap<>();
            
            String username = (String) row[1];
            long totalBets = ((Number) (row[2] != null ? row[2] : 0)).longValue();
            long winBets = ((Number) (row[3] != null ? row[3] : 0)).longValue();
            long lossBets = ((Number) (row[4] != null ? row[4] : 0)).longValue();
            
            BigDecimal totalWinAmount = BigDecimal.ZERO;
            if (row[5] != null) {
                if (row[5] instanceof BigDecimal) {
                    totalWinAmount = (BigDecimal) row[5];
                } else {
                    totalWinAmount = new BigDecimal(row[5].toString());
                }
            }

            double winRate = totalBets > 0 ? (double) winBets / totalBets : 0.0;
            double lossRate = totalBets > 0 ? (double) lossBets / totalBets : 0.0;

            map.put("username", username);
            map.put("totalBets", totalBets);
            map.put("winBets", winBets);
            map.put("lossBets", lossBets);
            map.put("totalWinAmount", totalWinAmount);
            map.put("winRate", winRate);
            map.put("lossRate", lossRate);

            list.add(map);
        }

        // Sắp xếp danh sách dựa trên tham số sortBy
        if ("total_win_amount".equalsIgnoreCase(sortBy)) {
            list.sort((a, b) -> {
                int cmp = ((BigDecimal) b.get("totalWinAmount")).compareTo((BigDecimal) a.get("totalWinAmount"));
                if (cmp != 0) return cmp;
                return Double.compare((Double) b.get("winRate"), (Double) a.get("winRate"));
            });
        } else if ("loss_rate".equalsIgnoreCase(sortBy)) {
            list.sort((a, b) -> {
                int cmp = Double.compare((Double) b.get("lossRate"), (Double) a.get("lossRate"));
                if (cmp != 0) return cmp;
                return Long.compare((Long) b.get("totalBets"), (Long) a.get("totalBets"));
            });
        } else {
            // Mặc định: win_rate (tỉ lệ thắng)
            list.sort((a, b) -> {
                int cmp = Double.compare((Double) b.get("winRate"), (Double) a.get("winRate"));
                if (cmp != 0) return cmp;
                return ((BigDecimal) b.get("totalWinAmount")).compareTo((BigDecimal) a.get("totalWinAmount"));
            });
        }

        // Lấy top 10 và gán thứ hạng
        List<Map<String, Object>> leaderboard = new ArrayList<>();
        int rank = 1;
        for (int i = 0; i < Math.min(10, list.size()); i++) {
            Map<String, Object> entry = list.get(i);
            entry.put("rank", rank++);
            leaderboard.add(entry);
        }

        return ResponseEntity.ok(leaderboard);
    }
}
