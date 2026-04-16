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
    <div className="px-4 md:px-6 py-5">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Profile Header */}
        <div className="card p-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-md bg-[#0066B3] flex items-center justify-center text-white text-[15px] font-semibold shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  {user.fullName || `${user.firstName} ${user.lastName}`}
                </h1>
                <p className="text-[13px] text-neutral-500">{user.email}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                    {roleLabels[user.role] || user.role}
                  </span>
                  {user.department && (
                    <span className="badge bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                      {user.department}
                    </span>
                  )}
                  {user.businessUnit && (
                    <span className="badge bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                      {user.businessUnit}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={logout}
              className="btn-danger self-start"
            >
              <span className="material-symbols-outlined text-[15px]">logout</span>
              Déconnexion
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Idées soumises</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">{myIdeas.length}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Points gagnés</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">{user.points || 0}</p>
          </div>
          <div className="card p-4">
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Votes reçus</p>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white mt-1">
              {myIdeas.reduce((sum, i) => sum + (i.voteCount || 0), 0)}
            </p>
          </div>
        </div>

        {/* Recent Ideas */}
        <div className="card p-4">
          <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white mb-3">Mes dernières idées</h2>
          {myIdeas.length === 0 ? (
            <p className="text-[13px] text-neutral-400 text-center py-6">Aucune idée soumise pour le moment.</p>
          ) : (
            <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {myIdeas.map((idea) => (
                <div key={idea.id} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{idea.title}</p>
                    <p className="text-[12px] text-neutral-400">{idea.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <StatusBadge status={idea.status} />
                    <span className="flex items-center gap-1 text-[12px] text-neutral-400">
                      <span className="material-symbols-outlined text-[13px]">thumb_up</span>
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
    BROUILLON: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    SOUMISE: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    EN_VALIDATION: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
    SCOREE: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    APPROUVEE_INNOVATION: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
    APPROUVEE_BU: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    APPROUVEE_DG: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
    CLOTUREE: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    REJETEE: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
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
    <span className={`badge ${colors[status] || "bg-neutral-100 text-neutral-600"}`}>
      {labels[status] || status}
    </span>
  );
}
