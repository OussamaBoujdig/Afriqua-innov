"use client";

import { useEffect, useState, useCallback } from "react";
import { projects as projectsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProjectChat from "@/components/ProjectChat";

interface ProjectItem {
  id: string;
  name: string;
  currentStage: string;
  progressPercent: number;
}

const STAGE_LABELS: Record<string, string> = {
  EXPLORATION: "Exploration",
  CONCEPTUALISATION: "Conceptualisation",
  PILOTE: "Pilote",
  MISE_A_ECHELLE: "Mise à l'échelle",
};

export default function MessageriePage() {
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const res = await projectsApi.getMyTeamProjects();
      setProjects(res.data as ProjectItem[]);
    } catch {
      setProjects([]);
      setLoadError(true);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!authLoading && user) loadProjects();
  }, [authLoading, user, loadProjects]);

  if (loading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Project list */}
      <div className={`flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111113] ${
        selectedProject ? "hidden sm:flex w-64 shrink-0" : "flex-1 sm:w-64 sm:flex-none sm:shrink-0"
      }`}>
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Messagerie</h2>
          <p className="text-[12px] text-neutral-500 mt-0.5">{projects.length} projet{projects.length > 1 ? "s" : ""}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadError ? (
            <div className="text-center py-12 px-4">
              <p className="text-[13px] text-red-600">Erreur de chargement</p>
              <button onClick={loadProjects} className="mt-2 text-[13px] font-medium text-neutral-900 dark:text-white hover:underline">Réessayer</button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-[13px] text-neutral-500">Aucun projet</p>
              <p className="text-[12px] text-neutral-400 mt-1">Rejoignez une équipe pour accéder à la messagerie.</p>
            </div>
          ) : (
            projects.map((p) => (
              <button key={p.id} onClick={() => setSelectedProject(p)}
                className={`w-full text-left px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 transition-colors ${
                  selectedProject?.id === p.id ? "bg-neutral-50 dark:bg-neutral-800" : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                }`}>
                <div className="flex items-center gap-2.5">
                  <div className={`size-8 shrink-0 rounded-md flex items-center justify-center text-[12px] font-medium ${
                    selectedProject?.id === p.id
                      ? "bg-[#0066B3] text-white"
                      : "bg-slate-200 dark:bg-neutral-700 text-slate-600 dark:text-neutral-300"
                  }`}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{p.name}</p>
                    <p className="text-[11px] text-neutral-500">{STAGE_LABELS[p.currentStage] || p.currentStage}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className={`flex flex-col flex-1 min-w-0 ${selectedProject ? "flex" : "hidden sm:flex"}`}>
        {selectedProject ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-neutral-200 dark:border-neutral-800 sm:hidden">
              <button onClick={() => setSelectedProject(null)} className="text-[13px] font-medium text-neutral-900 dark:text-white flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Retour
              </button>
              <span className="text-[13px] text-neutral-500 truncate">{selectedProject.name}</span>
            </div>
            <div className="flex-1 overflow-hidden p-4">
              <ProjectChat projectId={selectedProject.id} />
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-col items-center justify-center h-full text-center p-8">
            <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Sélectionnez un projet</h3>
            <p className="mt-1 text-[13px] text-neutral-500 max-w-xs">
              Choisissez un projet pour accéder au chat d&apos;équipe.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
