package com.worldcup.bet.scheduler;

import com.worldcup.bet.entity.Match;
import com.worldcup.bet.entity.SystemFund;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.service.BetService;
import com.worldcup.bet.service.MatchSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class MatchScheduler {

    private final MatchSyncService matchSyncService;
    private final BetService betService;
    private final SystemFundRepository systemFundRepository;

    // Chạy định kỳ mỗi 30 phút để đồng bộ tỉ số trận đấu và thực hiện thanh toán tự động (Chỉ chạy ở chế độ THỰC TẾ)
    @Scheduled(cron = "0 */30 * * * *")
    public void syncMatchesAndSettle() {
        SystemFund fund = systemFundRepository.findOrCreateSingleFund();
        
        if ("SIMULATION".equals(fund.getSystemMode())) {
            log.info("Hệ thống đang ở chế độ GIẢ LẬP. Bỏ qua tự động đồng bộ từ Football API.");
            return;
        }

        log.info("Bắt đầu tiến trình Scheduler (chế độ THỰC TẾ): Đồng bộ tỉ số và trả thưởng cá cược...");
        
        try {
            // Bước 1: Đồng bộ dữ liệu mới nhất từ API
            List<Match> matches = matchSyncService.syncWorldCupMatches();

            // Bước 2: Quét các trận đã kết thúc để chia thưởng
            int settledCount = 0;
            for (Match match : matches) {
                if ("FINISHED".equals(match.getStatus()) && !match.isSettled()) {
                    log.info("Phát hiện trận đấu [{}] đã kết thúc (tỉ số: {}-{}). Đang thực hiện chia thưởng...",
                            match.getHomeTeam() + " vs " + match.getAwayTeam(), 
                            match.getHomeScore(), match.getAwayScore());
                    
                    betService.settleMatchBets(match.getId());
                    settledCount++;
                }
            }

            if (settledCount > 0) {
                log.info("Hoàn tất thanh toán cho {} trận đấu kết thúc mới.", settledCount);
            }
        } catch (Exception e) {
            log.error("Lỗi xảy ra trong tiến trình Scheduler: {}", e.getMessage(), e);
        }
    }
}
