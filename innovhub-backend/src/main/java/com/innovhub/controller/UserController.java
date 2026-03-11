package com.innovhub.controller;

import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getMe() {
        User user = getCurrentUser();
        UserSummaryResponse summary = UserSummaryResponse.builder()
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
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
}
