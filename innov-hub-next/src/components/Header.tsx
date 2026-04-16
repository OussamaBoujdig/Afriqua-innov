"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { notifications as notifApi, getToken, API_BASE } from "@/lib/api";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const roleLabels: Record<string, string> = {
  PORTEUR_IDEE: "Porteur d'idée",
  RESPONSABLE_INNOVATION: "Resp. Innovation",
  DIRECTEUR_BU: "Directeur BU",
  DIRECTEUR_GENERAL: "Directeur Général",
};

interface Notif {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
  type?: string;
}

interface ToastNotif { id: string; title: string; message: string; link: string | null; type?: string }

const notifTypeConfig = (type?: string) => {
  switch (type) {
    case "SUCCESS": return { icon: "check_circle", color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-400" };
    case "WARNING": return { icon: "warning", color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-400" };
    case "ERROR":   return { icon: "error", color: "text-red-500", bg: "bg-red-50", border: "border-red-400" };
    default:        return { icon: "notifications", color: "text-[#0066B3]", bg: "bg-blue-50", border: "border-[#0066B3]" };
  }
};

function NotifToast({ notif, onClose, onNavigate }: {
  notif: ToastNotif;
  onClose: () => void;
  onNavigate: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [onClose]);

  const cfg = notifTypeConfig(notif.type);

  return (
    <div className={`pointer-events-auto w-80 card p-3 shadow-xl animate-slide-in-right border-l-4 ${cfg.border}`}>
      <div className="flex items-start gap-2.5">
        <div className={`size-7 rounded-md ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
          <span className={`material-symbols-outlined text-[15px] ${cfg.color}`}>{cfg.icon}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-neutral-900 dark:text-white leading-snug">{notif.title}</p>
          <p className="mt-0.5 text-[12px] text-neutral-500 line-clamp-2">{notif.message}</p>
          {notif.link && (
            <button type="button" onClick={onNavigate} className="mt-1.5 text-[12px] font-medium text-[#0066B3] hover:text-[#004d87] transition-colors flex items-center gap-0.5">
              Voir <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
            </button>
          )}
        </div>
        <button type="button" onClick={onClose} className="shrink-0 size-5 flex items-center justify-center text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-all" aria-label="Fermer">
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [unread, setUnread]             = useState(0);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [notifOpen, setNotifOpen]       = useState(false);
  const [notifs, setNotifs]             = useState<Notif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [filterUnread, setFilterUnread] = useState(false);
  const [toasts, setToasts]             = useState<ToastNotif[]>([]);

  const menuRef  = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await notifApi.getUnreadCount();
      const count = res.data as number;
      setUnread(prev => {
        if (!isFirstLoad.current && count > prev) {
          notifApi.getAll(0, 1).then(r => {
            const page = r.data as { content: Notif[] };
            const latest = page.content?.[0];
            if (latest && !latest.isRead) {
              setToasts(t => [...t, { id: latest.id + Date.now(), title: latest.title, message: latest.message, link: latest.link, type: latest.type }]);
            }
          }).catch(() => {});
        }
        isFirstLoad.current = false;
        return count;
      });
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    const token = getToken();
    if (!user?.id || !token) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${user.id}/queue/notifications`, (frame) => {
          try {
            const notif: Notif = JSON.parse(frame.body);
            setUnread(prev => prev + 1);
            setNotifs(prev => [notif, ...prev]);
            setToasts(t => [...t, { id: notif.id + Date.now(), title: notif.title, message: notif.message, link: notif.link, type: notif.type }]);
          } catch { /* parse error */ }
        });
        client.subscribe(`/user/${user.id}/queue/invitations`, () => {});
      },
    });
    client.activate();
    return () => { client.deactivate(); };
  }, [user?.id]);

  const openNotifs = async () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    setMenuOpen(false);
    setFilterUnread(false);
    if (opening) {
      setNotifLoading(true);
      try {
        const res = await notifApi.getAll(0, 30);
        const page = res.data as { content: Notif[] };
        setNotifs(page.content || []);
      } catch { /* ignore */ }
      setNotifLoading(false);
    }
  };

  const markAllRead = async () => {
    try { await notifApi.markAllRead(); setNotifs(prev => prev.map(n => ({ ...n, isRead: true }))); setUnread(0); } catch { /* ignore */ }
  };

  const clearAllNotifs = async () => {
    try { await notifApi.clearAll(); setNotifs([]); setUnread(0); } catch { /* ignore */ }
  };

  const resolveNotifLink = useCallback((link: string | null): string | null => {
    if (!link) return null;
    const role = user?.role;
    // Idea links: route by role
    if (link.startsWith("/idees/")) {
      if (role === "PORTEUR_IDEE") return "/mes-idees";
      return "/approbation";
    }
    // Campaign links
    if (link.startsWith("/campagnes/")) return link.replace("/campagnes/", "/campagnes/");
    // Project links
    if (link.startsWith("/projets/") || link.startsWith("/projects/")) return "/suivi-projet";
    // Task links
    if (link.startsWith("/taches/") || link.startsWith("/tasks/")) return "/mes-taches";
    // Invitation links
    if (link.startsWith("/invitations/")) return "/mes-invitations";
    // Messaging links
    if (link.startsWith("/messagerie/") || link.startsWith("/messages/")) return "/messagerie";
    // Approbation
    if (link === "/approbation") return "/approbation";
    // Fallback: return as-is
    return link;
  }, [user]);

  const handleNotifClick = async (n: Notif) => {
    if (!n.isRead) {
      try { await notifApi.markRead(n.id); setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x)); setUnread(prev => Math.max(0, prev - 1)); } catch { /* ignore */ }
    }
    setNotifOpen(false);
    const dest = resolveNotifLink(n.link);
    if (dest) router.push(dest);
  };

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() : "";

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "maintenant";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}j`;
  };

  const pageTitle: Record<string, string> = {
    "/": "Tableau de bord",
    "/mes-idees": "Mes Idées",
    "/soumettre": "Soumettre une idée",
    "/campagnes/creer": "Créer une campagne",
    "/campagnes": "Campagnes",
    "/toutes-idees": "Toutes les idées",
    "/approbation": "Approbation",
    "/suivi-projet": "Suivi Projet",
    "/mes-taches": "Mes Tâches",
    "/mes-invitations": "Mes Invitations",
    "/messagerie": "Messagerie",
    "/gestion-utilisateurs": "Utilisateurs",
    "/profil": "Mon Profil",
  };

  const currentTitle = Object.entries(pageTitle).find(([path]) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path)
  )?.[1] || "InnovHub";

  const displayedNotifs = filterUnread ? notifs.filter(n => !n.isRead) : notifs;
  const unreadInList = notifs.filter(n => !n.isRead).length;

  return (
    <>
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none" aria-live="polite">
        {toasts.map(t => (
          <NotifToast key={t.id} notif={t} onClose={() => dismissToast(t.id)}
            onNavigate={() => { dismissToast(t.id); const dest = resolveNotifLink(t.link); if (dest) router.push(dest); }} />
        ))}
      </div>

      <header className="flex items-center justify-between border-b border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#111113] px-4 lg:px-5 shrink-0 z-50 h-14">
        {/* Left */}
        <div className="flex items-center gap-3">
          {/* Mobile: logo + name */}
          <Link href="/" className="lg:hidden flex items-center gap-2">
            <Image src="/logo-afriquia.png" alt="Afriquia SMDC" width={24} height={24} />
            <span className="text-[14px] font-semibold text-[#0066B3] tracking-tight">InnovHub</span>
          </Link>
          {/* Desktop: logo + page title */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <Image src="/logo-afriquia.png" alt="Afriquia SMDC" width={26} height={26} />
            </Link>
            <span className="text-neutral-300 dark:text-neutral-700">|</span>
            <h1 className="text-[14px] font-medium text-slate-700 dark:text-white">{currentTitle}</h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <button onClick={openNotifs} aria-label="Notifications" aria-expanded={notifOpen}
              className={`relative flex size-8 items-center justify-center rounded-md transition-colors ${
                notifOpen ? "bg-blue-50 dark:bg-blue-950/30 text-[#0066B3]" : "hover:bg-slate-100 dark:hover:bg-neutral-800"
              }`}>
              <span className={`material-symbols-outlined text-[18px] ${notifOpen ? "text-[#0066B3] dark:text-blue-400" : "text-slate-500 dark:text-neutral-400"}`}>notifications</span>
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex min-w-[16px] h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-medium text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-50 w-[380px] max-w-[calc(100vw-2rem)] card shadow-lg animate-fade-in-up overflow-hidden">
                  {/* Panel header */}
                  <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">Notifications</h3>
                      {unread > 0 && (
                        <span className="text-[11px] font-medium text-neutral-500">{unread} non lues</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {unread > 0 && (
                        <button onClick={markAllRead} className="text-[12px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-1.5 py-0.5 rounded">
                          Tout lire
                        </button>
                      )}
                      {notifs.length > 0 && (
                        <button onClick={clearAllNotifs} className="text-[12px] font-medium text-red-500 hover:text-red-600 px-1.5 py-0.5 rounded">
                          Vider
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-4">
                    {[
                      { key: false, label: "Toutes", count: notifs.length },
                      { key: true, label: "Non lues", count: unreadInList },
                    ].map(tab => (
                      <button key={String(tab.key)} onClick={() => setFilterUnread(tab.key)}
                        className={`py-2 px-2 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
                          filterUnread === tab.key
                            ? "border-[#0066B3] dark:border-blue-400 text-[#0066B3] dark:text-blue-400"
                            : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-neutral-300"
                        }`}>
                        {tab.label} {tab.count > 0 && <span className="text-neutral-400 ml-0.5">{tab.count}</span>}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className="max-h-[360px] overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center py-10 gap-2">
                        <span className="material-symbols-outlined animate-spin text-neutral-400 text-lg">progress_activity</span>
                      </div>
                    ) : displayedNotifs.length === 0 ? (
                      <div className="py-10 text-center">
                        <p className="text-[13px] text-neutral-400">Aucune notification</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {displayedNotifs.map(n => (
                          <li key={n.id}>
                            <button type="button" onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                                !n.isRead ? "bg-blue-50/40 dark:bg-blue-950/10" : ""
                              }`}>
                              <div className="flex items-start gap-2.5">
                                {/* Type icon */}
                                <div className={`mt-0.5 shrink-0 size-6 rounded-md flex items-center justify-center ${notifTypeConfig(n.type).bg}`}>
                                  <span className={`material-symbols-outlined text-[13px] ${notifTypeConfig(n.type).color}`}>
                                    {notifTypeConfig(n.type).icon}
                                  </span>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <p className={`text-[13px] leading-snug flex-1 ${!n.isRead ? "font-medium text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-400"}`}>
                                      {n.title}
                                    </p>
                                    {!n.isRead && <span className="shrink-0 size-1.5 rounded-full bg-blue-500" />}
                                  </div>
                                  <p className="mt-0.5 text-[12px] text-neutral-500 line-clamp-2">{n.message}</p>
                                  <p className="mt-1 text-[11px] text-neutral-400">{timeAgo(n.createdAt)}</p>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-4 bg-neutral-200 dark:bg-neutral-700 mx-1" />

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }} aria-label="Menu utilisateur" aria-expanded={menuOpen}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity px-1 py-1">
              <div className="hidden sm:block text-right">
                <p className="text-[13px] font-medium text-neutral-900 dark:text-white leading-tight">
                  {user?.fullName || "Utilisateur"}
                </p>
                <span className="text-[11px] text-neutral-500">
                  {roleLabels[user?.role || ""] || ""}
                </span>
              </div>
              <div className="size-7 rounded-full bg-[#0066B3] flex items-center justify-center text-[10px] font-medium text-white">
                {initials}
              </div>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 card shadow-lg py-1 z-50 animate-fade-in-up">
                <div className="px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 mb-1">
                  <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{user?.fullName}</p>
                  <p className="text-[11px] text-neutral-500 truncate">{user?.email}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); router.push("/profil"); }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-neutral-400">person</span>
                  Mon profil
                </button>
                <button onClick={async () => { setMenuOpen(false); await logout(); }}
                  className="w-full text-left px-3 py-1.5 text-[13px] text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
