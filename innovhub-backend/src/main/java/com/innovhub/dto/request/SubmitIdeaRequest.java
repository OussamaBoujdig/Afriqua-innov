package com.innovhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitIdeaRequest {

    @NotBlank
    private String title;

    private String category;

    @NotBlank
    private String problemStatement;

    @NotBlank
    private String proposedSolution;

    private String expectedRoi;

    private BigDecimal estimatedCost;

    private Integer roiDelayMonths;

    private String targetBu;

    private Integer timelineMonths;

    private String resourcesNeeded;

    private String campaignId;

    private String imageUrl;

    @Builder.Default
    private boolean draft = false;
}
