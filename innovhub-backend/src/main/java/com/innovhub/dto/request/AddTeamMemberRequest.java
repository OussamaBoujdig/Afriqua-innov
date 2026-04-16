package com.innovhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddTeamMemberRequest {

    @NotBlank
    private String userId;

    private String teamRole;

    private String responseDeadline;
}
