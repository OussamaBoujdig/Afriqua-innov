package com.innovhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {

    private long totalIdeas;
    private long ideasEnCours;
    private long ideasValidees;
    private long ideasDeployees;
    private Map<String, Long> pipeline;
    private List<IdeaSummaryResponse> recentIdeas;
    private List<UserSummaryResponse> topInnovators;
}
