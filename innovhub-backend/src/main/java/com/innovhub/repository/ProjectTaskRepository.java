package com.innovhub.repository;

import com.innovhub.entity.ProjectTask;
import com.innovhub.enums.ProjectStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectTaskRepository extends JpaRepository<ProjectTask, String> {

    List<ProjectTask> findByProject_IdOrderByCreatedAtDesc(String projectId);

    List<ProjectTask> findByProject_IdAndStageOrderByCreatedAtDesc(String projectId, ProjectStage stage);

    List<ProjectTask> findByAssignedTo_IdOrderByCreatedAtDesc(String userId);
}
