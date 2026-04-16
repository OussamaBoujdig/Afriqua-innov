"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ideas as ideasApi, downloadFile, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Idea {
  id: string;
  reference: string;
  title: string;
  category: string;
  status: string;
  imageUrl: string | null;
  totalScore: number | null;
  scoreCount: number;
  requiredScoreCount: number;
  voteCount: number;
  commentCount: number;
  submittedByName: string;
  submittedById: string;
  scoringDeadline: string | null;
  submittedAt: string | null;
  createdAt: string;
}

interface IdeaDetail {
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
  problemStatement: string;
  proposedSolution: string;
  expectedRoi: string | null;
  estimatedCost: number | null;
  campaignId: string | null;
  campaignTitle: string | null;
  scoringDeadline: string | null;
  createdAt: string;
}

interface DocFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedByName: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string }> = {
  BROUILLON: { label: "Brouillon" },
  SOUMISE: { label: "Soumise" },
  EN_VALIDATION: { label: "En validation" },
  SCOREE: { label: "Scorée" },
  APPROUVEE_INNOVATION: { label: "Approuvée Innovation" },
  APPROUVEE_BU: { label: "Approuvée BU" },
  APPROUVEE_DG: { label: "Approuvée DG" },
  EN_INCUBATION: { label: "En incubation" },
  CLOTUREE: { label: "Clôturée" },
  REJETEE: { label: "Rejetée" },
};

function formatBytes(b: number) {
  return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB";
}

const ALLOWED_ROLES = ["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"];

export default function ToutesIdeesPage() {
  const { isRole, user, loading: authLoading } = useAuth();
  const isResponsable = isRole("RESPONSABLE_INNOVATION");
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user && !ALLOWED_ROLES.includes(user.role)) {
      router.replace("/mes-idees");
    }
  }, [authLoading, user, router]);

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score" | "votes">("date");

  const [selected, setSelected] = useState<IdeaDetail | null>(null);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const flash = (setter: (v: string | null) => void, msg: string) => { setter(msg); setTimeout(() => setter(null), 4000); };

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const res = await ideasApi.getAll(0, 200);
      const page = res.data as { content: Idea[] };
      setIdeas(page.content || []);
    } catch { flash(setErrorMsg, "Erreur lors du chargement des idées"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authLoading && user && ALLOWED_ROLES.includes(user.role)) {
      loadIdeas();
    }
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetail = async (id: string) => {
    setLoadingDetail(true);
    setDocs([]);
      try {
        const res = await ideasApi.getById(id);
        setSelected(res.data as IdeaDetail);
        try {
          const docRes = await ideasApi.getDocuments(id);
          setDocs((docRes.data as DocFile[]) || []);
        } catch { /* ignore */ }
      } catch { flash(setErrorMsg, "Erreur lors du chargement du détail"); }
    finally { setLoadingDetail(false); }
  };

  const handleDelete = async () => {
    if (!selected || !confirm("Voulez-vous vraiment supprimer cette idée ?")) return;
    setDeleting(true);
    try {
      await ideasApi.delete(selected.id);
      flash(setSuccessMsg, "Idée supprimée !");
      setSelected(null);
      await loadIdeas();
    } catch (e) { flash(setErrorMsg, e instanceof Error ? e.message : "Erreur lors de la suppression"); }
    finally { setDeleting(false); }
  };

  const statuses = Object.keys(statusConfig);
  const filtered = ideas
    .filter((i) => filter === "ALL" || i.status === filter)
    .filter((i) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return i.title.toLowerCase().includes(q) || i.category.toLowerCase().includes(q) || i.submittedByName.toLowerCase().includes(q) || (i.reference && i.reference.toLowerCase().includes(q));
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.totalScore ?? 0) - (a.totalScore ?? 0);
      if (sortBy === "votes") return b.voteCount - a.voteCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = ideas.filter((i) => i.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const Toast = () => (
    <>
      {errorMsg && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[100] max-w-sm rounded-md border border-red-200 bg-white p-3 text-[13px] text-red-700 dark:border-red-900/50 dark:bg-[#111113] dark:text-red-300 flex items-start gap-2"
        >
          <span className="material-symbols-outlined shrink-0 text-base text-red-500">error</span>
          <span className="min-w-0 flex-1 leading-snug">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="btn-ghost shrink-0 !p-1 text-neutral-500" aria-label="Fermer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="fixed top-4 right-4 z-[100] max-w-sm rounded-md border border-emerald-200 bg-white p-3 text-[13px] text-emerald-800 dark:border-emerald-900/50 dark:bg-[#111113] dark:text-emerald-300 flex items-start gap-2"
        >
          <span className="material-symbols-outlined shrink-0 text-base text-emerald-600">check_circle</span>
          <span className="min-w-0 flex-1 leading-snug">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="btn-ghost shrink-0 !p-1 text-neutral-500" aria-label="Fermer">
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </>
  );

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <Toast />
      <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
    </div>
  );

  if (selected) return (
    <div className="h-full overflow-y-auto">
      <Toast />
      <div className="page-enter mx-auto max-w-2xl px-4 py-5 lg:px-6 animate-fade-in-up">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="btn-ghost mb-4"
        >
          <span className="material-symbols-outlined text-base text-neutral-500">arrow_back</span>
          Retour à la liste
        </button>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <article className="card border-neutral-200 p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700 sm:p-4">
              <header className="border-b border-neutral-200 pb-4 dark:border-neutral-800">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                        {statusConfig[selected.status]?.label || selected.status}
                      </span>
                      <span className="badge border border-neutral-200 bg-neutral-50 text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                        {selected.category}
                      </span>
                    </div>
                    <h1 className="text-lg font-semibold leading-snug text-neutral-900 dark:text-white">{selected.title}</h1>
                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400">
                      Par {selected.submittedByName} · {new Date(selected.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {isResponsable && selected.status !== "CLOTUREE" && (
                      <button type="button" onClick={handleDelete} disabled={deleting} className="btn-danger">
                        <span className={`material-symbols-outlined text-base ${deleting ? "animate-spin" : ""}`}>{deleting ? "progress_activity" : "delete"}</span>
                        Supprimer
                      </button>
                    )}
                    <Link href="/approbation" className="btn-primary">
                      <span className="material-symbols-outlined text-base">approval_delegation</span>
                      Approbation
                    </Link>
                  </div>
                </div>
              </header>

              <section className="border-b border-neutral-200 py-4 dark:border-neutral-800" aria-label="Indicateurs">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">{selected.totalScore != null ? Number(selected.totalScore).toFixed(1) : "—"}</p>
                    <p className="text-[11px] font-medium text-neutral-500">Score</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">{selected.scoreCount}/{selected.requiredScoreCount}</p>
                    <p className="text-[11px] font-medium text-neutral-500">Évaluations</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">{selected.voteCount}</p>
                    <p className="text-[11px] font-medium text-neutral-500">Votes</p>
                  </div>
                  <div className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2 text-center dark:border-neutral-800 dark:bg-neutral-950">
                    <p className="text-[13px] font-semibold tabular-nums text-neutral-900 dark:text-white">{selected.commentCount}</p>
                    <p className="text-[11px] font-medium text-neutral-500">Commentaires</p>
                  </div>
                </div>
              </section>

              <div className="space-y-4 pt-4">
                <section>
                  <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Problématique</h2>
                  <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{selected.problemStatement}</p>
                </section>
                <section>
                  <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Solution proposée</h2>
                  <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{selected.proposedSolution}</p>
                </section>
                {selected.expectedRoi && (
                  <section>
                    <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">ROI estimé</h2>
                    <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{selected.expectedRoi}</p>
                  </section>
                )}
                {selected.estimatedCost != null && (
                  <section>
                    <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Coût estimé</h2>
                    <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{Number(selected.estimatedCost).toLocaleString()} €</p>
                  </section>
                )}
                {selected.campaignTitle && (
                  <section>
                    <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Campagne</h2>
                    <Link href={`/campagnes/${selected.campaignId}`} className="text-[13px] font-medium text-[#0066B3] hover:underline dark:text-blue-400">
                      {selected.campaignTitle}
                    </Link>
                  </section>
                )}
                {selected.scoringDeadline && (
                  <section>
                    <h2 className="mb-1 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Délai de scoring</h2>
                    <p className="text-[13px] leading-relaxed text-neutral-700 dark:text-neutral-300">{new Date(selected.scoringDeadline).toLocaleDateString("fr-FR")}</p>
                  </section>
                )}
              </div>
            </article>

            {docs.length > 0 && (
              <section className="card border-neutral-200 p-4 transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700">
                <h2 className="mb-3 text-[14px] font-semibold text-neutral-900 dark:text-white">
                  Pièces jointes <span className="text-[13px] font-normal text-neutral-500">({docs.length})</span>
                </h2>
                <ul className="flex flex-col gap-2">
                  {docs.map((d) => (
                    <li key={d.id}>
                      <button
                        type="button"
                        onClick={() => downloadFile(d.id, d.fileName)}
                        className="flex w-full items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-600"
                      >
                        <span className="material-symbols-outlined shrink-0 text-base text-neutral-400">description</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-medium text-neutral-900 dark:text-white">{d.fileName}</span>
                          <span className="mt-0.5 block text-[12px] text-neutral-500 dark:text-neutral-400">
                            {formatBytes(d.fileSizeBytes)} · {d.uploadedByName} · {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                        </span>
                        <span className="material-symbols-outlined shrink-0 text-base text-neutral-400" aria-hidden>
                          download
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto">
      <Toast />
      <div className="page-enter mx-auto w-full max-w-[1400px] px-4 py-5 lg:px-6">
        <div className="mb-4 flex flex-col gap-2 border-b border-neutral-200 pb-5 dark:border-neutral-800 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">Toutes les idées</h1>
            <p className="mt-1 text-[13px] text-neutral-500 dark:text-neutral-400">Vue d&apos;ensemble de toutes les idées soumises</p>
          </div>
          <p className="text-[13px] font-medium tabular-nums text-neutral-500 dark:text-neutral-400">
            {ideas.length} idée{ideas.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="filter-tabs overflow-x-auto">
            <button type="button" onClick={() => setFilter("ALL")}
              className={`filter-tab${filter === "ALL" ? " active" : ""}`}>
              Toutes <span className="tab-count">{ideas.length}</span>
            </button>
            {statuses.map((s) => {
              const cfg = statusConfig[s];
              const count = statusCounts[s] || 0;
              if (count === 0) return null;
              return (
                <button type="button" key={s} onClick={() => setFilter(s)} title={cfg.label}
                  className={`filter-tab${filter === s ? " active" : ""}`}>
                  <span className="max-w-[120px] truncate">{cfg.label}</span>
                  <span className="tab-count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative min-w-0 flex-1">
            <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 z-[1] -translate-y-1/2 text-base text-neutral-400">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par titre, catégorie, auteur, référence…"
              aria-label="Rechercher des idées"
              className="search-input w-full"
            />
          </div>
          <div className="filter-tabs shrink-0" role="group" aria-label="Trier">
            {([
              { key: "date" as const, label: "Date" },
              { key: "score" as const, label: "Score" },
              { key: "votes" as const, label: "Votes" },
            ]).map((s) => (
              <button type="button" key={s.key} onClick={() => setSortBy(s.key)}
                className={`filter-tab${sortBy === s.key ? " active" : ""}`}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="animate-fade-in-up card flex flex-col items-center justify-center border-dashed border-neutral-300 py-16 dark:border-neutral-700">
            <p className="text-[13px] text-neutral-500 dark:text-neutral-400">Aucune idée trouvée.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((idea) => {
              const cfg = statusConfig[idea.status] || statusConfig.SOUMISE;
              return (
                <button
                  type="button"
                  key={idea.id}
                  onClick={() => openDetail(idea.id)}
                  className="card group flex flex-col overflow-hidden text-left transition-all duration-200 hover:border-[#0066B3]/40 hover:shadow-md hover:-translate-y-0.5"
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-900">
                    {resolveImageUrl(idea.imageUrl) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImageUrl(idea.imageUrl)!} alt={idea.title} className="h-full w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-neutral-800 dark:to-neutral-900">
                        <span className="material-symbols-outlined text-[32px] text-[#0066B3]/25">lightbulb</span>
                      </div>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 flex flex-wrap items-end justify-between gap-2">
                      <span className="badge max-w-[55%] truncate border border-neutral-200/80 bg-white/95 text-neutral-600 dark:border-neutral-700 dark:bg-[#111113]/95 dark:text-neutral-400">
                        {idea.category}
                      </span>
                      <span className="badge border border-neutral-200/80 bg-white/95 text-neutral-600 dark:border-neutral-700 dark:bg-[#111113]/95 dark:text-neutral-400">
                        {cfg.label}
                      </span>
                    </div>
                    {idea.reference && (
                      <span className="absolute right-2 top-2 rounded px-1.5 py-0.5 font-mono text-[10px] text-neutral-600 bg-white/90 dark:bg-[#111113]/90 dark:text-neutral-400">
                        {idea.reference}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 line-clamp-2 text-[14px] font-semibold leading-snug text-neutral-900 dark:text-white">{idea.title}</h3>
                    <p className="mb-3 text-[13px] text-neutral-500 dark:text-neutral-400">Par {idea.submittedByName}</p>
                    <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-neutral-200 pt-3 text-[12px] text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                      <span className="tabular-nums">
                        Score {idea.totalScore != null ? Number(idea.totalScore).toFixed(1) : "—"}
                      </span>
                      <span className="tabular-nums">
                        Éval. {idea.scoreCount}/{idea.requiredScoreCount}
                      </span>
                      <span className="tabular-nums">
                        Votes {idea.voteCount}
                      </span>
                      <span className="ml-auto shrink-0 tabular-nums text-neutral-400 dark:text-neutral-500">{new Date(idea.createdAt).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
