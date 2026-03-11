package com.innovhub.dto.response;

import com.innovhub.enums.IdeaStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IdeaSummaryResponse {

    private String id;
    private String reference;
    private String title;
    private String category;
    private IdeaStatus status;
    private BigDecimal totalScore;
    private String submittedByName;
    private String submittedById;
    private long voteCount;
    private long commentCount;
    private Instant submittedAt;
    private Instant createdAt;
}
