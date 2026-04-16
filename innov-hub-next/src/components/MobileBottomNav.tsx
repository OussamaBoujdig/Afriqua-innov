"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const MANAGERS = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"];

type NavItem = { href: string; icon: string; label: string };

const employeeItems: NavItem[] = [
  { href: "/", icon: "space_dashboard", label: "Accueil" },
  { href: "/mes-idees", icon: "lightbulb", label: "Idées" },
  { href: "/soumettre", icon: "add_circle", label: "Soumettre" },
  { href: "/campagnes", icon: "campaign", label: "Campagnes" },
  { href: "/mes-taches", icon: "task_alt", label: "Tâches" },
];

const managerItems: NavItem[] = [
  { href: "/", icon: "space_dashboard", label: "Accueil" },
  { href: "/toutes-idees", icon: "list", label: "Idées" },
  { href: "/approbation", icon: "fact_check", label: "Approb." },
  { href: "/suivi-projet", icon: "monitoring", label: "Projets" },
  { href: "/messagerie", icon: "chat_bubble", label: "Messages" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const items = user && MANAGERS.includes(user.role) ? managerItems : employeeItems;

  return (
    <nav className="lg:hidden flex justify-around items-end h-14 bg-white dark:bg-[#111113] border-t border-neutral-200 dark:border-neutral-800 shrink-0 z-50 px-1 pb-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md min-w-0 ${
            isActive(item.href)
              ? "text-[#0066B3] dark:text-blue-400"
              : "text-slate-400 dark:text-neutral-500"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          <span className="text-[10px] font-medium leading-none truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
