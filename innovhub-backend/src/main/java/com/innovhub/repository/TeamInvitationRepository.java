package com.innovhub.repository;

import com.innovhub.entity.TeamInvitation;
import com.innovhub.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamInvitationRepository extends JpaRepository<TeamInvitation, String> {

    List<TeamInvitation> findByInvitedUser_IdAndStatusOrderByCreatedAtDesc(String userId, InvitationStatus status);

    List<TeamInvitation> findByInvitedUser_IdOrderByCreatedAtDesc(String userId);

    List<TeamInvitation> findByProject_IdOrderByCreatedAtDesc(String projectId);

    Optional<TeamInvitation> findByProject_IdAndInvitedUser_IdAndStatus(String projectId, String userId, InvitationStatus status);

    boolean existsByProject_IdAndInvitedUser_IdAndStatus(String projectId, String userId, InvitationStatus status);

    List<TeamInvitation> findByInvitedBy_IdOrderByCreatedAtDesc(String userId);
}
