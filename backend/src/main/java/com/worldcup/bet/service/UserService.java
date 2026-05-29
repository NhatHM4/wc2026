package com.worldcup.bet.service;

import com.worldcup.bet.dto.RegisterRequest;
import com.worldcup.bet.entity.User;

public interface UserService {
    User registerUser(RegisterRequest request);
    User getUserByUsername(String username);
}
