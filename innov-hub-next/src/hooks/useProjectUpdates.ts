"use client";

import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getToken, API_BASE } from "@/lib/api";

interface ProjectUpdateEvent {
  type: string;
  projectId: string;
}

/**
 * Subscribes to real-time project update events via STOMP WebSocket.
 * Calls `onUpdate` whenever the project data changes (team, tasks, deliverables, stage, etc.)
 */
export function useProjectUpdates(
  projectId: string | null | undefined,
  onUpdate: (event: ProjectUpdateEvent) => void
) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!projectId) return;
    const token = getToken();
    if (!token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/project/${projectId}/updates`, (frame) => {
          try {
            const event: ProjectUpdateEvent = JSON.parse(frame.body);
            callbackRef.current(event);
          } catch { /* ignore parse errors */ }
        });
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [projectId]);
}
