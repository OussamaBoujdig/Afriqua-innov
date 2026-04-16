package com.innovhub.controller;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.request.AddTeamMemberRequest;
import com.innovhub.dto.request.CreateDeliverableRequest;
import com.innovhub.dto.request.CreateTaskRequest;
import com.innovhub.dto.request.RespondInvitationRequest;
import com.innovhub.dto.request.UpdateTaskRequest;
import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.ProjectDetailResponse;
import com.innovhub.dto.response.ProjectTaskResponse;
import com.innovhub.dto.response.TeamInvitationResponse;
import com.innovhub.dto.response.TeamMemberResponse;
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

    @GetMapping("/my-team")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProjectDetailResponse>>> getMyTeamProjects() {
        List<ProjectDetailResponse> result = projectService.getMyTeamProjects(getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> getProject(@PathVariable String id) {
        ProjectDetailResponse result = projectService.getProjectById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<Void>> deleteProject(@PathVariable String id) {
        projectService.deleteProject(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Projet supprimé", null));
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

    @PostMapping("/{id}/deliverables")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> createDeliverable(
            @PathVariable String id, @Valid @RequestBody CreateDeliverableRequest req) {
        ProjectDetailResponse result = projectService.createDeliverable(id, req.getTitle(), req.getStage(), getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Livrable créé", result));
    }

    @PatchMapping("/{id}/deliverables/{delivId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> toggleDeliverable(@PathVariable String id, @PathVariable String delivId) {
        ProjectDetailResponse result = projectService.toggleDeliverable(id, delivId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}/deliverables/{delivId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<ProjectDetailResponse>> deleteDeliverable(@PathVariable String id, @PathVariable String delivId) {
        ProjectDetailResponse result = projectService.deleteDeliverable(id, delivId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Livrable supprimé", result));
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

    // ── Task endpoints ──

    @GetMapping("/{id}/tasks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<ProjectTaskResponse>>> getTasks(@PathVariable String id) {
        List<ProjectTaskResponse> tasks = projectService.getTasksForProject(id);
        return ResponseEntity.ok(ApiResponse.ok(tasks));
    }

    @PostMapping("/{id}/tasks")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> createTask(
            @PathVariable String id, @Valid @RequestBody CreateTaskRequest req) {
        ProjectTaskResponse result = projectService.createTask(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Tâche créée", result));
    }

    @PatchMapping("/{id}/tasks/{taskId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ProjectTaskResponse>> updateTask(
            @PathVariable String id, @PathVariable String taskId, @RequestBody UpdateTaskRequest req) {
        ProjectTaskResponse result = projectService.updateTask(id, taskId, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Tâche mise à jour", result));
    }

    @DeleteMapping("/{id}/tasks/{taskId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<Void>> deleteTask(@PathVariable String id, @PathVariable String taskId) {
        projectService.deleteTask(id, taskId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Tâche supprimée", null));
    }

    @GetMapping("/{id}/tasks/{taskId}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getTaskDocuments(@PathVariable String id, @PathVariable String taskId) {
        List<DocumentResponse> docs = documentService.getDocumentsForTask(taskId).stream()
                .map(this::toDocResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok(docs));
    }

    @PostMapping("/{id}/tasks/{taskId}/documents")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DocumentResponse>> uploadTaskDocument(
            @PathVariable String id, @PathVariable String taskId, @RequestParam("file") MultipartFile file) {
        Document doc = documentService.uploadForTask(id, taskId, file, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Document uploadé", toDocResponse(doc)));
    }

    // ── Team endpoints ──

    @GetMapping("/{id}/team")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TeamMemberResponse>>> getTeamMembers(@PathVariable String id) {
        List<TeamMemberResponse> team = projectService.getTeamMembers(id);
        return ResponseEntity.ok(ApiResponse.ok(team));
    }

    @PostMapping("/{id}/team")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<TeamInvitationResponse>> addTeamMember(
            @PathVariable String id, @Valid @RequestBody AddTeamMemberRequest req) {
        TeamInvitationResponse result = projectService.addTeamMember(id, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Invitation envoyée", result));
    }

    @GetMapping("/{id}/invitations")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TeamInvitationResponse>>> getProjectInvitations(@PathVariable String id) {
        List<TeamInvitationResponse> invitations = projectService.getProjectInvitations(id);
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    @GetMapping("/invitations/mine")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TeamInvitationResponse>>> getMyInvitations() {
        List<TeamInvitationResponse> invitations = projectService.getMyInvitations(getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    @GetMapping("/invitations/sent")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TeamInvitationResponse>>> getInvitationsSent() {
        List<TeamInvitationResponse> invitations = projectService.getInvitationsSent(getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(invitations));
    }

    @PostMapping("/invitations/{invitationId}/respond")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<TeamInvitationResponse>> respondToInvitation(
            @PathVariable String invitationId, @Valid @RequestBody RespondInvitationRequest req) {
        TeamInvitationResponse result = projectService.respondToInvitation(invitationId, req, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/invitations/{invitationId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<Void>> deleteInvitation(@PathVariable String invitationId) {
        projectService.deleteInvitation(invitationId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Invitation supprimée", null));
    }

    @PatchMapping("/{id}/team/{memberId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<TeamMemberResponse>> updateTeamMemberRole(
            @PathVariable String id, @PathVariable String memberId, @RequestBody Map<String, String> body) {
        String teamRole = body.get("teamRole");
        TeamMemberResponse result = projectService.updateTeamMemberRole(id, memberId, teamRole, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Rôle mis à jour", result));
    }

    @DeleteMapping("/{id}/team/{memberId}")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<Void>> removeTeamMember(@PathVariable String id, @PathVariable String memberId) {
        projectService.removeTeamMember(id, memberId, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Membre retiré de l'équipe", null));
    }

    private DocumentResponse toDocResponse(Document d) {
        return DocumentResponse.builder()
                .id(d.getId())
                .fileName(d.getFileName())
                .fileType(d.getFileType())
                .fileSizeBytes(d.getFileSizeBytes())
                .uploadedByName(d.getUploadedBy().getFullName())
                .taskId(d.getTask() != null ? d.getTask().getId() : null)
                .taskTitle(d.getTask() != null ? d.getTask().getTitle() : null)
                .createdAt(d.getCreatedAt())
                .downloadUrl("/documents/" + d.getId() + "/download")
                .build();
    }
}
