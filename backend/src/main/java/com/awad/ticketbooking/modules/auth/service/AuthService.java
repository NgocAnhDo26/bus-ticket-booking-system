package com.awad.ticketbooking.modules.auth.service;

import com.awad.ticketbooking.modules.auth.dto.AuthResponse;
import com.awad.ticketbooking.modules.auth.dto.GoogleLoginRequest;
import com.awad.ticketbooking.modules.auth.dto.LoginRequest;
import com.awad.ticketbooking.modules.auth.dto.RegisterRequest;
import com.awad.ticketbooking.modules.auth.dto.UserResponse;
import com.awad.ticketbooking.modules.auth.entity.AuthProvider;
import com.awad.ticketbooking.modules.auth.entity.RefreshToken;
import com.awad.ticketbooking.modules.auth.entity.User;
import com.awad.ticketbooking.modules.auth.entity.UserRole;
import com.awad.ticketbooking.modules.auth.mapper.UserMapper;
import com.awad.ticketbooking.modules.auth.repository.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken.Payload;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;

    @Transactional
    public AuthResult register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        userRepository
                .findByEmail(email)
                .ifPresent(user -> {
                    throw new IllegalArgumentException("Email already registered");
                });

        User user = User.builder()
                .fullName(request.fullName())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(UserRole.PASSENGER)
                .authProvider(AuthProvider.LOCAL)
                .build();

        User saved = userRepository.save(user);
        return issueTokens(saved);
    }

    public AuthResult login(LoginRequest request) {
        String email = request.email().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, request.password()));
        User user = userRepository
                .findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return issueTokens(user);
    }

    @Transactional
    public AuthResult loginWithGoogle(GoogleLoginRequest request) {
        try {
            GoogleIdToken idToken = googleIdTokenVerifier.verify(request.credential());
            if (idToken == null) {
                throw new IllegalArgumentException("Invalid Google credential");
            }
            Payload payload = idToken.getPayload();
            String email = payload.getEmail().toLowerCase();
            Optional<User> existing = userRepository.findByEmail(email);
            User user = existing.orElseGet(() -> userRepository.save(User.builder()
                    .email(email)
                    .fullName((String) payload.get("name"))
                    .avatarUrl((String) payload.get("picture"))
                    .authProvider(AuthProvider.GOOGLE)
                    .role(UserRole.PASSENGER)
                    .build()));
            return issueTokens(user);
        } catch (IllegalArgumentException ex) {
            // Re-throw IllegalArgumentException as-is
            throw ex;
        } catch (Exception ex) {
            // Log the actual exception for debugging
            System.err.println("Google sign-in error: " + ex.getClass().getName() + " - " + ex.getMessage());
            ex.printStackTrace();
            throw new IllegalArgumentException("Google sign-in failed: " + ex.getMessage());
        }
    }

    @Transactional
    public AuthResult refresh(String token) {
        RefreshToken refreshToken = refreshTokenService.validateToken(token);
        User user = refreshToken.getUser();
        return issueTokens(user);
    }

    @Transactional
    public void logout(User user) {
        refreshTokenService.revokeAll(user);
    }

    private AuthResult issueTokens(User user) {
        refreshTokenService.revokeAll(user);
        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.create(user);
        UserResponse userResponse = UserMapper.toResponse(user);
        AuthResponse response = new AuthResponse(accessToken, userResponse);
        return new AuthResult(response, refreshToken.getToken());
    }

    public record AuthResult(AuthResponse payload, String refreshToken) {}
}

