package com.innovhub.service;

import com.innovhub.dto.request.AddCommentRequest;
import com.innovhub.dto.request.ScoreIdeaRequest;
import com.innovhub.dto.request.SubmitIdeaRequest;
import com.innovhub.dto.request.WorkflowActionRequest;
import com.innovhub.dto.response.IdeaDetailResponse;
import com.innovhub.dto.response.IdeaScoreResponse;
import com.innovhub.dto.response.IdeaSummaryResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.*;
import com.innovhub.enums.IdeaStatus;
import com.innovhub.enums.ProjectStage;
import com.innovhub.enums.UserRole;
import com.innovhub.exception.BadRequestException;
import com.innovhub.exception.ForbiddenException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class IdeaService {

    private static final int REQUIRED_RESPONSABLE_SCORES = 3;

    private final IdeaRepository ideaRepository;
    private final IdeaScoreRepository ideaScoreRepository;
    private final IdeaWorkflowHistoryRepository ideaWorkflowHistoryRepository;
    private final CampaignRepository campaignRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final DocumentRepository documentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectDeliverableRepository projectDeliverableRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final ProjectTeamMemberRepository projectTeamMemberRepository;
    private final ProjectMessageRepository projectMessageRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public IdeaDetailResponse submitIdea(SubmitIdeaRequest req, User currentUser) {
        Idea idea = Idea.builder()
                .title(req.getTitle())
                .category(req.getCategory())
                .problemStatement(req.getProblemStatement())
                .proposedSolution(req.getProposedSolution())
                .expectedRoi(req.getExpectedRoi())
                .estimatedCost(req.getEstimatedCost())
                .roiDelayMonths(req.getRoiDelayMonths())
                .targetBu(req.getTargetBu())
                .timelineMonths(req.getTimelineMonths())
                .resourcesNeeded(req.getResourcesNeeded())
                .imageUrl(req.getImageUrl())
                .submittedBy(currentUser)
                .build();

        if (req.getCampaignId() != null) {
            Campaign campaign = campaignRepository.findById(req.getCampaignId())
                    .orElseThrow(() -> new ResourceNotFoundException("Campagne non trouvée"));
            idea.setCampaign(campaign);
        }

        if (req.isDraft()) {
            idea.setStatus(IdeaStatus.BROUILLON);
        } else {
            idea.setStatus(IdeaStatus.SOUMISE);
            idea.setSubmittedAt(Instant.now());
        }

        idea = ideaRepository.save(idea);

        if (idea.getStatus() == IdeaStatus.SOUMISE) {
            final Idea savedIdea = idea;
            userRepository.findByRole(UserRole.RESPONSABLE_INNOVATION)
                    .forEach(u -> notificationService.notify(u, "Nouvelle idée soumise", "L'idée \"" + savedIdea.getTitle() + "\" a été soumise.", "/approbation"));
        }

        return toIdeaDetail(idea);
    }

    public Page<IdeaSummaryResponse> getAllIdeas(Pageable pageable) {
        return mapPageWithBatchCounts(ideaRepository.findAll(pageable));
    }

    public Page<IdeaSummaryResponse> getMyIdeas(User currentUser, Pageable pageable) {
        return mapPageWithBatchCounts(ideaRepository.findBySubmittedBy(currentUser, pageable));
    }

    public Page<IdeaSummaryResponse> getIdeasByCampaign(String campaignId, Pageable pageable) {
        return mapPageWithBatchCounts(ideaRepository.findByCampaign_Id(campaignId, pageable));
    }

    private Page<IdeaSummaryResponse> mapPageWithBatchCounts(Page<Idea> page) {
        List<String> ids = page.getContent().stream().map(Idea::getId).collect(Collectors.toList());
        Map<String, Long> scoreCounts = ids.isEmpty() ? Map.of() : ideaScoreRepository.countMapByIdeaIds(ids);
        Map<String, Long> voteCounts  = ids.isEmpty() ? Map.of() : voteRepository.countMapByIdeaIds(ids);
        return page.map(idea -> toIdeaSummaryWithCounts(idea, scoreCounts, voteCounts));
    }

    public IdeaDetailResponse getIdeaById(String id) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));
        return toIdeaDetail(idea);
    }

    public IdeaDetailResponse updateIdea(String id, SubmitIdeaRequest req, User currentUser) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        if (!idea.getSubmittedBy().getId().equals(currentUser.getId())) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à modifier cette idée");
        }

        if (idea.getStatus() != IdeaStatus.BROUILLON) {
            throw new BadRequestException("Seul un brouillon peut être modifié");
        }

        idea.setTitle(req.getTitle());
        idea.setCategory(req.getCategory());
        idea.setProblemStatement(req.getProblemStatement());
        idea.setProposedSolution(req.getProposedSolution());
        idea.setExpectedRoi(req.getExpectedRoi());
        idea.setEstimatedCost(req.getEstimatedCost());
        idea.setRoiDelayMonths(req.getRoiDelayMonths());
        idea.setTargetBu(req.getTargetBu());
        idea.setTimelineMonths(req.getTimelineMonths());
        idea.setResourcesNeeded(req.getResourcesNeeded());
        idea.setImageUrl(req.getImageUrl());

        if (req.getCampaignId() != null) {
            Campaign campaign = campaignRepository.findById(req.getCampaignId())
                    .orElseThrow(() -> new ResourceNotFoundException("Campagne non trouvée"));
            idea.setCampaign(campaign);
        } else {
            idea.setCampaign(null);
        }

        if (!req.isDraft()) {
            idea.setStatus(IdeaStatus.SOUMISE);
            idea.setSubmittedAt(Instant.now());
        }

        idea = ideaRepository.save(idea);

        if (idea.getStatus() == IdeaStatus.SOUMISE) {
            final Idea savedIdea = idea;
            userRepository.findByRole(UserRole.RESPONSABLE_INNOVATION)
                    .forEach(u -> notificationService.notify(u, "Nouvelle idée soumise", "L'idée \"" + savedIdea.getTitle() + "\" a été soumise.", "/approbation"));
        }

        return toIdeaDetail(idea);
    }

    public void deleteIdea(String id, User currentUser) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        if (idea.getStatus() == IdeaStatus.CLOTUREE) {
            throw new BadRequestException("Une idée clôturée ne peut pas être supprimée");
        }

        boolean isResponsable = currentUser.getRole() == UserRole.RESPONSABLE_INNOVATION;
        boolean isOwner = idea.getSubmittedBy() != null && idea.getSubmittedBy().getId().equals(currentUser.getId());

        if (!isResponsable && !isOwner) {
            throw new ForbiddenException("Vous ne pouvez supprimer que vos propres idées");
        }

        // Explicitly delete ALL child records in dependency order

        // 1. Votes (FK without cascade in existing DB)
        voteRepository.deleteAllByIdeaId(id);

        // 2. Comments on idea
        commentRepository.deleteAllByIdeaId(id);

        // 3. Documents attached to idea
        documentRepository.deleteAllByIdeaId(id);

        // 4. Idea scores (FK without cascade)
        ideaScoreRepository.deleteAll(ideaScoreRepository.findByIdea_Id(id));

        // 5. Workflow history
        ideaWorkflowHistoryRepository.deleteAll(ideaWorkflowHistoryRepository.findByIdea_IdOrderByCreatedAtDesc(id));

        // 6. Project and all its children (project FK has no cascade)
        projectRepository.findByIdea_Id(id).ifPresent(project -> {
            String projectId = project.getId();
            projectMessageRepository.deleteAll(
                projectMessageRepository.findByProject_IdOrderByCreatedAtDesc(projectId, org.springframework.data.domain.Pageable.unpaged()).getContent()
            );
            projectTaskRepository.deleteAll(projectTaskRepository.findByProject_IdOrderByCreatedAtDesc(projectId));
            projectTeamMemberRepository.deleteAll(projectTeamMemberRepository.findByProject_IdOrderByAddedAtDesc(projectId));
            projectDeliverableRepository.deleteAll(projectDeliverableRepository.findByProject_IdOrderBySortOrderAsc(projectId));
            projectRepository.delete(project);
        });

        ideaRepository.delete(idea);
    }

    public IdeaScoreResponse scoreIdea(String ideaId, ScoreIdeaRequest req, User currentUser) {
        UserRole role = currentUser.getRole();
        if (role != UserRole.RESPONSABLE_INNOVATION && role != UserRole.DIRECTEUR_BU && role != UserRole.DIRECTEUR_GENERAL) {
            throw new ForbiddenException("Seuls le Resp. Innovation, le Directeur BU et le Directeur Général peuvent scorer une idée. Votre rôle actuel : " + role);
        }

        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        if (idea.getStatus() != IdeaStatus.SOUMISE && idea.getStatus() != IdeaStatus.EN_VALIDATION) {
            throw new BadRequestException("Seules les idées soumises ou en validation peuvent être notées. Statut actuel : " + idea.getStatus());
        }

        if (idea.getScoringDeadline() != null && Instant.now().isAfter(idea.getScoringDeadline())) {
            throw new BadRequestException("Le délai de scoring est dépassé pour cette idée");
        }

        if (ideaScoreRepository.findByIdea_IdAndScoredBy_Id(ideaId, currentUser.getId()).isPresent()) {
            throw new BadRequestException("Vous avez déjà noté cette idée");
        }

        List<IdeaScore> existingScores = ideaScoreRepository.findByIdea_Id(ideaId);
        boolean roleAlreadyScored = existingScores.stream()
                .anyMatch(s -> s.getScoredBy().getRole() == currentUser.getRole());
        if (roleAlreadyScored) {
            throw new BadRequestException("Un utilisateur avec le rôle " + role + " a déjà noté cette idée. Un seul score par rôle.");
        }

        BigDecimal computedScore = BigDecimal.valueOf(
                req.getInnovationLevel()      * 0.25 +
                req.getTechnicalFeasibility() * 0.20 +
                req.getStrategicAlignment()   * 0.25 +
                req.getRoiPotential()         * 0.20 +
                (10 - req.getRiskLevel())     * 0.10
        ).setScale(2, RoundingMode.HALF_UP);

        IdeaScore score = IdeaScore.builder()
                .idea(idea)
                .scoredBy(currentUser)
                .innovationLevel(req.getInnovationLevel())
                .technicalFeasibility(req.getTechnicalFeasibility())
                .strategicAlignment(req.getStrategicAlignment())
                .roiPotential(req.getRoiPotential())
                .riskLevel(req.getRiskLevel())
                .totalScore(computedScore)
                .comments(req.getComments())
                .build();

        IdeaScore refreshed = ideaScoreRepository.save(score);

        List<IdeaScore> allScores = ideaScoreRepository.findByIdea_Id(ideaId);
        boolean hasRespInnov = allScores.stream().anyMatch(s -> s.getScoredBy().getRole() == UserRole.RESPONSABLE_INNOVATION);
        boolean hasDirBu = allScores.stream().anyMatch(s -> s.getScoredBy().getRole() == UserRole.DIRECTEUR_BU);
        boolean hasDirGen = allScores.stream().anyMatch(s -> s.getScoredBy().getRole() == UserRole.DIRECTEUR_GENERAL);

        if (hasRespInnov && hasDirBu && hasDirGen) {
            BigDecimal avgScore = calculateAverageScore(allScores);
            // Re-fetch idea since cache was cleared
            idea = ideaRepository.findById(ideaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));
            idea.setTotalScore(avgScore);
            idea.setStatus(IdeaStatus.SCOREE);
            ideaRepository.save(idea);
            notifySubmitter(idea, "SUCCESS", "Idée évaluée", "Votre idée \"" + idea.getTitle() + "\" a reçu les 3 évaluations requises (Resp. Innovation, Dir. BU, Dir. Général).");
        } else {
            idea = ideaRepository.findById(ideaId)
                    .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));
            idea.setStatus(IdeaStatus.EN_VALIDATION);
            ideaRepository.save(idea);
        }

        return toIdeaScoreResponse(refreshed);
    }

    public IdeaDetailResponse processWorkflowAction(String ideaId, WorkflowActionRequest req, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        String action = req.getAction();
        IdeaStatus oldStatus = idea.getStatus();
        IdeaStatus newStatus;

        switch (action) {
            case "VALIDATE" -> {
                // Responsable Innovation validates a scored idea
                if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION) {
                    throw new BadRequestException("Seul le Responsable Innovation peut valider");
                }
                if (oldStatus != IdeaStatus.SCOREE) {
                    throw new BadRequestException("Seules les idées ayant reçu les 3 scores requis peuvent passer à l'approbation");
                }
                newStatus = IdeaStatus.APPROUVEE_INNOVATION;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "SUCCESS", "Idée validée", "Votre idée \"" + idea.getTitle() + "\" a été validée par le Responsable Innovation.");
                notifyUsersByRole(UserRole.DIRECTEUR_BU, "Idée à approuver", "L'idée \"" + idea.getTitle() + "\" attend votre approbation.", "/approbation");
            }
            case "REJECT" -> {
                if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION
                        && currentUser.getRole() != UserRole.DIRECTEUR_BU
                        && currentUser.getRole() != UserRole.DIRECTEUR_GENERAL) {
                    throw new ForbiddenException("Seuls les managers peuvent rejeter une idée");
                }
                if (oldStatus == IdeaStatus.CLOTUREE || oldStatus == IdeaStatus.REJETEE || oldStatus == IdeaStatus.BROUILLON) {
                    throw new BadRequestException("Cette idée ne peut pas être rejetée dans son état actuel : " + oldStatus);
                }
                newStatus = IdeaStatus.REJETEE;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "ERROR", "Idée rejetée", "Votre idée \"" + idea.getTitle() + "\" a été rejetée.");
            }
            case "APPROVE_BU" -> {
                // Directeur BU approves
                if (currentUser.getRole() != UserRole.DIRECTEUR_BU) {
                    throw new BadRequestException("Seul le Directeur BU peut approuver à ce stade");
                }
                if (oldStatus != IdeaStatus.APPROUVEE_INNOVATION) {
                    throw new BadRequestException("Seules les idées validées par l'innovation peuvent être approuvées BU");
                }
                newStatus = IdeaStatus.APPROUVEE_BU;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "SUCCESS", "Idée approuvée BU", "Votre idée \"" + idea.getTitle() + "\" a été approuvée par le Directeur BU.");
                notifyUsersByRole(UserRole.DIRECTEUR_GENERAL, "Idée à approuver", "L'idée \"" + idea.getTitle() + "\" attend votre approbation finale.", "/approbation");
            }
            case "APPROVE_DG" -> {
                // Directeur Général approves
                if (currentUser.getRole() != UserRole.DIRECTEUR_GENERAL) {
                    throw new BadRequestException("Seul le Directeur Général peut approuver à ce stade");
                }
                if (oldStatus != IdeaStatus.APPROUVEE_BU) {
                    throw new BadRequestException("Seules les idées approuvées BU peuvent être approuvées DG");
                }
                newStatus = IdeaStatus.APPROUVEE_DG;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "SUCCESS", "Idée approuvée DG", "Votre idée \"" + idea.getTitle() + "\" a été approuvée par le Directeur Général.");
            }
            case "CLOSE" -> {
                // Directeur Général closes the idea and creates a project
                if (currentUser.getRole() != UserRole.DIRECTEUR_GENERAL) {
                    throw new BadRequestException("Seul le Directeur Général peut clôturer une idée");
                }
                if (oldStatus != IdeaStatus.APPROUVEE_DG) {
                    throw new BadRequestException("Seules les idées approuvées DG peuvent être clôturées");
                }
                newStatus = IdeaStatus.CLOTUREE;
                idea.setStatus(newStatus);
                idea.setCurrentStage(ProjectStage.EXPLORATION);

                // Auto-create project, owned by Responsable Innovation
                User projectOwner = userRepository.findFirstByRole(UserRole.RESPONSABLE_INNOVATION)
                        .orElse(currentUser);

                Project project = Project.builder()
                        .idea(idea)
                        .name("Projet : " + idea.getTitle())
                        .description(idea.getProposedSolution())
                        .currentStage(ProjectStage.EXPLORATION)
                        .stageProgress(0)
                        .owner(projectOwner)
                        .build();
                project = projectRepository.save(project);

                List<ProjectDeliverable> deliverables = List.of(
                        ProjectDeliverable.builder().project(project).stage(ProjectStage.EXPLORATION).title("Étude de faisabilité technique").sortOrder(0).build(),
                        ProjectDeliverable.builder().project(project).stage(ProjectStage.EXPLORATION).title("Analyse comparative du marché").sortOrder(1).build(),
                        ProjectDeliverable.builder().project(project).stage(ProjectStage.EXPLORATION).title("Identification des partenaires clés").sortOrder(2).build(),
                        ProjectDeliverable.builder().project(project).stage(ProjectStage.EXPLORATION).title("Rapport d'estimation budgétaire").sortOrder(3).build()
                );
                projectDeliverableRepository.saveAll(deliverables);

                User submitter = idea.getSubmittedBy();
                submitter.setPoints(submitter.getPoints() + 500);
                userRepository.save(submitter);

                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);

                notifySubmitter(idea, "Idée clôturée", "Votre idée \"" + idea.getTitle() + "\" a été clôturée et un projet a été créé. +500 points !");
                notifyUsersByRole(UserRole.RESPONSABLE_INNOVATION, "Nouveau projet créé", "Le projet \"" + project.getName() + "\" a été créé. Vous en êtes le responsable.", "/suivi-projet?id=" + project.getId());
            }
            default -> throw new BadRequestException("Action inconnue");
        }

        return toIdeaDetail(idea);
    }

    public IdeaDetailResponse setScoringDeadline(String ideaId, Instant deadline, User currentUser) {
        if (currentUser.getRole() != UserRole.RESPONSABLE_INNOVATION
                && currentUser.getRole() != UserRole.DIRECTEUR_BU
                && currentUser.getRole() != UserRole.DIRECTEUR_GENERAL) {
            throw new ForbiddenException("Seuls les managers peuvent définir un délai de scoring");
        }
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));
        idea.setScoringDeadline(deadline);
        final Idea savedIdea = ideaRepository.save(idea);

        String formattedDeadline = ZonedDateTime.ofInstant(deadline, ZoneId.of("Africa/Casablanca"))
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy à HH:mm"));

        // Notify the idea submitter
        notifySubmitter(savedIdea, "INFO", "Délai d'évaluation défini",
                "Un délai d'évaluation a été fixé au " + formattedDeadline + " pour votre idée \"" + savedIdea.getTitle() + "\". Les évaluateurs ont été notifiés.");

        // Notify all evaluators who have not yet scored this idea
        List<String> alreadyScoredUserIds = ideaScoreRepository.findByIdea_Id(ideaId)
                .stream().map(s -> s.getScoredBy().getId()).collect(Collectors.toList());

        List<UserRole> evaluatorRoles = List.of(
                UserRole.RESPONSABLE_INNOVATION,
                UserRole.DIRECTEUR_BU,
                UserRole.DIRECTEUR_GENERAL
        );

        for (UserRole role : evaluatorRoles) {
            userRepository.findByRole(role).forEach(evaluator -> {
                if (!alreadyScoredUserIds.contains(evaluator.getId())) {
                    notificationService.notify(evaluator, "WARNING",
                            "Délai d'évaluation fixé",
                            "L'idée \"" + savedIdea.getTitle() + "\" doit être évaluée avant le " + formattedDeadline + ". Votre évaluation est requise.",
                            "/approbation");
                }
            });
        }

        return toIdeaDetail(savedIdea);
    }

    private void saveHistory(Idea idea, IdeaStatus from, IdeaStatus to, User actionBy, String comment) {
        ideaWorkflowHistoryRepository.save(IdeaWorkflowHistory.builder()
                .idea(idea)
                .fromStatus(from)
                .toStatus(to)
                .actionBy(actionBy)
                .comment(comment)
                .build());
    }

    public boolean toggleVote(String ideaId, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        var existingVote = voteRepository.findByIdea_IdAndUser_Id(ideaId, currentUser.getId());

        if (existingVote.isPresent()) {
            voteRepository.delete(existingVote.get());
            return false;
        } else {
            Vote vote = Vote.builder()
                    .idea(idea)
                    .user(currentUser)
                    .build();
            voteRepository.save(vote);
            return true;
        }
    }

    public void addComment(String ideaId, AddCommentRequest req, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        Comment comment = Comment.builder()
                .idea(idea)
                .author(currentUser)
                .content(req.getContent())
                .build();

        if (req.getParentId() != null) {
            Comment parent = commentRepository.findById(req.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Commentaire parent non trouvé"));
            comment.setParent(parent);
        }

        commentRepository.save(comment);

        if (!currentUser.getId().equals(idea.getSubmittedBy().getId())) {
            notificationService.notify(idea.getSubmittedBy(), "Nouveau commentaire", "Un commentaire a été ajouté sur votre idée \"" + idea.getTitle() + "\".", "/mes-idees");
        }
    }

    private IdeaSummaryResponse toIdeaSummaryWithCounts(Idea idea, Map<String, Long> scoreCounts, Map<String, Long> voteCounts) {
        int scoreCount = scoreCounts.getOrDefault(idea.getId(), 0L).intValue();
        long voteCount  = voteCounts.getOrDefault(idea.getId(), 0L);
        return IdeaSummaryResponse.builder()
                .id(idea.getId())
                .reference(idea.getReference())
                .title(idea.getTitle())
                .category(idea.getCategory())
                .status(idea.getStatus())
                .totalScore(idea.getTotalScore())
                .scoreCount(scoreCount)
                .requiredScoreCount(REQUIRED_RESPONSABLE_SCORES)
                .imageUrl(idea.getImageUrl())
                .submittedByName(idea.getSubmittedBy().getFullName())
                .submittedById(idea.getSubmittedBy().getId())
                .voteCount(voteCount)
                .commentCount(0)
                .scoringDeadline(idea.getScoringDeadline())
                .submittedAt(idea.getSubmittedAt())
                .createdAt(idea.getCreatedAt())
                .build();
    }

    private IdeaDetailResponse toIdeaDetail(Idea idea) {
        List<IdeaScore> rawScores = ideaScoreRepository.findByIdea_Id(idea.getId());
        List<IdeaScoreResponse> scores = rawScores.stream()
                .map(this::toIdeaScoreResponse)
                .toList();
        List<String> scoredByRoles = rawScores.stream()
                .map(s -> s.getScoredBy().getRole().name())
                .toList();

        return IdeaDetailResponse.builder()
                .id(idea.getId())
                .reference(idea.getReference())
                .title(idea.getTitle())
                .category(idea.getCategory())
                .status(idea.getStatus())
                .totalScore(idea.getTotalScore())
                .scoreCount(scores.size())
                .requiredScoreCount(REQUIRED_RESPONSABLE_SCORES)
                .imageUrl(idea.getImageUrl())
                .submittedByName(idea.getSubmittedBy().getFullName())
                .submittedById(idea.getSubmittedBy().getId())
                .voteCount(voteRepository.countByIdea_Id(idea.getId()))
                .commentCount(0)
                .submittedAt(idea.getSubmittedAt())
                .createdAt(idea.getCreatedAt())
                .problemStatement(idea.getProblemStatement())
                .proposedSolution(idea.getProposedSolution())
                .expectedRoi(idea.getExpectedRoi())
                .estimatedCost(idea.getEstimatedCost())
                .roiDelayMonths(idea.getRoiDelayMonths())
                .targetBu(idea.getTargetBu())
                .timelineMonths(idea.getTimelineMonths())
                .resourcesNeeded(idea.getResourcesNeeded())
                .currentStage(idea.getCurrentStage())
                .campaignId(idea.getCampaign() != null ? idea.getCampaign().getId() : null)
                .campaignTitle(idea.getCampaign() != null ? idea.getCampaign().getTitle() : null)
                .submittedBy(toUserSummary(idea.getSubmittedBy()))
                .assignedTo(idea.getAssignedTo() != null ? toUserSummary(idea.getAssignedTo()) : null)
                .scores(scores)
                .scoredByRoles(scoredByRoles)
                .scoringDeadline(idea.getScoringDeadline())
                .updatedAt(idea.getUpdatedAt())
                .build();
    }

    private IdeaScoreResponse toIdeaScoreResponse(IdeaScore s) {
        return IdeaScoreResponse.builder()
                .id(s.getId())
                .innovationLevel(s.getInnovationLevel())
                .technicalFeasibility(s.getTechnicalFeasibility())
                .strategicAlignment(s.getStrategicAlignment())
                .roiPotential(s.getRoiPotential())
                .riskLevel(s.getRiskLevel())
                .totalScore(s.getTotalScore())
                .comments(s.getComments())
                .scoredById(s.getScoredBy().getId())
                .scoredByName(s.getScoredBy().getFullName())
                .createdAt(s.getCreatedAt())
                .build();
    }

    private BigDecimal calculateAverageScore(List<IdeaScore> scores) {
        if (scores.isEmpty()) {
            return null;
        }

        List<BigDecimal> nonNullScores = scores.stream()
                .map(IdeaScore::getTotalScore)
                .filter(java.util.Objects::nonNull)
                .toList();

        if (nonNullScores.isEmpty()) {
            return null;
        }

        BigDecimal total = nonNullScores.stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return total.divide(BigDecimal.valueOf(nonNullScores.size()), 2, RoundingMode.HALF_UP);
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

    private void notifySubmitter(Idea idea, String title, String message) {
        notificationService.notify(idea.getSubmittedBy(), "INFO", title, message, "/mes-idees");
    }

    private void notifySubmitter(Idea idea, String type, String title, String message) {
        notificationService.notify(idea.getSubmittedBy(), type, title, message, "/mes-idees");
    }

    private void notifyUsersByRole(UserRole role, String title, String message, String link) {
        userRepository.findByRole(role)
                .forEach(u -> notificationService.notify(u, "INFO", title, message, link));
    }
}

