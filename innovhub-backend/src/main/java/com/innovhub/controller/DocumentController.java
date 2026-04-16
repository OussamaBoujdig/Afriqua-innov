package com.innovhub.controller;

import com.innovhub.dto.response.ApiResponse;
import com.innovhub.entity.Document;
import com.innovhub.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @Value("${file.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping("/{id}/download")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadDocument(@PathVariable String id) throws MalformedURLException {
        Document doc = documentService.getDocumentById(id);
        Path filePath = Paths.get(doc.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = doc.getFileType() != null ? doc.getFileType() : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getFileName() + "\"")
                .body(resource);
    }

    @PostMapping("/upload-image")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Fichier vide"));
        }
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "image";
        String storedName = UUID.randomUUID() + "_" + originalName;
        Path dir = Paths.get(uploadDir, "campaign-images").toAbsolutePath().normalize();
        Files.createDirectories(dir);
        try (InputStream in = file.getInputStream()) {
            Files.copy(in, dir.resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        }
        return ResponseEntity.ok(ApiResponse.ok(Map.of("fileName", storedName)));
    }

    @GetMapping("/images/{fileName}")
    public ResponseEntity<Resource> serveImage(@PathVariable String fileName) throws MalformedURLException {
        Path basePath = Paths.get(uploadDir, "campaign-images").toAbsolutePath().normalize();
        Path filePath = basePath.resolve(fileName).normalize();
        if (!filePath.startsWith(basePath)) {
            return ResponseEntity.badRequest().build();
        }
        Resource resource = new UrlResource(filePath.toUri());
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        String contentType = "image/jpeg";
        String lower = fileName.toLowerCase();
        if (lower.contains(".png")) contentType = "image/png";
        else if (lower.contains(".gif")) contentType = "image/gif";
        else if (lower.contains(".webp")) contentType = "image/webp";
        else if (lower.contains(".svg")) contentType = "image/svg+xml";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }

    @GetMapping("/chat/{fileName}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Resource> downloadChatFile(@PathVariable String fileName) throws MalformedURLException {
        Path basePath = Paths.get(uploadDir, "chat").toAbsolutePath().normalize();
        Path filePath = basePath.resolve(fileName).normalize();

        if (!filePath.startsWith(basePath)) {
            return ResponseEntity.badRequest().build();
        }

        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filePath.getFileName() + "\"")
                .body(resource);
    }
}
