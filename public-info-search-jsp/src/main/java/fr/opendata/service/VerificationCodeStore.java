package fr.opendata.service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class VerificationCodeStore {
    private static final Duration CODE_TTL = Duration.ofMinutes(10);
    private static final Duration SEND_COOLDOWN = Duration.ofSeconds(60);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final VerificationCodeStore INSTANCE = new VerificationCodeStore();

    private final Map<String, Entry> entries = new ConcurrentHashMap<>();

    private VerificationCodeStore() {
    }

    public static VerificationCodeStore getInstance() {
        return INSTANCE;
    }

    public String createCode(String type, String destination) {
        String key = key(type, destination);
        Entry existing = entries.get(key);
        Instant now = Instant.now();
        if (existing != null && Duration.between(existing.sentAt, now).compareTo(SEND_COOLDOWN) < 0) {
            throw new IllegalStateException("wait_before_resend");
        }

        String code = String.valueOf(100000 + RANDOM.nextInt(900000));
        entries.put(key, new Entry(code, now, now.plus(CODE_TTL)));
        return code;
    }

    public boolean verify(String type, String destination, String code) {
        String key = key(type, destination);
        Entry entry = entries.get(key);
        if (entry == null || entry.expiresAt.isBefore(Instant.now())) {
            entries.remove(key);
            return false;
        }
        boolean valid = entry.code.equals(String.valueOf(code).trim());
        if (valid) {
            entries.remove(key);
        }
        return valid;
    }

    private String key(String type, String destination) {
        return clean(type) + ":" + clean(destination);
    }

    private String clean(String value) {
        return String.valueOf(value == null ? "" : value).trim().toLowerCase(Locale.ROOT);
    }

    private record Entry(String code, Instant sentAt, Instant expiresAt) {
    }
}
