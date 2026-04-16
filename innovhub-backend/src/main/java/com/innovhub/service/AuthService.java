package com.innovhub.service;

import com.innovhub.dto.request.CreateUserRequest;
import com.innovhub.dto.request.LoginRequest;
import com.innovhub.dto.request.RefreshTokenRequest;
import com.innovhub.dto.response.AuthResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.RefreshToken;
import com.innovhub.entity.User;
import com.innovhub.enums.UserRole;
import com.innovhub.exception.BadRequestException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.RefreshTokenRepository;
import com.innovhub.repository.UserRepository;
import com.innovhub.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public User createUser(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email déjà utilisé");
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .role(request.getRole())
                .businessUnit(request.getBusinessUnit())
                .department(request.getDepartment())
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User updateUserRole(String userId, UserRole role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        user.setRole(role);
        return userRepository.save(user);
    }

    @Transactional
    public void deleteUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
        user.setIsActive(false);
        userRepository.save(user);
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (!user.getIsActive()) {
            throw new BadRequestException("Ce compte a été désactivé");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Mot de passe incorrect");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name(), user.getFirstName(), user.getLastName());
        String refreshTokenValue = jwtUtil.generateRefreshToken();

        RefreshToken refreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiresAt(Instant.now().plusMillis(jwtUtil.getRefreshExpiration()))
                .build();
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .user(toUserSummary(user))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        RefreshToken refreshTokenEntity = refreshTokenRepository.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new BadRequestException("Token de rafraîchissement invalide"));

        if (refreshTokenEntity.getExpiresAt().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshTokenEntity);
            throw new BadRequestException("Token expiré");
        }

        User user = refreshTokenEntity.getUser();

        refreshTokenRepository.delete(refreshTokenEntity);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name(), user.getFirstName(), user.getLastName());
        String refreshTokenValue = jwtUtil.generateRefreshToken();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .token(refreshTokenValue)
                .user(user)
                .expiresAt(Instant.now().plusMillis(jwtUtil.getRefreshExpiration()))
                .build();
        refreshTokenRepository.save(newRefreshToken);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenValue)
                .user(toUserSummary(user))
                .build();
    }

    @Transactional
    public void logout(String userId) {
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    private UserSummaryResponse toUserSummary(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .fullName(user.getFullName())
                .role(user.getRole())
                .businessUnit(user.getBusinessUnit())
                .department(user.getDepartment())
                .avatarUrl(user.getAvatarUrl())
                .points(user.getPoints())
                .build();
    }
}
