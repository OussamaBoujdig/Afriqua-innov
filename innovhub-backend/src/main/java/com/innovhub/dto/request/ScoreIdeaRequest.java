package com.innovhub.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreIdeaRequest {

    @NotNull
    @Min(0)
    @Max(10)
    private Integer innovationLevel;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer technicalFeasibility;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer strategicAlignment;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer roiPotential;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer riskLevel;

    private String comments;
}
