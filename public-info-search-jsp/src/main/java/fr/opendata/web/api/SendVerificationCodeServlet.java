package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.service.EmailVerificationService;
import fr.opendata.service.SmsVerificationService;
import fr.opendata.service.VerificationCodeStore;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;
import java.util.regex.Pattern;

@WebServlet("/api/auth/send-code")
public class SendVerificationCodeServlet extends HttpServlet {
    private static final Pattern GMAIL = Pattern.compile("^[^\\s@]+@gmail\\.com$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PHONE = Pattern.compile("^\\+?\\d[\\d\\s.-]{7,18}$");

    private final ObjectMapper mapper = new ObjectMapper();
    private final VerificationCodeStore store = VerificationCodeStore.getInstance();
    private final EmailVerificationService emailService = new EmailVerificationService();
    private final SmsVerificationService smsService = new SmsVerificationService();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        setCors(resp);
        resp.setContentType("application/json;charset=UTF-8");
        CodeRequest body = mapper.readValue(req.getInputStream(), CodeRequest.class);
        String type = clean(body.type());
        String destination = clean(body.destination());

        if (!isValid(type, destination)) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), Map.of("ok", false, "error", "invalid_destination"));
            return;
        }

        try {
            String code = store.createCode(type, destination);
            if ("email".equals(type)) {
                emailService.sendCode(destination, code);
            } else {
                smsService.sendCode(destination, code);
            }
            mapper.writeValue(resp.getWriter(), Map.of("ok", true));
        } catch (IllegalStateException ex) {
            resp.setStatus("wait_before_resend".equals(ex.getMessage())
                ? HttpServletResponse.SC_TOO_MANY_REQUESTS
                : HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            mapper.writeValue(resp.getWriter(), Map.of("ok", false, "error", ex.getMessage()));
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) {
        setCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private void setCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", env("AUTH_CORS_ORIGIN", "*"));
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    }

    private boolean isValid(String type, String destination) {
        return ("email".equals(type) && GMAIL.matcher(destination).matches())
            || ("phone".equals(type) && PHONE.matcher(destination).matches());
    }

    private String clean(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    public record CodeRequest(String type, String destination) {
    }
}
