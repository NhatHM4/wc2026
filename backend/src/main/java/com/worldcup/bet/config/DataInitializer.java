package com.worldcup.bet.config;

import com.worldcup.bet.entity.User;
import com.worldcup.bet.repository.SystemFundRepository;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final PasswordEncoder passwordEncoder;
    private final SystemFundRepository systemFundRepository;

    @Override
    public void run(String... args) throws Exception {
        // Khởi tạo Quỹ hệ thống (SystemFund) duy nhất nếu chưa tồn tại
        systemFundRepository.findOrCreateSingleFund();

        if (!userRepository.existsByUsername("admin")) {
            log.info("Initializing OWNER user (admin / haminhnhat123)...");
            User owner = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("haminhnhat123"))
                    .role("OWNER")
                    .approved(true)
                    .build();
            User savedOwner = userRepository.save(owner);
            
            // Auto create wallet for owner
            walletService.createWallet(savedOwner.getId());
            log.info("OWNER user initialized successfully!");
        } else {
            // Đảm bảo tài khoản admin hiện tại đã được phê duyệt để tránh bị khóa
            userRepository.findByUsername("admin").ifPresent(owner -> {
                if (!owner.isApproved()) {
                    owner.setApproved(true);
                    userRepository.save(owner);
                    log.info("Successfully approved existing admin user.");
                }
            });
        }
    }
}
