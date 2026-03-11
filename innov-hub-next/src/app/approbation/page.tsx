"use client";

import { useEffect, useState } from "react";
import { ideas as ideasApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

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
  problemStatement?: string;
  proposedSolution?: string;
  expectedRoi?: string;
  estimatedCost?: number;
}

const columns = [
  { key: "SOUMISE", label: "Soumise" },
  { key: "EN_VALIDATION", label: "En Validation" },
  { key: "SCOREE", label: "Scorée" },
  { key: "APPROUVEE_INNOVATION", label: "Approuvée Innovation" },
  { key: "APPROUVEE_BU", label: "Approuvée BU" },
  { key: "APPROUVEE_DG", label: "Approuvée DG" },
  { key: "CLOTUREE", label: "Clôturée" },
];

const catColors: Record<string, string> = {
  "Technologie": "text-primary bg-primary/10",
  "Opérations": "text-amber-600 bg-amber-100",
  "RH": "text-cyan-600 bg-cyan-100",
  "Marketing": "text-rose-600 bg-rose-100",
  "RSE": "text-emerald-600 bg-emerald-100",
};

export default function ApprobationPage() {
  const { isRole } = useAuth();
  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [scoreForm, setScoreForm] = useState({ innovationLevel: 5, technicalFeasibility: 5, strategicAlignment: 5, roiPotential: 5, riskLevel: 5, comments: "" });
  const [showScore, setShowScore] = useState(false);

  const load = () => {
    setLoading(true);
    ideasApi.getAll(0, 100).then((res) => {
      const page = res.data as { content: Idea[] };
      setAllIdeas(page.content || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const loadDetail = async (id: string) => {
    try {
      const res = await ideasApi.getById(id);
      setSelectedIdea(res.data as Idea);
    } catch { /* ignore */ }
  };

  const doWorkflow = async (action: string, comment?: string) => {
    if (!selectedIdea) return;
    setActionLoading(true);
    try {
      await ideasApi.workflow(selectedIdea.id, action, comment);
      setSelectedIdea(null);
      load();
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  };

  const doScore = async () => {
    if (!selectedIdea) return;
    setActionLoading(true);
    try {
      await ideasApi.score(selectedIdea.id, scoreForm);
      setShowScore(false);
      setSelectedIdea(null);
      load();
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  };

  const grouped = columns.map((col) => ({
    ...col,
    items: allIdeas.filter((i) => i.status === col.key),
  }));

  return (
    <div className="p-4 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h1 className="text-lg font-extrabold tracking-tight">Tableau d&apos;approbation</h1>
        <div className="flex gap-2 text-[10px]">
          {isRole("PORTEUR_IDEE") && <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold">Porteur d&apos;idée</span>}
          {isRole("RESPONSABLE_INNOVATION") && <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary font-bold">Resp. Innovation</span>}
          {isRole("DIRECTEUR_BU") && <span className="px-2 py-1 rounded-lg bg-amber-100 text-amber-700 font-bold">Directeur BU</span>}
          {isRole("DIRECTEUR_GENERAL") && <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-bold">Directeur Général</span>}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 min-w-0">
          {grouped.map((col) => (
            <div key={col.key} className="flex-shrink-0 min-w-[220px] w-56 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 border border-slate-200 dark:border-slate-700">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                {col.label} <span className="text-[10px] font-normal text-slate-500">{col.items.length}</span>
              </h3>
              <div className="space-y-2">
                {col.items.map((idea) => (
                  <button
                    key={idea.id}
                    onClick={() => loadDetail(idea.id)}
                    className="w-full text-left bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${catColors[idea.category] || "text-slate-600 bg-slate-100"}`}>{idea.category}</span>
                      {idea.totalScore !== null && (
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 font-bold text-primary text-[9px]">{Number(idea.totalScore).toFixed(0)}</span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white mt-1 text-xs">{idea.title}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-slate-500">{idea.submittedByName}</span>
                      <span className="text-[9px] text-slate-500">{new Date(idea.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </button>
                ))}
                {col.items.length === 0 && (
                  <p className="text-[10px] text-slate-400 text-center py-4">Aucune idée</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail panel */}
      {selectedIdea && (
        <div className="fixed right-0 top-0 h-full w-[380px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-[60] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex-1 pr-2">{selectedIdea.title}</h3>
              <button onClick={() => { setSelectedIdea(null); setShowScore(false); }} className="size-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-slate-200 transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${catColors[selectedIdea.category] || "text-slate-600 bg-slate-100"}`}>{selectedIdea.category}</span>
              {selectedIdea.totalScore !== null && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-primary font-bold text-white text-[10px]">{Number(selectedIdea.totalScore).toFixed(0)}</span>
              )}
            </div>

            <div className="space-y-2 mb-4 text-xs text-slate-600 dark:text-slate-400">
              <p className="font-medium text-slate-500 text-[10px] uppercase">Soumis par</p>
              <p className="font-semibold text-slate-900 dark:text-white">{selectedIdea.submittedByName}</p>
            </div>

            {selectedIdea.problemStatement && (
              <div className="mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Problématique</p><p className="text-xs text-slate-600 dark:text-slate-400">{selectedIdea.problemStatement}</p></div>
            )}
            {selectedIdea.proposedSolution && (
              <div className="mb-3"><p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Solution</p><p className="text-xs text-slate-600 dark:text-slate-400">{selectedIdea.proposedSolution}</p></div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-4">
              {selectedIdea.estimatedCost != null && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">Budget</p>
                  <p className="font-bold text-sm">{Number(selectedIdea.estimatedCost).toLocaleString()} €</p>
                </div>
              )}
              {selectedIdea.expectedRoi && (
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-0.5">ROI estimé</p>
                  <p className="font-bold text-sm">{selectedIdea.expectedRoi}</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">favorite</span>{selectedIdea.voteCount}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">chat</span>{selectedIdea.commentCount}</span>
            </div>

            {showScore && isRole("RESPONSABLE_INNOVATION") && (
              <div className="mb-4 p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <h4 className="text-xs font-bold">Évaluation</h4>
                {[
                  { key: "innovationLevel", label: "Innovation" },
                  { key: "technicalFeasibility", label: "Faisabilité" },
                  { key: "strategicAlignment", label: "Alignement stratégique" },
                  { key: "roiPotential", label: "Potentiel ROI" },
                  { key: "riskLevel", label: "Risque" },
                ].map((field) => (
                  <div key={field.key} className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-600">{field.label}</span>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={scoreForm[field.key as keyof typeof scoreForm] as number}
                      onChange={(e) => setScoreForm((prev) => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                      className="w-24 accent-primary"
                    />
                    <span className="text-xs font-bold text-primary w-5 text-right">{scoreForm[field.key as keyof typeof scoreForm]}</span>
                  </div>
                ))}
                <textarea
                  value={scoreForm.comments}
                  onChange={(e) => setScoreForm((prev) => ({ ...prev, comments: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-xs mt-1"
                  placeholder="Commentaire..."
                  rows={2}
                />
                <button onClick={doScore} disabled={actionLoading} className="w-full py-2 rounded-lg bg-primary text-white font-bold text-xs disabled:opacity-50">
                  {actionLoading ? "..." : "Enregistrer le score"}
                </button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              {/* Responsable Innovation: score ideas that are SOUMISE or EN_VALIDATION */}
              {(selectedIdea.status === "SOUMISE" || selectedIdea.status === "EN_VALIDATION") && isRole("RESPONSABLE_INNOVATION") && (
                <button onClick={() => setShowScore(!showScore)} className="w-full py-2.5 rounded-xl bg-purple-500 text-white font-bold text-xs">
                  {showScore ? "Masquer évaluation" : "Scorer cette idée"}
                </button>
              )}
              {/* Responsable Innovation: validate scored ideas */}
              {selectedIdea.status === "SCOREE" && isRole("RESPONSABLE_INNOVATION") && (
                <button onClick={() => doWorkflow("VALIDATE")} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-teal-500 text-white font-bold text-xs disabled:opacity-50">Valider (Innovation)</button>
              )}
              {/* Directeur BU: approve validated ideas */}
              {selectedIdea.status === "APPROUVEE_INNOVATION" && isRole("DIRECTEUR_BU") && (
                <button onClick={() => doWorkflow("APPROVE_BU")} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50">Approuver (BU)</button>
              )}
              {/* Directeur Général: approve BU-approved ideas */}
              {selectedIdea.status === "APPROUVEE_BU" && isRole("DIRECTEUR_GENERAL") && (
                <button onClick={() => doWorkflow("APPROVE_DG")} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-primary text-white font-bold text-xs disabled:opacity-50">Approuver (DG)</button>
              )}
              {/* Directeur Général: close DG-approved ideas → creates project */}
              {selectedIdea.status === "APPROUVEE_DG" && isRole("DIRECTEUR_GENERAL") && (
                <button onClick={() => doWorkflow("CLOSE")} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-bold text-xs disabled:opacity-50">Clôturer (Créer projet)</button>
              )}
              {/* Any authorized role can reject (except porteur) */}
              {!["CLOTUREE", "REJETEE"].includes(selectedIdea.status) && isRole("RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL") && (
                <button onClick={() => doWorkflow("REJECT")} disabled={actionLoading} className="w-full py-2.5 rounded-xl bg-rose-500 text-white font-bold text-xs disabled:opacity-50">Rejeter</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
