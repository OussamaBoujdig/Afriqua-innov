package com.innovhub.service;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.response.ProjectDetailResponse;
import com.innovhub.dto.response.ProjectDeliverableResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.Comment;
import com.innovhub.entity.Project;
import com.innovhub.entity.ProjectDeliverable;
import com.innovhub.entity.User;
import com.innovhub.enums.ProjectStage;
import com.innovhub.exception.BadRequestException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.CommentRepository;
import com.innovhub.repository.DocumentRepository;
import com.innovhub.repository.ProjectDeliverableRepository;
import com.innovhub.repository.ProjectRepository;
import com.innovhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectDeliverableRepository projectDeliverableRepository;
    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public Page<ProjectDetailResponse> getAllProjects(Pageable pageable) {
        return projectRepository.findAll(pageable).map(this::toProjectDetail);
    }

    public ProjectDetailResponse getProjectById(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return toProjectDetail(project);
    }

    @Transactional
    public ProjectDetailResponse advanceStage(String id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectStage current = project.getCurrentStage();
        ProjectStage next;
        switch (current) {
            case EXPLORATION -> next = ProjectStage.CONCEPTUALISATION;
            case CONCEPTUALISATION -> next = ProjectStage.PILOTE;
            case PILOTE -> next = ProjectStage.MISE_A_ECHELLE;
            case MISE_A_ECHELLE -> throw new BadRequestException("Le projet est déjà à l'étape finale");
            default -> throw new BadRequestException("Étape inconnue");
        }

        project.setCurrentStage(next);
        project = projectRepository.save(project);
        recalculateProgress(project);
        return toProjectDetail(project);
    }

    @Transactional
    public ProjectDetailResponse updateProgress(String id, int progress, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        int clamped = Math.max(0, Math.min(100, progress));
        project.setStageProgress(clamped);
        project = projectRepository.save(project);
        return toProjectDetail(project);
    }

    @Transactional
    public ProjectDetailResponse toggleDeliverable(String projectId, String deliverableId, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectDeliverable deliverable = projectDeliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new ResourceNotFoundException("Livrable non trouvé"));

        if (!deliverable.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Ce livrable n'appartient pas à ce projet");
        }

        deliverable.setIsDone(!deliverable.getIsDone());
        if (deliverable.getIsDone()) {
            deliverable.setDoneAt(java.time.Instant.now());
            deliverable.setDoneBy(currentUser);
        } else {
            deliverable.setDoneAt(null);
            deliverable.setDoneBy(null);
        }
        projectDeliverableRepository.save(deliverable);

        recalculateProgress(project);

        return toProjectDetail(project);
    }

    private void recalculateProgress(Project project) {
        List<ProjectDeliverable> stageDeliverables = project.getDeliverables().stream()
                .filter(d -> d.getStage() == project.getCurrentStage())
                .toList();
        if (stageDeliverables.isEmpty()) {
            project.setStageProgress(0);
        } else {
            long done = stageDeliverables.stream().filter(ProjectDeliverable::getIsDone).count();
            int pct = (int) Math.round((done * 100.0) / stageDeliverables.size());
            project.setStageProgress(pct);
        }
        projectRepository.save(project);
    }

    @Transactional
    public void addComment(String projectId, AddCommentRequest req, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        Comment comment = Comment.builder()
                .project(project)
                .author(currentUser)
                .content(req.getContent())
                .build();

        if (req.getParentId() != null) {
            Comment parent = commentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Commentaire parent non trouvé"));
            comment.setParent(parent);
        }

        commentRepository.save(comment);
    }

    private ProjectDetailResponse toProjectDetail(Project p) {
        return ProjectDetailResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .currentStage(p.getCurrentStage())
                .stageProgress(p.getStageProgress())
                .owner(toUserSummary(p.getOwner()))
                .dueDate(p.getDueDate())
                .launchedAt(p.getLaunchedAt())
                .ideaId(p.getIdea().getId())
                .ideaTitle(p.getIdea().getTitle())
                .deliverables(p.getDeliverables().stream().map(this::toDeliverable).toList())
                .build();
    }

    private ProjectDeliverableResponse toDeliverable(ProjectDeliverable d) {
        return ProjectDeliverableResponse.builder()
                .id(d.getId())
                .stage(d.getStage())
                .title(d.getTitle())
                .isDone(d.getIsDone())
                .doneAt(d.getDoneAt())
                .doneByName(d.getDoneBy() != null ? d.getDoneBy().getFullName() : null)
                .sortOrder(d.getSortOrder())
                .build();
    }

    private UserSummaryResponse toUserSummary(User u) {
        return UserSummaryResponse.builder()
                .id(u.getId())
                .email(u.getEmail())
                .firstName(u.getFirstName())
                .lastName(u.getLastName())
                .fullName(u.getFullName())
                .role(u.getRole())
                .businessUnit(u.getBusinessUnit())
                .department(u.getDepartment())
                .avatarUrl(u.getAvatarUrl())
                .points(u.getPoints())
                .build();
    }
}
