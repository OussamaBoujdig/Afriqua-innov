package com.innovhub.dto.response;

import com.innovhub.enums.IdeaStatus;
import com.innovhub.enums.ProjectStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeaDetailResponse {

    // IdeaSummaryResponse fields
    private String id;
    private String reference;
    private String title;
    private String category;
    private IdeaStatus status;
    private BigDecimal totalScore;
    private int scoreCount;
    private int requiredScoreCount;
    private String submittedByName;
    private String submittedById;
    private long voteCount;
    private long commentCount;
    private Instant submittedAt;
    private Instant createdAt;

    private String imageUrl;

    // Additional detail fields
    private String problemStatement;
    private String proposedSolution;
    private String expectedRoi;
    private BigDecimal estimatedCost;
    private Integer roiDelayMonths;
    private String targetBu;
    private Integer timelineMonths;
    private String resourcesNeeded;
    private ProjectStage currentStage;
    private String campaignId;
    private String campaignTitle;
    private UserSummaryResponse submittedBy;
    private UserSummaryResponse assignedTo;
    private List<IdeaScoreResponse> scores;
    private List<String> scoredByRoles;
    private Instant scoringDeadline;
    private Instant updatedAt;
}
