"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const MANAGERS = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"];
const RESP_ONLY = ["RESPONSABLE_INNOVATION"];
const PORTEUR = ["PORTEUR_IDEE"];

const sections = [
  {
    label: null,
    items: [
      { label: "Tableau de bord", href: "/", icon: "space_dashboard", roles: null },
      { label: "Campagnes", href: "/campagnes", icon: "campaign", roles: null },
    ],
  },
  {
    label: "Innovation",
    items: [
      { label: "Mes Idées", href: "/mes-idees", icon: "lightbulb", roles: null },
      { label: "Soumettre une idée", href: "/soumettre", icon: "add_circle", roles: PORTEUR },
      { label: "Toutes les idées", href: "/toutes-idees", icon: "list", roles: MANAGERS },
    ],
  },
  {
    label: "Gestion",
    items: [
      { label: "Approbation", href: "/approbation", icon: "fact_check", roles: MANAGERS },
      { label: "Suivi Projets", href: "/suivi-projet", icon: "monitoring", roles: MANAGERS },
    ],
  },
  {
    label: "Collaborer",
    items: [
      { label: "Mes Tâches", href: "/mes-taches", icon: "task_alt", roles: null },
      { label: "Mes Invitations", href: "/mes-invitations", icon: "mail", roles: null },
      { label: "Messagerie", href: "/messagerie", icon: "chat_bubble", roles: null },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Utilisateurs", href: "/gestion-utilisateurs", icon: "group", roles: RESP_ONLY },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const canSee = (roles: string[] | null) =>
    !roles || (user !== null && roles.includes(user.role));

  return (
    <aside className="hidden lg:flex w-[232px] flex-col border-r border-slate-200 dark:border-neutral-800 bg-white dark:bg-[#111113] shrink-0">
      {/* Brand */}
     

      {/* Nav */}
      <nav className="flex flex-col flex-1 overflow-y-auto px-2.5 py-3 gap-0.5">
        {sections.map((section) => {
          const visible = section.items.filter((item) => canSee(item.roles));
          if (visible.length === 0) return null;
          return (
            <div key={section.label ?? "__root"}>
              {section.label && (
                <p className="mt-5 mb-1.5 px-2.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {section.label}
                </p>
              )}
              {visible.map((item) => {
                const active = isActive(item.href);
                const hovered = hoveredHref === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onMouseEnter={() => setHoveredHref(item.href)}
                    onMouseLeave={() => setHoveredHref(null)}
                    className={`relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-150 ${
                      active
                        ? "bg-blue-50 dark:bg-blue-950/30 text-[#0066B3] dark:text-blue-400 font-medium"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:text-slate-900 dark:hover:text-white"
                    } ${hovered && !active ? "translate-x-0.5" : ""}`}
                  >
                    {/* Active indicator bar */}
                    {active && (
                      <span
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0066B3] dark:bg-blue-400 rounded-r-full"
                        style={{ animation: "scaleIn 0.2s ease-out" }}
                      />
                    )}
                    <span
                      className={`material-symbols-outlined text-[18px] transition-all duration-150 ${
                        active
                          ? "active-fill text-[#0066B3] dark:text-blue-400"
                          : hovered
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Profile */}
      <div className="px-2.5 pb-3 pt-2 border-t border-slate-200 dark:border-neutral-800">
        {user && (
          <Link
            href="/profil"
            className={`group flex items-center gap-2.5 px-2.5 py-[7px] rounded-md text-[13px] transition-all duration-150 ${
              isActive("/profil")
                ? "bg-blue-50 dark:bg-blue-950/30 text-[#0066B3] dark:text-blue-400 font-medium"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-neutral-800/50 hover:translate-x-0.5"
            }`}
          >
            <div className="size-7 rounded-full bg-[#0066B3] flex items-center justify-center text-[10px] font-bold text-white shrink-0 ring-2 ring-transparent group-hover:ring-blue-200 dark:group-hover:ring-blue-900 transition-all">
              {user.fullName?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] leading-tight">{user.fullName}</p>
              <p className="truncate text-[10px] text-slate-400 leading-tight">{user.role?.replace(/_/g, " ")}</p>
            </div>
            <span className="material-symbols-outlined text-[14px] text-slate-300 dark:text-slate-600 group-hover:text-slate-400 transition-colors shrink-0">
              chevron_right
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}
