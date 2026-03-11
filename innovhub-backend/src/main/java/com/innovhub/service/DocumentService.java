package com.innovhub.service;

import com.innovhub.entity.Document;
import com.innovhub.entity.Idea;
import com.innovhub.entity.Project;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.DocumentRepository;
import com.innovhub.repository.IdeaRepository;
import com.innovhub.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final IdeaRepository ideaRepository;
    private final ProjectRepository projectRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Transactional
    public Document uploadForIdea(String ideaId, MultipartFile file, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        Path dir = Paths.get(uploadDir, "ideas", ideaId.toString());
        try {
            Files.createDirectories(dir);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage", e);
        }

        String fileName = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        Path filePath = dir.resolve(fileName);
        try {
            file.transferTo(filePath.toFile());
        } catch (java.io.IOException e) {
            throw new RuntimeException("Impossible de sauvegarder le fichier", e);
        }

        Document document = Document.builder()
                .idea(idea)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file")
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .uploadedBy(currentUser)
                .build();
        return documentRepository.save(document);
    }

    @Transactional
    public Document uploadForProject(String projectId, MultipartFile file, User currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Projet non trouvé"));

        Path dir = Paths.get(uploadDir, "projects", projectId.toString());
        try {
            Files.createDirectories(dir);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Impossible de créer le répertoire de stockage", e);
        }

        String fileName = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        Path filePath = dir.resolve(fileName);
        try {
            file.transferTo(filePath.toFile());
        } catch (java.io.IOException e) {
            throw new RuntimeException("Impossible de sauvegarder le fichier", e);
        }

        Document document = Document.builder()
                .project(project)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file")
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .uploadedBy(currentUser)
                .build();
        return documentRepository.save(document);
    }

    public Document getDocumentById(String id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document non trouvé"));
    }

    public List<Document> getDocumentsForIdea(String ideaId) {
        return documentRepository.findByIdea_Id(ideaId);
    }

    public List<Document> getDocumentsForProject(String projectId) {
        return documentRepository.findByProject_Id(projectId);
    }
}
