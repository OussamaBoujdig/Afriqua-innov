package com.innovhub.controller;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.ProjectDetailResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.DocumentService;
import com.innovhub.service.ProjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.innovhub.dto.response.DocumentResponse;
import com.innovhub.entity.Document;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/projects")
@RequiredArgsConstructor
@Tag(name = "Projects")
public class ProjectController {

    private final ProjectService projectService;
    private final DocumentService documentService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<Page<ProjectDetailResponse>>> getAllProjects(Pageable pageable) {
        Page<ProjectDetailResponse> result = projectService.getAllProjects(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> getProject(@PathVariable String id) {
        ProjectDetailResponse result = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}/stage")
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> advanceStage(@PathVariable String id) {
        ProjectDetailResponse result = projectService.advanceStage(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> updateProgress(@PathVariable String id, @RequestBody Map<String, Integer> body) {
        int progress = body.getOrDefault("progress", 0);
        ProjectDetailResponse result = projectService.updateProgress(id, progress, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}/deliverables/{delivId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> toggleDeliverable(@PathVariable String id, @PathVariable String delivId) {
        ProjectDetailResponse result = projectService.toggleDeliverable(id, delivId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> addComment(@PathVariable String id, @Valid @RequestBody AddCommentRequest req) {
        projectService.addComment(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Commentaire ajouté", null));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getDocuments(@PathVariable String id) {
        List<DocumentResponse> docs = documentService.getDocumentsForProject(id).stream()
                .map(this::toDocResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(docs));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadDocument(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        Document doc = documentService.uploadForProject(id, file, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Document uploadé", toDocResponse(doc)));
    }

    private DocumentResponse toDocResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .fileName(d.getFileName())
                .fileType(d.getFileType())
                .fileSizeBytes(d.getFileSizeBytes())
                .uploadedByName(d.getUploadedBy().getFullName())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
