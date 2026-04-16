package com.innovhub.event;

import com.innovhub.service.WebSocketBroadcastService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Broadcasts via WebSocket AFTER the originating transaction has committed.
 * No @Async here: we want the send to happen immediately and reliably
 * right after the commit, on the same thread the event was published.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final WebSocketBroadcastService broadcastService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNotification(NotificationEvent event) {
        try {
            broadcastService.sendNotificationDirect(event.getUserId(), event.getPayload());
        } catch (Exception e) {
            log.warn("Failed to broadcast notification to user {}: {}", event.getUserId(), e.getMessage());
        }
    }
}
