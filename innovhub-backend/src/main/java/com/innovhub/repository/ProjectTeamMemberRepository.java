package com.innovhub.repository;

import com.innovhub.entity.ProjectTeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectTeamMemberRepository extends JpaRepository<ProjectTeamMember, String> {

    List<ProjectTeamMember> findByProject_IdOrderByAddedAtDesc(String projectId);

    Optional<ProjectTeamMember> findByProject_IdAndUser_Id(String projectId, String userId);

    boolean existsByProject_IdAndUser_Id(String projectId, String userId);

    void deleteByProject_IdAndUser_Id(String projectId, String userId);

    List<ProjectTeamMember> findByUser_IdOrderByAddedAtDesc(String userId);
}
