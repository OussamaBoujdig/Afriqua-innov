package com.innovhub.service;

import com.innovhub.dto.response.NotificationResponse;
import com.innovhub.entity.Notification;
import com.innovhub.entity.User;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Async
    @Transactional
    public void notify(User user, String title, String message) {
        Notification notification = Notification.builder()
                .user(user)
                .type("INFO")
                .title(title)
                .message(message)
                .link(null)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    @Async
    @Transactional
    public void notify(User user, String title, String message, String link) {
        Notification notification = Notification.builder()
                .user(user)
                .type("INFO")
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(notification);
    }

    public Page<NotificationResponse> getNotifications(String userId, Pageable pageable) {
        return notificationRepository.findByUser_IdOrderByCreatedAtDesc(userId, pageable)
                .map(this::toResponse);
    }

    public long getUnreadCount(String userId) {
        return notificationRepository.countByUser_IdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAllAsRead(String userId) {
        notificationRepository.markAllAsRead(userId);
    }

    @Transactional
    public void markAsRead(String notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .link(n.getLink())
                .isRead(n.getIsRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
