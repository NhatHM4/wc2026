package com.worldcup.bet.service.impl;

import com.worldcup.bet.dto.RegisterRequest;
import com.worldcup.bet.entity.User;
import com.worldcup.bet.repository.UserRepository;
import com.worldcup.bet.service.UserService;
import com.worldcup.bet.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final WalletService walletService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public User registerUser(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Tên đăng nhập đã tồn tại");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role("USER")
                .build();

        User savedUser = userRepository.save(user);
        
        // Tự động tạo ví khi đăng ký thành công
        walletService.createWallet(savedUser.getId());

        return savedUser;
    }

    @Override
    @Transactional(readOnly = true)
    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
    }
}
