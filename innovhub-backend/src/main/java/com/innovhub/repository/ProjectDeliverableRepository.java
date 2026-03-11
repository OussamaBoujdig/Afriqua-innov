package com.innovhub.repository;

import com.innovhub.entity.ProjectDeliverable;
import com.innovhub.enums.ProjectStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectDeliverableRepository extends JpaRepository<ProjectDeliverable, String> {

    List<ProjectDeliverable> findByProject_IdOrderBySortOrderAsc(String projectId);

    List<ProjectDeliverable> findByProject_IdAndStage(String projectId, ProjectStage stage);
}
