"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { campaigns as campaignsApi } from "@/lib/api";

const categories = [
  { value: "Écologie", label: "Écologie", color: "bg-emerald-500" },
  { value: "Technologie", label: "Technologie", color: "bg-blue-500" },
  { value: "Culture", label: "Culture", color: "bg-amber-500" },
  { value: "Données", label: "Données", color: "bg-purple-500" },
  { value: "Logistique", label: "Logistique", color: "bg-rose-500" },
  { value: "RH", label: "Ressources Humaines", color: "bg-cyan-500" },
];

export default function CreerCampagnePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    startDate: "",
    endDate: "",
    imageUrl: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const selectedCat = categories.find((c) => c.value === form.category);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await campaignsApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        categoryColor: selectedCat?.color || "bg-primary",
        imageUrl: preview || form.imageUrl || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      });
      router.push("/campagnes");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 h-full">
      <div className="max-w-5xl mx-auto flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/campagnes" className="text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              </Link>
              <h1 className="text-lg font-extrabold tracking-tight">Créer une Campagne</h1>
            </div>
            <p className="text-slate-500 text-xs ml-6">Lancez un nouveau défi d&apos;innovation pour mobiliser les équipes.</p>
          </div>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Photo de couverture</label>
                  <div
                    className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${
                      dragOver ? "border-primary bg-primary/5" : preview ? "border-transparent" : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                  >
                    {preview ? (
                      <div className="relative h-36 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={preview} alt="Aperçu" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button type="button" className="px-3 py-1.5 bg-white text-slate-700 rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Changer</button>
                          <button type="button" className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-bold" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>Supprimer</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                          <span className="material-symbols-outlined text-slate-400 text-xl">add_photo_alternate</span>
                        </div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Cliquez ou glissez une image ici</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP — max 5 Mo</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nom de la campagne *</label>
                    <input value={form.title} onChange={(e) => update("title", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" placeholder="Ex: Green Tech 2025" type="text" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Catégorie *</label>
                    <select value={form.category} onChange={(e) => update("category", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" required>
                      <option value="">Choisir une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Description *</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none" placeholder="Décrivez le défi, les objectifs et les résultats attendus..." rows={3} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date de début</label>
                    <input value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" type="date" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Date de fin</label>
                    <input value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="h-9 w-full rounded-lg border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/50 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" type="date" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Link href="/campagnes" className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Annuler</Link>
                  <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-primary text-white font-semibold text-xs shadow-md shadow-primary/20 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50">
                    {loading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <><span className="material-symbols-outlined text-[16px]">rocket_launch</span>Lancer la campagne</>}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Aperçu de la carte</h3>
                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <div className="h-28 w-full bg-slate-200 relative overflow-hidden">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><span className="material-symbols-outlined text-slate-300 text-3xl">image</span></div>
                    )}
                    <div className={`absolute top-2 left-2 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${selectedCat?.color || "bg-primary"}`}>
                      {form.category || "Catégorie"}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-bold mb-0.5 text-slate-400">{form.title || "Nom de la campagne"}</h4>
                    <p className="text-slate-400 text-[10px] mb-3 line-clamp-2">{form.description || "Description de la campagne..."}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-[12px]">lightbulb</span>
                        <span className="text-[10px] font-medium">0 idées</span>
                      </div>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[9px] font-bold">Nouveau</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
