"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import MobileBottomNav from "@/components/MobileBottomNav";
import ChatbotWidget from "@/components/ChatbotWidget";

const PUBLIC_PATHS = ["/login"];

function LoadingScreen() {
  return (
    <div className="flex h-full items-center justify-center bg-white dark:bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-12 flex items-center justify-center">
          {/* Spinning ring */}
          <svg className="absolute inset-0 animate-spin" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" stroke="#e2e8f0" strokeWidth="3" />
            <path d="M24 4 a20 20 0 0 1 20 20" stroke="#0066B3" strokeWidth="3" strokeLinecap="round" />
          </svg>
          {/* Center dot */}
          <div className="size-3 rounded-full bg-[#0066B3] opacity-80" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[13px] font-medium text-slate-700 dark:text-slate-300">InnovHub</span>
          <span className="text-[12px] text-slate-400">Chargement en cours...</span>
        </div>
      </div>
    </div>
  );
}

function PageWrapper({ children, pathname }: { children: React.ReactNode; pathname: string }) {
  const [key, setKey] = useState(pathname);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => {
      setKey(pathname);
      setVisible(true);
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      key={key}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.2s ease-out, transform 0.2s ease-out",
        height: "100%",
      }}
    >
      {children}
    </div>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user && !PUBLIC_PATHS.includes(pathname)) router.replace("/login");
    if (user && PUBLIC_PATHS.includes(pathname)) router.replace("/");
  }, [user, loading, pathname, router]);

  if (loading) return <LoadingScreen />;

  if (PUBLIC_PATHS.includes(pathname)) {
    return <div className="h-full overflow-y-auto">{children}</div>;
  }

  if (!user) return null;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-[#f8f9fb] dark:bg-[#09090b]">
          <PageWrapper pathname={pathname}>{children}</PageWrapper>
        </main>
      </div>
      <MobileBottomNav />
      <ChatbotWidget />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
