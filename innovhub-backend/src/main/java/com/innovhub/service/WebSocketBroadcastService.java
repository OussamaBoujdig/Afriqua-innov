package com.innovhub.service;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketBroadcastService {

    private final SimpMessagingTemplate messagingTemplate;

    public void sendToProjectChat(String projectId, Object payload) {
        messagingTemplate.convertAndSend("/topic/project/" + projectId + "/messages", payload);
    }

    @Async
    public void sendNotificationToUser(String userId, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/notifications", payload);
    }

    @Async
    public void sendInvitationToUser(String userId, Object payload) {
        messagingTemplate.convertAndSendToUser(userId, "/queue/invitations", payload);
    }

    @Async
    public void sendProjectUpdate(String projectId, String updateType) {
        messagingTemplate.convertAndSend(
                "/topic/project/" + projectId + "/updates",
                java.util.Map.of("type", updateType, "projectId", projectId)
        );
    }
}
