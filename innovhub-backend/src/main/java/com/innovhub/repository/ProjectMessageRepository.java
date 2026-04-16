package com.innovhub.repository;

import com.innovhub.entity.ProjectMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectMessageRepository extends JpaRepository<ProjectMessage, String> {

    Page<ProjectMessage> findByProject_IdOrderByCreatedAtDesc(String projectId, Pageable pageable);
}
