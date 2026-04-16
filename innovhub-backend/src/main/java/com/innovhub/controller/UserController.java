package com.innovhub.controller;

import com.innovhub.dto.request.CreateUserRequest;
import com.innovhub.dto.request.UpdateRoleRequest;
import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.AuthService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
@Tag(name = "Users")
@PreAuthorize("isAuthenticated()")
public class UserController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> getMe() {
        User user = getCurrentUser();
        return ResponseEntity.ok(ApiResponse.ok(toSummary(user)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<List<UserSummaryResponse>>> getAllUsers() {
        List<UserSummaryResponse> users = userRepository.findAll().stream()
                .filter(User::getIsActive)
                .map(this::toSummary)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PostMapping
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> createUser(@Valid @RequestBody CreateUserRequest req) {
        User user = authService.createUser(req);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur créé avec succès", toSummary(user)));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<UserSummaryResponse>> updateRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest req) {
        User user = authService.updateUserRole(id, req.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Rôle mis à jour", toSummary(user)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable String id) {
        authService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("Utilisateur supprimé", null));
    }

    private UserSummaryResponse toSummary(User user) {
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

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }
}
