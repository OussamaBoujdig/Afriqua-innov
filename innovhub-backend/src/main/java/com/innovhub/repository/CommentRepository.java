package com.innovhub.repository;

import com.innovhub.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, String> {

    Page<Comment> findByIdea_IdOrderByCreatedAtDesc(String ideaId, Pageable pageable);

    Page<Comment> findByProject_IdOrderByCreatedAtDesc(String projectId, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Comment c WHERE c.idea.id = :ideaId")
    void deleteAllByIdeaId(@Param("ideaId") String ideaId);
}
