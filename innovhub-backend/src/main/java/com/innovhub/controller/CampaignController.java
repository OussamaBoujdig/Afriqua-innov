package com.innovhub.controller;

import com.innovhub.dto.response.ApiResponse;
import com.innovhub.dto.response.CampaignResponse;
import com.innovhub.dto.response.IdeaSummaryResponse;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.UserRepository;
import com.innovhub.service.CampaignService;
import com.innovhub.service.IdeaService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/campaigns")
@RequiredArgsConstructor
@Tag(name = "Campaigns")
public class CampaignController {

    private final CampaignService campaignService;
    private final IdeaService ideaService;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String userId = auth.getName();
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("Utilisateur non trouvé"));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<CampaignResponse>>> getAllCampaigns(Pageable pageable) {
        Page<CampaignResponse> result = campaignService.getAllCampaigns(pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CampaignResponse>> getCampaign(@PathVariable String id) {
        CampaignResponse result = campaignService.getCampaignById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}/ideas")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<IdeaSummaryResponse>>> getCampaignIdeas(@PathVariable String id, Pageable pageable) {
        Page<IdeaSummaryResponse> result = ideaService.getIdeasByCampaign(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('RESPONSABLE_INNOVATION')")
    public ResponseEntity<ApiResponse<CampaignResponse>> closeCampaign(@PathVariable String id) {
        CampaignResponse result = campaignService.closeCampaign(id, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok("Campagne terminée", result));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<CampaignResponse>> createCampaign(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String category = (String) body.get("category");
        String categoryColor = (String) body.getOrDefault("categoryColor", "#7C3AED");
        String imageUrl = (String) body.get("imageUrl");
        LocalDate startDate = body.get("startDate") != null ? LocalDate.parse((String) body.get("startDate")) : null;
        LocalDate endDate = body.get("endDate") != null ? LocalDate.parse((String) body.get("endDate")) : null;

        CampaignResponse result = campaignService.createCampaign(title, description, category, categoryColor, imageUrl, startDate, endDate, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RESPONSABLE_INNOVATION','DIRECTEUR_BU','DIRECTEUR_GENERAL')")
    public ResponseEntity<ApiResponse<CampaignResponse>> updateCampaign(@PathVariable String id, @RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        String category = (String) body.get("category");
        String categoryColor = (String) body.getOrDefault("categoryColor", "#7C3AED");
        String imageUrl = (String) body.get("imageUrl");
        LocalDate startDate = body.get("startDate") != null ? LocalDate.parse((String) body.get("startDate")) : null;
        LocalDate endDate = body.get("endDate") != null ? LocalDate.parse((String) body.get("endDate")) : null;

        CampaignResponse result = campaignService.updateCampaign(id, title, description, category, categoryColor, imageUrl, startDate, endDate, getCurrentUser());
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
