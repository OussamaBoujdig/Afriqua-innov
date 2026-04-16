package com.innovhub.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamMemberResponse {

    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String role;
    private String teamRole;
    private String department;
    private String avatarUrl;
    private String addedByName;
    private Instant addedAt;
}
