"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ideas as ideasApi, resolveImageUrl } from "@/lib/api";
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
  imageUrl: string | null;
  createdAt: string;
  problemStatement?: string;
  proposedSolution?: string;
  expectedRoi?: string;
  estimatedCost?: number;
  campaignId?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  BROUILLON:            { label: "Brouillon",    color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
  SOUMISE:              { label: "Soumise",      color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
  EN_VALIDATION:        { label: "En révision",  color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  SCOREE:               { label: "Scorée",       color: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" },
  APPROUVEE_INNOVATION: { label: "Approuvée",    color: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400" },
  APPROUVEE_BU:         { label: "Approuvée BU", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  APPROUVEE_DG:         { label: "Approuvée DG", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  CLOTUREE:             { label: "Clôturée",     color: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
  REJETEE:              { label: "Rejetée",      color: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
};

function IdeaCardSkeleton() {
  return (
    <div className="card flex flex-col overflow-hidden">
      <div className="skeleton aspect-[16/9] w-full" style={{ borderRadius: 0 }} />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-16 rounded-full" />
          <div className="skeleton h-5 w-20 rounded-full" />
        </div>
        <div className="skeleton h-4 w-4/5" />
        <div className="flex justify-between pt-2 border-t border-neutral-100">
          <div className="skeleton h-3 w-20" />
          <div className="skeleton h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

interface IdeaCardProps {
  idea: Idea;
  canDeleteIdea: boolean;
  deleting: string | null;
  votingId: string | null;
  justVoted: string | null;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onEdit: (idea: Idea) => void;
}

function IdeaCard({ idea, canDeleteIdea, deleting, votingId, justVoted, onDelete, onVote, onEdit }: IdeaCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const cfg = statusConfig[idea.status] || statusConfig.SOUMISE;
  const resolvedImg = resolveImageUrl(idea.imageUrl);
  const isDraft = idea.status === "BROUILLON";

  return (
    <div className="card group flex flex-col overflow-hidden hover:border-[#0066B3]/40 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
        {resolvedImg ? (
          <>
            {!imgLoaded && <div className="skeleton absolute inset-0" style={{ borderRadius: 0 }} />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImg}
              alt={idea.title}
              className={`absolute inset-0 h-full w-full object-cover group-hover:scale-[1.02] transition-all duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100 dark:from-neutral-800 dark:to-neutral-900">
            <span className="material-symbols-outlined text-[32px] text-[#0066B3]/25">lightbulb</span>
          </div>
        )}
        {/* Delete button overlay */}
        {canDeleteIdea && (
          <button
            onClick={() => onDelete(idea.id)}
            disabled={deleting === idea.id}
            className="absolute top-2 right-2 size-7 rounded-md bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center text-neutral-400 hover:text-red-600 hover:bg-white transition-all duration-150 opacity-0 group-hover:opacity-100 shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">
              {deleting === idea.id ? "progress_activity" : "delete"}
            </span>
          </button>
        )}
        {isDraft && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[12px]">edit_note</span>
            Brouillon
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`badge ${cfg.color}`}>{cfg.label}</span>
          {idea.category && (
            <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{idea.category}</span>
          )}
          {idea.totalScore != null && (
            <span className="ml-auto badge bg-blue-50 text-[#0066B3] font-semibold tabular-nums">
              {Number(idea.totalScore).toFixed(0)} pts
            </span>
          )}
        </div>

        <h3 className="text-[14px] font-semibold text-neutral-900 dark:text-white mb-auto group-hover:text-[#0066B3] transition-colors duration-150 leading-snug">
          {idea.title}
        </h3>

        {/* Draft action */}
        {isDraft && (
          <button
            type="button"
            onClick={() => onEdit(idea)}
            className="mt-2 btn-primary w-full justify-center py-1.5 text-[12px]"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Modifier & Soumettre
          </button>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[12px] text-neutral-400">
          <span>{new Date(idea.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
          <div className="flex items-center gap-3">
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MesIdeesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isResponsable = user?.role === "RESPONSABLE_INNOVATION";
  const getDeletable = (idea: Idea) => {
    if (idea.status === "CLOTUREE") return false;
    if (isResponsable) return true;
    return true;
  };

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editIdea, setEditIdea] = useState<Idea | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", category: "", problemStatement: "", proposedSolution: "", expectedRoi: "", estimatedCost: "" });
  const [editError, setEditError] = useState<string | null>(null);

  const openEdit = async (idea: Idea) => {
    try {
      const res = await ideasApi.getById(idea.id);
      const detail = res.data as Idea;
      setEditForm({
        title: detail.title || "",
        category: detail.category || "",
        problemStatement: detail.problemStatement || "",
        proposedSolution: detail.proposedSolution || "",
        expectedRoi: detail.expectedRoi || "",
        estimatedCost: detail.estimatedCost ? String(detail.estimatedCost) : "",
      });
      setEditIdea(detail);
      setEditError(null);
    } catch {
      setDeleteError("Impossible de charger le brouillon");
      setTimeout(() => setDeleteError(null), 3000);
    }
  };

  const submitEdit = async (draft: boolean) => {
    if (!editIdea) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await ideasApi.update(editIdea.id, {
        title: editForm.title,
        category: editForm.category,
        problemStatement: editForm.problemStatement,
        proposedSolution: editForm.proposedSolution,
        expectedRoi: editForm.expectedRoi || undefined,
        estimatedCost: editForm.estimatedCost ? parseFloat(editForm.estimatedCost) : undefined,
        imageUrl: editIdea.imageUrl || undefined,
        draft,
      });
      setEditIdea(null);
      load();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Erreur lors de la mise à jour");
    } finally {
      setEditLoading(false);
    }
  };

  const load = () => {
    setLoading(true);
    ideasApi.getMine(0, 50).then((res) => {
      const page = res.data as { content: Idea[] };
      setIdeas(page.content || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleVote = async (id: string) => {
    if (votingId) return;
    setVotingId(id);
    setJustVoted(id);
    try {
      await ideasApi.vote(id);
      load();
    } catch { /* ignore */ }
    finally {
      setVotingId(null);
      setTimeout(() => setJustVoted(null), 600);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette idée ?")) return;
    setDeleting(id);
    setDeleteError(null);
    try {
      await ideasApi.delete(id);
      setIdeas((prev) => prev.filter((i) => i.id !== id));
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur lors de la suppression";
      setDeleteError(msg);
      setTimeout(() => setDeleteError(null), 4000);
    } finally {
      setDeleting(null);
    }
  };

  const filtered = filter === "ALL"
    ? ideas
    : filter === "APPROUVEE"
    ? ideas.filter((i) => ["APPROUVEE_INNOVATION", "APPROUVEE_BU", "APPROUVEE_DG"].includes(i.status))
    : ideas.filter((i) => i.status === filter);

  const counts = {
    ALL:       ideas.length,
    SOUMISE:   ideas.filter((i) => i.status === "SOUMISE").length,
    APPROUVEE: ideas.filter((i) => ["APPROUVEE_INNOVATION", "APPROUVEE_BU", "APPROUVEE_DG"].includes(i.status)).length,
    CLOTUREE:  ideas.filter((i) => i.status === "CLOTUREE").length,
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Delete error toast */}
      {deleteError && (
        <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
          <div className="toast error flex items-center gap-2 pr-2">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span className="flex-1 text-[13px]">{deleteError}</span>
            <button onClick={() => setDeleteError(null)} className="p-0.5 hover:bg-red-100 rounded transition-colors">
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        </div>
      )}
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-5">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Mes Idées</h1>
            <p className="text-[13px] text-neutral-500 mt-0.5">
              {loading
                ? <span className="skeleton h-3 w-40 inline-block align-middle" />
                : `${ideas.length} idée${ideas.length !== 1 ? "s" : ""} soumise${ideas.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>
          <Link href="/soumettre" className="btn-primary">
            <span className="material-symbols-outlined text-[16px]">add</span>
            Soumettre une idée
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <div className="filter-tabs">
            {[
              { key: "ALL",       label: "Toutes",     count: counts.ALL },
              { key: "SOUMISE",   label: "Soumises",   count: counts.SOUMISE },
              { key: "APPROUVEE", label: "Approuvées", count: counts.APPROUVEE },
              { key: "CLOTUREE",  label: "Clôturées",  count: counts.CLOTUREE },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`filter-tab${filter === tab.key ? " active" : ""}`}>
                {tab.label} <span className="tab-count">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <IdeaCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card text-center py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-neutral-300">lightbulb</span>
            <p className="text-[14px] text-neutral-500">Aucune idée pour le moment.</p>
            <Link href="/soumettre" className="btn-primary mt-2">Soumettre une idée</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger">
            {filtered.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                canDeleteIdea={getDeletable(idea)}
                deleting={deleting}
                votingId={votingId}
                justVoted={justVoted}
                onDelete={handleDelete}
                onVote={handleVote}
                onEdit={openEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit Draft Modal */}
      {editIdea && (
        <>
          <div className="fixed inset-0 z-[55] bg-black/30" onClick={() => !editLoading && setEditIdea(null)} />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[15px] font-semibold text-neutral-900 dark:text-white">Modifier le brouillon</h2>
                <button type="button" onClick={() => setEditIdea(null)} disabled={editLoading}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-[#111113]">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {editError && (
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  {editError}
                </div>
              )}

              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-neutral-500">Titre *</label>
                  <input value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3]" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-neutral-500">Catégorie *</label>
                  <select value={editForm.category} onChange={(e) => setEditForm((p) => ({ ...p, category: e.target.value }))}
                    className="w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3]">
                    <option value="">Sélectionnez</option>
                    <option value="Technologie">Technologie & IT</option>
                    <option value="Opérations">Opérations & Logistique</option>
                    <option value="RH">Ressources Humaines</option>
                    <option value="Marketing">Marketing & Ventes</option>
                    <option value="RSE">RSE & Environnement</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-neutral-500">Problématique *</label>
                  <textarea value={editForm.problemStatement} onChange={(e) => setEditForm((p) => ({ ...p, problemStatement: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3] resize-none" rows={3} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px] font-medium text-neutral-500">Solution proposée *</label>
                  <textarea value={editForm.proposedSolution} onChange={(e) => setEditForm((p) => ({ ...p, proposedSolution: e.target.value }))}
                    className="w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3] resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-neutral-500">ROI estimé</label>
                    <input value={editForm.expectedRoi} onChange={(e) => setEditForm((p) => ({ ...p, expectedRoi: e.target.value }))}
                      className="w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] font-medium text-neutral-500">Coût estimé (€)</label>
                    <input type="number" value={editForm.estimatedCost} onChange={(e) => setEditForm((p) => ({ ...p, estimatedCost: e.target.value }))}
                      className="w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 outline-none focus:border-[#0066B3]" />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => submitEdit(true)} disabled={editLoading}
                  className="btn-ghost text-[13px]">
                  {editLoading ? <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> : "Sauvegarder brouillon"}
                </button>
                <button type="button"
                  onClick={() => submitEdit(false)}
                  disabled={editLoading || !editForm.title || !editForm.category || !editForm.problemStatement || !editForm.proposedSolution}
                  className="btn-primary text-[13px]">
                  {editLoading ? <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> : (
                    <>
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Soumettre
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
