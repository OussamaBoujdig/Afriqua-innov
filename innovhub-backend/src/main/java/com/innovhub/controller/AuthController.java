package com.innovhub.controller;

import com.innovhub.dto.request.LoginRequest;
import com.innovhub.dto.request.RefreshTokenRequest;
import com.innovhub.dto.request.RegisterRequest;
import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.AuthResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(@Valid @RequestBody RegisterRequest req) {
        AuthResponse result = authService.register(req);
        return ResponseEntity.ok(ApiResponse.ok("Inscription réussie", result));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest req) {
        AuthResponse result = authService.login(req);
        return ResponseEntity.ok(ApiResponse.ok("Connexion réussie", result));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(@Valid @RequestBody RefreshTokenRequest req) {
        AuthResponse result = authService.refreshToken(req);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> logout() {
        User user = getCurrentUser();
        authService.logout(user.getId());
        return ResponseEntity.ok(ApiResponse.ok("Déconnexion réussie", null));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
}
