package com.innovhub.repository;

import com.innovhub.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public interface VoteRepository extends JpaRepository<Vote, String> {

    Optional<Vote> findByIdea_IdAndUser_Id(String ideaId, String userId);

    long countByIdea_Id(String ideaId);

    @Modifying
    @Query("DELETE FROM Vote v WHERE v.idea.id = :ideaId")
    void deleteAllByIdeaId(@Param("ideaId") String ideaId);

    @Query("SELECT v.idea.id, COUNT(v) FROM Vote v WHERE v.idea.id IN :ideaIds GROUP BY v.idea.id")
    List<Object[]> countByIdeaIds(@Param("ideaIds") Collection<String> ideaIds);

    default Map<String, Long> countMapByIdeaIds(Collection<String> ideaIds) {
        return countByIdeaIds(ideaIds).stream()
                .collect(Collectors.toMap(r -> (String) r[0], r -> (Long) r[1]));
    }
}
