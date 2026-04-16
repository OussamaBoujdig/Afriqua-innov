package com.innovhub.controller;

import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.ProjectMessageResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.ProjectMessageService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/projects/{projectId}/messages")
@RequiredArgsConstructor
@Tag(name = "Project Messages")
public class MessageController {

    private final ProjectMessageService messageService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findById(auth.getName())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<ProjectMessageResponse>>> getMessages(
            @PathVariable String projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<ProjectMessageResponse> messages = messageService.getMessages(projectId, getCurrentUser(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(messages));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectMessageResponse>> sendMessage(
            @PathVariable String projectId,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile file) {
        ProjectMessageResponse result = messageService.sendMessage(projectId, content, file, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Message envoyé", result));
    }
}
