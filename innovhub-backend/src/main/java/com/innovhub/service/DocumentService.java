package com.innovhub.service;

import com.innovhub.entity.Document;
import com.innovhub.entity.Idea;
import com.innovhub.entity.Project;
import com.innovhub.entity.ProjectTask;
import com.innovhub.entity.User;
import com.innovhub.enums.UserRole;
import com.innovhub.exception.BadRequestException;
import com.innovhub.exception.ForbiddenException;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.DocumentRepository;
import com.innovhub.repository.IdeaRepository;
import com.innovhub.repository.ProjectRepository;
import com.innovhub.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final IdeaRepository ideaRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository projectTaskRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private Path saveFile(MultipartFile file, Path dir) {
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new BadRequestException("Impossible de créer le répertoire de stockage: " + e.getMessage());
        }

        String storedName = UUID.randomUUID() + "_" + (file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        Path target = dir.resolve(storedName);

        try (InputStream in = file.getInputStream()) {
            Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new BadRequestException("Impossible de sauvegarder le fichier: " + e.getMessage());
        }

        return target;
    }

    @Transactional
    public Document uploadForIdea(String ideaId, MultipartFile file, User currentUser) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResourceNotFoundException("Idée non trouvée"));

        Path filePath = saveFile(file, Paths.get(uploadDir, "ideas", ideaId));

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

        Path filePath = saveFile(file, Paths.get(uploadDir, "projects", projectId));

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

    @Transactional
    public Document uploadForTask(String projectId, String taskId, MultipartFile file, User currentUser) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Tâche non trouvée"));

        if (!task.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Cette tâche n'appartient pas à ce projet");
        }

        boolean isAssignee = task.getAssignedTo() != null && task.getAssignedTo().getId().equals(currentUser.getId());
        boolean isCreator = task.getCreatedBy().getId().equals(currentUser.getId());
        boolean isRespInnov = currentUser.getRole() == UserRole.RESPONSABLE_INNOVATION;

        if (!isAssignee && !isCreator && !isRespInnov) {
            throw new ForbiddenException("Vous n'êtes pas autorisé à uploader des documents pour cette tâche");
        }

        Path filePath = saveFile(file, Paths.get(uploadDir, "projects", projectId, "tasks", taskId));

        Document document = Document.builder()
                .project(task.getProject())
                .task(task)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file")
                .filePath(filePath.toString())
                .fileType(file.getContentType())
                .fileSizeBytes(file.getSize())
                .uploadedBy(currentUser)
                .build();
        return documentRepository.save(document);
    }

    public List<Document> getDocumentsForTask(String taskId) {
        return documentRepository.findByTask_Id(taskId);
    }
}
