package com.innovhub.entity;

import com.innovhub.enums.IdeaStatus;
import com.innovhub.enums.ProjectStage;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ideas")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Idea {

    @Id
    @Column(length = 36)
    private String id;

    @Column(length = 20, unique = true, insertable = false, updatable = false)
    private String reference;

    @Column(nullable = false)
    private String title;

    @Column(length = 100)
    private String category;

    @Column(name = "problem_statement", nullable = false, columnDefinition = "text")
    private String problemStatement;

    @Column(name = "proposed_solution", nullable = false, columnDefinition = "text")
    private String proposedSolution;

    @Column(name = "expected_roi")
    private String expectedRoi;

    @Column(name = "estimated_cost", precision = 15, scale = 2)
    private BigDecimal estimatedCost;

    @Column(name = "roi_delay_months")
    private Integer roiDelayMonths;

    @Column(name = "target_bu", length = 100)
    private String targetBu;

    @Column(name = "timeline_months")
    private Integer timelineMonths;

    @Column(name = "resources_needed", columnDefinition = "text")
    private String resourcesNeeded;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(30)")
    @Builder.Default
    private IdeaStatus status = IdeaStatus.BROUILLON;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_stage", columnDefinition = "varchar(30)")
    private ProjectStage currentStage;

    @Column(name = "total_score", precision = 4, scale = 2)
    private BigDecimal totalScore;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campaign_id")
    private Campaign campaign;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submitted_by", nullable = false)
    private User submittedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = java.util.UUID.randomUUID().toString();
        }
    }
}
