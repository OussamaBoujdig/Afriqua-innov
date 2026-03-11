package com.innovhub.repository;

import com.innovhub.entity.IdeaScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IdeaScoreRepository extends JpaRepository<IdeaScore, String> {

    List<IdeaScore> findByIdea_Id(String ideaId);

    Optional<IdeaScore> findByIdea_IdAndScoredBy_Id(String ideaId, String scoredById);
}
