"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const allNavItems = [
  { label: "Tableau de bord", href: "/", icon: "dashboard", roles: null },
  { label: "Mes Idées", href: "/mes-idees", icon: "lightbulb", roles: null },
  { label: "Soumettre", href: "/soumettre", icon: "add_circle", roles: ["PORTEUR_IDEE"] },
  { label: "Campagnes", href: "/campagnes", icon: "explore", roles: null },
  { label: "Approbation", href: "/approbation", icon: "approval_delegation", roles: ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] },
  { label: "Projets", href: "/suivi-projet", icon: "rocket", roles: ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:flex w-56 flex-col border-r border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0 overflow-y-auto">
      <nav className="flex flex-col gap-1 p-4 flex-1">
        {allNavItems.filter((item) => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              isActive(item.href)
                ? "flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-sm shadow-primary/20 text-sm font-semibold"
                : "flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-all text-sm font-medium"
            }
          >
            <span className={`material-symbols-outlined text-xl ${isActive(item.href) ? "" : "text-slate-400"}`}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
