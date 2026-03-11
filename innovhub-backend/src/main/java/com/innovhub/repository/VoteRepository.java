package com.innovhub.repository;

import com.innovhub.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoteRepository extends JpaRepository<Vote, String> {

    Optional<Vote> findByIdea_IdAndUser_Id(String ideaId, String userId);

    long countByIdea_Id(String ideaId);
}
