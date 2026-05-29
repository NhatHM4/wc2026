package com.worldcup.bet.controller;

import com.worldcup.bet.entity.SystemFund;
import com.worldcup.bet.repository.SystemFundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system")
@RequiredArgsConstructor
public class SystemController {

    private final SystemFundRepository systemFundRepository;

    @GetMapping("/fund")
    public ResponseEntity<?> getSystemFund() {
        SystemFund fund = systemFundRepository.findOrCreateSingleFund();
        return ResponseEntity.ok(fund);
    }
}
