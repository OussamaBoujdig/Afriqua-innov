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
public class ProjectMessageResponse {

    private String id;
    private String projectId;
    private String senderId;
    private String senderName;
    private String senderRole;
    private String senderAvatarUrl;
    private String content;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSizeBytes;
    private Instant createdAt;
}
