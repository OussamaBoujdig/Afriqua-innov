"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ideas as ideasApi } from "@/lib/api";

interface Idea {
  id: string;
  title: string;
  category: string;
  status: string;
  totalScore: number | null;
  voteCount: number;
  commentCount: number;
  submittedByName: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; barColor: string }> = {
  BROUILLON: { label: "Brouillon", color: "bg-slate-100 text-slate-600", barColor: "bg-slate-300" },
  SOUMISE: { label: "Soumise", color: "bg-blue-100 text-blue-700", barColor: "bg-blue-500" },
  EN_VALIDATION: { label: "En révision", color: "bg-amber-100 text-amber-700", barColor: "bg-amber-500" },
  SCOREE: { label: "Scorée", color: "bg-purple-100 text-purple-700", barColor: "bg-purple-500" },
  APPROUVEE_INNOVATION: { label: "Approuvée Innovation", color: "bg-teal-100 text-teal-700", barColor: "bg-teal-500" },
  APPROUVEE_BU: { label: "Approuvée BU", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" },
  APPROUVEE_DG: { label: "Approuvée DG", color: "bg-emerald-100 text-emerald-700", barColor: "bg-emerald-500" },
  CLOTUREE: { label: "Clôturée", color: "bg-slate-100 text-slate-600", barColor: "bg-primary" },
  REJETEE: { label: "Rejetée", color: "bg-red-100 text-red-700", barColor: "bg-red-500" },
};

const statusFlow = ["SOUMISE", "EN_VALIDATION", "SCOREE", "APPROUVEE_INNOVATION", "APPROUVEE_BU", "APPROUVEE_DG", "CLOTUREE"];

function getStepIndex(status: string) {
  const idx = statusFlow.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function MesIdeesPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    ideasApi.getMine(0, 50).then((res) => {
      const page = res.data as { content: Idea[] };
      setIdeas(page.content || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleVote = async (id: string) => {
    try {
      await ideasApi.vote(id);
      load();
    } catch { /* ignore */ }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette idée ?")) return;
    setDeleting(id);
    try {
      await ideasApi.delete(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch { /* ignore */ } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === "ALL"
    ? ideas
    : filter === "APPROUVEE"
    ? ideas.filter((i) => ["APPROUVEE_INNOVATION", "APPROUVEE_BU", "APPROUVEE_DG"].includes(i.status))
    : ideas.filter((i) => i.status === filter);

  const counts = {
    ALL: ideas.length,
    SOUMISE: ideas.filter((i) => i.status === "SOUMISE").length,
    APPROUVEE: ideas.filter((i) => ["APPROUVEE_INNOVATION", "APPROUVEE_BU", "APPROUVEE_DG"].includes(i.status)).length,
    CLOTUREE: ideas.filter((i) => i.status === "CLOTUREE").length,
  };

  return (
    <div className="flex flex-1 overflow-y-auto">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <h1 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Mes Idées</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Gérez et suivez le cycle de vie de vos propositions d&apos;innovation.</p>
            </div>
            <Link href="/soumettre" className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 text-sm">
              <span className="material-symbols-outlined">add_circle</span>
              <span>Soumettre une idée</span>
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4 border-b border-primary/10">
            {[
              { key: "ALL", label: `Toutes (${counts.ALL})` },
              { key: "SOUMISE", label: `Soumises (${counts.SOUMISE})` },
              { key: "APPROUVEE", label: `Approuvées (${counts.APPROUVEE})` },
              { key: "CLOTUREE", label: `Clôturées (${counts.CLOTUREE})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`pb-3 px-2 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-slate-500 hover:text-primary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">lightbulb</span>
              <p className="text-sm text-slate-400">Aucune idée pour le moment.</p>
              <Link href="/soumettre" className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl">
                <span className="material-symbols-outlined text-sm">add</span>Soumettre une idée
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((idea) => {
                const stepIdx = getStepIndex(idea.status);
                const cfg = statusConfig[idea.status] || statusConfig.SOUMISE;
                const canDelete = idea.status !== "CLOTUREE";
                return (
                  <div key={idea.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-primary/30 hover:-translate-y-1 transition-all duration-300 group">
                    <div className="relative h-20 w-full bg-slate-200">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/40 to-primary/80"></div>
                      <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                        {cfg.label}
                      </div>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(idea.id)}
                          disabled={deleting === idea.id}
                          className="absolute top-3 left-3 size-7 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          title="Supprimer cette idée"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {deleting === idea.id ? "progress_activity" : "delete"}
                          </span>
                        </button>
                      )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">{idea.title}</h3>
                      <p className="text-xs text-slate-400 mb-3">{idea.category}</p>
                      <div className="mb-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Progression</p>
                        <div className="flex items-center w-full gap-1">
                          {statusFlow.slice(0, 3).map((s, i) => (
                            <div key={s} className="flex flex-col items-center flex-1">
                              <div className={`size-4 rounded-full flex items-center justify-center text-white text-[8px] ${
                                i <= stepIdx ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"
                              }`}>
                                {i < stepIdx ? <span className="material-symbols-outlined text-[8px]">check</span> : (i + 1)}
                              </div>
                              {i < 2 && <div className={`h-0.5 w-full mt-0.5 ${i < stepIdx ? "bg-primary" : "bg-slate-200 dark:bg-slate-700"}`}></div>}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto pt-3 border-t border-primary/5 flex items-center justify-between text-xs text-slate-400">
                        <span>{new Date(idea.createdAt).toLocaleDateString("fr-FR")}</span>
                        <div className="flex gap-3">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">chat</span>{idea.commentCount}
                          </span>
                          <button
                            onClick={() => handleVote(idea.id)}
                            className="flex items-center gap-1 text-primary font-bold hover:scale-110 transition-transform"
                          >
                            <span className="material-symbols-outlined text-sm">favorite</span>{idea.voteCount}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <Link href="/soumettre" className="bg-primary/5 dark:bg-primary/10 rounded-2xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center p-8 text-center group cursor-pointer hover:border-primary/50 hover:bg-primary/10 hover:-translate-y-1 transition-all duration-300">
                <div className="size-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-primary mb-3 shadow-sm group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-2xl">add_box</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Nouvelle proposition ?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Partagez votre prochaine innovation.</p>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
