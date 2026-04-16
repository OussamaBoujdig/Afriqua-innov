package com.innovhub.controller;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.request.ScoreIdeaRequest;
import com.innovhub.dto.request.SubmitIdeaRequest;
import com.innovhub.dto.request.WorkflowActionRequest;
import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.IdeaDetailResponse;
import com.innovhub.dto.response.IdeaScoreResponse;
import com.innovhub.dto.response.IdeaSummaryResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.DocumentService;
import com.innovhub.service.IdeaService;
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

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/ideas")
@RequiredArgsConstructor
@Tag(name = "Ideas")
public class IdeaController {

    private final IdeaService ideaService;
    private final DocumentService documentService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IdeaDetailResponse>> submitIdea(@Valid @RequestBody SubmitIdeaRequest req) {
        IdeaDetailResponse result = ideaService.submitIdea(req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Idée soumise avec succès", result));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<Page<IdeaSummaryResponse>>> getAllIdeas(Pageable pageable) {
        Page<IdeaSummaryResponse> result = ideaService.getAllIdeas(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<IdeaSummaryResponse>>> getMyIdeas(Pageable pageable) {
        Page<IdeaSummaryResponse> result = ideaService.getMyIdeas(getCurrentUser(), pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IdeaDetailResponse>> getIdea(@PathVariable String id) {
        IdeaDetailResponse result = ideaService.getIdeaById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IdeaDetailResponse>> updateIdea(@PathVariable String id, @Valid @RequestBody SubmitIdeaRequest req) {
        IdeaDetailResponse result = ideaService.updateIdea(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteIdea(@PathVariable String id) {
        ideaService.deleteIdea(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Idée supprimée", null));
    }

    @PostMapping("/{id}/score")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IdeaScoreResponse>> scoreIdea(@PathVariable String id, @Valid @RequestBody ScoreIdeaRequest req) {
        IdeaScoreResponse result = ideaService.scoreIdea(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Score enregistré", result));
    }

    @PostMapping("/{id}/workflow")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<IdeaDetailResponse>> processWorkflow(@PathVariable String id, @Valid @RequestBody WorkflowActionRequest req) {
        IdeaDetailResponse result = ideaService.processWorkflowAction(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}/vote")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Boolean>> toggleVote(@PathVariable String id) {
        boolean voted = ideaService.toggleVote(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(voted ? "Vote ajouté" : "Vote retiré", voted));
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> addComment(@PathVariable String id, @Valid @RequestBody AddCommentRequest req) {
        ideaService.addComment(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Commentaire ajouté", null));
    }

    @PatchMapping("/{id}/scoring-deadline")
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<IdeaDetailResponse>> setScoringDeadline(@PathVariable String id, @RequestBody Map<String, String> body) {
        Instant deadline = Instant.parse(body.get("scoringDeadline"));
        IdeaDetailResponse result = ideaService.setScoringDeadline(id, deadline, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Délai de scoring défini", result));
    }

    @GetMapping("/{id}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<java.util.List<Map<String, Object>>>> getDocuments(@PathVariable String id) {
        var docs = documentService.getDocumentsForIdea(id);
        var result = docs.stream().map(d -> {
            Map<String, Object> m = new java.util.LinkedHashMap<>();
            m.put("id", d.getId());
            m.put("fileName", d.getFileName());
            m.put("fileType", d.getFileType());
            m.put("fileSizeBytes", d.getFileSizeBytes());
            m.put("uploadedByName", d.getUploadedBy().getFullName());
            m.put("createdAt", d.getCreatedAt());
            m.put("downloadUrl", "/documents/" + d.getId() + "/download");
            return m;
        }).toList();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> uploadDocument(@PathVariable String id, @RequestParam("file") MultipartFile file) {
        documentService.uploadForIdea(id, file, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Document uploadé", null));
    }
}
