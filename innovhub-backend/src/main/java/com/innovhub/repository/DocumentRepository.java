package com.innovhub.repository;

import com.innovhub.entity.Document;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    @Override
    @EntityGraph(attributePaths = {"uploadedBy", "task"})
    Optional<Document> findById(String id);

    @EntityGraph(attributePaths = {"uploadedBy", "task"})
    List<Document> findByIdea_Id(String ideaId);

    @EntityGraph(attributePaths = {"uploadedBy", "task"})
    List<Document> findByProject_Id(String projectId);

    @EntityGraph(attributePaths = {"uploadedBy", "task"})
    List<Document> findByTask_Id(String taskId);

    @Modifying
    @Query("DELETE FROM Document d WHERE d.idea.id = :ideaId")
    void deleteAllByIdeaId(@Param("ideaId") String ideaId);
}
