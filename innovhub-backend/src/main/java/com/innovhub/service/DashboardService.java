package com.innovhub.service;

import com.innovhub.dto.response.DashboardStatsResponse;
import com.innovhub.dto.response.IdeaSummaryResponse;
import com.innovhub.dto.response.UserSummaryResponse;
import com.innovhub.entity.Idea;
import com.innovhub.entity.User;
import com.innovhub.enums.IdeaStatus;
import com.innovhub.repository.IdeaRepository;
import com.innovhub.repository.UserRepository;
import com.innovhub.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final IdeaRepository ideaRepository;
    private final UserRepository userRepository;
    private final VoteRepository voteRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalIdeas = ideaRepository.count();

        long ideasEnCours = ideaRepository.countByStatus(IdeaStatus.SOUMISE)
                + ideaRepository.countByStatus(IdeaStatus.EN_VALIDATION)
                + ideaRepository.countByStatus(IdeaStatus.SCOREE);

        long ideasValidees = ideaRepository.countByStatus(IdeaStatus.APPROUVEE_INNOVATION)
                + ideaRepository.countByStatus(IdeaStatus.APPROUVEE_BU)
                + ideaRepository.countByStatus(IdeaStatus.APPROUVEE_DG);

        long ideasDeployees = ideaRepository.countByStatus(IdeaStatus.CLOTUREE);

        Map<String, Long> pipeline = new LinkedHashMap<>();
        pipeline.put("Exploration",
                ideaRepository.countByStatus(IdeaStatus.SOUMISE) + ideaRepository.countByStatus(IdeaStatus.EN_VALIDATION));
        pipeline.put("Conceptualisation",
                ideaRepository.countByStatus(IdeaStatus.SCOREE) + ideaRepository.countByStatus(IdeaStatus.APPROUVEE_INNOVATION));
        pipeline.put("Pilote",
                ideaRepository.countByStatus(IdeaStatus.APPROUVEE_BU) + ideaRepository.countByStatus(IdeaStatus.APPROUVEE_DG));
        pipeline.put("Mise à l'échelle", ideaRepository.countByStatus(IdeaStatus.CLOTUREE));

        List<IdeaSummaryResponse> recentIdeas = ideaRepository
                .findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent()
                .stream()
                .map(this::toIdeaSummary)
                .collect(Collectors.toList());

        List<UserSummaryResponse> topInnovators = userRepository.findTop10ByOrderByPointsDesc()
                .stream()
                .filter(u -> u.getPoints() > 0)
                .limit(5)
                .map(this::toUserSummary)
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalIdeas(totalIdeas)
                .ideasEnCours(ideasEnCours)
                .ideasValidees(ideasValidees)
                .ideasDeployees(ideasDeployees)
                .pipeline(pipeline)
                .recentIdeas(recentIdeas)
                .topInnovators(topInnovators)
                .build();
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

    private UserSummaryResponse toUserSummary(User user) {
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
}
