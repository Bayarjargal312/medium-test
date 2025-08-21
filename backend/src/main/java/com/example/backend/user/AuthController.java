package com.example.backend.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import jakarta.mail.internet.InternetAddress;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Collections;
import java.util.HashMap;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    @Value("${app.email.enabled:false}")
    private boolean emailEnabled;
    @Value("${app.email.from:no-reply@example.com}")
    private String emailFrom;
    @Value("${app.email.provider:smtp}")
    private String emailProvider;
    @Value("${sendgrid.api.key:}")
    private String sendgridApiKey;
    @Value("${spring.mail.username:}")
    private String smtpUsername;
    private final Map<String, String> emailToPendingCode = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthController(UserRepository userRepository, JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    public record RegisterStartRequest(@NotBlank String username,
                                       @NotBlank String name,
                                       @Email String email,
                                       @NotBlank String password) {}

    @PostMapping("/register/start")
    public ResponseEntity<?> registerStart(@RequestBody RegisterStartRequest body) {
        if (userRepository.findByEmail(body.email()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
        }
        if (userRepository.findByUsername(body.username()).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already in use"));
        }
        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        emailToPendingCode.put(body.email(), code);
        // Send email only when enabled, otherwise log in dev
        if (emailEnabled) {
            if ("sendgrid".equalsIgnoreCase(emailProvider) && sendgridApiKey != null && !sendgridApiKey.isBlank()) {
                try {
                    // Minimal HTTP client using java.net; avoids extra deps
                    var url = new java.net.URL("https://api.sendgrid.com/v3/mail/send");
                    var conn = (java.net.HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setDoOutput(true);
                    conn.setRequestProperty("Authorization", "Bearer " + sendgridApiKey);
                    conn.setRequestProperty("Content-Type", "application/json");
                    String payload = "{\n" +
                            "  \"personalizations\": [{ \"to\": [{ \"email\": \"" + body.email() + "\" }] }],\n" +
                            "  \"from\": { \"email\": \"" + emailFrom + "\" },\n" +
                            "  \"subject\": \"Your verification code\",\n" +
                            "  \"content\": [{ \"type\": \"text/plain\", \"value\": \"Your one-time password (OTP) is: " + code + "\" }]\n" +
                            "}";
                    try (var os = conn.getOutputStream()) {
                        os.write(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
                    }
                    int status = conn.getResponseCode();
                    if (status >= 200 && status < 300) {
                        System.out.println("[EMAIL] Sent via SendGrid to " + body.email());
                    } else {
                        String errorBody = "";
                        try (var es = conn.getErrorStream() != null ? conn.getErrorStream() : conn.getInputStream()) {
                            if (es != null) {
                                errorBody = new String(es.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
                            }
                        } catch (Exception ignore) {}
                        System.out.println("[EMAIL] SendGrid failed with status " + status + ": " + errorBody);
                    }
                } catch (Exception ex) {
                    System.out.println("[EMAIL] SendGrid error: " + ex.getMessage());
                }
            } else {
                try {
                    // Determine sender: prefer configured from, else SMTP username
                    String fromAddress = (emailFrom != null && !emailFrom.isBlank()) ? emailFrom : smtpUsername;
                    if (fromAddress == null || fromAddress.isBlank()) {
                        throw new IllegalArgumentException("No From address configured. Set app.email.from or spring.mail.username.");
                    }
                    // Validate addresses to avoid 'Could not parse mail'
                    new InternetAddress(fromAddress, false).validate();
                    new InternetAddress(body.email(), false).validate();

                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setTo(body.email());
                    msg.setFrom(fromAddress);
                    msg.setSubject("Your Medium clone verification code");
                    msg.setText("Your one-time password (OTP) is: " + code + "\nIt expires in 10 minutes.");
                    mailSender.send(msg);
                } catch (Exception ex) {
                    System.out.println("[DEV EMAIL] Failed to send email: " + ex.getMessage());
                    System.out.println("[DEV EMAIL] Verification code for " + body.email() + ": " + code);
                }
            }
        } else {
            System.out.println("[DEV EMAIL] Email sending disabled. Code for " + body.email() + ": " + code);
        }
        // Stash hashed password temporarily in the map along with code
        emailToPendingCode.put(body.email() + ":u", body.username());
        emailToPendingCode.put(body.email() + ":n", body.name());
        emailToPendingCode.put(body.email() + ":p", BCrypt.hashpw(body.password(), BCrypt.gensalt()));
        return ResponseEntity.ok(Map.of("sent", true));
    }

    public record VerifyRequest(@Email String email, @NotBlank String code) {}

    @PostMapping("/register/verify")
    public ResponseEntity<?> registerVerify(@RequestBody VerifyRequest body) {
        String expected = emailToPendingCode.get(body.email());
        if (expected == null || !expected.equals(body.code())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid verification code"));
        }
        String username = emailToPendingCode.get(body.email() + ":u");
        String name = emailToPendingCode.get(body.email() + ":n");
        String passwordHash = emailToPendingCode.get(body.email() + ":p");

        User user = new User();
        user.setEmail(body.email());
        user.setUsername(username);
        user.setName(name);
        user.setPasswordHash(passwordHash);
        user.setEmailVerified(true);
        user.setCreatedAtEpochMs(System.currentTimeMillis());
        try {
            if (userRepository.count() == 0) {
                user.setRole("ADMIN");
            } else {
                user.setRole("USER");
            }
        } catch (Exception ignore) {
            user.setRole("USER");
        }
        userRepository.save(user);

        // Clear pending
        emailToPendingCode.remove(body.email());
        emailToPendingCode.remove(body.email() + ":u");
        emailToPendingCode.remove(body.email() + ":n");
        emailToPendingCode.remove(body.email() + ":p");

        return ResponseEntity.ok(Map.of("registered", true, "role", user.getRole()));
    }

    public record LoginRequest(@NotBlank String usernameOrEmail, @NotBlank String password) {}

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest body) {
        Optional<User> userOpt = body.usernameOrEmail().contains("@")
                ? userRepository.findByEmail(body.usernameOrEmail())
                : userRepository.findByUsername(body.usernameOrEmail());

        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }
        User user = userOpt.get();
        if (!BCrypt.checkpw(body.password(), user.getPasswordHash())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        return ResponseEntity.ok(profile);
    }

    public record InterestsRequest(@Email String email, List<String> interests) {}

    @PostMapping("/interests")
    public ResponseEntity<?> saveInterests(@RequestBody InterestsRequest body) {
        if (body.email() == null || body.email().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email required"));
        }
        Optional<User> userOpt = userRepository.findByEmail(body.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }
        User user = userOpt.get();
        user.setInterests(body.interests() == null ? java.util.Collections.emptyList() : body.interests());
        userRepository.save(user);

        Map<String, Object> profile = new HashMap<>();
        profile.put("id", user.getId());
        profile.put("username", user.getUsername());
        profile.put("name", user.getName());
        profile.put("email", user.getEmail());
        profile.put("interests", user.getInterests());
        return ResponseEntity.ok(profile);
    }
}


