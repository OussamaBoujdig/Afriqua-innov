package com.innovhub.repository;

import com.innovhub.entity.IdeaWorkflowHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IdeaWorkflowHistoryRepository extends JpaRepository<IdeaWorkflowHistory, String> {

    List<IdeaWorkflowHistory> findByIdea_IdOrderByCreatedAtDesc(String ideaId);
}
