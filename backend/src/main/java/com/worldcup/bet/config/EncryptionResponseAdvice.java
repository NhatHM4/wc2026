package com.worldcup.bet.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.worldcup.bet.entity.SystemFund;
import com.worldcup.bet.repository.SystemFundRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;

import java.util.Map;

@ControllerAdvice
@RequiredArgsConstructor
public class EncryptionResponseAdvice implements ResponseBodyAdvice<Object> {

    private final SystemFundRepository systemFundRepository;
    private final ObjectMapper objectMapper;

    @Override
    public boolean supports(MethodParameter returnType, Class<? extends HttpMessageConverter<?>> converterType) {
        return returnType.getContainingClass().getPackageName().startsWith("com.worldcup.bet.controller");
    }

    @Override
    public Object beforeBodyWrite(Object body, MethodParameter returnType, MediaType selectedContentType,
                                  Class<? extends HttpMessageConverter<?>> selectedConverterType,
                                  ServerHttpRequest request, ServerHttpResponse response) {
        if (body == null) {
            return null;
        }

        String path = request.getURI().getPath();
        // Do not encrypt authentication endpoints or the public system fund settings API
        if (path.startsWith("/api/auth/") || path.equals("/api/system/fund")) {
            return body;
        }

        try {
            SystemFund fund = systemFundRepository.findOrCreateSingleFund();
            if (fund.isEncryptMode()) {
                String jsonStr = objectMapper.writeValueAsString(body);
                String encrypted = EncryptionUtils.encrypt(jsonStr);
                return Map.of("encryptedData", encrypted);
            }
        } catch (Exception e) {
            // Log warning/error
        }

        return body;
    }
}
