package com.innovhub.service;

import com.innovhub.dto.response.ProjectMessageResponse;
import com.innovhub.entity.Project;
import com.innovhub.entity.ProjectMessage;
import com.innovhub.entity.ProjectTeamMember;
import com.innovhub.entity.User;
import com.innovhub.enums.UserRole;
import com.innovhub.exception.ForbiddenException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.ProjectMessageRepository;
import com.innovhub.repository.ProjectRepository;
import com.innovhub.repository.ProjectTeamMemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectMessageService {

    private final ProjectMessageRepository messageRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTeamMemberRepository teamMemberRepository;
    private final WebSocketBroadcastService broadcastService;
    private final NotificationService notificationService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    public Page<ProjectMessageResponse> getMessages(String projectId, User currentUser, Pageable pageable) {
        validateAccess(projectId, currentUser);
        return messageRepository.findByProject_IdOrderByCreatedAtDesc(projectId, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ProjectMessageResponse sendMessage(String projectId, String content, MultipartFile file, User currentUser) {
        validateAccess(projectId, currentUser);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectMessage.ProjectMessageBuilder builder = ProjectMessage.builder()
                .project(project)
                .sender(currentUser)
                .content(content);

        if (file != null && !file.isEmpty()) {
            try {
                String fileId = UUID.randomUUID().toString();
                String originalName = file.getOriginalFilename();
                String ext = originalName != null && originalName.contains(".")
                        ? originalName.substring(originalName.lastIndexOf(".")) : "";
                String storedName = fileId + ext;

                Path uploadPath = Paths.get(uploadDir, "chat");
                Files.createDirectories(uploadPath);
                Files.copy(file.getInputStream(), uploadPath.resolve(storedName));

                builder.fileName(originalName)
                        .fileUrl("/documents/chat/" + storedName)
                        .fileType(file.getContentType())
                        .fileSizeBytes(file.getSize());
            } catch (IOException e) {
                throw new RuntimeException("Erreur lors de l'upload du fichier", e);
            }
        }

        ProjectMessage saved = messageRepository.save(builder.build());
        ProjectMessageResponse response = toResponse(saved);
        broadcastService.sendToProjectChat(projectId, response);

        // Notify all team members + project owner except the sender
        String preview = content != null && !content.isBlank()
                ? (content.length() > 60 ? content.substring(0, 60) + "..." : content)
                : (saved.getFileName() != null ? "Fichier : " + saved.getFileName() : "Nouveau message");
        String notifMsg = currentUser.getFullName() + " : " + preview;
        String link = "/messagerie";
        String notifTitle = "Nouveau message — " + project.getName();

        java.util.Set<String> notifiedIds = new java.util.HashSet<>();
        notifiedIds.add(currentUser.getId()); // exclude sender

        // Notify team members
        teamMemberRepository.findByProject_IdOrderByAddedAtDesc(projectId).stream()
                .map(ProjectTeamMember::getUser)
                .filter(u -> notifiedIds.add(u.getId()))
                .forEach(u -> notificationService.notify(u, notifTitle, notifMsg, link));

        // Notify project owner if not already notified
        User owner = project.getOwner();
        if (owner != null && notifiedIds.add(owner.getId())) {
            notificationService.notify(owner, notifTitle, notifMsg, link);
        }

        return response;
    }

    private void validateAccess(String projectId, User user) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        // Allow project owner
        if (project.getOwner() != null && project.getOwner().getId().equals(user.getId())) {
            return;
        }
        // Allow team members only
        if (!teamMemberRepository.existsByProject_IdAndUser_Id(projectId, user.getId())) {
            throw new ForbiddenException("Vous devez être membre de l'équipe pour accéder au chat");
        }
    }

    private ProjectMessageResponse toResponse(ProjectMessage m) {
        User s = m.getSender();
        return ProjectMessageResponse.builder()
                .id(m.getId())
                .projectId(m.getProject().getId())
                .senderId(s.getId())
                .senderName(s.getFullName())
                .senderRole(s.getRole().name())
                .senderAvatarUrl(s.getAvatarUrl())
                .content(m.getContent())
                .fileName(m.getFileName())
                .fileUrl(m.getFileUrl())
                .fileType(m.getFileType())
                .fileSizeBytes(m.getFileSizeBytes())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
