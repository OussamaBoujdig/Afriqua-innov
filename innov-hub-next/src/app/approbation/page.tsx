"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ideas as ideasApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface IdeaScore {
  id: string;
  scoredById: string;
  scoredByName: string;
  innovationLevel: number;
  technicalFeasibility: number;
  strategicAlignment: number;
  roiPotential: number;
  riskLevel: number;
  totalScore: number;
  comments: string;
  createdAt: string;
}

interface Idea {
  id: string;
  title: string;
  category: string;
  status: string;
  totalScore: number | null;
  scoreCount: number;
  requiredScoreCount: number;
  voteCount: number;
  commentCount: number;
  submittedByName: string;
  createdAt: string;
  problemStatement?: string;
  proposedSolution?: string;
  expectedRoi?: string;
  estimatedCost?: number;
  scores?: IdeaScore[];
  scoredByRoles?: string[];
  scoringDeadline?: string;
}

const columns = [
  { key: "SOUMISE", label: "Soumise" },
  { key: "EN_VALIDATION", label: "En Validation" },
  { key: "SCOREE", label: "Scorée" },
  { key: "APPROUVEE_INNOVATION", label: "Approuvée Innovation" },
  { key: "APPROUVEE_BU", label: "Approuvée BU" },
  { key: "APPROUVEE_DG", label: "Approuvée DG" },
  { key: "EN_INCUBATION", label: "En Incubation" },
  { key: "CLOTUREE", label: "Clôturée" },
  { key: "REJETEE", label: "Rejetée" },
];

const SCORING_ROLES = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"] as const;
const ROLE_LABELS: Record<string, string> = {
  RESPONSABLE_INNOVATION: "Resp. Innovation",
  DIRECTEUR_BU: "Directeur BU",
  DIRECTEUR_GENERAL: "Directeur Général",
};

export default function ApprobationPage() {
  const { isRole, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && !["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"].includes(user.role)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);

  const [allIdeas, setAllIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [scoreForm, setScoreForm] = useState({ innovationLevel: 5, technicalFeasibility: 5, strategicAlignment: 5, roiPotential: 5, riskLevel: 5, comments: "" });
  const [showScore, setShowScore] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flash = (setter: (v: string | null) => void, msg: string) => { setter(msg); setTimeout(() => setter(null), 5000); };

  const load = () => {
    setLoading(true);
    ideasApi.getAll(0, 100).then((res) => {
      const page = res.data as { content: Idea[] };
      setAllIdeas(page.content || []);
    }).catch((err) => {
      flash(setErrorMsg, err?.message || "Impossible de charger les idées");
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!authLoading && user && ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"].includes(user.role)) {
      load();
    }
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDetail = async (id: string) => {
    try {
      const res = await ideasApi.getById(id);
      setSelectedIdea(res.data as Idea);
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Impossible de charger le détail");
    }
  };

  const doWorkflow = async (action: string, comment?: string) => {
    if (!selectedIdea) return;
    setActionLoading(true);
    try {
      await ideasApi.workflow(selectedIdea.id, action, comment);
      flash(setSuccessMsg, "Action effectuée avec succès");
      setSelectedIdea(null);
      load();
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur lors de l'action");
    } finally { setActionLoading(false); }
  };

  const doScore = async () => {
    if (!selectedIdea) return;
    setActionLoading(true);
    try {
      await ideasApi.score(selectedIdea.id, scoreForm);
      flash(setSuccessMsg, "Score enregistré avec succès !");
      setShowScore(false);
      setScoreForm({ innovationLevel: 5, technicalFeasibility: 5, strategicAlignment: 5, roiPotential: 5, riskLevel: 5, comments: "" });
      await loadDetail(selectedIdea.id);
      load();
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur lors du scoring");
    } finally { setActionLoading(false); }
  };

  const saveDeadline = async () => {
    if (!selectedIdea || !deadlineInput) return;
    setActionLoading(true);
    try {
      const isoDeadline = new Date(deadlineInput).toISOString();
      await ideasApi.setScoringDeadline(selectedIdea.id, isoDeadline);
      flash(setSuccessMsg, "Délai de scoring défini !");
      setShowDeadline(false);
      await loadDetail(selectedIdea.id);
      load();
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur");
    } finally { setActionLoading(false); }
  };

  const grouped = columns.map((col) => ({ ...col, items: allIdeas.filter((i) => i.status === col.key) }));

  const canScore = (idea: Idea) => {
    if (idea.status !== "SOUMISE" && idea.status !== "EN_VALIDATION") return false;
    if (!user) return false;
    const userRole = user.role;
    if (!SCORING_ROLES.includes(userRole as typeof SCORING_ROLES[number])) return false;
    if (idea.scoredByRoles?.includes(userRole)) return false;
    return true;
  };

  const myRoleAlreadyScored = (idea: Idea) => {
    if (!user) return false;
    return idea.scoredByRoles?.includes(user.role) ?? false;
  };

  const missingRoles = (idea: Idea) => {
    const scored = idea.scoredByRoles || [];
    return SCORING_ROLES.filter((r) => !scored.includes(r));
  };

  return (
    <div className="relative p-4 lg:p-6">
      {errorMsg && (
        <div
          role="alert"
          className="animate-fade-in-up card shadow-lg fixed top-4 right-4 z-[100] flex max-w-sm items-start gap-2 px-3 py-2.5 dark:border-neutral-800 dark:bg-[#111113]"
        >
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-red-600 dark:text-red-400">error</span>
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-900 dark:text-white">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Fermer" className="btn-ghost shrink-0 p-1.5">
            <span className="material-symbols-outlined text-base text-neutral-500">close</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="animate-fade-in-up card shadow-lg fixed top-4 right-4 z-[100] flex max-w-sm items-start gap-2 px-3 py-2.5 dark:border-neutral-800 dark:bg-[#111113]"
        >
          <span className="material-symbols-outlined mt-0.5 shrink-0 text-base text-neutral-600 dark:text-neutral-400">check_circle</span>
          <span className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-900 dark:text-white">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} aria-label="Fermer" className="btn-ghost shrink-0 p-1.5">
            <span className="material-symbols-outlined text-base text-neutral-500">close</span>
          </button>
        </div>
      )}

      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">Tableau d&apos;approbation</h1>
        <div className="flex flex-wrap gap-2">
          {isRole("RESPONSABLE_INNOVATION") && (
            <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Resp. Innovation</span>
          )}
          {isRole("DIRECTEUR_BU") && (
            <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Directeur BU</span>
          )}
          {isRole("DIRECTEUR_GENERAL") && (
            <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Directeur Général</span>
          )}
          {isRole("PORTEUR_IDEE") && (
            <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">Porteur d&apos;idée</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <span className="material-symbols-outlined animate-spin text-xl text-neutral-400">progress_activity</span>
        </div>
      ) : (
        <div className="flex min-w-0 gap-3 overflow-x-auto pb-4">
          {grouped.map((col) => (
            <div key={col.key} className="card flex w-56 min-w-[220px] flex-shrink-0 flex-col p-3 dark:border-neutral-800 dark:bg-[#111113]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">{col.label}</h3>
                <span className="badge bg-neutral-100 tabular-nums text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {col.items.length}
                </span>
              </div>
              <div className="space-y-2">
                {col.items.map((idea) => (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() => loadDetail(idea.id)}
                    className="card w-full p-3 text-left transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {idea.category}
                      </span>
                      {idea.totalScore !== null && idea.scoreCount >= idea.requiredScoreCount && (
                        <span className="badge bg-neutral-100 tabular-nums font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {Number(idea.totalScore).toFixed(0)}
                        </span>
                      )}
                    </div>
                    <p className="text-[13px] font-medium leading-snug text-neutral-900 dark:text-white">{idea.title}</p>
                    {(idea.status === "SOUMISE" || idea.status === "EN_VALIDATION") && idea.requiredScoreCount > 0 && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                            <div
                              className="h-full rounded-full bg-[#0066B3] dark:bg-blue-400 transition-all duration-300"
                              style={{ width: `${(idea.scoreCount / idea.requiredScoreCount) * 100}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[12px] font-medium tabular-nums text-[#0066B3] dark:text-blue-400">
                            {idea.scoreCount}/{idea.requiredScoreCount}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-200 pt-2 dark:border-neutral-800">
                      <span className="truncate text-[12px] text-neutral-500 dark:text-neutral-400">{idea.submittedByName}</span>
                      <span className="shrink-0 text-[12px] tabular-nums text-neutral-400 dark:text-neutral-500">
                        {new Date(idea.createdAt).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                  </button>
                ))}
                {col.items.length === 0 && (
                  <p className="py-6 text-center text-[13px] text-neutral-400 dark:text-neutral-500">Aucune idée</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIdea && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/30" aria-hidden />
          <div className="animate-slide-in-right fixed right-0 top-0 z-[60] h-full w-full overflow-y-auto border-l border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#111113] sm:w-[420px]">
            <div className="flex flex-col gap-0 p-4 sm:p-5">
              <div className="mb-4 flex items-start justify-between gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <h3 className="flex-1 pr-2 text-[14px] font-semibold leading-snug text-neutral-900 dark:text-white">{selectedIdea.title}</h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedIdea(null);
                    setShowScore(false);
                  }}
                  aria-label="Fermer"
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:border-neutral-700 dark:bg-[#111113] dark:hover:bg-neutral-800 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                  {selectedIdea.category}
                </span>
                {selectedIdea.totalScore !== null && selectedIdea.scoreCount >= selectedIdea.requiredScoreCount && (
                  <span className="badge bg-neutral-100 font-medium tabular-nums text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                    {Number(selectedIdea.totalScore).toFixed(1)}
                  </span>
                )}
              </div>

              {(selectedIdea.status === "SOUMISE" || selectedIdea.status === "EN_VALIDATION" || selectedIdea.status === "SCOREE") && (
                <section className="card mb-4 p-3 dark:border-neutral-800 dark:bg-[#111113]">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[14px] font-medium text-neutral-900 dark:text-white">Évaluations requises</span>
                    <span className="badge tabular-nums bg-blue-50 text-[#0066B3] dark:bg-blue-950/40 dark:text-blue-400">
                      {selectedIdea.scoreCount}/{selectedIdea.requiredScoreCount}
                    </span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-[#0066B3] dark:bg-blue-400 transition-all duration-300"
                      style={{ width: `${Math.min((selectedIdea.scoreCount / selectedIdea.requiredScoreCount) * 100, 100)}%` }}
                    />
                  </div>

                  <div className="space-y-2">
                    {SCORING_ROLES.map((role) => {
                      const scored = selectedIdea.scoredByRoles?.includes(role);
                      const matchingScore = selectedIdea.scores?.find((_, i) => selectedIdea.scoredByRoles?.[i] === role);
                      return (
                        <div
                          key={role}
                          className={`flex items-center justify-between gap-2 rounded-md border px-2 py-2 text-[13px] ${scored ? "border-blue-100 bg-blue-50/60 dark:border-blue-900/40 dark:bg-blue-950/20" : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#111113]"}`}
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <span className={`material-symbols-outlined shrink-0 text-base ${scored ? "text-[#0066B3] dark:text-blue-400" : "text-neutral-300 dark:text-neutral-600"}`}>
                              {scored ? "check_circle" : "radio_button_unchecked"}
                            </span>
                            <span className={`truncate font-medium ${scored ? "text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                              {ROLE_LABELS[role]}
                            </span>
                          </div>
                          {scored && matchingScore ? (
                            <span className="badge shrink-0 bg-blue-50 font-medium tabular-nums text-[#0066B3] dark:bg-blue-950/40 dark:text-blue-400">
                              {Number(matchingScore.totalScore).toFixed(1)}/10
                            </span>
                          ) : (
                            <span className="shrink-0 text-[12px] italic text-neutral-400 dark:text-neutral-500">En attente</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {selectedIdea.scoreCount >= selectedIdea.requiredScoreCount && (
                    <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-[13px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/30 dark:text-neutral-300">
                      <span className="material-symbols-outlined mr-1 align-middle text-base text-neutral-500">verified</span>
                      Tous les scores sont enregistrés
                    </div>
                  )}
                </section>
              )}

              {(selectedIdea.status === "SOUMISE" || selectedIdea.status === "EN_VALIDATION") && (
                <section className="card mb-4 p-3 dark:border-neutral-800 dark:bg-[#111113]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-[14px] font-medium text-neutral-900 dark:text-white">Délai de scoring</span>
                    {selectedIdea.scoringDeadline && (() => {
                      const remaining = new Date(selectedIdea.scoringDeadline).getTime() - Date.now();
                      const expired = remaining <= 0;
                      const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                      return (
                        <span
                          className={`badge ${expired ? "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200" : days <= 2 ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"}`}
                        >
                          {expired ? "Expiré" : `${days}j restant${days > 1 ? "s" : ""}`}
                        </span>
                      );
                    })()}
                  </div>
                  {selectedIdea.scoringDeadline ? (
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-white">
                      {new Date(selectedIdea.scoringDeadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  ) : (
                    <p className="text-[13px] text-neutral-400 dark:text-neutral-500">Aucun délai défini</p>
                  )}
                  {isRole("RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL") && (
                    <>
                      {!showDeadline ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowDeadline(true);
                            setDeadlineInput(selectedIdea.scoringDeadline ? new Date(selectedIdea.scoringDeadline).toISOString().slice(0, 16) : "");
                          }}
                          className="btn-ghost mt-2 px-0 text-[13px] font-medium text-neutral-700 dark:text-neutral-300"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                          {selectedIdea.scoringDeadline ? "Modifier" : "Définir un délai"}
                        </button>
                      ) : (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <input
                            type="datetime-local"
                            value={deadlineInput}
                            onChange={(e) => setDeadlineInput(e.target.value)}
                            className="min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 py-2 text-[13px] text-neutral-900 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-[#111113] dark:text-white dark:focus:border-neutral-600"
                          />
                          <button type="button" onClick={saveDeadline} disabled={actionLoading} className="btn-primary shrink-0">
                            OK
                          </button>
                          <button type="button" onClick={() => setShowDeadline(false)} className="btn-ghost size-8 shrink-0 p-0" aria-label="Annuler">
                            <span className="material-symbols-outlined text-base text-neutral-500">close</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </section>
              )}

              <section className="mb-4 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Soumis par</p>
                <p className="text-[13px] font-medium text-neutral-900 dark:text-white">{selectedIdea.submittedByName}</p>
              </section>

              {selectedIdea.problemStatement && (
                <section className="mb-4">
                  <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Problématique</p>
                  <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{selectedIdea.problemStatement}</p>
                </section>
              )}
              {selectedIdea.proposedSolution && (
                <section className="mb-4">
                  <p className="mb-1 text-[12px] font-medium uppercase tracking-wide text-neutral-400 dark:text-neutral-500">Solution</p>
                  <p className="text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">{selectedIdea.proposedSolution}</p>
                </section>
              )}

              <div className="mb-4 grid grid-cols-2 gap-2">
                {selectedIdea.estimatedCost != null && (
                  <div className="card p-2.5 dark:border-neutral-800 dark:bg-[#111113]">
                    <p className="mb-0.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">Budget</p>
                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-white">{Number(selectedIdea.estimatedCost).toLocaleString()} €</p>
                  </div>
                )}
                {selectedIdea.expectedRoi && (
                  <div className="card p-2.5 dark:border-neutral-800 dark:bg-[#111113]">
                    <p className="mb-0.5 text-[12px] font-medium text-neutral-500 dark:text-neutral-400">ROI estimé</p>
                    <p className="text-[14px] font-semibold text-neutral-900 dark:text-white">{selectedIdea.expectedRoi}</p>
                  </div>
                )}
              </div>

              <div className="mb-4 flex items-center gap-4 border-b border-neutral-200 pb-4 text-[13px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">favorite</span>
                  {selectedIdea.voteCount}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">chat</span>
                  {selectedIdea.commentCount}
                </span>
              </div>

              {showScore && canScore(selectedIdea) && (
                <div className="card mb-4 space-y-3 p-3 dark:border-neutral-800 dark:bg-[#111113]">
                  <h4 className="text-[14px] font-medium text-neutral-900 dark:text-white">
                    Évaluation en tant que {ROLE_LABELS[user?.role || ""] || user?.role}
                  </h4>
                  {[
                    { key: "innovationLevel", label: "Innovation" },
                    { key: "technicalFeasibility", label: "Faisabilité technique" },
                    { key: "strategicAlignment", label: "Alignement stratégique" },
                    { key: "roiPotential", label: "Potentiel ROI" },
                    { key: "riskLevel", label: "Niveau de risque" },
                  ].map((field) => (
                    <div key={field.key} className="rounded-md border border-neutral-200 bg-white px-2 py-2 dark:border-neutral-800 dark:bg-[#0c0c0e]">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">{field.label}</span>
                        <span className="badge bg-neutral-100 font-medium tabular-nums text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                          {scoreForm[field.key as keyof typeof scoreForm]}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={scoreForm[field.key as keyof typeof scoreForm] as number}
                        onChange={(e) => setScoreForm((prev) => ({ ...prev, [field.key]: parseInt(e.target.value) }))}
                        className="h-2 w-full cursor-pointer accent-[#0066B3] dark:accent-blue-400"
                      />
                    </div>
                  ))}
                  <textarea
                    value={scoreForm.comments}
                    onChange={(e) => setScoreForm((prev) => ({ ...prev, comments: e.target.value }))}
                    className="w-full rounded-md border border-neutral-200 bg-white px-2.5 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:border-neutral-800 dark:bg-[#111113] dark:text-white dark:placeholder:text-neutral-500 dark:focus:border-neutral-600"
                    placeholder="Commentaire (optionnel)..."
                    rows={2}
                  />
                  <button type="button" onClick={doScore} disabled={actionLoading} className="btn-primary w-full justify-center py-2">
                    {actionLoading ? "Enregistrement..." : "Enregistrer le score"}
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                {canScore(selectedIdea) && (
                  <button type="button" onClick={() => setShowScore(!showScore)} className="btn-primary w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">rate_review</span>
                    {showScore ? "Masquer évaluation" : "Scorer cette idée"}
                  </button>
                )}

                {(selectedIdea.status === "SOUMISE" || selectedIdea.status === "EN_VALIDATION") && myRoleAlreadyScored(selectedIdea) && (
                  <div className="card w-full py-3 text-center text-[13px] font-medium text-neutral-700 dark:border-neutral-800 dark:bg-[#111113] dark:text-neutral-300">
                    <span className="material-symbols-outlined mr-1 align-middle text-base text-neutral-500">check_circle</span>
                    Vous avez déjà scoré cette idée
                    {missingRoles(selectedIdea).length > 0 && (
                      <p className="mt-1 text-[12px] font-normal text-neutral-500 dark:text-neutral-400">
                        En attente : {missingRoles(selectedIdea).map((r) => ROLE_LABELS[r]).join(", ")}
                      </p>
                    )}
                  </div>
                )}

                {selectedIdea.status === "SCOREE" && isRole("RESPONSABLE_INNOVATION") && (
                  <button type="button" onClick={() => doWorkflow("VALIDATE")} disabled={actionLoading} className="btn-primary w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">verified</span>
                    Valider (Innovation)
                  </button>
                )}

                {selectedIdea.status === "APPROUVEE_INNOVATION" && isRole("DIRECTEUR_BU") && (
                  <button type="button" onClick={() => doWorkflow("APPROVE_BU")} disabled={actionLoading} className="btn-primary w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">thumb_up</span>
                    Approuver (BU)
                  </button>
                )}

                {selectedIdea.status === "APPROUVEE_BU" && isRole("DIRECTEUR_GENERAL") && (
                  <button type="button" onClick={() => doWorkflow("APPROVE_DG")} disabled={actionLoading} className="btn-primary w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">thumb_up</span>
                    Approuver (DG)
                  </button>
                )}

                {selectedIdea.status === "APPROUVEE_DG" && isRole("DIRECTEUR_GENERAL") && (
                  <button type="button" onClick={() => doWorkflow("CLOSE")} disabled={actionLoading} className="btn-primary w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">rocket_launch</span>
                    Clôturer (Créer projet)
                  </button>
                )}

                {!["CLOTUREE", "REJETEE", "SCOREE"].includes(selectedIdea.status) && isRole("RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL") && (
                  <button type="button" onClick={() => doWorkflow("REJECT")} disabled={actionLoading} className="btn-danger w-full justify-center py-2">
                    <span className="material-symbols-outlined text-base">block</span>
                    Rejeter
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
