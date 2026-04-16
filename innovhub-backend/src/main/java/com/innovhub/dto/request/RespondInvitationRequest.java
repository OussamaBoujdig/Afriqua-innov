package com.innovhub.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RespondInvitationRequest {

    @NotBlank
    private String action; // "ACCEPT" or "REFUSE"

    private String message;
}
