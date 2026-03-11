package com.innovhub.repository;

import com.innovhub.entity.Idea;
import com.innovhub.entity.User;
import com.innovhub.enums.IdeaStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface IdeaRepository extends JpaRepository<Idea, String>, JpaSpecificationExecutor<Idea> {

    Page<Idea> findBySubmittedBy(User user, Pageable pageable);

    Page<Idea> findByStatus(IdeaStatus status, Pageable pageable);

    Page<Idea> findByCampaign_Id(String campaignId, Pageable pageable);

    long countByStatus(IdeaStatus status);

    long countBySubmittedBy(User user);
}
