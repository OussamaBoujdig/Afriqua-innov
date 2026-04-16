"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ideas as ideasApi, campaigns as campaignsApi, documents as documentsApi } from "@/lib/api";

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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    campaignsApi.getAll(0, 100).then((res) => {
      const page = res.data as { content: Campaign[] };
      setCampaignList(page.content || []);
    }).catch(() => {});
  }, []);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageUploading(true);
    try {
      const res = await documentsApi.uploadImage(file);
      const data = res.data as { fileName: string };
      setImageUrl(`/documents/images/${data.fileName}`);
    } catch {
      setError("Erreur lors du téléversement de l'image");
      setImagePreview(null);
      setImageFile(null);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
        imageUrl: imageUrl || undefined,
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

  const inputClass =
    "w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-400";

  const textareaClass =
    "w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-400 resize-none";

  if (success) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <span className="material-symbols-outlined text-emerald-600 text-xl">check_circle</span>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Idée soumise avec succès</h2>
          <p className="text-[13px] text-neutral-500">Redirection vers vos idées...</p>
        </div>
      </div>
    );
  }

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Soumettre une idée</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">Partagez votre innovation avec la communauté Innov&apos;Hub</p>
        </div>

        {error && (
          <div className="card px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px] text-red-500">error</span>
            <span className="text-[13px] font-medium text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        <div className="card p-5">
          {/* Progress */}
          <div className="flex justify-between items-end mb-1">
            <span className="text-[12px] font-medium text-neutral-500">Étape {step} sur 3</span>
            <span className="text-[12px] font-medium text-neutral-400">{progress}%</span>
          </div>
          <div className="h-1 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-5">
            <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Détails du Concept</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">Titre de l&apos;idée *</label>
                <input
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className={inputClass}
                  placeholder="Ex: Optimisation du flux logistique par IA"
                  type="text"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">Catégorie *</label>
                <select
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  className={inputClass}
                >
                  <option value="">Sélectionnez une catégorie</option>
                  <option value="Technologie">Technologie & IT</option>
                  <option value="Opérations">Opérations & Logistique</option>
                  <option value="RH">Ressources Humaines</option>
                  <option value="Marketing">Marketing & Ventes</option>
                  <option value="RSE">RSE & Environnement</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">Problématique constatée *</label>
                <textarea
                  value={form.problemStatement}
                  onChange={(e) => update("problemStatement", e.target.value)}
                  className={textareaClass}
                  placeholder="Décrivez le problème que vous souhaitez résoudre..."
                  rows={3}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">Solution proposée *</label>
                <textarea
                  value={form.proposedSolution}
                  onChange={(e) => update("proposedSolution", e.target.value)}
                  className={textareaClass}
                  placeholder="Comment votre idée répond-elle à ce problème ?"
                  rows={4}
                />
              </div>

              {/* Image upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">
                  Image de couverture <span className="text-neutral-400 font-normal">(optionnel)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageChange(file);
                  }}
                />
                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center gap-2 w-full h-32 rounded-md border-2 border-dashed border-neutral-200 dark:border-neutral-700 hover:border-[#0066B3] hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer group"
                  >
                    <span className="material-symbols-outlined text-[28px] text-neutral-300 dark:text-neutral-600 group-hover:text-[#0066B3] transition-colors">add_photo_alternate</span>
                    <span className="text-[12px] text-neutral-400 group-hover:text-[#0066B3] transition-colors">Cliquez pour ajouter une image</span>
                    <span className="text-[11px] text-neutral-300 dark:text-neutral-600">PNG, JPG, WEBP — max 10 MB</span>
                  </button>
                ) : (
                  <div className="relative rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                    {imageUploading && (
                      <div className="absolute inset-0 bg-white/70 dark:bg-black/60 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined animate-spin text-[20px] text-[#0066B3]">progress_activity</span>
                        <span className="text-[12px] text-[#0066B3] font-medium">Téléversement...</span>
                      </div>
                    )}
                    {!imageUploading && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 size-7 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    )}
                    {!imageUploading && imageUrl && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-emerald-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        Téléversée
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Impact & ROI</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-neutral-500">ROI estimé</label>
                  <input
                    value={form.expectedRoi}
                    onChange={(e) => update("expectedRoi", e.target.value)}
                    className={inputClass}
                    placeholder="Ex: Réduction de 20% des coûts"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-neutral-500">Coût estimé (€)</label>
                  <input
                    type="number"
                    value={form.estimatedCost}
                    onChange={(e) => update("estimatedCost", e.target.value)}
                    className={inputClass}
                    placeholder="50000"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium text-neutral-500">Campagne associée (optionnel)</label>
                <select
                  value={form.campaignId}
                  onChange={(e) => update("campaignId", e.target.value)}
                  className={inputClass}
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
              <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Récapitulatif</h3>
              {imagePreview && (
                <div className="rounded-md overflow-hidden border border-neutral-100 dark:border-neutral-800 aspect-[16/9] bg-neutral-100 dark:bg-neutral-800">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Image de couverture" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="rounded-md border border-neutral-100 dark:border-neutral-800 p-4 space-y-3">
                <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Titre</p><p className="text-[13px] font-medium text-neutral-900 dark:text-white mt-0.5">{form.title}</p></div>
                <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Catégorie</p><p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5">{form.category}</p></div>
                <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Problématique</p><p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5">{form.problemStatement}</p></div>
                <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Solution</p><p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5">{form.proposedSolution}</p></div>
                {form.expectedRoi && <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">ROI</p><p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5">{form.expectedRoi}</p></div>}
                {form.estimatedCost && <div><p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Coût</p><p className="text-[13px] text-neutral-700 dark:text-neutral-300 mt-0.5">{parseFloat(form.estimatedCost).toLocaleString()} €</p></div>}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-between items-center border-t border-neutral-100 dark:border-neutral-800 mt-5">
            {step > 1 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-ghost"
                type="button"
              >
                Retour
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                className="btn-ghost"
                type="button"
              >
                Enregistrer en brouillon
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!stepValid()}
                className="btn-primary"
                type="button"
              >
                Étape suivante
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                className="btn-primary"
                type="button"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span>
                ) : (
                  <>
                    Soumettre
                    <span className="material-symbols-outlined text-[15px]">send</span>
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
