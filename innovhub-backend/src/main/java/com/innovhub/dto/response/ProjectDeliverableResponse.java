package com.innovhub.dto.response;

import com.innovhub.enums.ProjectStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectDeliverableResponse {

    private String id;
    private ProjectStage stage;
    private String title;
    private Boolean isDone;
    private Instant doneAt;
    private String doneByName;
    private Integer sortOrder;
}
