"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { chatbot } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  ts: number;
}

const SUGGESTIONS = [
  "Comment soumettre une idée ?",
  "Quel est le workflow ?",
  "Comment gérer une équipe projet ?",
  "Quels sont les rôles ?",
];

function escapeHtml(text: string) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderMarkdown(text: string) {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-medium text-neutral-900 dark:text-white">$1</strong>')
    .replace(/\n/g, "<br/>");
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "bot", text: "Bonjour, je suis l'assistant **InnovHub**. Comment puis-je vous aider ?", ts: Date.now() },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (open) { setHasUnread(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [open]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: text.trim(), ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await chatbot.send(text.trim());
      const reply = (res.data as { reply: string }).reply;
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "bot", text: reply, ts: Date.now() }]);
      if (!open) setHasUnread(true);
    } catch {
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "bot", text: "Désolé, une erreur est survenue.", ts: Date.now() }]);
    } finally { setLoading(false); }
  }, [loading, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Toggle button */}
      <button onClick={() => setOpen(!open)} aria-label={open ? "Fermer" : "Assistant"}
        className={`fixed bottom-20 md:bottom-5 right-4 md:right-5 z-50 size-10 rounded-md shadow-md flex items-center justify-center transition-colors ${
          open ? "bg-slate-600 text-white" : "bg-[#0066B3] text-white hover:bg-[#004d87]"
        }`}>
        <span className="material-symbols-outlined text-lg">{open ? "close" : "chat_bubble"}</span>
        {hasUnread && !open && (
          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-red-500" />
        )}
      </button>

      {/* Chat window */}
      <div className={`fixed bottom-32 md:bottom-20 right-4 md:right-5 z-50 w-[340px] sm:w-[370px] transition-all duration-200 origin-bottom-right ${
        open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
      }`}>
        <div className="card shadow-lg overflow-hidden flex flex-col" style={{ height: "440px" }}>
          {/* Header */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-neutral-900 dark:text-white">Assistant</p>
              <p className="text-[11px] text-neutral-500">Posez vos questions</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
              <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-md px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user"
                    ? "bg-[#0066B3] text-white"
                    : "bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-neutral-300"
                }`}>
                  <div dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 dark:bg-neutral-800 rounded-md px-4 py-3 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "120ms" }} />
                  <span className="size-1.5 rounded-full bg-neutral-400 animate-bounce" style={{ animationDelay: "240ms" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 2 && !loading && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-[12px] px-2.5 py-1 rounded-md border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Posez votre question..." disabled={loading}
                className="flex-1 h-8 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[13px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white disabled:opacity-50" />
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                className="size-8 rounded-md bg-[#0066B3] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#004d87] transition-colors shrink-0">
                <span className="material-symbols-outlined text-base">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
