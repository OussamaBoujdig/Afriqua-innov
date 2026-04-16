"use client";

import { useEffect, useState, useRef } from "react";
import { tasks as tasksApi, projects as projectsApi, downloadFile } from "@/lib/api";

interface TaskDoc {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedByName: string;
  createdAt: string;
  downloadUrl?: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  stage: string;
  status: string;
  assignedToId: string | null;
  assignedToName: string | null;
  createdByName: string;
  dueDate: string | null;
  createdAt: string;
  projectId: string;
  projectName: string;
  ideaTitle: string | null;
}

const stageLabels: Record<string, string> = {
  EXPLORATION: "Exploration",
  CONCEPTUALISATION: "Conceptualisation",
  PILOTE: "Pilote",
  MISE_A_ECHELLE: "Mise à l'échelle",
};

const statusLabels: Record<string, string> = {
  A_FAIRE: "À faire",
  EN_COURS: "En cours",
  TERMINEE: "Terminée",
};

const statusColors: Record<string, string> = {
  A_FAIRE: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  EN_COURS: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  TERMINEE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export default function MesTachesPage() {
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [docs, setDocs] = useState<TaskDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (setter: (v: string | null) => void, msg: string) => { setter(msg); setTimeout(() => setter(null), 5000); };

  const [loadError, setLoadError] = useState(false);

  const load = () => {
    setLoading(true);
    setLoadError(false);
    tasksApi.getMine().then((res) => {
      setTaskList(res.data as Task[]);
    }).catch(() => {
      setLoadError(true);
      setTaskList([]);
    }).finally(() => setLoading(false));
  };

  const loadDocs = async (task: Task) => {
    try {
      const res = await tasksApi.getDocuments(task.projectId, task.id);
      setDocs(res.data as TaskDoc[]);
    } catch {
      setDocs([]);
    }
  };

  useEffect(load, []);

  const selectTask = (task: Task) => {
    setSelectedTask(task);
    loadDocs(task);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTask) return;
    setUploading(true);
    try {
      await tasksApi.uploadDocument(selectedTask.projectId, selectedTask.id, file);
      await loadDocs(selectedTask);
      flash(setSuccessMsg, "Document uploadé avec succès !");
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleMarkComplete = async () => {
    if (!selectedTask) return;
    setActionLoading(true);
    try {
      await projectsApi.updateTask(selectedTask.projectId, selectedTask.id, { status: "TERMINEE" });
      flash(setSuccessMsg, "Tâche marquée comme terminée !");
      setSelectedTask(null);
      load();
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (task: Task, status: string) => {
    try {
      await projectsApi.updateTask(task.projectId, task.id, { status });
      load();
      if (selectedTask?.id === task.id) {
        setSelectedTask({ ...selectedTask, status });
      }
    } catch (err: unknown) {
      flash(setErrorMsg, err instanceof Error ? err.message : "Erreur");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-5 h-full overflow-y-auto">
      {errorMsg && (
        <div
          role="alert"
          className="fixed top-4 right-4 z-[100] max-w-sm card px-4 py-3 text-[13px] font-medium text-red-700 dark:text-red-400 flex items-center gap-2 animate-fade-in-up"
        >
          <span className="material-symbols-outlined shrink-0 text-[15px] text-red-500">error</span>
          <span className="min-w-0 flex-1">{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} aria-label="Fermer" className="shrink-0 p-0.5 text-neutral-400 hover:text-neutral-600">
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      )}
      {successMsg && (
        <div
          role="status"
          className="fixed top-4 right-4 z-[100] max-w-sm card px-4 py-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-2 animate-fade-in-up"
        >
          <span className="material-symbols-outlined shrink-0 text-[15px] text-emerald-600">check_circle</span>
          <span className="min-w-0 flex-1">{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} aria-label="Fermer" className="shrink-0 p-0.5 text-neutral-400 hover:text-neutral-600">
            <span className="material-symbols-outlined text-[15px]">close</span>
          </button>
        </div>
      )}
      <div className="mx-auto max-w-5xl">
        <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Mes Tâches</h1>
        <p className="mt-1 mb-5 text-[13px] text-neutral-500">
          Tâches qui vous ont été assignées. Complétez-les et uploadez les pièces jointes pour terminer l&apos;étape.
        </p>

        {loadError ? (
          <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="material-symbols-outlined mb-2 text-xl text-neutral-400">error</span>
            <p className="text-[13px] font-medium text-red-600 dark:text-red-400">Erreur lors du chargement des tâches</p>
            <button type="button" onClick={load} className="mt-2 text-[13px] font-medium text-[#0066B3] dark:text-blue-400 hover:underline">Réessayer</button>
          </div>
        ) : taskList.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-16 px-6 text-center">
            <span className="material-symbols-outlined mb-2 text-xl text-neutral-300 dark:text-neutral-600">assignment</span>
            <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">Aucune tâche assignée</p>
            <p className="mt-1 text-[12px] text-neutral-400">Les tâches vous seront assignées par le Responsable Innovation.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {taskList.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => selectTask(task)}
                className={`card w-full cursor-pointer p-4 text-left transition-colors ${
                  selectedTask?.id === task.id
                    ? "border-neutral-400 dark:border-neutral-600"
                    : "hover:border-neutral-300 dark:hover:border-neutral-600"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-neutral-900 dark:text-white">{task.title}</p>
                    <p className="mt-0.5 text-[12px] text-neutral-500">{task.projectName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                        {stageLabels[task.stage] || task.stage}
                      </span>
                      <span className={`badge ${statusColors[task.status] || ""}`}>
                        {statusLabels[task.status] || task.status}
                      </span>
                      {task.dueDate && (
                        <span className="text-[11px] text-neutral-400">
                          Échéance : {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                    </div>
                  </div>
                  {task.status !== "TERMINEE" && (
                    <select
                      value={task.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(task, e.target.value)}
                      className="filter-select shrink-0 text-[12px]"
                    >
                      <option value="A_FAIRE">À faire</option>
                      <option value="EN_COURS">En cours</option>
                      <option value="TERMINEE">Terminée</option>
                    </select>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Slide-over detail panel */}
        {selectedTask && (
          <>
            <div className="fixed inset-0 z-[55] bg-black/20 dark:bg-black/40" aria-hidden onClick={() => setSelectedTask(null)} />
            <div className="fixed right-0 top-0 z-[60] flex h-full w-full animate-slide-in-right sm:w-[400px]">
              <aside className="flex h-full w-full flex-col overflow-y-auto border-l border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113]">
                <div className="p-5">
                  <div className="mb-5 flex items-start justify-between gap-3">
                    <h3 className="flex-1 pr-2 text-[14px] font-medium text-neutral-900 dark:text-white">{selectedTask.title}</h3>
                    <button
                      type="button"
                      onClick={() => setSelectedTask(null)}
                      aria-label="Fermer"
                      className="btn-ghost !p-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>

                  <div className="mb-4 space-y-1.5 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                    <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Projet</p>
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-white">{selectedTask.projectName}</p>
                    {selectedTask.ideaTitle && <p className="text-[12px] text-neutral-500">{selectedTask.ideaTitle}</p>}
                    <p className="text-[11px] text-neutral-400 uppercase tracking-wide">
                      Étape : {stageLabels[selectedTask.stage] || selectedTask.stage}
                    </p>
                  </div>

                  {selectedTask.description && (
                    <div className="mb-4 border-b border-neutral-100 dark:border-neutral-800 pb-4">
                      <p className="mb-1 text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Description</p>
                      <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-300">{selectedTask.description}</p>
                    </div>
                  )}

                  <div className="mb-5">
                    <p className="mb-2 text-[11px] font-medium text-neutral-400 uppercase tracking-wide">Pièces jointes</p>
                    <div className="mb-3">
                      <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading || selectedTask.status === "TERMINEE"}
                        className="btn-ghost text-[13px]"
                      >
                        <span className={`material-symbols-outlined text-[15px] ${uploading ? "animate-spin" : ""}`}>{uploading ? "progress_activity" : "upload_file"}</span>
                        {uploading ? "Upload..." : "Ajouter un fichier"}
                      </button>
                    </div>
                    {docs.length === 0 ? (
                      <p className="text-[12px] text-neutral-400">Aucun document</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {docs.map((d) => (
                          <li key={d.id}>
                            <button
                              type="button"
                              onClick={() => downloadFile(d.id, d.fileName)}
                              className="card group flex w-full cursor-pointer items-center gap-3 p-2.5 text-left text-[13px] hover:border-neutral-300"
                            >
                              <span className="material-symbols-outlined shrink-0 text-[16px] text-neutral-400 group-hover:text-neutral-600">description</span>
                              <span className="min-w-0 flex-1 truncate font-medium text-neutral-700 dark:text-neutral-300">{d.fileName}</span>
                              <span className="shrink-0 text-[11px] text-neutral-400">{formatBytes(d.fileSizeBytes)}</span>
                              <span className="material-symbols-outlined shrink-0 text-[15px] text-neutral-400 group-hover:text-neutral-600">download</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {selectedTask.status !== "TERMINEE" && (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={actionLoading}
                      className="btn-primary w-full justify-center py-2.5"
                      style={{ background: "#059669" }}
                    >
                      {actionLoading ? "..." : "Marquer comme terminée"}
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
