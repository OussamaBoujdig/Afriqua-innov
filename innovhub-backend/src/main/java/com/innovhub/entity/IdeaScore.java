package com.innovhub.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "idea_scores", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id", "scored_by"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class IdeaScore {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idea_id", nullable = false)
    private Idea idea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scored_by", nullable = false)
    private User scoredBy;

    @Column(name = "innovation_level", nullable = false)
    private Integer innovationLevel;

    @Column(name = "technical_feasibility", nullable = false)
    private Integer technicalFeasibility;

    @Column(name = "strategic_alignment", nullable = false)
    private Integer strategicAlignment;

    @Column(name = "roi_potential", nullable = false)
    private Integer roiPotential;

    @Column(name = "risk_level", nullable = false)
    private Integer riskLevel;

    @Column(name = "total_score", precision = 4, scale = 2, insertable = false, updatable = false)
    private BigDecimal totalScore;

    @Column(columnDefinition = "text")
    private String comments;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void generateId() {
        if (this.id == null) {
            this.id = java.util.UUID.randomUUID().toString();
        }
    }
}
