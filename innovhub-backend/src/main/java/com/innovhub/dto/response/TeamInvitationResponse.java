package com.innovhub.dto.response;

import com.innovhub.enums.InvitationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TeamInvitationResponse {

    private String id;
    private String projectId;
    private String projectName;
    private String ideaTitle;
    private String teamRole;
    private InvitationStatus status;
    private String invitedByName;
    private String invitedUserName;
    private String invitedUserId;
    private Instant responseDeadline;
    private String responseMessage;
    private Instant respondedAt;
    private Instant createdAt;
}
