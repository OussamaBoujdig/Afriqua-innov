"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
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
  SOUMISE:              { label: "Soumise",      color: "bg-blue-50 text-blue-700" },
  EN_VALIDATION:        { label: "Révision",     color: "bg-amber-50 text-amber-700" },
  SCOREE:               { label: "Scorée",       color: "bg-violet-50 text-violet-700" },
  APPROUVEE_INNOVATION: { label: "Approuvée",    color: "bg-teal-50 text-teal-700" },
  APPROUVEE_BU:         { label: "Approuvée BU", color: "bg-emerald-50 text-emerald-700" },
  APPROUVEE_DG:         { label: "Approuvée DG", color: "bg-emerald-50 text-emerald-700" },
  CLOTUREE:             { label: "Déployé",      color: "bg-neutral-100 text-neutral-700" },
  BROUILLON:            { label: "Brouillon",    color: "bg-neutral-50 text-neutral-600" },
  REJETEE:              { label: "Rejetée",      color: "bg-red-50 text-red-700" },
};

/* Animated counter */
function AnimatedNumber({ value, delay = 0 }: { value: number; delay?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === 0) { setDisplayed(0); return; }
    let start: number | null = null;
    const duration = 900;
    const step = (ts: number) => {
      if (!start) start = ts + delay;
      const elapsed = ts - start;
      if (elapsed < 0) { rafRef.current = requestAnimationFrame(step); return; }
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(Math.round(eased * value));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value, delay]);

  return <span>{displayed}</span>;
}

/* Skeleton components */
function KpiSkeleton() {
  return (
    <div className="card px-4 py-3.5 space-y-2">
      <div className="skeleton h-3 w-16" />
      <div className="skeleton h-7 w-10" />
    </div>
  );
}

function PipelineSkeleton() {
  return (
    <div className="card px-5 py-4 space-y-3">
      <div className="skeleton h-3 w-20" />
      {[80, 60, 90, 45, 70].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="skeleton h-3 w-28 shrink-0" />
          <div className="skeleton h-6 flex-1" style={{ width: `${w}%`, maxWidth: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col card overflow-hidden">
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-3">
        <div className="skeleton h-3.5 w-28" />
        <div className="skeleton h-3 w-12" />
      </div>
      <div className="overflow-y-auto flex-1 divide-y divide-neutral-100 dark:divide-neutral-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-2.5">
            <div className="skeleton h-3 flex-1" />
            <div className="skeleton h-3 w-24" />
            <div className="skeleton h-3 w-8" />
            <div className="skeleton h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineVisible, setPipelineVisible] = useState(false);

  useEffect(() => {
    dashApi.getStats()
      .then((res) => {
        setStats(res.data as Stats);
        // Stagger pipeline bars animation
        setTimeout(() => setPipelineVisible(true), 100);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const s = stats || { totalIdeas: 0, ideasEnCours: 0, ideasValidees: 0, ideasDeployees: 0, pipeline: {}, recentIdeas: [], topInnovators: [] };
  const maxPipeline = Math.max(...Object.values(s.pipeline || {}), 1);

  const kpis = [
    { label: "Total Idées",  value: s.totalIdeas,    icon: "lightbulb",  delay: 0 },
    { label: "En cours",     value: s.ideasEnCours,   icon: "pending",    delay: 80 },
    { label: "Validées",     value: s.ideasValidees,  icon: "check_circle", delay: 160 },
    { label: "Déployées",    value: s.ideasDeployees, icon: "rocket_launch", delay: 240 },
  ];

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="flex flex-1 flex-col min-w-0 overflow-y-auto p-5 lg:p-6 gap-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 shrink-0 stagger">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
            : kpis.map((card) => (
              <div
                key={card.label}
                className="card px-4 py-3.5 group hover:border-[#0066B3]/30 hover:shadow-sm transition-all duration-200 cursor-default"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] text-neutral-500 font-medium">{card.label}</p>
                  <span className="material-symbols-outlined text-[16px] text-slate-300 group-hover:text-[#0066B3] transition-colors duration-200">
                    {card.icon}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-neutral-900 dark:text-white tabular-nums">
                  <AnimatedNumber value={card.value} delay={card.delay} />
                </p>
              </div>
            ))}
        </div>

        {/* Pipeline */}
        {loading ? <PipelineSkeleton /> : (
          <div className="card px-5 py-4 shrink-0">
            <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white mb-4">Pipeline d&apos;Innovation</h3>
            <div className="space-y-2.5">
              {Object.entries(s.pipeline || {}).map(([stage, count], idx) => (
                <div key={stage} className="flex items-center gap-3 group">
                  <span className="w-36 shrink-0 text-right text-[12px] font-medium text-neutral-500 truncate">{stage}</span>
                  <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full bg-[#0066B3] dark:bg-blue-500 rounded-md transition-all duration-700 ease-out"
                      style={{
                        width: pipelineVisible ? `${Math.max((count / maxPipeline) * 100, 4)}%` : "0%",
                        transitionDelay: `${idx * 80}ms`,
                      }}
                    />
                    <span className="absolute inset-0 flex items-center px-3 text-[12px] font-semibold text-white mix-blend-difference pointer-events-none">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
              {Object.keys(s.pipeline || {}).length === 0 && (
                <p className="py-2 text-center text-[13px] text-neutral-400">Aucune donnée.</p>
              )}
            </div>
          </div>
        )}

        {/* Recent ideas */}
        {loading ? <TableSkeleton /> : (
          <div className="flex min-h-0 flex-1 flex-col card overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-neutral-200 dark:border-neutral-800 px-5 py-3">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Idées récentes</h3>
              <Link href="/mes-idees" className="text-[13px] font-medium text-[#0066B3] hover:text-[#004d87] dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                Tout voir →
              </Link>
            </div>
            <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-neutral-50 dark:bg-neutral-800/50 z-10">
                  <tr className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                    <th className="px-5 py-2.5">Titre</th>
                    <th className="px-5 py-2.5">Auteur</th>
                    <th className="px-5 py-2.5 text-center">Score</th>
                    <th className="px-5 py-2.5">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {(s.recentIdeas || []).slice(0, 8).map((idea, idx) => {
                    const st = statusLabels[idea.status] || { label: idea.status, color: "bg-neutral-50 text-neutral-600" };
                    return (
                      <tr
                        key={idea.id}
                        className="hover:bg-blue-50/30 dark:hover:bg-blue-950/10 transition-colors cursor-pointer"
                        style={{ animation: `fadeIn 0.25s ease-out both`, animationDelay: `${idx * 30}ms` }}
                      >
                        <td className="px-5 py-2.5 text-[13px] font-medium text-neutral-900 dark:text-white max-w-[200px] truncate">{idea.title}</td>
                        <td className="px-5 py-2.5 text-[13px] text-neutral-500">{idea.submittedByName}</td>
                        <td className="px-5 py-2.5 text-center text-[13px] tabular-nums font-medium">
                          {idea.totalScore != null
                            ? <span className="text-[#0066B3]">{Number(idea.totalScore).toFixed(0)}</span>
                            : <span className="text-neutral-300">—</span>}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={`badge ${st.color}`}>{st.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {(s.recentIdeas || []).length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-10 text-center text-[13px] text-neutral-400">Aucune idée récente.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 p-5 pl-0 overflow-y-auto">
        <div className="space-y-4">
          {/* Top Innovators */}
          <div className="card p-4">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-3">Top Innovateurs</h3>
            <div className="space-y-2.5">
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="skeleton h-3 w-4" />
                      <div className="skeleton size-7 rounded-full" />
                      <div className="skeleton h-3 flex-1" />
                      <div className="skeleton h-3 w-8" />
                    </div>
                  ))
                : (s.topInnovators || []).map((u, i) => (
                    <div key={u.id} className="flex items-center gap-2.5 group">
                      <span className={`text-[12px] font-bold w-4 text-right tabular-nums ${
                        i === 0 ? "text-amber-500" : i === 1 ? "text-slate-400" : i === 2 ? "text-orange-400" : "text-neutral-300"
                      }`}>
                        {i + 1}
                      </span>
                      <div className="size-7 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 flex items-center justify-center text-[11px] font-semibold text-[#0066B3] dark:text-blue-300 shrink-0">
                        {u.fullName?.[0] || "?"}
                      </div>
                      <p className="flex-1 min-w-0 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 truncate group-hover:text-[#0066B3] transition-colors">{u.fullName}</p>
                      <span className="text-[12px] font-semibold text-neutral-500 tabular-nums shrink-0">{u.points?.toLocaleString()}</span>
                    </div>
                  ))}
              {!loading && (s.topInnovators || []).length === 0 && (
                <p className="text-[13px] text-neutral-400 text-center py-2">Aucun innovateur.</p>
              )}
            </div>
          </div>

          {/* CTA */}
          {!loading && (
            <div className="card p-4 border-[#0066B3] bg-[#0066B3] text-white overflow-hidden relative">
              {/* Subtle pattern */}
              <div className="absolute -right-4 -top-4 size-20 rounded-full bg-bleu/5" />
              <div className="absolute -right-1 -bottom-6 size-16 rounded-full bg-bleu/5" />
              <div className="relative">
                <h4 className="text-[14px] text-black font-semibold">Nouvelle idée ?</h4>
                <p className="mt-1 text-[12px] text-black leading-relaxed">Partagez votre concept et obtenez du feedback de l'équipe.</p>
                <Link
                  href="/soumettre"
                  className="mt-3 flex items-center justify-center gap-1.5 w-full rounded-md bg-white py-1.5 text-[13px] font-medium text-[#0066B3] hover:bg-blue-50 active:scale-95 transition-all duration-150"
                >
                  <span className="material-symbols-outlined text-[15px]">add_circle</span>
                  Soumettre
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
