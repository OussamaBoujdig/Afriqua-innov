package com.innovhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampaignResponse {

    private String id;
    private String title;
    private String description;
    private String category;
    private String categoryColor;
    private String imageUrl;
    private String status;
    private LocalDate startDate;
    private LocalDate endDate;
    private String createdByName;
    private long ideaCount;
    private Instant createdAt;
}
