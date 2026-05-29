package com.worldcup.bet.service.impl;

import com.worldcup.bet.entity.Match;
import com.worldcup.bet.repository.MatchRepository;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.service.MatchSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MatchSyncServiceImpl implements MatchSyncService {

    private final MatchRepository matchRepository;
    private final SystemFundRepository systemFundRepository;

    @Value("${football-api.token}")
    private String apiToken;

    @Value("${football-api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    @Transactional
    public List<Match> syncWorldCupMatches() {
        List<Match> syncedMatches = new ArrayList<>();
        
        // Kiểm tra xem có cấu hình API Token hợp lệ chưa, nếu chưa hoặc bị lỗi thì dùng mock data để chạy thử nghiệm
        if (apiToken == null || apiToken.isEmpty() || "YOUR_FOOTBALL_DATA_API_KEY".equals(apiToken)) {
            log.warn("API Token chưa được cấu hình. Hệ thống sẽ tự động khởi tạo dữ liệu Mock để kiểm thử.");
            return generateMockWorldCupMatches();
        }

        try {
            String url = baseUrl + "/competitions/WC/matches";
            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Auth-Token", apiToken);
            HttpEntity<String> entity = new HttpEntity<>(headers);

            ResponseEntity<FootballMatchResponse> response = restTemplate.exchange(
                    url, HttpMethod.GET, entity, FootballMatchResponse.class);

            if (response.getBody() != null && response.getBody().getMatches() != null) {
                for (FootballMatch apiMatch : response.getBody().getMatches()) {
                    // Chỉ đồng bộ các trận đấu đã xác định rõ cả 2 đội tuyển (để tránh lỗi NOT NULL DB và lọc bớt data trống)
                    if (apiMatch.getHomeTeam() == null || apiMatch.getHomeTeam().getName() == null ||
                        apiMatch.getAwayTeam() == null || apiMatch.getAwayTeam().getName() == null) {
                        continue;
                    }

                    Match match = matchRepository.findByApiMatchId(apiMatch.getId())
                            .orElse(new Match());

                    match.setApiMatchId(apiMatch.getId());
                    match.setHomeTeam(apiMatch.getHomeTeam().getName());
                    match.setAwayTeam(apiMatch.getAwayTeam().getName());
                    
                    // Parse thời gian từ UTC
                    ZonedDateTime utcTime = ZonedDateTime.parse(apiMatch.getUtcDate());
                    match.setMatchTime(utcTime.toLocalDateTime());

                    // Map status
                    // API status: SCHEDULED, TIMED, IN_PLAY, PAUSED, FINISHED, POSTPONED, SUSPENDED, CANCELLED
                    String apiStatus = apiMatch.getStatus();
                    if ("FINISHED".equals(apiStatus)) {
                        match.setStatus("FINISHED");
                        if (apiMatch.getScore() != null && apiMatch.getScore().getFullTime() != null) {
                            match.setHomeScore(apiMatch.getScore().getFullTime().getHome());
                            match.setAwayScore(apiMatch.getScore().getFullTime().getAway());
                        }
                    } else if ("IN_PLAY".equals(apiStatus) || "PAUSED".equals(apiStatus)) {
                        match.setStatus("IN_PLAY");
                    } else {
                        match.setStatus("SCHEDULED");
                    }

                    syncedMatches.add(matchRepository.save(match));
                }
                log.info("Đã đồng bộ thành công {} trận đấu từ Football-Data.org API", syncedMatches.size());
            }
        } catch (Exception e) {
            log.error("Lỗi khi đồng bộ lịch thi đấu từ API: {}. Sử dụng dữ liệu Mock.", e.getMessage());
            return generateMockWorldCupMatches();
        }

        return syncedMatches;
    }

    @Override
    @Transactional
    public List<Match> getAllMatches() {
        List<Match> matches = matchRepository.findAllByOrderByMatchTimeAsc();
        if (matches.isEmpty()) {
            com.worldcup.bet.entity.SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if ("REAL".equals(fund.getSystemMode())) {
                return syncWorldCupMatches();
            } else {
                return generateMockWorldCupMatches();
            }
        }
        return matches;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Match> getMatchesByStatus(String status) {
        return matchRepository.findByStatusOrderByMatchTimeAsc(status);
    }

    // Helper tạo dữ liệu Mock chất lượng để kiểm thử nhanh chóng
    private List<Match> generateMockWorldCupMatches() {
        List<Match> mockMatches = new ArrayList<>();

        // Kiểm tra xem đã có dữ liệu chưa để tránh tạo trùng lặp
        if (matchRepository.count() > 0) {
            // Mock transition for testing:
            // If "Hoa Kỳ (USA) vs Mexico" (100001L) is SCHEDULED, change it to FINISHED (3-0)
            matchRepository.findByApiMatchId(100001L).ifPresent(m -> {
                if ("SCHEDULED".equals(m.getStatus())) {
                    m.setStatus("FINISHED");
                    m.setHomeScore(3);
                    m.setAwayScore(0);
                    matchRepository.save(m);
                    log.info("MOCK REAL SYNC: Trận đấu Hoa Kỳ vs Mexico (100001L) chuyển sang FINISHED (3-0)");
                }
            });

            // If "Argentina vs Pháp" (100002L) is SCHEDULED, change it to FINISHED (0-0)
            matchRepository.findByApiMatchId(100002L).ifPresent(m -> {
                if ("SCHEDULED".equals(m.getStatus())) {
                    m.setStatus("FINISHED");
                    m.setHomeScore(0);
                    m.setAwayScore(0);
                    matchRepository.save(m);
                    log.info("MOCK REAL SYNC: Trận đấu Argentina vs Pháp (100002L) chuyển sang FINISHED (0-0)");
                }
            });

            // If "Brazil vs Đức" (100003L) is IN_PLAY, change it to FINISHED (2-1)
            matchRepository.findByApiMatchId(100003L).ifPresent(m -> {
                if ("IN_PLAY".equals(m.getStatus())) {
                    m.setStatus("FINISHED");
                    m.setHomeScore(2);
                    m.setAwayScore(1);
                    matchRepository.save(m);
                    log.info("MOCK REAL SYNC: Trận đấu Brazil vs Đức (100003L) chuyển sang FINISHED (2-1)");
                }
            });

            return matchRepository.findAllByOrderByMatchTimeAsc();
        }

        log.info("Khởi tạo danh sách trận đấu Mock World Cup 2026...");

        // Trận 1: Sắp thi đấu (Trong vòng 2 ngày tới)
        Match m1 = Match.builder()
                .apiMatchId(100001L)
                .homeTeam("Hoa Kỳ (USA)")
                .awayTeam("Mexico")
                .matchTime(LocalDateTime.now().plusDays(2))
                .status("SCHEDULED")
                .poolAmount(BigDecimal.ZERO)
                .settled(false)
                .build();
        m1.setId(com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch());
        mockMatches.add(matchRepository.save(m1));

        // Trận 2: Sắp thi đấu (Trong vòng 5 ngày tới)
        Match m2 = Match.builder()
                .apiMatchId(100002L)
                .homeTeam("Argentina")
                .awayTeam("Pháp (France)")
                .matchTime(LocalDateTime.now().plusDays(5))
                .status("SCHEDULED")
                .poolAmount(BigDecimal.ZERO)
                .settled(false)
                .build();
        m2.setId(com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch());
        mockMatches.add(matchRepository.save(m2));

        // Trận 3: Đang diễn ra
        Match m3 = Match.builder()
                .apiMatchId(100003L)
                .homeTeam("Brazil")
                .awayTeam("Đức (Germany)")
                .matchTime(LocalDateTime.now().minusMinutes(45))
                .status("IN_PLAY")
                .homeScore(1)
                .awayScore(0)
                .poolAmount(new BigDecimal("50000.00")) // Đã cược 50k
                .settled(false)
                .build();
        m3.setId(com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch());
        mockMatches.add(matchRepository.save(m3));

        // Trận 4: Đã kết thúc (Cần giải ngân)
        Match m4 = Match.builder()
                .apiMatchId(100004L)
                .homeTeam("Việt Nam (VIE)")
                .awayTeam("Thái Lan (THA)")
                .matchTime(LocalDateTime.now().minusHours(3))
                .status("FINISHED")
                .homeScore(3)
                .awayScore(2)
                .poolAmount(new BigDecimal("30000.00")) // Tổng 30k cược
                .settled(false)
                .build();
        m4.setId(com.github.f4b6a3.uuid.UuidCreator.getTimeOrderedEpoch());
        mockMatches.add(matchRepository.save(m4));

        return mockMatches;
    }

    // Các class DTO để map JSON trả về từ API
    @lombok.Data
    private static class FootballMatchResponse {
        private List<FootballMatch> matches;
    }

    @lombok.Data
    private static class FootballMatch {
        private Long id;
        private String utcDate;
        private String status;
        private FootballTeam homeTeam;
        private FootballTeam awayTeam;
        private FootballScore score;
    }

    @lombok.Data
    private static class FootballTeam {
        private String name;
    }

    @lombok.Data
    private static class FootballScore {
        private FootballScoreTime fullTime;
    }

    @lombok.Data
    private static class FootballScoreTime {
        private Integer home;
        private Integer away;
    }
}
