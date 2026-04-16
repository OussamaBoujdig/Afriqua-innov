package com.innovhub.service;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.request.AddTeamMemberRequest;
import com.innovhub.dto.request.CreateTaskRequest;
import com.innovhub.dto.request.RespondInvitationRequest;
import com.innovhub.dto.request.UpdateTaskRequest;
import com.innovhub.dto.response.ProjectDetailResponse;
import com.innovhub.dto.response.ProjectDeliverableResponse;
import com.innovhub.dto.response.ProjectTaskResponse;
import com.innovhub.dto.response.TeamInvitationResponse;
import com.innovhub.dto.response.TeamMemberResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.Comment;
import com.innovhub.entity.Project;
import com.innovhub.entity.ProjectDeliverable;
import com.innovhub.entity.ProjectTask;
import com.innovhub.entity.ProjectTeamMember;
import com.innovhub.entity.TeamInvitation;
import com.innovhub.entity.User;
import com.innovhub.enums.InvitationStatus;
import com.innovhub.enums.ProjectStage;
import com.innovhub.enums.TaskStatus;
import com.innovhub.enums.UserRole;
import com.innovhub.exception.BadRequestException;
import com.innovhub.exception.ForbiddenException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.CommentRepository;
import com.innovhub.repository.DocumentRepository;
import com.innovhub.repository.ProjectDeliverableRepository;
import com.innovhub.repository.ProjectRepository;
import com.innovhub.repository.ProjectTaskRepository;
import com.innovhub.repository.ProjectTeamMemberRepository;
import com.innovhub.repository.TeamInvitationRepository;
import com.innovhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectDeliverableRepository projectDeliverableRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final ProjectTeamMemberRepository projectTeamMemberRepository;
    private final TeamInvitationRepository teamInvitationRepository;
    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WebSocketBroadcastService broadcastService;

    public Page<ProjectDetailResponse> getAllProjects(Pageable pageable) {
        return projectRepository.findAll(pageable).map(this::toProjectDetail);
    }

    public List<ProjectDetailResponse> getMyTeamProjects(User currentUser) {
        java.util.Set<String> seen = new java.util.LinkedHashSet<>();
        java.util.List<ProjectDetailResponse> result = new java.util.ArrayList<>();

        // Projects where user is owner
        for (Project p : projectRepository.findByOwner_IdOrderByCreatedAtDesc(currentUser.getId())) {
            if (seen.add(p.getId())) result.add(toProjectDetail(p));
        }
        // Projects where user is team member
        for (ProjectTeamMember m : projectTeamMemberRepository.findByUser_IdOrderByAddedAtDesc(currentUser.getId())) {
            if (seen.add(m.getProject().getId())) result.add(toProjectDetail(m.getProject()));
        }
        return result;
    }

    public ProjectDetailResponse getProjectById(String id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return toProjectDetail(project);
    }

    @Transactional
    public void deleteProject(String id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        if (currentUser.getRole() != UserRole.DIRECTEUR_GENERAL) {
            throw new ForbiddenException("Seul le Directeur Général peut supprimer un projet");
        }
        broadcastService.sendProjectUpdate(id, "PROJECT_DELETED");
        projectRepository.delete(project);
    }

    @Transactional
    public ProjectDetailResponse advanceStage(String id, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION && !isOwner) {
            throw new ForbiddenException("Seul le Responsable Innovation ou le propriétaire du projet peut avancer l'étape");
        }

        List<ProjectTask> stageTasks = projectTaskRepository.findByProject_IdAndStageOrderByCreatedAtDesc(id, project.getCurrentStage());
        long tasksNotDone = stageTasks.stream().filter(t -> t.getStatus() != TaskStatus.TERMINEE).count();
        if (tasksNotDone > 0) {
            throw new BadRequestException("Toutes les tâches de cette étape doivent être terminées avant de passer à la suivante (" + tasksNotDone + " en attente).");
        }

        if ("TERMINEE".equals(project.getStatus())) {
            throw new BadRequestException("Le projet est déjà terminé");
        }

        ProjectStage current = project.getCurrentStage();
        if (current == ProjectStage.MISE_A_ECHELLE) {
            project.setStatus("TERMINEE");
            project.setClosedAt(java.time.Instant.now());
            project.setStageProgress(100);
            project = projectRepository.save(project);

            String link = "/suivi-projet?id=" + project.getId();
            notificationService.notify(project.getOwner(), "SUCCESS", "Projet terminé",
                    "Le projet \"" + project.getName() + "\" est terminé. Toutes les étapes sont complétées.", link);

            broadcastService.sendProjectUpdate(id, "STAGE_ADVANCED");
            return toProjectDetail(project);
        }

        ProjectStage next;
        switch (current) {
            case EXPLORATION -> next = ProjectStage.CONCEPTUALISATION;
            case CONCEPTUALISATION -> next = ProjectStage.PILOTE;
            case PILOTE -> next = ProjectStage.MISE_A_ECHELLE;
            default -> throw new BadRequestException("Étape inconnue");
        }

        project.setCurrentStage(next);
        project = projectRepository.save(project);
        recalculateProgress(project);

        String link = "/suivi-projet?id=" + project.getId();
        notificationService.notify(project.getOwner(), "SUCCESS", "Étape avancée",
                "Le projet \"" + project.getName() + "\" est passé à l'étape " + next + ".", link);

        broadcastService.sendProjectUpdate(id, "STAGE_ADVANCED");
        return toProjectDetail(project);
    }

    @Transactional
    public ProjectDetailResponse updateProgress(String id, int progress, User currentUser) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        boolean isOwner = project.getOwner().getId().equals(currentUser.getId());
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION && !isOwner) {
            throw new ForbiddenException("Seul le Responsable Innovation ou le propriétaire du projet peut modifier la progression");
        }

        int clamped = Math.max(0, Math.min(100, progress));
        project.setStageProgress(clamped);
        project = projectRepository.save(project);
        broadcastService.sendProjectUpdate(id, "PROGRESS_UPDATED");
        return toProjectDetail(project);
    }

    @Transactional
    public ProjectDetailResponse toggleDeliverable(String projectId, String deliverableId, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut marquer les livrables comme terminés");
        }

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

        broadcastService.sendProjectUpdate(projectId, "DELIVERABLE_UPDATED");
        return toProjectDetail(project);
    }

    private void recalculateProgress(Project project) {
        List<ProjectDeliverable> stageDeliverables = project.getDeliverables().stream()
                .filter(d -> d.getStage() == project.getCurrentStage())
                .toList();
        List<ProjectTask> stageTasks = projectTaskRepository.findByProject_IdAndStageOrderByCreatedAtDesc(project.getId(), project.getCurrentStage());

        int totalItems = stageDeliverables.size() + stageTasks.size();
        if (totalItems == 0) {
            project.setStageProgress(0);
        } else {
            long deliverablesDone = stageDeliverables.stream().filter(ProjectDeliverable::getIsDone).count();
            long tasksDone = stageTasks.stream().filter(t -> t.getStatus() == TaskStatus.TERMINEE).count();
            int pct = (int) Math.round(((deliverablesDone + tasksDone) * 100.0) / totalItems);
            project.setStageProgress(Math.min(100, pct));
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

    // ── Deliverable management ──

    @Transactional
    public ProjectDetailResponse createDeliverable(String projectId, String title, String stageStr, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut créer des livrables");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectStage stage;
        if (stageStr != null && !stageStr.isBlank()) {
            try {
                stage = ProjectStage.valueOf(stageStr);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Étape invalide: " + stageStr);
            }
        } else {
            stage = project.getCurrentStage();
        }

        int maxSort = project.getDeliverables().stream()
                .filter(d -> d.getStage() == stage)
                .mapToInt(ProjectDeliverable::getSortOrder)
                .max().orElse(0);

        ProjectDeliverable deliverable = ProjectDeliverable.builder()
                .project(project)
                .stage(stage)
                .title(title)
                .sortOrder(maxSort + 1)
                .build();

        projectDeliverableRepository.save(deliverable);
        recalculateProgress(project);

        broadcastService.sendProjectUpdate(projectId, "DELIVERABLE_UPDATED");
        Project refreshed = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return toProjectDetail(refreshed);
    }

    @Transactional
    public ProjectDetailResponse deleteDeliverable(String projectId, String deliverableId, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut supprimer des livrables");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectDeliverable deliverable = projectDeliverableRepository.findById(deliverableId)
                .orElseThrow(() -> new ResourceNotFoundException("Livrable non trouvé"));

        if (!deliverable.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Ce livrable n'appartient pas à ce projet");
        }

        projectDeliverableRepository.delete(deliverable);
        recalculateProgress(project);

        broadcastService.sendProjectUpdate(projectId, "DELIVERABLE_UPDATED");
        Project refreshed = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return toProjectDetail(refreshed);
    }

    // ── Task management ──

    public List<ProjectTaskResponse> getTasksForProject(String projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return projectTaskRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toTaskResponse)
                .toList();
    }

    @Transactional
    public ProjectTaskResponse createTask(String projectId, CreateTaskRequest req, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut créer des tâches");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        ProjectStage stage;
        try {
            stage = ProjectStage.valueOf(req.getStage());
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Étape invalide: " + req.getStage());
        }

        User assignee = null;
        if (req.getAssignedToId() != null && !req.getAssignedToId().isBlank()) {
            assignee = userRepository.findById(req.getAssignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné non trouvé"));
            if (!projectTeamMemberRepository.existsByProject_IdAndUser_Id(projectId, assignee.getId())) {
                throw new BadRequestException("Cet utilisateur ne fait pas partie de l'équipe du projet");
            }
        }

        LocalDate dueDate = null;
        if (req.getDueDate() != null && !req.getDueDate().isBlank()) {
            dueDate = LocalDate.parse(req.getDueDate());
        }

        ProjectTask task = ProjectTask.builder()
                .project(project)
                .title(req.getTitle())
                .description(req.getDescription())
                .stage(stage)
                .assignedTo(assignee)
                .createdBy(currentUser)
                .dueDate(dueDate)
                .build();

        task = projectTaskRepository.save(task);

        if (assignee != null) {
            notificationService.notify(assignee, "INFO", "Nouvelle tâche assignée",
                    "La tâche \"" + task.getTitle() + "\" vous a été assignée dans le projet \"" + project.getName() + "\".",
                    "/mes-taches");
        }

        broadcastService.sendProjectUpdate(projectId, "TASK_UPDATED");
        return toTaskResponse(task);
    }

    @Transactional
    public ProjectTaskResponse updateTask(String projectId, String taskId, UpdateTaskRequest req, User currentUser) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Cette tâche n'appartient pas à ce projet");
        }

        boolean isCreator = task.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(currentUser.getId());
        boolean isRespInnov = currentUser.getRole() == UserRole.RESPONSABLE_INNOVATION;

        if (!isCreator && !isAssignee && !isRespInnov) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette tâche");
        }

        if (req.getTitle() != null) task.setTitle(req.getTitle());
        if (req.getDescription() != null) task.setDescription(req.getDescription());

        if (req.getStatus() != null) {
            try {
                task.setStatus(TaskStatus.valueOf(req.getStatus()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Statut invalide: " + req.getStatus());
            }
        }

        if (req.getAssignedToId() != null) {
            if (req.getAssignedToId().isBlank()) {
                task.setAssignedTo(null);
            } else {
                User assignee = userRepository.findById(req.getAssignedToId())
                        .orElseThrow(() -> new ResourceNotFoundException("Utilisateur assigné non trouvé"));
                if (!projectTeamMemberRepository.existsByProject_IdAndUser_Id(projectId, assignee.getId())) {
                    throw new BadRequestException("Cet utilisateur ne fait pas partie de l'équipe du projet");
                }
                task.setAssignedTo(assignee);
            }
        }

        if (req.getDueDate() != null) {
            task.setDueDate(req.getDueDate().isBlank() ? null : LocalDate.parse(req.getDueDate()));
        }

        ProjectTask savedTask = projectTaskRepository.save(task);
        recalculateProgress(savedTask.getProject());

        if (req.getStatus() != null && TaskStatus.valueOf(req.getStatus()) == TaskStatus.TERMINEE) {
            User owner = savedTask.getProject().getOwner();
            notificationService.notify(owner, "SUCCESS", "Tâche terminée",
                    "La tâche \"" + savedTask.getTitle() + "\" a été marquée comme terminée.",
                    "/suivi-projet?id=" + savedTask.getProject().getId());
        }

        broadcastService.sendProjectUpdate(projectId, "TASK_UPDATED");
        return toTaskResponse(savedTask);
    }

    @Transactional
    public void deleteTask(String projectId, String taskId, User currentUser) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Cette tâche n'appartient pas à ce projet");
        }

        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut supprimer des tâches");
        }

        projectTaskRepository.delete(task);
        broadcastService.sendProjectUpdate(projectId, "TASK_UPDATED");
    }

    private ProjectTaskResponse toTaskResponse(ProjectTask t) {
        return ProjectTaskResponse.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .stage(t.getStage())
                .status(t.getStatus())
                .assignedToId(t.getAssignedTo() != null ? t.getAssignedTo().getId() : null)
                .assignedToName(t.getAssignedTo() != null ? t.getAssignedTo().getFullName() : null)
                .createdById(t.getCreatedBy().getId())
                .createdByName(t.getCreatedBy().getFullName())
                .dueDate(t.getDueDate())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .projectId(t.getProject().getId())
                .projectName(t.getProject().getName())
                .ideaTitle(t.getProject().getIdea() != null ? t.getProject().getIdea().getTitle() : null)
                .build();
    }

    public List<ProjectTaskResponse> getMyTasks(User currentUser) {
        return projectTaskRepository.findByAssignedTo_IdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toTaskResponse)
                .toList();
    }

    // ── Team management ──

    public List<TeamMemberResponse> getTeamMembers(String projectId) {
        projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));
        return projectTeamMemberRepository.findByProject_IdOrderByAddedAtDesc(projectId).stream()
                .map(this::toTeamMemberResponse)
                .toList();
    }

    @Transactional
    public TeamInvitationResponse addTeamMember(String projectId, AddTeamMemberRequest req, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut gérer l'équipe");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        User member = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));

        if (projectTeamMemberRepository.existsByProject_IdAndUser_Id(projectId, req.getUserId())) {
            throw new BadRequestException("Cet utilisateur fait déjà partie de l'équipe");
        }

        if (teamInvitationRepository.existsByProject_IdAndInvitedUser_IdAndStatus(projectId, req.getUserId(), InvitationStatus.EN_ATTENTE)) {
            throw new BadRequestException("Une invitation est déjà en attente pour cet utilisateur");
        }

        Instant deadline = null;
        if (req.getResponseDeadline() != null && !req.getResponseDeadline().isBlank()) {
            deadline = Instant.parse(req.getResponseDeadline());
        }

        TeamInvitation invitation = TeamInvitation.builder()
                .project(project)
                .invitedUser(member)
                .invitedBy(currentUser)
                .teamRole(req.getTeamRole())
                .responseDeadline(deadline)
                .build();

        invitation = teamInvitationRepository.save(invitation);

        String deadlineInfo = deadline != null ? " Veuillez répondre avant la date limite." : "";
        notificationService.notify(member, "INFO", "Invitation à rejoindre un projet",
                "Vous êtes invité(e) à rejoindre l'équipe du projet \"" + project.getName() + "\""
                        + (req.getTeamRole() != null ? " en tant que " + req.getTeamRole() : "")
                        + "." + deadlineInfo,
                "/mes-invitations");

        TeamInvitationResponse invResponse = toInvitationResponse(invitation);
        broadcastService.sendInvitationToUser(member.getId(), invResponse);
        broadcastService.sendProjectUpdate(projectId, "TEAM_UPDATED");
        return invResponse;
    }

    @Transactional
    public List<TeamInvitationResponse> getInvitationsSent(User currentUser) {
        return teamInvitationRepository.findByInvitedBy_IdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(inv -> {
                    if (inv.getStatus() == InvitationStatus.EN_ATTENTE
                            && inv.getResponseDeadline() != null
                            && Instant.now().isAfter(inv.getResponseDeadline())) {
                        inv.setStatus(InvitationStatus.EXPIREE);
                        teamInvitationRepository.save(inv);
                    }
                    return toInvitationResponse(inv);
                })
                .toList();
    }

    @Transactional
    public List<TeamInvitationResponse> getMyInvitations(User currentUser) {
        return teamInvitationRepository.findByInvitedUser_IdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(inv -> {
                    if (inv.getStatus() == InvitationStatus.EN_ATTENTE
                            && inv.getResponseDeadline() != null
                            && Instant.now().isAfter(inv.getResponseDeadline())) {
                        inv.setStatus(InvitationStatus.EXPIREE);
                        teamInvitationRepository.save(inv);
                    }
                    return toInvitationResponse(inv);
                })
                .toList();
    }

    public List<TeamInvitationResponse> getProjectInvitations(String projectId) {
        return teamInvitationRepository.findByProject_IdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toInvitationResponse)
                .toList();
    }

    @Transactional
    public TeamInvitationResponse respondToInvitation(String invitationId, RespondInvitationRequest req, User currentUser) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation non trouvée"));

        if (!invitation.getInvitedUser().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Vous ne pouvez répondre qu'à vos propres invitations");
        }

        if (invitation.getStatus() != InvitationStatus.EN_ATTENTE) {
            throw new BadRequestException("Cette invitation a déjà été traitée");
        }

        if (invitation.getResponseDeadline() != null && Instant.now().isAfter(invitation.getResponseDeadline())) {
            invitation.setStatus(InvitationStatus.EXPIREE);
            teamInvitationRepository.save(invitation);
            throw new BadRequestException("Le délai de réponse est dépassé");
        }

        boolean accepted = "ACCEPT".equalsIgnoreCase(req.getAction());
        invitation.setStatus(accepted ? InvitationStatus.ACCEPTEE : InvitationStatus.REFUSEE);
        invitation.setResponseMessage(req.getMessage());
        invitation.setRespondedAt(Instant.now());
        teamInvitationRepository.save(invitation);

        Project project = invitation.getProject();
        User inviter = invitation.getInvitedBy();

        if (accepted) {
            ProjectTeamMember teamMember = ProjectTeamMember.builder()
                    .project(project)
                    .user(currentUser)
                    .teamRole(invitation.getTeamRole())
                    .addedBy(inviter)
                    .build();
            projectTeamMemberRepository.save(teamMember);

            notificationService.notify(inviter, "SUCCESS", "Invitation acceptée",
                    currentUser.getFullName() + " a accepté de rejoindre l'équipe du projet \"" + project.getName() + "\".",
                    "/suivi-projet?id=" + project.getId());
        } else {
            String reason = req.getMessage() != null && !req.getMessage().isBlank()
                    ? " Justification : " + req.getMessage()
                    : "";
            notificationService.notify(inviter, "WARNING", "Invitation refusée",
                    currentUser.getFullName() + " a refusé de rejoindre l'équipe du projet \"" + project.getName() + "\"." + reason,
                    "/suivi-projet?id=" + project.getId());
        }

        broadcastService.sendProjectUpdate(project.getId(), "TEAM_UPDATED");
        return toInvitationResponse(invitation);
    }

    @Transactional
    public void deleteInvitation(String invitationId, User currentUser) {
        TeamInvitation invitation = teamInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("Invitation non trouvée"));

        if (!invitation.getInvitedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Vous ne pouvez supprimer que les invitations que vous avez envoyées");
        }

        teamInvitationRepository.delete(invitation);
    }

    private TeamInvitationResponse toInvitationResponse(TeamInvitation inv) {
        Project p = inv.getProject();
        return TeamInvitationResponse.builder()
                .id(inv.getId())
                .projectId(p.getId())
                .projectName(p.getName())
                .ideaTitle(p.getIdea() != null ? p.getIdea().getTitle() : null)
                .teamRole(inv.getTeamRole())
                .status(inv.getStatus())
                .invitedByName(inv.getInvitedBy().getFullName())
                .invitedUserName(inv.getInvitedUser().getFullName())
                .invitedUserId(inv.getInvitedUser().getId())
                .responseDeadline(inv.getResponseDeadline())
                .responseMessage(inv.getResponseMessage())
                .respondedAt(inv.getRespondedAt())
                .createdAt(inv.getCreatedAt())
                .build();
    }

    @Transactional
    public TeamMemberResponse updateTeamMemberRole(String projectId, String memberId, String teamRole, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut gérer l'équipe");
        }

        ProjectTeamMember member = projectTeamMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé"));

        if (!member.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Ce membre n'appartient pas à ce projet");
        }

        member.setTeamRole(teamRole);
        member = projectTeamMemberRepository.save(member);
        broadcastService.sendProjectUpdate(projectId, "TEAM_UPDATED");
        return toTeamMemberResponse(member);
    }

    @Transactional
    public void removeTeamMember(String projectId, String memberId, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
            throw new ForbiddenException("Seul le Responsable Innovation peut gérer l'équipe");
        }

        ProjectTeamMember member = projectTeamMemberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Membre non trouvé"));

        if (!member.getProject().getId().equals(projectId)) {
            throw new BadRequestException("Ce membre n'appartient pas à ce projet");
        }

        projectTeamMemberRepository.delete(member);
        broadcastService.sendProjectUpdate(projectId, "TEAM_UPDATED");
    }

    private TeamMemberResponse toTeamMemberResponse(ProjectTeamMember m) {
        User u = m.getUser();
        return TeamMemberResponse.builder()
                .id(m.getId())
                .userId(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .role(u.getRole().name())
                .teamRole(m.getTeamRole())
                .department(u.getDepartment())
                .avatarUrl(u.getAvatarUrl())
                .addedByName(m.getAddedBy().getFullName())
                .addedAt(m.getAddedAt())
                .build();
    }

    private ProjectDetailResponse toProjectDetail(Project p) {
        return ProjectDetailResponse.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .currentStage(p.getCurrentStage())
                .stageProgress(p.getStageProgress())
                .status(p.getStatus())
                .owner(toUserSummary(p.getOwner()))
                .dueDate(p.getDueDate())
                .launchedAt(p.getLaunchedAt())
                .closedAt(p.getClosedAt())
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
