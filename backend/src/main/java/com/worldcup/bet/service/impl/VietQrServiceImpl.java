package com.worldcup.bet.service.impl;

import com.worldcup.bet.service.VietQrService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class VietQrServiceImpl implements VietQrService {

    @Value("${vietqr.client-id}")
    private String clientId;

    @Value("${vietqr.api-key}")
    private String apiKey;

    @Value("${vietqr.base-url}")
    private String baseUrl;

    @Value("${vietqr.account-no}")
    private String accountNo;

    @Value("${vietqr.account-name}")
    private String accountName;

    @Value("${vietqr.acq-id}")
    private String acqId;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public Map<String, Object> generateQrCode(BigDecimal amount, String addInfo) {

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", clientId);
            headers.set("x-api-key", apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("accountNo", accountNo);
            requestBody.put("accountName", accountName);
            requestBody.put("acqId", acqId);
            requestBody.put("amount", amount);
            requestBody.put("addInfo", addInfo);
            requestBody.put("format", "text");
            requestBody.put("template", "compact");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            log.info("Sending request to VietQR API at {} to generate QR code for user {}", baseUrl, username);
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String code = (String) body.get("code");
                String desc = (String) body.get("desc");

                if ("00".equals(code)) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data != null) {
                        Map<String, Object> result = new HashMap<>();
                        result.put("qrCode", data.get("qrCode"));
                        result.put("qrDataURL", data.get("qrDataURL"));
                        result.put("addInfo", addInfo);
                        result.put("accountNo", accountNo);
                        result.put("accountName", accountName);
                        result.put("acqId", acqId);
                        result.put("amount", amount);
                        return result;
                    }
                } else {
                    log.error("VietQR API returned error code {}: {}", code, desc);
                    throw new RuntimeException("VietQR API error: " + desc);
                }
            }
            throw new RuntimeException("Không nhận được phản hồi hợp lệ từ VietQR API");
        } catch (Exception e) {
            log.error("Lỗi khi tạo mã QR VietQR: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi hệ thống khi tạo mã VietQR: " + e.getMessage());
        }
    }
}
