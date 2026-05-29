package com.worldcup.bet.controller;

import com.worldcup.bet.entity.Match;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.service.MatchSyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/matches")
@RequiredArgsConstructor
public class MatchController {

    private final MatchSyncService matchSyncService;
    private final SystemFundRepository systemFundRepository;

    private boolean isSimulationMatch(Long apiMatchId) {
        if (apiMatchId == null) return true;
        if (apiMatchId >= 100001 && apiMatchId <= 100004) return true;
        if (apiMatchId >= 1000000000000L) return true;
        return false;
    }

    @GetMapping
    public ResponseEntity<?> getMatches(
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "team", required = false) String team) {
        try {
            List<Match> matches = matchSyncService.getAllMatches();

            // Lấy chế độ hệ thống hiện tại
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            String mode = fund.getSystemMode();

            // Lọc các trận đấu tương ứng với chế độ hệ thống
            if ("REAL".equals(mode)) {
                // Chỉ hiện trận đấu từ API
                matches = matches.stream()
                        .filter(m -> !isSimulationMatch(m.getApiMatchId()))
                        .toList();
            } else {
                // Chỉ hiện trận đấu giả lập/mock
                matches = matches.stream()
                        .filter(m -> isSimulationMatch(m.getApiMatchId()))
                        .toList();
            }

            // Lọc theo status nếu có
            if (status != null && !status.trim().isEmpty()) {
                matches = matches.stream()
                        .filter(m -> m.getStatus().equalsIgnoreCase(status.trim()))
                        .toList();
            }

            // Lọc theo tên đội bóng nếu có
            if (team != null && !team.trim().isEmpty()) {
                String search = team.trim().toLowerCase();
                matches = matches.stream()
                        .filter(m -> m.getHomeTeam().toLowerCase().contains(search) 
                                  || m.getAwayTeam().toLowerCase().contains(search))
                        .toList();
            }

            return ResponseEntity.ok(matches);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/sync")
    public ResponseEntity<?> forceSync() {
        try {
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if ("SIMULATION".equals(fund.getSystemMode())) {
                throw new IllegalArgumentException("Hệ thống đang ở chế độ GIẢ LẬP. Không thể đồng bộ lịch thi đấu từ API.");
            }
            List<Match> matches = matchSyncService.syncWorldCupMatches();
            return ResponseEntity.ok(Map.of(
                    "message", "Đồng bộ lịch thi đấu thành công!",
                    "count", matches.size()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
