package com.innovhub.repository;

import com.innovhub.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, String> {

    Page<Project> findByOwner_Id(String ownerId, Pageable pageable);

    Optional<Project> findByIdea_Id(String ideaId);
}
