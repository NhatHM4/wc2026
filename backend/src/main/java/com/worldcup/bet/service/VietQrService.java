package com.worldcup.bet.service;

import java.math.BigDecimal;
import java.util.Map;

public interface VietQrService {
    Map<String, Object> generateQrCode(BigDecimal amount, String addInfo);
}
