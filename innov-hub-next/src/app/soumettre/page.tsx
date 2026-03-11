"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ideas as ideasApi, campaigns as campaignsApi } from "@/lib/api";

interface Campaign {
  id: string;
  title: string;
}

export default function SoumettreIdeePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [campaignList, setCampaignList] = useState<Campaign[]>([]);

  const [form, setForm] = useState({
    title: "",
    category: "",
    problemStatement: "",
    proposedSolution: "",
    expectedRoi: "",
    estimatedCost: "",
    campaignId: "",
  });

  useEffect(() => {
    campaignsApi.getAll(0, 100).then((res) => {
      const page = res.data as { content: Campaign[] };
      setCampaignList(page.content || []);
    }).catch(() => {});
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const stepValid = () => {
    if (step === 1) return form.title && form.category && form.problemStatement && form.proposedSolution;
    if (step === 2) return true;
    return true;
  };

  const handleSubmit = async (draft = false) => {
    setError("");
    setLoading(true);
    try {
      await ideasApi.submit({
        title: form.title,
        category: form.category,
        problemStatement: form.problemStatement,
        proposedSolution: form.proposedSolution,
        expectedRoi: form.expectedRoi || undefined,
        estimatedCost: form.estimatedCost ? parseFloat(form.estimatedCost) : undefined,
        campaignId: form.campaignId || undefined,
        draft,
      });
      setSuccess(true);
      setTimeout(() => router.push("/mes-idees"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la soumission");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <div className="size-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
          </div>
          <h2 className="text-lg font-extrabold">Idée soumise avec succès !</h2>
          <p className="text-sm text-slate-500">Redirection vers vos idées...</p>
        </div>
      </div>
    );
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="px-4 lg:px-8 py-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-extrabold leading-tight tracking-tight">Soumettre une idée</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Partagez votre innovation avec la communauté Innov&apos;Hub</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-200/60 dark:border-slate-800/60">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-end">
              <span className="text-primary text-sm font-bold uppercase tracking-wider">Étape {step} sur 3</span>
              <span className="text-slate-900 dark:text-slate-100 text-sm font-bold">{progress}%</span>
            </div>
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">1</span>
                <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">Détails du Concept</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Titre de l&apos;idée *</label>
                  <input
                    value={form.title}
                    onChange={(e) => update("title", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="Ex: Optimisation du flux logistique par IA"
                    type="text"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Catégorie *</label>
                  <select
                    value={form.category}
                    onChange={(e) => update("category", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    <option value="Technologie">Technologie & IT</option>
                    <option value="Opérations">Opérations & Logistique</option>
                    <option value="RH">Ressources Humaines</option>
                    <option value="Marketing">Marketing & Ventes</option>
                    <option value="RSE">RSE & Environnement</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Problématique constatée *</label>
                  <textarea
                    value={form.problemStatement}
                    onChange={(e) => update("problemStatement", e.target.value)}
                    className="flex w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="Décrivez le problème que vous souhaitez résoudre..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Solution proposée *</label>
                  <textarea
                    value={form.proposedSolution}
                    onChange={(e) => update("proposedSolution", e.target.value)}
                    className="flex w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="Comment votre idée répond-elle à ce problème ?"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">2</span>
                <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">Impact & ROI</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">ROI estimé</label>
                  <input
                    value={form.expectedRoi}
                    onChange={(e) => update("expectedRoi", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="Ex: Réduction de 20% des coûts"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Coût estimé (€)</label>
                  <input
                    type="number"
                    value={form.estimatedCost}
                    onChange={(e) => update("estimatedCost", e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Campagne associée (optionnel)</label>
                <select
                  value={form.campaignId}
                  onChange={(e) => update("campaignId", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                >
                  <option value="">Aucune campagne</option>
                  {campaignList.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">3</span>
                <h3 className="text-slate-900 dark:text-slate-100 text-base font-bold">Récapitulatif</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-3">
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Titre</p><p className="text-sm font-semibold">{form.title}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Catégorie</p><p className="text-sm">{form.category}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Problématique</p><p className="text-sm">{form.problemStatement}</p></div>
                <div><p className="text-[10px] font-bold text-slate-400 uppercase">Solution</p><p className="text-sm">{form.proposedSolution}</p></div>
                {form.expectedRoi && <div><p className="text-[10px] font-bold text-slate-400 uppercase">ROI</p><p className="text-sm">{form.expectedRoi}</p></div>}
                {form.estimatedCost && <div><p className="text-[10px] font-bold text-slate-400 uppercase">Coût</p><p className="text-sm">{parseFloat(form.estimatedCost).toLocaleString()} €</p></div>}
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 mt-4">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                type="button"
              >
                Retour
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
                type="button"
              >
                Enregistrer en brouillon
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!stepValid()}
                className="group relative flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                type="button"
              >
                Étape suivante
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="group relative flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-white font-bold text-sm shadow-lg shadow-primary/30 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
                type="button"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                ) : (
                  <>
                    Soumettre
                    <span className="material-symbols-outlined text-sm">send</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
