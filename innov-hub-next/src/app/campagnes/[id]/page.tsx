"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { campaigns as campaignsApi, resolveImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface Campaign {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryColor: string;
  imageUrl: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName: string;
  ideaCount: number;
  createdAt: string;
}

interface IdeaSummary {
  id: string;
  title: string;
  category: string;
  status: string;
  totalScore: number | null;
  scoreCount: number;
  requiredScoreCount: number;
  submittedByName: string;
  voteCount: number;
  createdAt: string;
}

const statusLabel: Record<string, string> = {
  BROUILLON: "Brouillon", SOUMISE: "Soumise", EN_VALIDATION: "En validation",
  SCOREE: "Scorée", APPROUVEE_INNOVATION: "Approuvée Innovation",
  APPROUVEE_BU: "Approuvée BU", APPROUVEE_DG: "Approuvée DG",
  CLOTUREE: "Clôturée", REJETEE: "Rejetée",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isRole } = useAuth();
  const isResponsable = isRole("RESPONSABLE_INNOVATION");
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [ideas, setIdeas] = useState<IdeaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [closing, setClosing] = useState(false);
  const [toast, setToast] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setLoadError(false);
    Promise.all([
      campaignsApi.getById(id).then((r) => setCampaign(r.data as Campaign)),
      campaignsApi.getIdeas(id, 0, 100).then((r) => {
        const page = r.data as { content: IdeaSummary[] };
        setIdeas(page.content || []);
      }),
    ]).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [id]);

  const handleClose = async () => {
    if (!id || !confirm("Terminer cette campagne ?")) return;
    setClosing(true);
    try {
      const r = await campaignsApi.close(id);
      setCampaign(r.data as Campaign);
      setToast({ type: "ok", msg: "Campagne terminée" });
    } catch (e: unknown) {
      setToast({ type: "err", msg: e instanceof Error ? e.message : "Erreur" });
    } finally { setClosing(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-[14px] text-neutral-500">{loadError ? "Erreur de chargement" : "Campagne introuvable"}</p>
        <Link href="/campagnes" className="text-[13px] font-medium text-neutral-900 dark:text-white hover:underline">Retour</Link>
      </div>
    );
  }

  const progress = (() => {
    if (!campaign.startDate || !campaign.endDate) return 0;
    const s = new Date(campaign.startDate).getTime();
    const e = new Date(campaign.endDate).getTime();
    const now = Date.now();
    if (now <= s) return 0;
    if (now >= e) return 100;
    return Math.round(((now - s) / (e - s)) * 100);
  })();

  return (
    <div className="h-full overflow-y-auto">
      {toast && (
        <div className={`fixed top-3 right-3 z-50 card shadow-lg px-4 py-2 text-[13px] font-medium ${toast.type === "ok" ? "text-emerald-700" : "text-red-700"}`}>
          {toast.msg}
          <button className="ml-3 text-neutral-400 hover:text-neutral-600" onClick={() => setToast(null)}>&times;</button>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-5">
        <Link href="/campagnes" className="flex items-center gap-1 text-[13px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white mb-4 transition-colors">
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Campagnes
        </Link>

        {/* Campaign header */}
        <div className="card overflow-hidden mb-6">
          <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800">
            {resolveImageUrl(campaign.imageUrl) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImageUrl(campaign.imageUrl)!} alt={campaign.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="material-symbols-outlined text-[40px] text-neutral-300 dark:text-neutral-600">campaign</span>
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{campaign.category}</span>
              <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{campaign.status}</span>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">{campaign.title}</h1>
            <p className="text-[13px] text-neutral-500 mb-4">{campaign.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Idées", value: String(ideas.length) },
                { label: "Statut", value: campaign.status },
                { label: "Début", value: campaign.startDate ? new Date(campaign.startDate).toLocaleDateString("fr-FR") : "--" },
                { label: "Fin", value: campaign.endDate ? new Date(campaign.endDate).toLocaleDateString("fr-FR") : "--" },
              ].map(m => (
                <div key={m.label} className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-800/50">
                  <p className="text-[11px] text-neutral-500 uppercase tracking-wider">{m.label}</p>
                  <p className="text-[14px] font-medium text-neutral-900 dark:text-white mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[12px] mb-1">
                <span className="text-neutral-500">Progression</span>
                <span className="font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{progress}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] text-neutral-500">Par {campaign.createdByName}</span>
              <div className="flex items-center gap-2">
                {isResponsable && campaign.status !== "TERMINEE" && (
                  <button onClick={handleClose} disabled={closing} className="btn-danger">
                    {closing ? "Fermeture..." : "Terminer la campagne"}
                  </button>
                )}
                {campaign.status !== "TERMINEE" && (
                  <Link href={`/soumettre?campaignId=${campaign.id}`} className="btn-primary">
                    Soumettre une idée
                  </Link>
                )}
                {campaign.status === "TERMINEE" && (
                  <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">Terminée</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ideas */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Idées soumises</h2>
          <span className="text-[13px] text-neutral-500">{ideas.length} idée{ideas.length !== 1 ? "s" : ""}</span>
        </div>

        {ideas.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-[14px] text-neutral-500">Aucune idée soumise.</p>
            {campaign.status !== "TERMINEE" && (
              <Link href={`/soumettre?campaignId=${campaign.id}`} className="btn-primary mt-4">
                Soumettre la première idée
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ideas.map((idea) => (
              <div key={idea.id} className="card p-4 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{idea.category}</span>
                  <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">{statusLabel[idea.status] || idea.status}</span>
                  {idea.totalScore !== null && idea.scoreCount >= idea.requiredScoreCount && (
                    <span className="ml-auto text-[12px] font-medium text-neutral-700 dark:text-neutral-300 tabular-nums">{Number(idea.totalScore).toFixed(0)}</span>
                  )}
                </div>
                <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white mb-2">{idea.title}</h3>
                <div className="flex items-center justify-between text-[12px] text-neutral-500">
                  <span>{idea.submittedByName}</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">thumb_up</span>
                      {idea.voteCount}
                    </span>
                    <span>{new Date(idea.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                </div>
                {(idea.status === "SOUMISE" || idea.status === "EN_VALIDATION") && idea.requiredScoreCount > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all" style={{ width: `${(idea.scoreCount / idea.requiredScoreCount) * 100}%` }} />
                    </div>
                    <span className="text-[11px] text-neutral-500 tabular-nums">{idea.scoreCount}/{idea.requiredScoreCount}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
