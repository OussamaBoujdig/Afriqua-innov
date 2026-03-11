"use client";

import { useEffect, useState, useRef } from "react";
import { projects as projectsApi } from "@/lib/api";

interface DocFile {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedByName: string;
  createdAt: string;
}

interface Deliverable {
  id: string;
  stage: string;
  title: string;
  isDone: boolean;
  doneAt: string | null;
  doneByName: string | null;
  sortOrder: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  currentStage: string;
  stageProgress: number;
  owner: { id: string; fullName: string };
  dueDate: string;
  launchedAt: string;
  ideaId: string;
  ideaTitle: string;
  deliverables: Deliverable[];
}

const stages = [
  { key: "EXPLORATION", label: "Exploration", icon: "search", color: "from-blue-500 to-cyan-500" },
  { key: "CONCEPTUALISATION", label: "Conceptualisation", icon: "lightbulb", color: "from-violet-500 to-purple-500" },
  { key: "PILOTE", label: "Pilote", icon: "rocket", color: "from-amber-500 to-orange-500" },
  { key: "MISE_A_ECHELLE", label: "Mise à l'échelle", icon: "trending_up", color: "from-emerald-500 to-teal-500" },
];

function getStageIdx(stage: string) {
  const idx = stages.findIndex((s) => s.key === stage);
  return idx >= 0 ? idx : 0;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function fileIcon(type: string | null) {
  if (!type) return "description";
  if (type.includes("pdf")) return "picture_as_pdf";
  if (type.includes("image")) return "image";
  if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return "table_chart";
  if (type.includes("presentation") || type.includes("powerpoint")) return "slideshow";
  if (type.includes("word") || type.includes("document")) return "article";
  if (type.includes("zip") || type.includes("rar")) return "folder_zip";
  return "description";
}

export default function SuiviProjetPage() {
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"deliverables" | "documents" | "details">("deliverables");
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    projectsApi.getAll(0, 50).then((res) => {
      const page = res.data as { content: Project[] };
      const list = page.content || [];
      setProjectList(list);
      if (list.length > 0 && !selected) {
        setSelected(list[0]);
        loadDocs(list[0].id);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  const refreshSelected = async (id: string) => {
    try {
      const res = await projectsApi.getById(id);
      const p = res.data as Project;
      setSelected(p);
      setProjectList((prev) => prev.map((x) => x.id === p.id ? p : x));
    } catch { /* ignore */ }
  };

  const loadDocs = async (projectId: string) => {
    try {
      const res = await projectsApi.getDocuments(projectId);
      setDocs(res.data as DocFile[]);
    } catch {
      setDocs([]);
    }
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectProject = (p: Project) => {
    setSelected(p);
    setActiveTab("deliverables");
    loadDocs(p.id);
  };

  const advanceStage = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await projectsApi.advanceStage(selected.id);
      await refreshSelected(selected.id);
    } catch { /* ignore */ } finally {
      setActionLoading(false);
    }
  };

  const toggleDeliverable = async (delivId: string) => {
    if (!selected) return;
    try {
      await projectsApi.toggleDeliverable(selected.id, delivId);
      await refreshSelected(selected.id);
    } catch { /* ignore */ }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try {
      await projectsApi.uploadDocument(selected.id, file);
      await loadDocs(selected.id);
    } catch { /* ignore */ } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined animate-spin text-primary text-2xl">progress_activity</span>
      </div>
    );
  }

  if (projectList.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="material-symbols-outlined text-slate-300 text-4xl">rocket_launch</span>
          <p className="text-sm text-slate-400 mt-2">Aucun projet en cours.</p>
          <p className="text-xs text-slate-400">Les projets sont créés automatiquement lorsqu&apos;une idée est clôturée.</p>
        </div>
      </div>
    );
  }

  const stageIdx = selected ? getStageIdx(selected.currentStage) : 0;
  const currentStageDeliverables = selected?.deliverables.filter((d) => d.stage === selected.currentStage) || [];
  const doneCount = currentStageDeliverables.filter((d) => d.isDone).length;
  const totalCount = currentStageDeliverables.length;
  const completionPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto w-full px-4 lg:px-6 py-4">
        {/* Project selector tabs */}
        {projectList.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {projectList.map((p) => (
              <button
                key={p.id}
                onClick={() => selectProject(p)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selected?.id === p.id ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary/10"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        )}

        {selected && (
          <>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <span className="material-symbols-outlined text-xs">verified</span>Projet actif
                </div>
                <h1 className="text-xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">{selected.name}</h1>
                <p className="text-slate-600 dark:text-slate-400 text-sm">{selected.description || selected.ideaTitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={advanceStage}
                  disabled={actionLoading || stageIdx >= stages.length - 1 || completionPct < 100}
                  title={completionPct < 100 ? "Terminez tous les livrables de cette étape d'abord" : ""}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs hover:shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-sm">skip_next</span>
                  {actionLoading ? "..." : stageIdx >= stages.length - 1 ? "Étape finale" : "Étape suivante"}
                </button>
              </div>
            </div>

            {/* Stage pipeline */}
            <div className="relative flex justify-between items-start mb-6">
              <div className="absolute top-5 left-0 w-full h-[3px] bg-slate-200 dark:bg-slate-800 -z-10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-500"
                  style={{ width: `${(stageIdx / (stages.length - 1)) * 100}%` }}
                ></div>
              </div>
              {stages.map((s, i) => (
                <div key={s.key} className="flex flex-col items-center gap-2 text-center flex-1">
                  <div className={`size-10 rounded-full flex items-center justify-center ring-4 ring-white dark:ring-background-dark transition-all ${
                    i < stageIdx ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" :
                    i === stageIdx ? `bg-gradient-to-br ${s.color} text-white shadow-lg shadow-primary/40 scale-110` :
                    "bg-slate-200 dark:bg-slate-800 text-slate-400"
                  }`}>
                    <span className="material-symbols-outlined text-lg">
                      {i < stageIdx ? "check" : s.icon}
                    </span>
                  </div>
                  <div>
                    <p className={`font-medium text-xs ${
                      i <= stageIdx ? "text-slate-900 dark:text-white font-bold" : "text-slate-400"
                    }`}>{s.label}</p>
                    {i === stageIdx && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-primary font-bold uppercase mt-0.5">
                        <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                        En cours
                      </span>
                    )}
                    {i < stageIdx && (
                      <span className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">Terminé</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Progress bar for current stage */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">analytics</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Progression {stages[stageIdx]?.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-primary">{completionPct}%</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${completionPct}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400">{doneCount}/{totalCount} livrables terminés</span>
                {completionPct === 100 && stageIdx < stages.length - 1 && (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Prêt pour l&apos;étape suivante
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-fit">
              {[
                { key: "deliverables" as const, label: "Livrables", icon: "checklist" },
                { key: "documents" as const, label: "Documents", icon: "folder" },
                { key: "details" as const, label: "Détails", icon: "info" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === tab.key ? "bg-white dark:bg-slate-900 text-primary shadow-sm" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                {activeTab === "deliverables" && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-base">checklist</span>
                      Livrables — {stages[stageIdx]?.label}
                    </h2>
                    {currentStageDeliverables.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">Aucun livrable pour cette étape.</p>
                    ) : (
                      <div className="space-y-2">
                        {currentStageDeliverables.sort((a, b) => a.sortOrder - b.sortOrder).map((d) => (
                          <div
                            key={d.id}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              d.isDone
                                ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40"
                                : "bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 hover:border-primary/30"
                            }`}
                          >
                            <button
                              onClick={() => toggleDeliverable(d.id)}
                              className={`size-6 flex items-center justify-center rounded-lg shrink-0 transition-all ${
                                d.isDone
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : "border-2 border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5"
                              }`}
                            >
                              {d.isDone && <span className="material-symbols-outlined text-sm">check</span>}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${d.isDone ? "text-slate-400 line-through" : "text-slate-800 dark:text-slate-200"}`}>
                                {d.title}
                              </p>
                              {d.isDone && d.doneByName && (
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  Fait par {d.doneByName} {d.doneAt ? `le ${new Date(d.doneAt).toLocaleDateString("fr-FR")}` : ""}
                                </p>
                              )}
                            </div>
                            {d.isDone && (
                              <span className="material-symbols-outlined text-emerald-500 text-lg shrink-0">verified</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* All stages overview */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Vue d&apos;ensemble des étapes</h3>
                      <div className="space-y-2">
                        {stages.map((s, i) => {
                          const stageDelivs = selected.deliverables.filter((d) => d.stage === s.key);
                          const done = stageDelivs.filter((d) => d.isDone).length;
                          const total = stageDelivs.length;
                          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                          return (
                            <div key={s.key} className="flex items-center gap-3">
                              <span className={`material-symbols-outlined text-sm ${i <= stageIdx ? "text-primary" : "text-slate-300"}`}>{s.icon}</span>
                              <span className="text-xs font-medium w-32 shrink-0">{s.label}</span>
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${i < stageIdx ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${pct}%` }}></div>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 w-10 text-right">{done}/{total}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "documents" && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">folder</span>
                        Documents du projet
                      </h2>
                      <div>
                        <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
                        <button
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-sm">{uploading ? "progress_activity" : "upload_file"}</span>
                          {uploading ? "Upload..." : "Ajouter un fichier"}
                        </button>
                      </div>
                    </div>
                    {docs.length === 0 ? (
                      <div className="text-center py-8">
                        <span className="material-symbols-outlined text-3xl text-slate-300 dark:text-slate-600">cloud_upload</span>
                        <p className="text-xs text-slate-400 mt-2">Aucun document. Ajoutez des fichiers pour ce projet.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {docs.map((d) => (
                          <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 hover:border-primary/30 transition-all">
                            <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-primary text-lg">{fileIcon(d.fileType)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{d.fileName}</p>
                              <p className="text-[10px] text-slate-400">
                                {formatBytes(d.fileSizeBytes)} &middot; par {d.uploadedByName} &middot; {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                    <h2 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <span className="material-symbols-outlined text-primary text-base">info</span>
                      Détails du projet
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">person</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-medium">Responsable</p>
                            <p className="font-bold text-sm">{selected.owner?.fullName || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-base">calendar_today</span>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 font-medium">Lancé le</p>
                            <p className="font-bold text-sm">{selected.launchedAt ? new Date(selected.launchedAt).toLocaleDateString("fr-FR") : "N/A"}</p>
                          </div>
                        </div>
                        {selected.dueDate && (
                          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div className="size-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                              <span className="material-symbols-outlined text-base">event</span>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-500 font-medium">Échéance</p>
                              <p className="font-bold text-sm">{new Date(selected.dueDate).toLocaleDateString("fr-FR")}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Idée d&apos;origine</p>
                          <p className="text-sm font-semibold">{selected.ideaTitle}</p>
                          <p className="text-[10px] text-slate-400 mt-1">Créé automatiquement lors de la clôture.</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                          <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Progression automatique</p>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                            <div className="h-full bg-gradient-to-r from-primary to-indigo-500 rounded-full transition-all" style={{ width: `${completionPct}%` }}></div>
                          </div>
                          <p className="text-xs text-primary font-bold text-center mt-2">{completionPct}%</p>
                          <p className="text-[9px] text-slate-400 text-center mt-0.5">Basé sur les livrables complétés</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right sidebar info */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Étape actuelle</h3>
                  <div className={`p-4 rounded-xl bg-gradient-to-br ${stages[stageIdx]?.color || "from-primary to-indigo-600"} text-white`}>
                    <span className="material-symbols-outlined text-2xl mb-2">{stages[stageIdx]?.icon}</span>
                    <p className="text-sm font-extrabold">{stages[stageIdx]?.label}</p>
                    <p className="text-xs opacity-80 mt-1">Étape {stageIdx + 1} sur {stages.length}</p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
                  <h3 className="text-xs font-bold uppercase text-slate-500 mb-3">Résumé</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Livrables totaux</span>
                      <span className="text-xs font-bold">{selected.deliverables.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Terminés</span>
                      <span className="text-xs font-bold text-emerald-600">{selected.deliverables.filter(d => d.isDone).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">En attente</span>
                      <span className="text-xs font-bold text-amber-600">{selected.deliverables.filter(d => !d.isDone).length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Documents</span>
                      <span className="text-xs font-bold">{docs.length}</span>
                    </div>
                    <hr className="border-slate-100 dark:border-slate-800" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">Responsable</span>
                      <span className="text-xs font-bold">{selected.owner?.fullName || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
