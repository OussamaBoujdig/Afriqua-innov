package com.innovhub.repository;

import com.innovhub.entity.IdeaScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface IdeaScoreRepository extends JpaRepository<IdeaScore, String> {

    List<IdeaScore> findByIdea_Id(String ideaId);

    List<IdeaScore> findByIdea_IdOrderByCreatedAtAsc(String ideaId);

    long countByIdea_Id(String ideaId);

    Optional<IdeaScore> findByIdea_IdAndScoredBy_Id(String ideaId, String scoredById);

    @Query("SELECT s.idea.id, COUNT(s) FROM IdeaScore s WHERE s.idea.id IN :ideaIds GROUP BY s.idea.id")
    List<Object[]> countByIdeaIds(@Param("ideaIds") Collection<String> ideaIds);

    default Map<String, Long> countMapByIdeaIds(Collection<String> ideaIds) {
        return countByIdeaIds(ideaIds).stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> (Long) r[1]));
    }
}
