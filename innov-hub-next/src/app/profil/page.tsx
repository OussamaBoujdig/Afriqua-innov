"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { ideas as ideasApi } from "@/lib/api";

interface IdeaSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  voteCount: number;
  createdAt: string;
}

const roleLabels: Record<string, string> = {
  PORTEUR_IDEE: "Porteur d'idée",
  RESPONSABLE_INNOVATION: "Responsable Innovation",
  DIRECTEUR_BU: "Directeur BU",
  DIRECTEUR_GENERAL: "Directeur Général",
};

export default function ProfilPage() {
  const { user, logout } = useAuth();
  const [myIdeas, setMyIdeas] = useState<IdeaSummary[]>([]);

  useEffect(() => {
    ideasApi.getMine(0, 5).then((res) => {
      const page = res.data as { content: IdeaSummary[] };
      setMyIdeas(page.content || []);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Profile Header Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary to-indigo-600 relative">
            <div className="absolute -bottom-8 left-6">
              <div className="size-16 rounded-2xl bg-white dark:bg-slate-800 border-4 border-white dark:border-slate-800 shadow-lg flex items-center justify-center text-primary text-xl font-extrabold">
                {initials}
              </div>
            </div>
          </div>
          <div className="pt-10 pb-4 px-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h1 className="text-lg font-extrabold tracking-tight">{user.fullName || `${user.firstName} ${user.lastName}`}</h1>
                <p className="text-sm text-slate-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {roleLabels[user.role] || user.role}
                  </span>
                  {user.department && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                      {user.department}
                    </span>
                  )}
                  {user.businessUnit && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                      {user.businessUnit}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <span className="material-symbols-outlined text-sm">logout</span>
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4 text-center">
            <span className="material-symbols-outlined text-primary text-2xl mb-1">lightbulb</span>
            <p className="text-2xl font-extrabold text-primary">{myIdeas.length}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Idées soumises</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4 text-center">
            <span className="material-symbols-outlined text-amber-500 text-2xl mb-1">emoji_events</span>
            <p className="text-2xl font-extrabold text-amber-500">{user.points || 0}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Points gagnés</p>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4 text-center">
            <span className="material-symbols-outlined text-emerald-500 text-2xl mb-1">favorite</span>
            <p className="text-2xl font-extrabold text-emerald-500">
              {myIdeas.reduce((sum, i) => sum + (i.voteCount || 0), 0)}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Votes reçus</p>
          </div>
        </div>

        {/* Recent Ideas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4">
          <h2 className="text-sm font-bold mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">history</span>
            Mes dernières idées
          </h2>
          {myIdeas.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Aucune idée soumise pour le moment.</p>
          ) : (
            <div className="space-y-2">
              {myIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-primary/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="material-symbols-outlined text-primary text-base shrink-0">lightbulb</span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{idea.title}</p>
                      <p className="text-[10px] text-slate-400">{idea.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <StatusBadge status={idea.status} />
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <span className="material-symbols-outlined text-xs">favorite</span>
                      {idea.voteCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    BROUILLON: "bg-slate-100 text-slate-600",
    SOUMISE: "bg-blue-100 text-blue-700",
    EN_VALIDATION: "bg-amber-100 text-amber-700",
    SCOREE: "bg-purple-100 text-purple-700",
    APPROUVEE_INNOVATION: "bg-teal-100 text-teal-700",
    APPROUVEE_BU: "bg-emerald-100 text-emerald-700",
    APPROUVEE_DG: "bg-emerald-100 text-emerald-700",
    CLOTUREE: "bg-slate-100 text-slate-600",
    REJETEE: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    BROUILLON: "Brouillon",
    SOUMISE: "Soumise",
    EN_VALIDATION: "En révision",
    SCOREE: "Scorée",
    APPROUVEE_INNOVATION: "Approuvée Innovation",
    APPROUVEE_BU: "Approuvée BU",
    APPROUVEE_DG: "Approuvée DG",
    CLOTUREE: "Clôturée",
    REJETEE: "Rejetée",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${colors[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
}
