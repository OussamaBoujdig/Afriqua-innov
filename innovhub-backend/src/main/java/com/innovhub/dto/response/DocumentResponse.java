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
public class DocumentResponse {
    private String id;
    private String fileName;
    private String fileType;
    private Long fileSizeBytes;
    private String uploadedByName;
    private String taskId;
    private String taskTitle;
    private Instant createdAt;
    private String downloadUrl;
}
