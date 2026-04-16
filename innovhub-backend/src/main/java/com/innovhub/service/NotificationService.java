package com.innovhub.service;

import com.innovhub.dto.response.NotificationResponse;
import com.innovhub.entity.Notification;
import com.innovhub.entity.User;
import com.innovhub.event.NotificationEvent;
import com.innovhub.exception.ResourceNotFoundException;
import com.innovhub.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ApplicationEventPublisher eventPublisher;

    /** Persist + broadcast without a type (defaults to INFO). */
    @Transactional
    public void notify(User user, String title, String message) {
        persistAndPublish(user, "INFO", title, message, null);
    }

    /** Persist + broadcast with a link (defaults to INFO). */
    @Transactional
    public void notify(User user, String title, String message, String link) {
        persistAndPublish(user, "INFO", title, message, link);
    }

    /** Persist + broadcast with explicit type and optional link. */
    @Transactional
    public void notify(User user, String type, String title, String message, String link) {
        persistAndPublish(user, type != null ? type : "INFO", title, message, link);
    }

    /**
     * Saves the notification to DB and publishes a NotificationEvent.
     * The event listener broadcasts via WebSocket AFTER_COMMIT, ensuring
     * the notification is already persisted when the client receives the push.
     */
    private void persistAndPublish(User user, String type, String title, String message, String link) {
        Notification notification = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
        notification = notificationRepository.save(notification);
        eventPublisher.publishEvent(new NotificationEvent(this, user.getId(), toResponse(notification)));
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
    public void clearAll(String userId) {
        notificationRepository.deleteAllByUserId(userId);
    }

    @Transactional
    public void markAsRead(String notificationId, String userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification non trouvée"));
        if (!notification.getUser().getId().equals(userId)) {
            throw new com.innovhub.exception.ForbiddenException("Vous ne pouvez modifier que vos propres notifications");
        }
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
