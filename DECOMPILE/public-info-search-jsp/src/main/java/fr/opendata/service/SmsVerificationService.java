package fr.opendata.service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class SmsVerificationService {
    private final HttpClient client = HttpClient.newHttpClient();

    public void sendCode(String phone, String code) {
        String provider = env("SMS_PROVIDER", "log");
        if (!"twilio".equalsIgnoreCase(provider)) {
            System.out.printf("SMS VERIFICATION CODE for %s: %s%n", phone, code);
            return;
        }

        sendTwilio(phone, code);
    }

    private void sendTwilio(String phone, String code) {
        String sid = env("TWILIO_ACCOUNT_SID", "");
        String token = env("TWILIO_AUTH_TOKEN", "");
        String from = env("TWILIO_FROM", "");
        if (sid.isBlank() || token.isBlank() || from.isBlank()) {
            throw new IllegalStateException("twilio_not_configured");
        }

        String body = form("To", phone)
            + "&" + form("From", from)
            + "&" + form("Body", "Ton code de verification est : " + code);

        String auth = Base64.getEncoder().encodeToString((sid + ":" + token).getBytes(StandardCharsets.UTF_8));
        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json"))
            .header("Authorization", "Basic " + auth)
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        try {
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("sms_send_failed:" + response.statusCode());
            }
        } catch (IOException ex) {
            throw new IllegalStateException("sms_send_failed", ex);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("sms_send_interrupted", ex);
        }
    }

    private String form(String key, String value) {
        return URLEncoder.encode(key, StandardCharsets.UTF_8)
            + "="
            + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}
