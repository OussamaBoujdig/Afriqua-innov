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

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class IdeaService {

    private final IdeaRepository ideaRepository;
    private final IdeaScoreRepository ideaScoreRepository;
    private final IdeaWorkflowHistoryRepository ideaWorkflowHistoryRepository;
    private final CampaignRepository campaignRepository;
    private final VoteRepository voteRepository;
    private final CommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final ProjectDeliverableRepository projectDeliverableRepository;
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
            userRepository.findAll().stream()
                    .filter(u -> u.getRole() == UserRole.RESPONSABLE_INNOVATION)
                    .forEach(u -> notificationService.notify(u, "Nouvelle idée soumise", "L'idée \"" + savedIdea.getTitle() + "\" a été soumise.", "/idees/" + savedIdea.getId()));
        }

        return toIdeaDetail(idea);
    }

    public Page<IdeaSummaryResponse> getAllIdeas(Pageable pageable) {
        return ideaRepository.findAll(pageable).map(this::toIdeaSummary);
    }

    public Page<IdeaSummaryResponse> getMyIdeas(User currentUser, Pageable pageable) {
        return ideaRepository.findBySubmittedBy(currentUser, pageable).map(this::toIdeaSummary);
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

        if (req.getCampaignId() != null) {
            Campaign campaign = campaignRepository.findById(req.getCampaignId())
                    .orElseThrow(() -> new ResourceNotFoundException("Campagne non trouvée"));
            idea.setCampaign(campaign);
        } else {
            idea.setCampaign(null);
        }

        idea = ideaRepository.save(idea);
        return toIdeaDetail(idea);
    }

    public void deleteIdea(String id, User currentUser) {
        Idea idea = ideaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        boolean isOwner = idea.getSubmittedBy().getId().equals(currentUser.getId());
        boolean isManager = currentUser.getRole() == UserRole.RESPONSABLE_INNOVATION
                || currentUser.getRole() == UserRole.DIRECTEUR_BU
                || currentUser.getRole() == UserRole.DIRECTEUR_GENERAL;

        if (!isOwner && !isManager) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à supprimer cette idée");
        }

        if (idea.getStatus() == IdeaStatus.CLOTUREE) {
            throw new BadRequestException("Une idée clôturée ne peut pas être supprimée");
        }

        ideaRepository.delete(idea);
    }

    public IdeaScoreResponse scoreIdea(String ideaId, ScoreIdeaRequest req, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        if (idea.getStatus() != IdeaStatus.SOUMISE && idea.getStatus() != IdeaStatus.EN_VALIDATION) {
            throw new BadRequestException("Seules les idées soumises ou en validation peuvent être notées");
        }

        if (ideaScoreRepository.findByIdea_IdAndScoredBy_Id(ideaId, currentUser.getId()).isPresent()) {
            throw new BadRequestException("Vous avez déjà noté cette idée");
        }

        IdeaScore score = IdeaScore.builder()
                .idea(idea)
                .scoredBy(currentUser)
                .innovationLevel(req.getInnovationLevel())
                .technicalFeasibility(req.getTechnicalFeasibility())
                .strategicAlignment(req.getStrategicAlignment())
                .roiPotential(req.getRoiPotential())
                .riskLevel(req.getRiskLevel())
                .comments(req.getComments())
                .build();

        score = ideaScoreRepository.save(score);

        IdeaScore refreshed = ideaScoreRepository.findById(score.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Score non trouvé"));

        idea.setTotalScore(refreshed.getTotalScore());
        idea.setStatus(IdeaStatus.SCOREE);
        ideaRepository.save(idea);

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
                    throw new BadRequestException("Seules les idées scorées peuvent être validées");
                }
                newStatus = IdeaStatus.APPROUVEE_INNOVATION;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "Idée validée", "Votre idée \"" + idea.getTitle() + "\" a été validée par le Responsable Innovation.");
                notifyUsersByRole(UserRole.DIRECTEUR_BU, "Idée à approuver", "L'idée \"" + idea.getTitle() + "\" attend votre approbation.", idea.getId());
            }
            case "REJECT" -> {
                newStatus = IdeaStatus.REJETEE;
                idea.setStatus(newStatus);
                saveHistory(idea, oldStatus, newStatus, currentUser, req.getComment());
                ideaRepository.save(idea);
                notifySubmitter(idea, "Idée rejetée", "Votre idée \"" + idea.getTitle() + "\" a été rejetée.");
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
                notifySubmitter(idea, "Idée approuvée BU", "Votre idée \"" + idea.getTitle() + "\" a été approuvée par le Directeur BU.");
                notifyUsersByRole(UserRole.DIRECTEUR_GENERAL, "Idée à approuver", "L'idée \"" + idea.getTitle() + "\" attend votre approbation finale.", idea.getId());
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
                notifySubmitter(idea, "Idée approuvée DG", "Votre idée \"" + idea.getTitle() + "\" a été approuvée par le Directeur Général.");
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
                User projectOwner = userRepository.findAll().stream()
                        .filter(u -> u.getRole() == UserRole.RESPONSABLE_INNOVATION)
                        .findFirst()
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
                notifyUsersByRole(UserRole.RESPONSABLE_INNOVATION, "Nouveau projet créé", "Le projet \"" + project.getName() + "\" a été créé. Vous en êtes le responsable.", project.getId());
            }
            default -> throw new BadRequestException("Action inconnue");
        }

        return toIdeaDetail(idea);
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
            notificationService.notify(idea.getSubmittedBy(), "Nouveau commentaire", "Un commentaire a été ajouté sur votre idée \"" + idea.getTitle() + "\".", "/idees/" + ideaId);
        }
    }

    private IdeaSummaryResponse toIdeaSummary(Idea idea) {
        return IdeaSummaryResponse.builder()
                .id(idea.getId())
                .reference(idea.getReference())
                .title(idea.getTitle())
                .category(idea.getCategory())
                .status(idea.getStatus())
                .totalScore(idea.getTotalScore())
                .submittedByName(idea.getSubmittedBy().getFullName())
                .submittedById(idea.getSubmittedBy().getId())
                .voteCount(voteRepository.countByIdea_Id(idea.getId()))
                .commentCount(0)
                .submittedAt(idea.getSubmittedAt())
                .createdAt(idea.getCreatedAt())
                .build();
    }

    private IdeaDetailResponse toIdeaDetail(Idea idea) {
        List<IdeaScoreResponse> scores = ideaScoreRepository.findByIdea_Id(idea.getId()).stream()
                .map(this::toIdeaScoreResponse)
                .toList();

        return IdeaDetailResponse.builder()
                .id(idea.getId())
                .reference(idea.getReference())
                .title(idea.getTitle())
                .category(idea.getCategory())
                .status(idea.getStatus())
                .totalScore(idea.getTotalScore())
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
                .scoredByName(s.getScoredBy().getFullName())
                .createdAt(s.getCreatedAt())
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

    private void notifySubmitter(Idea idea, String title, String message) {
        notificationService.notify(idea.getSubmittedBy(), title, message, "/idees/" + idea.getId());
    }

    private void notifyUsersByRole(UserRole role, String title, String message, String ideaId) {
        String link = "/idees/" + ideaId;
        userRepository.findAll().stream()
                .filter(u -> u.getRole() == role)
                .forEach(u -> notificationService.notify(u, title, message, link));
    }
}
