"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { campaigns as campaignsApi, documents as documentsApi, API_BASE } from "@/lib/api";

const categories = [
  { value: "Écologie", label: "Écologie", color: "bg-emerald-500" },
  { value: "Technologie", label: "Technologie", color: "bg-blue-500" },
  { value: "Culture", label: "Culture", color: "bg-amber-500" },
  { value: "Données", label: "Données", color: "bg-purple-500" },
  { value: "Logistique", label: "Logistique", color: "bg-rose-500" },
  { value: "RH", label: "Ressources Humaines", color: "bg-cyan-500" },
];

const inputClass =
  "w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-400";

const textareaClass =
  "w-full px-3 py-2 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-400 resize-none";

export default function CreerCampagnePage() {
  const router = useRouter();
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
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
    setSelectedFile(file);
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
      let imageUrl: string | undefined = form.imageUrl || undefined;
      if (selectedFile) {
        const uploadRes = await documentsApi.uploadImage(selectedFile);
        const { fileName } = uploadRes.data as { fileName: string };
        imageUrl = `${API_BASE}/documents/images/${fileName}`;
      }
      await campaignsApi.create({
        title: form.title,
        description: form.description,
        category: form.category,
        categoryColor: selectedCat?.color || "bg-primary",
        imageUrl,
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
    <div className="px-4 md:px-6 py-5 h-full">
      <div className="max-w-5xl mx-auto flex flex-col h-full">
        <div className="flex items-center gap-2 mb-1">
          <Link href="/campagnes" className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          </Link>
          <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Créer une Campagne</h1>
        </div>
        <p className="text-[13px] text-neutral-500 mb-4 ml-6">Lancez un nouveau défi d&apos;innovation pour mobiliser les équipes.</p>

        {error && (
          <div className="mb-3 card px-4 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px] text-red-500">error</span>
            <span className="text-[13px] font-medium text-red-600 dark:text-red-400">{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Form */}
            <div className="lg:col-span-3 card p-5">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-neutral-500">Photo de couverture</label>
                  <div
                    className={`relative border border-dashed rounded-md overflow-hidden cursor-pointer transition-colors ${
                      dragOver ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900" : preview ? "border-transparent" : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
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
                          <button type="button" className="btn-ghost !bg-white !text-neutral-700 text-[12px]" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>Changer</button>
                          <button type="button" className="btn-danger text-[12px]" onClick={(e) => { e.stopPropagation(); setPreview(null); }}>Supprimer</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 px-4">
                        <span className="material-symbols-outlined text-neutral-300 dark:text-neutral-600 text-xl mb-2">add_photo_alternate</span>
                        <p className="text-[13px] font-medium text-neutral-600 dark:text-neutral-400">Cliquez ou glissez une image ici</p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">PNG, JPG, WEBP — max 5 Mo</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-neutral-500">Nom de la campagne *</label>
                    <input value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} placeholder="Ex: Green Tech 2025" type="text" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-neutral-500">Catégorie *</label>
                    <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass} required>
                      <option value="">Choisir une catégorie</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-medium text-neutral-500">Description *</label>
                  <textarea value={form.description} onChange={(e) => update("description", e.target.value)} className={textareaClass} placeholder="Décrivez le défi, les objectifs et les résultats attendus..." rows={3} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-neutral-500">Date de début</label>
                    <input value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={inputClass} type="date" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[12px] font-medium text-neutral-500">Date de fin</label>
                    <input value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} type="date" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <Link href="/campagnes" className="btn-ghost text-[13px]">Annuler</Link>
                  <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? <span className="material-symbols-outlined animate-spin text-[15px]">progress_activity</span> : "Lancer la campagne"}
                  </button>
                </div>
              </form>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="card p-4">
                <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-3">Aperçu de la carte</h3>
                <div className="card overflow-hidden">
                  <div className="h-28 w-full bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><span className="material-symbols-outlined text-neutral-300 dark:text-neutral-600 text-xl">image</span></div>
                    )}
                    <div className={`absolute top-2 left-2 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-md ${selectedCat?.color || "bg-neutral-900"}`}>
                      {form.category || "Catégorie"}
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="text-[14px] font-medium text-neutral-400">{form.title || "Nom de la campagne"}</h4>
                    <p className="text-neutral-400 text-[12px] mt-0.5 line-clamp-2">{form.description || "Description de la campagne..."}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-neutral-400">0 idées</span>
                      <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">Nouveau</span>
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
