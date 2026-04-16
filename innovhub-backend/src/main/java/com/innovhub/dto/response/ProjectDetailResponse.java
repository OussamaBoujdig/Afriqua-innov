package com.innovhub.dto.response;

import com.innovhub.enums.ProjectStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDetailResponse {

    private String id;
    private String name;
    private String description;
    private ProjectStage currentStage;
    private Integer stageProgress;
    private String status;
    private UserSummaryResponse owner;
    private LocalDate dueDate;
    private Instant launchedAt;
    private Instant closedAt;
    private String ideaId;
    private String ideaTitle;
    private List<ProjectDeliverableResponse> deliverables;
}
