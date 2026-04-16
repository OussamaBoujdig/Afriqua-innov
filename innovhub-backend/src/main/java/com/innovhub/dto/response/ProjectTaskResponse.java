package com.innovhub.dto.response;

import com.innovhub.enums.ProjectStage;
import com.innovhub.enums.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectTaskResponse {

    private String id;
    private String title;
    private String description;
    private ProjectStage stage;
    private TaskStatus status;
    private String assignedToId;
    private String assignedToName;
    private String createdById;
    private String createdByName;
    private LocalDate dueDate;
    private Instant createdAt;
    private Instant updatedAt;

    private String projectId;
    private String projectName;
    private String ideaTitle;
}
