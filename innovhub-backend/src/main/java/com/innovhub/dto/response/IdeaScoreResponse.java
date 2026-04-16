package com.innovhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeaScoreResponse {

    private String id;
    private Integer innovationLevel;
    private Integer technicalFeasibility;
    private Integer strategicAlignment;
    private Integer roiPotential;
    private Integer riskLevel;
    private BigDecimal totalScore;
    private String comments;
    private String scoredById;
    private String scoredByName;
    private Instant createdAt;

}
