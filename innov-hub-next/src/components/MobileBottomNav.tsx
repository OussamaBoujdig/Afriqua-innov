"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const mobileNavItems = [
  { href: "/", icon: "dashboard", roles: null },
  { href: "/mes-idees", icon: "lightbulb", roles: null },
  { href: "/soumettre", icon: "add", isFab: true, roles: ["PORTEUR_IDEE"] },
  { href: "/campagnes", icon: "explore", roles: null },
  { href: "/approbation", icon: "approval_delegation", roles: ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const visibleItems = mobileNavItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <nav className="lg:hidden flex justify-around items-center h-14 bg-white dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0 z-50">
      {visibleItems.map((item) =>
        item.isFab ? (
          <Link
            key={item.href}
            href={item.href}
            className="size-10 rounded-full bg-primary text-white -mt-5 shadow-md shadow-primary/30 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
          </Link>
        ) : (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center transition-colors ${
              isActive(item.href) ? "text-primary" : "text-slate-400 hover:text-primary"
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isActive(item.href) ? "active-fill" : ""}`}>
              {item.icon}
            </span>
          </Link>
        )
      )}
    </nav>
  );
}
