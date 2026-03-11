"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState, useRef, useCallback } from "react";
import { notifications as notifApi } from "@/lib/api";

const roleLabels: Record<string, string> = {
  PORTEUR_IDEE: "Porteur d'idée",
  RESPONSABLE_INNOVATION: "Resp. Innovation",
  DIRECTEUR_BU: "Directeur BU",
  DIRECTEUR_GENERAL: "Directeur Général",
};

const navItems = [
  { label: "Tableau de bord", href: "/", roles: null },
  { label: "Mes Idées", href: "/mes-idees", roles: null },
  { label: "Campagnes", href: "/campagnes", roles: null },
  { label: "Approbation", href: "/approbation", roles: ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] },
  { label: "Projets", href: "/suivi-projet", roles: ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] },
];

interface Notif {
  id: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const fetchUnread = useCallback(() => {
    notifApi.getUnreadCount().then((res) => {
      setUnread(res.data as number);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  useEffect(() => {
    fetchUnread();
  }, [pathname, fetchUnread]);

  const openNotifs = async () => {
    setNotifOpen(!notifOpen);
    setMenuOpen(false);
    if (!notifOpen) {
      setNotifLoading(true);
      try {
        const res = await notifApi.getAll(0, 20);
        const page = res.data as { content: Notif[] };
        setNotifs(page.content || []);
      } catch { /* ignore */ }
      setNotifLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await notifApi.markAllRead();
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const handleNotifClick = async (n: Notif) => {
    if (!n.isRead) {
      try {
        await notifApi.markRead(n.id);
        setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, isRead: true } : x));
        setUnread((prev) => Math.max(0, prev - 1));
      } catch { /* ignore */ }
    }
    setNotifOpen(false);
    if (n.link) router.push(n.link);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase()
    : "";

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return `Il y a ${Math.floor(hrs / 24)}j`;
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-5 lg:px-8 shrink-0 z-50 h-14">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5 text-primary hover:opacity-90 transition-opacity">
          <div className="size-9 bg-gradient-to-br from-primary to-indigo-600 shadow-sm shadow-primary/20 rounded-xl flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-xl">hub</span>
          </div>
          <span className="text-slate-900 dark:text-slate-100 text-base font-bold tracking-tight">
            Innov&apos;Hub
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-5">
          {navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive(item.href)
                  ? "text-sm font-bold text-primary border-b-2 border-primary pb-0.5"
                  : "text-sm font-medium text-slate-500 hover:text-primary dark:text-slate-400 transition-colors"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-4">
        {/* Notifications bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotifs}
            className="relative flex size-9 items-center justify-center rounded-xl bg-slate-100/60 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-2xl z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">Notifications</h3>
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-[10px] font-bold text-primary hover:underline">
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <span className="material-symbols-outlined animate-spin text-primary text-lg">progress_activity</span>
                  </div>
                ) : notifs.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">notifications_off</span>
                    <p className="text-xs text-slate-400 mt-2">Aucune notification</p>
                  </div>
                ) : (
                  notifs.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${!n.isRead ? "bg-primary/5" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 size-2 rounded-full shrink-0 ${!n.isRead ? "bg-primary" : "bg-transparent"}`}></div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold truncate ${!n.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"}`}>{n.title}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                          <p className="text-[9px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
            className="flex items-center gap-3 border-l border-slate-200/60 pl-4 dark:border-slate-700/60 hover:opacity-80 transition-opacity"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
                {user?.fullName || user?.email || "Utilisateur"}
              </p>
              <span className="text-[10px] font-bold text-primary/80 uppercase">
                {roleLabels[user?.role || ""] || user?.role || ""}
              </span>
            </div>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-primary/20">
              {initials}
            </div>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-xl py-1 z-50">
              <button
                onClick={() => { setMenuOpen(false); router.push("/profil"); }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">person</span>
                Mon profil
              </button>
              <hr className="border-slate-100 dark:border-slate-800 my-0.5" />
              <button
                onClick={async () => { setMenuOpen(false); await logout(); }}
                className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
