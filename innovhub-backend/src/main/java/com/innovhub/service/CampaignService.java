package com.innovhub.service;

import com.innovhub.dto.response.CampaignResponse;
import com.innovhub.entity.Campaign;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.CampaignRepository;
import com.innovhub.repository.IdeaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CampaignService {

    private final CampaignRepository campaignRepository;
    private final IdeaRepository ideaRepository;

    public Page<CampaignResponse> getAllCampaigns(Pageable pageable) {
        return campaignRepository.findAll(pageable).map(this::toCampaignResponse);
    }

    public Page<CampaignResponse> getCampaignsByStatus(String status, Pageable pageable) {
        return campaignRepository.findByStatus(status, pageable).map(this::toCampaignResponse);
    }

    public CampaignResponse getCampaignById(String id) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campagne non trouvée"));
        return toCampaignResponse(campaign);
    }

    @Transactional
    public CampaignResponse createCampaign(String title, String description, String category,
                                           String categoryColor, String imageUrl,
                                           LocalDate startDate, LocalDate endDate, User currentUser) {
        Campaign campaign = Campaign.builder()
                .title(title)
                .description(description)
                .category(category)
                .categoryColor(categoryColor != null ? categoryColor : "#7C3AED")
                .imageUrl(imageUrl)
                .startDate(startDate)
                .endDate(endDate)
                .createdBy(currentUser)
                .status("ACTIF")
                .build();
        campaign = campaignRepository.save(campaign);
        return toCampaignResponse(campaign);
    }

    @Transactional
    public CampaignResponse updateCampaign(String id, String title, String description, String category,
                                          String categoryColor, String imageUrl,
                                          LocalDate startDate, LocalDate endDate, User currentUser) {
        Campaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Campagne non trouvée"));
        campaign.setTitle(title);
        campaign.setDescription(description);
        campaign.setCategory(category);
        if (categoryColor != null) campaign.setCategoryColor(categoryColor);
        campaign.setImageUrl(imageUrl);
        campaign.setStartDate(startDate);
        campaign.setEndDate(endDate);
        campaign = campaignRepository.save(campaign);
        return toCampaignResponse(campaign);
    }

    private CampaignResponse toCampaignResponse(Campaign c) {
        long ideaCount = 0;
        return CampaignResponse.builder()
                .id(c.getId())
                .title(c.getTitle())
                .description(c.getDescription())
                .category(c.getCategory())
                .categoryColor(c.getCategoryColor())
                .imageUrl(c.getImageUrl())
                .status(c.getStatus())
                .startDate(c.getStartDate())
                .endDate(c.getEndDate())
                .createdByName(c.getCreatedBy().getFullName())
                .ideaCount(ideaCount)
                .createdAt(c.getCreatedAt())
                .build();
    }
}
