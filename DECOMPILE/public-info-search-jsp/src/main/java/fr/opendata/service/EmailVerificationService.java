package fr.opendata.service;

import jakarta.mail.Authenticator;
import jakarta.mail.Message;
import jakarta.mail.MessagingException;
import jakarta.mail.PasswordAuthentication;
import jakarta.mail.Session;
import jakarta.mail.Transport;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;

import java.util.Properties;

public class EmailVerificationService {
    public void sendCode(String email, String code) {
        String host = env("SMTP_HOST", "");
        if (host.isBlank()) {
            System.out.printf("EMAIL VERIFICATION CODE for %s: %s%n", email, code);
            return;
        }

        String port = env("SMTP_PORT", "587");
        String username = env("SMTP_USERNAME", "");
        String password = env("SMTP_PASSWORD", "");
        String from = env("SMTP_FROM", username.isBlank() ? "no-reply@example.com" : username);

        Properties props = new Properties();
        props.put("mail.smtp.auth", String.valueOf(!username.isBlank()));
        props.put("mail.smtp.starttls.enable", env("SMTP_STARTTLS", "true"));
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);

        Session session = username.isBlank()
            ? Session.getInstance(props)
            : Session.getInstance(props, new Authenticator() {
                @Override
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, password);
                }
            });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(from));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(email));
            message.setSubject("Code de verification");
            message.setText("Ton code de verification est : " + code + "\n\nIl expire dans 10 minutes.");
            Transport.send(message);
        } catch (MessagingException ex) {
            throw new IllegalStateException("email_send_failed", ex);
        }
    }

    private String env(String key, String fallback) {
        String value = System.getenv(key);
        return value == null || value.isBlank() ? fallback : value;
    }
}
