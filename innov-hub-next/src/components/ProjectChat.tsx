"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { projects as projectsApi, getToken, API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface ChatMessage {
  id: string;
  projectId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatarUrl: string | null;
  content: string | null;
  fileName: string | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function groupByDate(messages: ChatMessage[]): { date: string; msgs: ChatMessage[] }[] {
  const groups: { date: string; msgs: ChatMessage[] }[] = [];
  let current: { date: string; msgs: ChatMessage[] } | null = null;
  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toDateString();
    if (!current || current.date !== dateStr) {
      current = { date: dateStr, msgs: [] };
      groups.push(current);
    }
    current.msgs.push(msg);
  }
  return groups;
}

export default function ProjectChat({ projectId }: { projectId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<Client | null>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const res = await projectsApi.getMessages(projectId, 0, 100);
        const data = res.data as { content: ChatMessage[] };
        setMessages([...(data.content || [])].reverse());
        scrollToBottom();
      } catch { /* ignore */ } finally { setLoading(false); }
    }
    load();
  }, [projectId, scrollToBottom]);

  useEffect(() => {
    const token = getToken();
    if (!token || !projectId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/project/${projectId}/messages`, (frame) => {
          try {
            const msg: ChatMessage = JSON.parse(frame.body);
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
            scrollToBottom();
          } catch { /* parse error */ }
        });
      },
      onDisconnect: () => setWsConnected(false),
    });
    client.activate();
    clientRef.current = client;
    return () => { client.deactivate(); clientRef.current = null; };
  }, [projectId, scrollToBottom]);

  const handleSend = async () => {
    if ((!text.trim() && !file) || sending) return;
    setSending(true);
    try {
      await projectsApi.sendMessage(projectId, text.trim() || undefined, file || undefined);
      setText("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      inputRef.current?.focus();
    } catch {
      setSendError(true);
      setTimeout(() => setSendError(false), 3000);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    const token = getToken();
    const res = await fetch(`${API_BASE}${fileUrl}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const groups = groupByDate(messages);
  const isMe = (senderId: string) => user?.id === senderId;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">Chat d&apos;équipe</h3>
          <span className="text-[11px] text-neutral-400">{messages.length} messages</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${wsConnected ? "bg-emerald-500" : "bg-red-400"}`} />
          <span className="text-[11px] text-neutral-400">{wsConnected ? "Connecté" : "Déconnecté"}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-[13px] text-neutral-400">Aucun message. Commencez la conversation.</p>
          </div>
        ) : (
          groups.map(group => (
            <div key={group.date}>
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
                <span className="text-[11px] text-neutral-400">{formatDate(group.msgs[0].createdAt)}</span>
                <div className="flex-1 border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              {group.msgs.map((msg, i) => {
                const mine = isMe(msg.senderId);
                const showAvatar = i === 0 || group.msgs[i - 1].senderId !== msg.senderId;
                return (
                  <div key={msg.id} className={`flex gap-2 mb-1 ${mine ? "flex-row-reverse" : ""}`}>
                    {showAvatar ? (
                      <div className={`size-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-medium ${
                        mine ? "bg-[#0066B3] text-white" : "bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300"
                      }`}>
                        {msg.senderName.charAt(0).toUpperCase()}
                      </div>
                    ) : (
                      <div className="w-6 shrink-0" />
                    )}
                    <div className={`max-w-[75%] ${mine ? "items-end" : "items-start"}`}>
                      {showAvatar && (
                        <div className={`flex items-center gap-1.5 mb-0.5 ${mine ? "justify-end" : ""}`}>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">{msg.senderName}</span>
                          <span className="text-[10px] text-neutral-400">{formatTime(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`rounded-md px-3 py-2 text-[13px] leading-relaxed ${
                        mine
                          ? "bg-[#0066B3] text-white"
                          : "bg-slate-100 dark:bg-neutral-800 text-slate-800 dark:text-neutral-200"
                      }`}>
                        {msg.content && <p className="whitespace-pre-wrap break-words">{msg.content}</p>}
                        {msg.fileName && msg.fileUrl && (
                          <button onClick={() => handleDownloadFile(msg.fileUrl!, msg.fileName!)}
                            className={`mt-1 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                              mine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200"
                            }`}>
                            <span className="material-symbols-outlined text-[14px]">attach_file</span>
                            <span className="truncate max-w-[180px]">{msg.fileName}</span>
                            {msg.fileSizeBytes && <span className="opacity-70">({formatFileSize(msg.fileSizeBytes)})</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* File preview */}
      {file && (
        <div className="mx-4 mb-1 flex items-center gap-2 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-3 py-2">
          <span className="material-symbols-outlined text-[14px] text-neutral-400">attach_file</span>
          <span className="text-[12px] text-neutral-700 dark:text-neutral-300 truncate flex-1">{file.name}</span>
          <span className="text-[11px] text-neutral-400">{formatFileSize(file.size)}</span>
          <button onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="text-neutral-400 hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>
      )}

      {sendError && (
        <div className="mx-4 mb-1 text-[12px] text-red-500">Erreur d&apos;envoi.</div>
      )}

      {/* Input */}
      <div className="px-4 py-2.5 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          <input type="file" ref={fileRef} className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
          <button onClick={() => fileRef.current?.click()} className="size-8 shrink-0 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center transition-colors">
            <span className="material-symbols-outlined text-lg">attach_file</span>
          </button>
          <input ref={inputRef} type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Écrire un message..."
            className="flex-1 h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-[13px] placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white" />
          <button onClick={handleSend} disabled={sending || (!text.trim() && !file)}
            className="size-8 shrink-0 rounded-md bg-[#0066B3] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#004d87] transition-colors">
            <span className="material-symbols-outlined text-base">{sending ? "hourglass_top" : "send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
