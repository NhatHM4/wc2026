package com.worldcup.bet.scheduler;

import com.worldcup.bet.service.WalletService;
import jakarta.mail.*;
import jakarta.mail.internet.MimeMultipart;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
@Slf4j
public class VietQrMailScannerScheduler {

    private final WalletService walletService;

    @Value("${gmail.username}")
    private String username;

    @Value("${gmail.password}")
    private String password;

    @Value("${gmail.host}")
    private String host;

    @Value("${gmail.port}")
    private String port;

    @Value("${gmail.protocol}")
    private String protocol;

    @Scheduled(fixedDelay = 20000)
    public void scanCakeBankEmails() {
        if (username == null || username.isEmpty() || "YOUR_GMAIL_USERNAME".equals(username)) {
            return;
        }

        Store store = null;
        Folder inbox = null;
        try {
            Properties properties = new Properties();
            properties.put("mail.store.protocol", protocol);
            properties.put("mail.imaps.host", host);
            properties.put("mail.imaps.port", port);
            properties.put("mail.imaps.ssl.enable", "true");

            Session emailSession = Session.getDefaultInstance(properties);
            store = emailSession.getStore(protocol);
            store.connect(host, username, password);

            inbox = store.getFolder("INBOX");
            inbox.open(Folder.READ_WRITE);

            // Tìm kiếm kết hợp: Chỉ lấy thư CHƯA ĐỌC và có TIÊU ĐỀ chứa "[CAKE]"
            jakarta.mail.search.SearchTerm unseenTerm = new jakarta.mail.search.FlagTerm(new Flags(Flags.Flag.SEEN), false);
            jakarta.mail.search.SearchTerm cakeSubjectTerm = new jakarta.mail.search.SubjectTerm("[CAKE]");
            jakarta.mail.search.SearchTerm combinedTerm = new jakarta.mail.search.AndTerm(unseenTerm, cakeSubjectTerm);

            Message[] messages = inbox.search(combinedTerm);

            if (messages.length > 0) {
                log.info("Phát hiện {} email giao dịch CAKE chưa đọc trong Inbox.", messages.length);
            }

            // Quét từ email mới nhất đến cũ nhất, giới hạn tối đa 20 email mỗi lần để tránh nghẽn/timeout
            int limit = Math.min(messages.length, 20);
            for (int i = messages.length - 1; i >= messages.length - limit; i--) {
                Message message = messages[i];
                try {
                    String subject = message.getSubject();
                    if (subject == null) {
                        subject = "";
                    }

                    // Kiểm tra tiêu đề email có liên quan đến CAKE Bank giao dịch thành công
                    if (subject.contains("[CAKE]") && subject.contains("thành công")) {
                        log.info("Đang xử lý email giao dịch CAKE: {}", subject);
                        String body = getTextFromMessage(message);
                        String cleanText = stripHtml(body).replaceAll("\\s+", " ");

                        // Parse Mã giao dịch
                        Pattern txPattern = Pattern.compile("Mã giao dịch\\s*(\\d+)");
                        Matcher txMatcher = txPattern.matcher(cleanText);
                        String bankTxId = null;
                        if (txMatcher.find()) {
                            bankTxId = txMatcher.group(1).trim();
                        }

                        // Parse Số tiền
                        Pattern amountPattern = Pattern.compile("Số tiền\\s*\\+?\\s*([0-9\\.,]+)");
                        Matcher amountMatcher = amountPattern.matcher(cleanText);
                        BigDecimal amount = null;
                        if (amountMatcher.find()) {
                            String cleanAmt = amountMatcher.group(1).replaceAll("[^0-9]", "");
                            amount = new BigDecimal(cleanAmt);
                        }

                        // Parse Nội dung chuyển khoản (addInfo) là mã unique 6 ký tự viết hoa/số
                        Pattern addInfoPattern = Pattern.compile("Nội dung giao dịch\\s*([A-Z0-9]{6})\\b", Pattern.CASE_INSENSITIVE);
                        Matcher addInfoMatcher = addInfoPattern.matcher(cleanText);
                        String addInfo = null;
                        if (addInfoMatcher.find()) {
                            addInfo = addInfoMatcher.group(1).trim().toUpperCase();
                        }

                        log.info("Kết quả parse email CAKE - Mã GD: {}, Số tiền: {}, Nội dung: {}", bankTxId, amount, addInfo);

                        if (bankTxId != null && amount != null && addInfo != null) {
                            boolean processed = walletService.completePendingDeposit(addInfo, amount, bankTxId);
                            if (processed) {
                                log.info("Nạp tiền tự động thành công cho nội dung: {}, Số tiền: {}, Mã GD: {}", addInfo, amount, bankTxId);
                            } else {
                                log.warn("Không thể xử lý giao dịch tự động. Nội dung: {}, Số tiền: {}, Mã GD: {} (Có thể đã được xử lý trước đó hoặc sai cấu trúc)", addInfo, amount, bankTxId);
                            }
                        }
                    }

                    // Đánh dấu đã xem để tránh quét lại
                    message.setFlag(Flags.Flag.SEEN, true);

                } catch (Exception ex) {
                    log.error("Lỗi khi xử lý từng email: {}", ex.getMessage(), ex);
                }
            }

        } catch (Exception e) {
            log.error("Lỗi khi quét hộp thư IMAP: {}", e.getMessage());
        } finally {
            try {
                if (inbox != null && inbox.isOpen()) {
                    inbox.close(true);
                }
                if (store != null) {
                    store.close();
                }
            } catch (Exception ex) {
                log.error("Lỗi khi đóng kết nối Mail Store: {}", ex.getMessage());
            }
        }
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]*>", " ");
    }

    private String getTextFromMessage(Message message) throws Exception {
        if (message.isMimeType("text/plain")) {
            return message.getContent().toString();
        } else if (message.isMimeType("text/html")) {
            return message.getContent().toString();
        } else if (message.isMimeType("multipart/*")) {
            MimeMultipart mimeMultipart = (MimeMultipart) message.getContent();
            return getTextFromMimeMultipart(mimeMultipart);
        }
        return "";
    }

    private String getTextFromMimeMultipart(MimeMultipart mimeMultipart) throws Exception {
        StringBuilder result = new StringBuilder();
        int count = mimeMultipart.getCount();
        for (int i = 0; i < count; i++) {
            BodyPart bodyPart = mimeMultipart.getBodyPart(i);
            if (bodyPart.isMimeType("text/plain")) {
                result.append(bodyPart.getContent().toString());
            } else if (bodyPart.isMimeType("text/html")) {
                result.append("\n").append(bodyPart.getContent().toString());
            } else if (bodyPart.getContent() instanceof MimeMultipart) {
                result.append(getTextFromMimeMultipart((MimeMultipart) bodyPart.getContent()));
            }
        }
        return result.toString();
    }
}
