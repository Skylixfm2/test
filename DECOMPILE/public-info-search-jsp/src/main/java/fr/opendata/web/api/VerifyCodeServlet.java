package fr.opendata.web.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import fr.opendata.service.VerificationCodeStore;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Map;

@WebServlet("/api/auth/verify-code")
public class VerifyCodeServlet extends HttpServlet {
    private final ObjectMapper mapper = new ObjectMapper();
    private final VerificationCodeStore store = VerificationCodeStore.getInstance();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setCors(resp);
        resp.setContentType("application/json;charset=UTF-8");
        VerifyRequest body = mapper.readValue(req.getInputStream(), VerifyRequest.class);

        boolean valid = store.verify(clean(body.type()), clean(body.destination()), clean(body.code()));
        if (!valid) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            mapper.writeValue(resp.getWriter(), Map.of("ok", false, "error", "invalid_code"));
            return;
        }

        mapper.writeValue(resp.getWriter(), Map.of("ok", true));
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

    private String clean(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }

    public record VerifyRequest(String type, String destination, String code) {
    }
}
