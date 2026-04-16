package com.innovhub.event;

import com.innovhub.service.WebSocketBroadcastService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Listens for NotificationEvent and broadcasts via WebSocket AFTER the
 * originating transaction has committed. This guarantees the notification
 * is already in the DB when the client receives the push and re-fetches.
 */
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final WebSocketBroadcastService broadcastService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onNotification(NotificationEvent event) {
        broadcastService.sendNotificationToUser(event.getUserId(), event.getPayload());
    }
}
