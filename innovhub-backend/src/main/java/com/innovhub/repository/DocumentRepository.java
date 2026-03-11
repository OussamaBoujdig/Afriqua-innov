package com.innovhub.repository;

import com.innovhub.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    List<Document> findByIdea_Id(String ideaId);

    List<Document> findByProject_Id(String projectId);
}
