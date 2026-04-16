package com.innovhub.event;

import com.innovhub.dto.response.NotificationResponse;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class NotificationEvent extends ApplicationEvent {

    private final String userId;
    private final NotificationResponse payload;

    public NotificationEvent(Object source, String userId, NotificationResponse payload) {
        super(source);
        this.userId = userId;
        this.payload = payload;
    }
}
