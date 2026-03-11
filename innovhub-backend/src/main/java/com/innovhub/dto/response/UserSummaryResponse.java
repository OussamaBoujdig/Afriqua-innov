package com.innovhub.dto.response;

import com.innovhub.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserSummaryResponse {

    private String id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private UserRole role;
    private String businessUnit;
    private String department;
    private String avatarUrl;
    private Integer points;
}
