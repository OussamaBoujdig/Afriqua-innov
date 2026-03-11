"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { dashboard as dashApi } from "@/lib/api";

interface Stats {
  totalIdeas: number;
  ideasEnCours: number;
  ideasValidees: number;
  ideasDeployees: number;
  pipeline: Record<string, number>;
  recentIdeas: Array<{
    id: string;
    title: string;
    submittedByName: string;
    totalScore: number | null;
    status: string;
  }>;
  topInnovators: Array<{
    id: string;
    fullName: string;
    points: number;
  }>;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  SOUMISE: { label: "Soumise", color: "bg-blue-100 text-blue-800" },
  EN_VALIDATION: { label: "Révision", color: "bg-amber-100 text-amber-800" },
  SCOREE: { label: "Scorée", color: "bg-purple-100 text-purple-800" },
  APPROUVEE_INNOVATION: { label: "Approuvée", color: "bg-teal-100 text-teal-800" },
  APPROUVEE_BU: { label: "Approuvée BU", color: "bg-emerald-100 text-emerald-800" },
  APPROUVEE_DG: { label: "Approuvée DG", color: "bg-emerald-100 text-emerald-800" },
  CLOTUREE: { label: "Déployé", color: "bg-primary/10 text-primary" },
  BROUILLON: { label: "Brouillon", color: "bg-slate-100 text-slate-600" },
  REJETEE: { label: "Rejetée", color: "bg-red-100 text-red-800" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashApi
      .getStats()
      .then((res) => setStats(res.data as Stats))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-primary text-2xl">
          progress_activity
        </span>
      </div>
    );
  }

  const s = stats || {
    totalIdeas: 0,
    ideasEnCours: 0,
    ideasValidees: 0,
    ideasDeployees: 0,
    pipeline: {},
    recentIdeas: [],
    topInnovators: [],
  };
  const maxPipeline = Math.max(...Object.values(s.pipeline || {}), 1);

  return (
    <div className="flex h-full w-full overflow-hidden p-5 gap-5">
      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col gap-4 min-w-0 overflow-hidden">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 shrink-0">
          {[
            { label: "Total Idées", value: s.totalIdeas, icon: "lightbulb", iconColor: "text-primary" },
            { label: "En cours", value: s.ideasEnCours, icon: "pending", iconColor: "text-amber-500" },
            { label: "Validées", value: s.ideasValidees, icon: "check_circle", iconColor: "text-emerald-500" },
            { label: "Déployées", value: s.ideasDeployees, icon: "rocket_launch", iconColor: "text-blue-500" },
          ].map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-xl border border-slate-200/60 bg-white px-5 py-4 dark:border-slate-800/60 dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="absolute -right-5 -top-5 size-20 rounded-full bg-primary/5 group-hover:scale-150 transition-transform duration-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{card.label}</span>
                <span className={`material-symbols-outlined ${card.iconColor} text-2xl`}>{card.icon}</span>
              </div>
              <p className="text-3xl font-bold tracking-tight">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="shrink-0 rounded-xl border border-slate-200/60 bg-white px-5 py-4 dark:border-slate-800/60 dark:bg-slate-900 shadow-sm">
          <h3 className="mb-3 text-base font-bold">Pipeline d&apos;Innovation</h3>
          <div className="space-y-2.5">
            {Object.entries(s.pipeline || {}).map(([stage, count]) => (
              <div key={stage} className="flex items-center gap-3">
                <div className="w-36 shrink-0 text-right text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
                  {stage}
                </div>
                <div className="relative h-8 flex-1 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-primary/60 to-primary transition-all duration-500"
                    style={{ width: `${Math.max((count / maxPipeline) * 100, 5)}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                    {count} Idées
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(s.pipeline || {}).length === 0 && (
              <p className="py-2 text-center text-sm text-slate-400">Aucune donnée dans le pipeline.</p>
            )}
          </div>
        </div>

        {/* Recent ideas table — fills remaining height */}
        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/60 bg-white overflow-hidden dark:border-slate-800/60 dark:bg-slate-900 shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
            <h3 className="text-base font-bold">Idées Récentes</h3>
            <Link href="/mes-idees" className="text-sm font-semibold text-primary hover:underline">
              Tout voir
            </Link>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 z-10">
                <tr>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase text-xs">Titre</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase text-xs">Auteur</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase text-xs text-center">Score</th>
                  <th className="px-5 py-3 font-bold text-slate-500 uppercase text-xs">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(s.recentIdeas || []).slice(0, 6).map((idea) => {
                  const st = statusLabels[idea.status] || {
                    label: idea.status,
                    color: "bg-slate-100 text-slate-600",
                  };
                  return (
                    <tr
                      key={idea.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-5 py-3 font-semibold text-slate-900 dark:text-white">{idea.title}</td>
                      <td className="px-5 py-3 text-slate-600">{idea.submittedByName}</td>
                      <td className="px-5 py-3 text-center">
                        {idea.totalScore != null ? (
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-xs font-bold text-primary">
                            {Number(idea.totalScore).toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${st.color}`}>
                          {st.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(s.recentIdeas || []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-400">
                      Aucune idée récente.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside className="w-full shrink-0 lg:w-64">
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200/60 bg-white p-4 dark:border-slate-800/60 dark:bg-slate-900 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider">Top Innovateurs</h3>
              <span className="material-symbols-outlined text-amber-500 text-[18px]">emoji_events</span>
            </div>
            <div className="space-y-3">
              {(s.topInnovators || []).map((user, i) => (
                <div key={user.id} className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400 ring-offset-1" : "bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-700"
                    }`}>
                      {user.fullName?.[0] || "?"}
                    </div>
                    <span className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[8px] font-bold text-white ${
                      i === 0 ? "bg-amber-400" : i === 1 ? "bg-slate-400" : "bg-amber-600/60"
                    }`}>{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{user.fullName}</p>
                  </div>
                  <span className="text-[10px] font-bold text-primary shrink-0">{user.points?.toLocaleString()}</span>
                </div>
              ))}
              {(s.topInnovators || []).length === 0 && (
                <p className="text-xs text-slate-400 text-center">Aucun innovateur.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-primary to-indigo-600 p-4 text-white shadow-md shadow-primary/20 relative overflow-hidden">
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-6xl opacity-10">lightbulb</span>
            <span className="material-symbols-outlined mb-1 text-lg">add_circle</span>
            <h4 className="mb-0.5 text-sm font-bold">Nouvelle Idée ?</h4>
            <p className="mb-3 text-[10px] opacity-80 text-white/90">Partagez votre concept et obtenez un feedback immédiat.</p>
            <Link href="/soumettre" className="block w-full rounded-lg bg-white py-1.5 text-center text-xs font-bold text-primary hover:bg-slate-50">Soumettre un projet</Link>
          </div>
        </div>
      </aside>
    </div>
  );
}