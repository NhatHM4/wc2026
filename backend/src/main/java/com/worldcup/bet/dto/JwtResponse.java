package com.worldcup.bet.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private UUID id;
    private String username;
    private String role;
}
