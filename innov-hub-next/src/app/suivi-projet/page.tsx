"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { projects as projectsApi, users as usersApi, downloadFile } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import ProjectChat from "@/components/ProjectChat";
import { useProjectUpdates } from "@/hooks/useProjectUpdates";

interface UserOption { id: string; fullName: string; role: string; email: string; }
interface ProjectTaskItem { id: string; title: string; description: string | null; stage: string; status: string; assignedToId: string | null; assignedToName: string | null; createdByName: string; dueDate: string | null; createdAt: string; }
interface DocFile { id: string; fileName: string; fileType: string; fileSizeBytes: number; uploadedByName: string; taskId?: string; taskTitle?: string; createdAt: string; downloadUrl?: string; }
interface Deliverable { id: string; stage: string; title: string; isDone: boolean; doneAt: string | null; doneByName: string | null; sortOrder: number; }
interface TeamMember { id: string; userId: string; fullName: string; email: string; role: string; teamRole: string | null; department: string | null; avatarUrl: string | null; addedByName: string; addedAt: string; }
interface Project { id: string; name: string; description: string; currentStage: string; stageProgress: number; status: string; owner: { id: string; fullName: string }; dueDate: string; launchedAt: string; closedAt: string | null; ideaId: string; ideaTitle: string; deliverables: Deliverable[]; }

const stages = [
  { key: "EXPLORATION", label: "Exploration", icon: "search" },
  { key: "CONCEPTUALISATION", label: "Conceptualisation", icon: "lightbulb" },
  { key: "PILOTE", label: "Pilote", icon: "rocket" },
  { key: "MISE_A_ECHELLE", label: "Mise à l’échelle", icon: "trending_up" },
];

function getStageIdx(stage: string) { return Math.max(0, stages.findIndex((s) => s.key === stage)); }
function formatBytes(b: number) { return b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(1) + " KB" : (b / 1048576).toFixed(1) + " MB"; }
function fileIcon(t: string | null) { if (!t) return "description"; if (t.includes("pdf")) return "picture_as_pdf"; if (t.includes("image")) return "image"; if (t.includes("spreadsheet") || t.includes("excel")) return "table_chart"; if (t.includes("word") || t.includes("document")) return "article"; return "description"; }

const statusLabel: Record<string, string> = { A_FAIRE: "À faire", EN_COURS: "En cours", TERMINEE: "Terminée" };
const statusBadge: Record<string, string> = {
  A_FAIRE: "badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  EN_COURS: "badge bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  TERMINEE: "badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
};

export default function SuiviProjetPage() {
  const { isRole, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const isAdmin = isRole("RESPONSABLE_INNOVATION");

  useEffect(() => {
    if (!authLoading && user && !["RESPONSABLE_INNOVATION", "DIRECTEUR_BU", "DIRECTEUR_GENERAL"].includes(user.role)) {
      router.replace("/");
    }
  }, [authLoading, user, router]);
  const isDG = isRole("DIRECTEUR_GENERAL");

  const [projectList, setProjectList] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [docs, setDocs] = useState<DocFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [tasks, setTasks] = useState<ProjectTaskItem[]>([]);
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [activeTab, setActiveTab] = useState<"deliverables" | "tasks" | "team" | "chat" | "documents" | "details">("deliverables");

  const [showDelivForm, setShowDelivForm] = useState(false);
  const [delivTitle, setDelivTitle] = useState("");

  const [viewStageKey, setViewStageKey] = useState<string | null>(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignedToId: "", dueDate: "" });

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addMemberForm, setAddMemberForm] = useState({ userId: "", teamRole: "", responseDeadline: "" });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editRoleValue, setEditRoleValue] = useState("");

  const [projSearch, setProjSearch] = useState("");
  const [projFilterStage, setProjFilterStage] = useState<string>("ALL");
  const [projFilterStatus, setProjFilterStatus] = useState<string>("ALL");

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const flash = (setter: (v: string | null) => void, msg: string) => { setter(msg); setTimeout(() => setter(null), 4000); };
  const showError = (err: unknown) => { const m = err instanceof Error ? err.message : "Une erreur est survenue"; flash(setErrorMsg, m); };

  // ── Data loading ──
  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll(0, 100);
      const page = res.data as { content: Project[] };
      setProjectList(page.content || []);
    } catch (e) { showError(e); } finally { setLoading(false); }
  };

  const refreshSelected = async (id: string) => {
    try {
      const res = await projectsApi.getById(id);
      const p = res.data as Project;
      setSelected(p);
      setProjectList((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    } catch (e) { showError(e); }
  };

  const loadDocs = async (id: string) => { try { setDocs((await projectsApi.getDocuments(id)).data as DocFile[]); } catch { setDocs([]); } };
  const loadTasks = async (id: string) => { try { setTasks((await projectsApi.getTasks(id)).data as ProjectTaskItem[]); } catch { setTasks([]); } };
  const loadUsers = async () => { try { setAllUsers((await usersApi.getAll()).data as UserOption[]); } catch { setAllUsers([]); } };
  const loadTeam = async (id: string) => { try { setTeamMembers((await projectsApi.getTeam(id)).data as TeamMember[]); } catch { setTeamMembers([]); } };

  useEffect(() => { loadProjects(); loadUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Real-time project updates via WebSocket ──
  const handleProjectUpdate = useCallback((event: { type: string }) => {
    if (!selected) return;
    const id = selected.id;
    if (event.type === "TEAM_UPDATED") {
      loadTeam(id);
    } else if (event.type === "TASK_UPDATED") {
      loadTasks(id);
      refreshSelected(id);
    } else if (event.type === "DELIVERABLE_UPDATED" || event.type === "STAGE_ADVANCED" || event.type === "PROGRESS_UPDATED") {
      refreshSelected(id);
      loadTasks(id);
    } else if (event.type === "PROJECT_DELETED") {
      setSelected(null);
      loadProjects();
    } else {
      refreshSelected(id);
    }
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  useProjectUpdates(selected?.id, handleProjectUpdate);

  const selectProject = (p: Project) => {
    setSelected(p);
    setActiveTab("deliverables");
    setViewStageKey(null);
    setShowDelivForm(false);
    setShowTaskForm(false);
    setShowAddMember(false);
    loadDocs(p.id);
    loadTasks(p.id);
    loadTeam(p.id);
  };

  const goBack = () => {
    setSelected(null);
    setShowDelivForm(false);
    setShowTaskForm(false);
    loadProjects();
  };

  // ── Actions ──
  const advanceStage = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await projectsApi.advanceStage(selected.id);
      flash(setSuccessMsg, "Étape avancée avec succès !");
      await refreshSelected(selected.id);
      await loadTasks(selected.id);
    } catch (e) { showError(e); } finally { setActionLoading(false); }
  };

  const toggleDeliverable = async (delivId: string) => {
    if (!selected) return;
    try {
      await projectsApi.toggleDeliverable(selected.id, delivId);
      await refreshSelected(selected.id);
    } catch (e) { showError(e); }
  };

  const handleCreateDeliverable = async () => {
    if (!selected || !delivTitle.trim()) return;
    setActionLoading(true);
    try {
      await projectsApi.createDeliverable(selected.id, { title: delivTitle, stage: selected.currentStage });
      flash(setSuccessMsg, "Livrable créé !");
      setDelivTitle("");
      setShowDelivForm(false);
      await refreshSelected(selected.id);
    } catch (e) { showError(e); } finally { setActionLoading(false); }
  };

  const handleDeleteDeliverable = async (delivId: string) => {
    if (!selected) return;
    try {
      await projectsApi.deleteDeliverable(selected.id, delivId);
      await refreshSelected(selected.id);
    } catch (e) { showError(e); }
  };

  const handleCreateTask = async () => {
    if (!selected || !taskForm.title.trim()) return;
    setActionLoading(true);
    try {
      await projectsApi.createTask(selected.id, { title: taskForm.title, description: taskForm.description || undefined, stage: selected.currentStage, assignedToId: taskForm.assignedToId || undefined, dueDate: taskForm.dueDate || undefined });
      flash(setSuccessMsg, "Tâche créée !");
      setTaskForm({ title: "", description: "", assignedToId: "", dueDate: "" });
      setShowTaskForm(false);
      await loadTasks(selected.id);
    } catch (e) { showError(e); } finally { setActionLoading(false); }
  };

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    if (!selected) return;
    try {
      await projectsApi.updateTask(selected.id, taskId, { status });
      await loadTasks(selected.id);
      await refreshSelected(selected.id);
    } catch (e) { showError(e); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selected) return;
    try {
      await projectsApi.deleteTask(selected.id, taskId);
      await loadTasks(selected.id);
      await refreshSelected(selected.id);
    } catch (e) { showError(e); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selected) return;
    setUploading(true);
    try { await projectsApi.uploadDocument(selected.id, file); await loadDocs(selected.id); flash(setSuccessMsg, "Document uploadé !"); }
    catch (err) { showError(err); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  };

  const handleDeleteProject = async () => {
    if (!selected || !confirm("Voulez-vous vraiment supprimer ce projet ?")) return;
    setActionLoading(true);
    try {
      await projectsApi.delete(selected.id);
      flash(setSuccessMsg, "Projet supprimé !");
      setSelected(null);
      await loadProjects();
    } catch (e) { showError(e); } finally { setActionLoading(false); }
  };

  // ── Team actions ──
  const handleAddTeamMember = async () => {
    if (!selected || !addMemberForm.userId) return;
    setActionLoading(true);
    try {
      const deadlineISO = addMemberForm.responseDeadline
        ? new Date(addMemberForm.responseDeadline).toISOString()
        : undefined;
      await projectsApi.addTeamMember(selected.id, {
        userId: addMemberForm.userId,
        teamRole: addMemberForm.teamRole || undefined,
        responseDeadline: deadlineISO,
      });
      flash(setSuccessMsg, "Invitation envoyée avec succès !");
      setAddMemberForm({ userId: "", teamRole: "", responseDeadline: "" });
      setShowAddMember(false);
      await loadTeam(selected.id);
    } catch (e) { showError(e); } finally { setActionLoading(false); }
  };

  const handleUpdateTeamRole = async (memberId: string) => {
    if (!selected) return;
    try {
      await projectsApi.updateTeamMemberRole(selected.id, memberId, editRoleValue);
      flash(setSuccessMsg, "Rôle mis à jour !");
      setEditingMemberId(null);
      await loadTeam(selected.id);
    } catch (e) { showError(e); }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    if (!selected || !confirm("Retirer ce membre de l’équipe ?")) return;
    try {
      await projectsApi.removeTeamMember(selected.id, memberId);
      flash(setSuccessMsg, "Membre retiré de l’équipe");
      await loadTeam(selected.id);
    } catch (e) { showError(e); }
  };

  // ── Computed ──
  const filteredProjects = projectList.filter((p) => {
    const q = projSearch.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q) || p.ideaTitle?.toLowerCase().includes(q) || p.owner?.fullName?.toLowerCase().includes(q);
    const matchStage = projFilterStage === "ALL" || p.currentStage === projFilterStage;
    const matchStatus = projFilterStatus === "ALL" || p.status === projFilterStatus;
    return matchSearch && matchStage && matchStatus;
  });

  const stageIdx = selected ? getStageIdx(selected.currentStage) : 0;
  const activeViewStage = viewStageKey || (selected?.currentStage ?? stages[0].key);
  const viewStageIdx = getStageIdx(activeViewStage);
  const isViewingPastStage = selected ? viewStageIdx < stageIdx : false;
  const isViewingCurrentStage = activeViewStage === selected?.currentStage;

  const stageDeliverables = selected?.deliverables.filter((d) => d.stage === activeViewStage) || [];
  const stageTasks = tasks.filter((t) => t.stage === activeViewStage);
  const doneDelivs = stageDeliverables.filter((d) => d.isDone).length;
  const doneTasks = stageTasks.filter((t) => t.status === "TERMINEE").length;
  const totalItems = stageDeliverables.length + stageTasks.length;
  const doneItems = doneDelivs + doneTasks;
  const completionPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  const currentStageDelivs = selected?.deliverables.filter((d) => d.stage === selected.currentStage) || [];
  const currentStageTasks = tasks.filter((t) => selected && t.stage === selected.currentStage);
  const currentDoneDelivs = currentStageDelivs.filter((d) => d.isDone).length;
  const currentDoneTasks = currentStageTasks.filter((t) => t.status === "TERMINEE").length;
  const currentTotalItems = currentStageDelivs.length + currentStageTasks.length;
  const currentDoneItems = currentDoneDelivs + currentDoneTasks;
  const currentCompletionPct = currentTotalItems > 0 ? Math.round((currentDoneItems / currentTotalItems) * 100) : 0;
  const isProjectFinished = selected?.status === "TERMINEE";
  const canAdvance = !isProjectFinished && currentCompletionPct === 100 && currentTotalItems > 0;

  const inputClass = "w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] px-3 text-[13px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-colors";
  const selectClass = "w-full h-8 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] px-2 text-[13px] text-neutral-600 dark:text-neutral-300 focus:outline-none focus:border-neutral-900 dark:focus:border-white cursor-pointer";

  // ── Toast ──
  const Toast = () => (
    <>
      {errorMsg && (
        <div className="card fixed top-4 right-4 z-[100] max-w-sm px-4 py-3 shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-red-500 text-base">error</span>
          <span className="flex-1 text-[13px] text-red-600 font-medium">{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)}><span className="material-symbols-outlined text-sm text-neutral-400 hover:text-neutral-600">close</span></button>
        </div>
      )}
      {successMsg && (
        <div className="card fixed top-4 right-4 z-[100] max-w-sm px-4 py-3 shadow-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>
          <span className="flex-1 text-[13px] text-neutral-900 dark:text-white font-medium">{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)}><span className="material-symbols-outlined text-sm text-neutral-400 hover:text-neutral-600">close</span></button>
        </div>
      )}
    </>
  );

  // ── Loading ──
  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Toast />
      <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
    </div>
  );

  // ── PROJECT LIST VIEW ──
  if (!selected) return (
    <div className="h-full overflow-y-auto">
      <Toast />
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-6 py-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Suivi des Projets</h1>
            <p className="text-[13px] text-neutral-500 mt-1">Tous les projets issus d&apos;idées approuvées et clôturées</p>
          </div>
          <span className="text-[13px] text-neutral-500 tabular-nums">{filteredProjects.length} projet{filteredProjects.length !== 1 ? "s" : ""}</span>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">search</span>
            <input
              type="text"
              value={projSearch}
              onChange={(e) => setProjSearch(e.target.value)}
              placeholder="Rechercher par nom, description ou responsable…"
              aria-label="Rechercher un projet"
              className="search-input pl-9"
            />
            {projSearch && (
              <button onClick={() => setProjSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <select value={projFilterStage} onChange={(e) => setProjFilterStage(e.target.value)}
            aria-label="Filtrer par étape" className="filter-select min-w-[150px]">
            <option value="ALL">Toutes les étapes</option>
            {stages.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <select value={projFilterStatus} onChange={(e) => setProjFilterStatus(e.target.value)}
            aria-label="Filtrer par statut" className="filter-select min-w-[130px]">
            <option value="ALL">Tous les statuts</option>
            <option value="EN_COURS">En cours</option>
            <option value="TERMINEE">Terminé</option>
          </select>
        </div>

        {/* Active filters */}
        {(projSearch || projFilterStage !== "ALL" || projFilterStatus !== "ALL") && (
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-[12px] text-neutral-500">{filteredProjects.length} résultat{filteredProjects.length !== 1 ? "s" : ""}</span>
            {projSearch && (
              <span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 gap-1">
                &quot;{projSearch}&quot;
                <button onClick={() => setProjSearch("")}><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {projFilterStage !== "ALL" && (
              <span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 gap-1">
                {stages.find((s) => s.key === projFilterStage)?.label}
                <button onClick={() => setProjFilterStage("ALL")}><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            {projFilterStatus !== "ALL" && (
              <span className="badge bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 gap-1">
                {projFilterStatus === "EN_COURS" ? "En cours" : "Terminé"}
                <button onClick={() => setProjFilterStatus("ALL")}><span className="material-symbols-outlined text-[11px]">close</span></button>
              </span>
            )}
            <button onClick={() => { setProjSearch(""); setProjFilterStage("ALL"); setProjFilterStatus("ALL"); }} className="text-[12px] text-neutral-400 hover:text-[#0066B3] dark:hover:text-blue-400 font-medium ml-1">
              Réinitialiser
            </button>
          </div>
        )}

        {projectList.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-neutral-300 dark:text-neutral-600 text-4xl">folder_open</span>
            <p className="text-[13px] text-neutral-500 mt-3 font-medium">Aucun projet en cours.</p>
            <p className="text-[12px] text-neutral-400 mt-1">Les projets sont créés automatiquement lorsqu&apos;une idée est clôturée sur le tableau d&apos;approbation.</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-neutral-300 dark:text-neutral-600 text-4xl">search_off</span>
            <p className="text-[13px] text-neutral-500 mt-3 font-medium">Aucun projet ne correspond à vos critères.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredProjects.map((p) => {
              const idx = getStageIdx(p.currentStage);
              const s = stages[idx];
              return (
                <button
                  key={p.id}
                  onClick={() => selectProject(p)}
                  className="card text-left p-4 hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-3">
                    {p.status === "TERMINEE" ? (
                      <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Terminé</span>
                    ) : (
                      <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{s.label}</span>
                    )}
                    <span className="ml-auto text-[11px] text-neutral-400 tabular-nums">{p.status === "TERMINEE" ? "" : `Étape ${idx + 1}/${stages.length}`}</span>
                  </div>
                  <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white mb-1 truncate">{p.name}</h3>
                  <p className="text-[12px] text-neutral-500 line-clamp-2 mb-3">{p.description || p.ideaTitle}</p>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${p.stageProgress}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-neutral-500 tabular-nums">{p.stageProgress}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">person</span>{p.owner?.fullName || "N/A"}</span>
                    <span>{p.launchedAt ? new Date(p.launchedAt).toLocaleDateString("fr-FR") : ""}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── PROJECT DETAIL VIEW ──
  return (
    <div className="h-full overflow-y-auto">
      <Toast />
      <div className="max-w-[1200px] mx-auto w-full px-4 lg:px-6 py-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div className="space-y-1">
            <button onClick={goBack} className="flex items-center gap-1 text-neutral-500 hover:text-[#0066B3] dark:hover:text-blue-400 text-[13px] font-medium mb-2 transition-colors">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Tous les projets
            </button>
            <p className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide">
              {isProjectFinished ? "Projet terminé" : "Projet actif"}
            </p>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">{selected.name}</h1>
            <p className="text-[13px] text-neutral-500">{selected.description || selected.ideaTitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isDG && (
              <button onClick={handleDeleteProject} disabled={actionLoading} className="btn-danger shrink-0">
                <span className="material-symbols-outlined text-sm">delete</span>
                Supprimer
              </button>
            )}
            {isAdmin && !isProjectFinished && (
              <button onClick={advanceStage} disabled={actionLoading || !canAdvance}
                title={!canAdvance ? "Terminez tous les livrables et tâches de cette étape" : ""}
                className="btn-primary shrink-0">
                <span className="material-symbols-outlined text-sm">skip_next</span>
                {actionLoading ? "..." : stageIdx >= stages.length - 1 ? "Terminer le projet" : "Étape suivante"}
              </button>
            )}
            {isProjectFinished && (
              <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 py-1 px-3 text-[13px]">
                <span className="material-symbols-outlined text-sm mr-1">check_circle</span>
                Terminé
              </span>
            )}
          </div>
        </div>

        {/* Stage pipeline */}
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-1">
            {stages.map((s, i) => {
              const isClickable = isProjectFinished || i <= stageIdx;
              const isViewing = s.key === activeViewStage;
              const isCompleted = isProjectFinished || i < stageIdx;
              const isCurrent = !isProjectFinished && i === stageIdx;
              return (
                <div key={s.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => isClickable && setViewStageKey(s.key)}
                    disabled={!isClickable}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors whitespace-nowrap ${
                      isViewing
                        ? "bg-[#0066B3] text-white dark:bg-blue-400 dark:text-white"
                        : isCompleted
                          ? "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                          : isCurrent
                            ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            : "text-neutral-400 dark:text-neutral-600 cursor-default"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">{isCompleted && !isViewing ? "check" : s.icon}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < stages.length - 1 && (
                    <div className={`flex-1 h-px mx-1 ${i < stageIdx ? "bg-neutral-400 dark:bg-neutral-500" : "bg-neutral-200 dark:bg-neutral-700"}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Past stage banner */}
        {isViewingPastStage && (
          <div className="card mb-4 px-4 py-2.5 flex items-center justify-between bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <span className="flex items-center gap-2 text-[12px] text-amber-700 dark:text-amber-400 font-medium">
              <span className="material-symbols-outlined text-sm">history</span>
              Vous consultez l&apos;étape passée : {stages[viewStageIdx]?.label}
            </span>
            <button onClick={() => setViewStageKey(null)} className="text-[12px] font-medium text-[#0066B3] dark:text-blue-400 hover:underline">
              Revenir à l&apos;étape actuelle
            </button>
          </div>
        )}

        {/* Progress bar */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-neutral-900 dark:text-white">Progression {stages[viewStageIdx]?.label}</span>
              {isViewingPastStage && <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">Étape passée</span>}
            </div>
            <span className="text-[13px] font-medium text-neutral-900 dark:text-white tabular-nums">{completionPct}%</span>
          </div>
          <div className="h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all duration-500" style={{ width: `${completionPct}%` }} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[12px] text-neutral-500">{doneItems}/{totalItems} éléments terminés ({doneDelivs} livrables, {doneTasks} tâches)</span>
            {canAdvance && (
              <span className="text-[12px] font-medium text-emerald-600 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Prêt pour l&apos;étape suivante
              </span>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs mb-4 w-fit max-w-full overflow-x-auto">
          {([
            { key: "deliverables" as const, label: "Livrables", icon: "checklist", count: stageDeliverables.length },
            { key: "tasks" as const, label: "Tâches", icon: "task_alt", count: stageTasks.length },
            { key: "team" as const, label: "Équipe", icon: "groups", count: teamMembers.length },
            { key: "chat" as const, label: "Chat", icon: "chat", count: undefined },
            { key: "documents" as const, label: "Documents", icon: "folder", count: docs.length },
            { key: "details" as const, label: "Détails", icon: "info" },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`filter-tab${activeTab === tab.key ? " active" : ""}`}>
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
              {"count" in tab && tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">

            {/* ── DELIVERABLES TAB ── */}
            {activeTab === "deliverables" && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                    Livrables — {stages[viewStageIdx]?.label}
                    {isViewingPastStage && <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Terminé</span>}
                  </h2>
                  {isAdmin && isViewingCurrentStage && !isProjectFinished && (
                    <button onClick={() => setShowDelivForm(!showDelivForm)} className="btn-primary">
                      <span className="material-symbols-outlined text-sm">{showDelivForm ? "close" : "add"}</span>
                      {showDelivForm ? "Annuler" : "Nouveau livrable"}
                    </button>
                  )}
                </div>

                {showDelivForm && isAdmin && isViewingCurrentStage && !isProjectFinished && (
                  <div className="card mb-4 p-4 flex gap-2">
                    <input type="text" value={delivTitle} onChange={(e) => setDelivTitle(e.target.value)} placeholder="Titre du livrable *"
                      className={`${inputClass} flex-1`}
                      onKeyDown={(e) => e.key === "Enter" && handleCreateDeliverable()} />
                    <button onClick={handleCreateDeliverable} disabled={actionLoading || !delivTitle.trim()} className="btn-primary shrink-0">
                      {actionLoading ? "..." : "Créer"}
                    </button>
                  </div>
                )}

                {stageDeliverables.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-3xl text-neutral-300 dark:text-neutral-600">checklist</span>
                    <p className="text-[13px] text-neutral-500 mt-2">Aucun livrable pour cette étape.</p>
                    {isAdmin && <p className="text-[12px] text-neutral-400 mt-1">Créez des livrables pour suivre la progression.</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stageDeliverables.sort((a, b) => a.sortOrder - b.sortOrder).map((d) => (
                      <div key={d.id} className={`flex items-center gap-3 p-3 rounded-md border transition-colors ${d.isDone ? "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800" : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"}`}>
                        {isAdmin ? (
                          <button onClick={() => toggleDeliverable(d.id)}
                            className={`size-5 flex items-center justify-center rounded shrink-0 border transition-colors ${d.isDone ? "bg-[#0066B3] dark:bg-blue-400 border-[#0066B3] dark:border-blue-400 text-white" : "border-neutral-300 dark:border-neutral-600 hover:border-[#0066B3] dark:hover:border-blue-400"}`}>
                            {d.isDone && <span className="material-symbols-outlined text-[13px]">check</span>}
                          </button>
                        ) : (
                          <div className={`size-5 flex items-center justify-center rounded shrink-0 border ${d.isDone ? "bg-[#0066B3] dark:bg-blue-400 border-[#0066B3] dark:border-blue-400 text-white" : "border-neutral-300 dark:border-neutral-600"}`}>
                            {d.isDone && <span className="material-symbols-outlined text-[13px]">check</span>}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] ${d.isDone ? "text-neutral-400 line-through" : "text-neutral-900 dark:text-white"}`}>{d.title}</p>
                          {d.isDone && d.doneByName && (
                            <p className="text-[11px] text-neutral-400 mt-0.5">Fait par {d.doneByName} {d.doneAt ? `le ${new Date(d.doneAt).toLocaleDateString("fr-FR")}` : ""}</p>
                          )}
                        </div>
                        {isAdmin && !d.isDone && (
                          <button onClick={() => handleDeleteDeliverable(d.id)}
                            className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors shrink-0">
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* All stages overview */}
                <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide mb-3">Vue d&apos;ensemble des étapes</h3>
                  <div className="space-y-2">
                    {stages.map((s, i) => {
                      const sd = selected.deliverables.filter((d) => d.stage === s.key);
                      const done = sd.filter((d) => d.isDone).length;
                      const total = sd.length;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                        <div key={s.key} className="flex items-center gap-3">
                          <span className={`material-symbols-outlined text-sm ${i <= stageIdx ? "text-[#0066B3] dark:text-blue-400" : "text-neutral-300 dark:text-neutral-600"}`}>{s.icon}</span>
                          <span className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300 w-32 shrink-0">{s.label}</span>
                          <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${i < stageIdx ? "bg-emerald-500" : "bg-[#0066B3] dark:bg-blue-400"}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-500 w-10 text-right tabular-nums">{done}/{total}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── TASKS TAB ── */}
            {activeTab === "tasks" && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                    Tâches — {stages[viewStageIdx]?.label}
                    {isViewingPastStage && <span className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">Terminé</span>}
                  </h2>
                  {isAdmin && isViewingCurrentStage && !isProjectFinished && (
                    <button onClick={() => setShowTaskForm(!showTaskForm)} className="btn-primary">
                      <span className="material-symbols-outlined text-sm">{showTaskForm ? "close" : "add"}</span>
                      {showTaskForm ? "Annuler" : "Nouvelle tâche"}
                    </button>
                  )}
                </div>

                {showTaskForm && isAdmin && isViewingCurrentStage && !isProjectFinished && (
                  <div className="card mb-4 p-4 space-y-3">
                    <input type="text" value={taskForm.title} onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Titre de la tâche *"
                      className={inputClass} />
                    <textarea value={taskForm.description} onChange={(e) => setTaskForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description (optionnel)" rows={2}
                      className="w-full rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] px-3 py-2 text-[13px] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white resize-none transition-colors" />
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-medium text-neutral-500 uppercase mb-1 block">Assigner à</label>
                        <select value={taskForm.assignedToId} onChange={(e) => setTaskForm((f) => ({ ...f, assignedToId: e.target.value }))}
                          className={selectClass}>
                          <option value="">Non assigné</option>
                          {teamMembers.map((m) => <option key={m.userId} value={m.userId}>{m.fullName}{m.teamRole ? ` — ${m.teamRole}` : ""}</option>)}
                        </select>
                        {teamMembers.length === 0 && (
                          <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">warning</span>
                            Ajoutez d&apos;abord des membres dans l&apos;onglet Équipe
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-neutral-500 uppercase mb-1 block">Échéance</label>
                        <input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm((f) => ({ ...f, dueDate: e.target.value }))}
                          className={inputClass} />
                      </div>
                    </div>
                    <button onClick={handleCreateTask} disabled={actionLoading || !taskForm.title.trim()} className="btn-primary w-full justify-center">
                      {actionLoading ? "Création..." : "Créer la tâche"}
                    </button>
                  </div>
                )}

                {stageTasks.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-3xl text-neutral-300 dark:text-neutral-600">assignment</span>
                    <p className="text-[13px] text-neutral-500 mt-2">Aucune tâche pour cette étape.</p>
                    {isAdmin && <p className="text-[12px] text-neutral-400 mt-1">Créez des tâches et assignez-les aux membres de l&apos;équipe.</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {stageTasks.map((task) => (
                      <div key={task.id} className="p-3 rounded-md border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{task.title}</p>
                              <span className={statusBadge[task.status] || "badge"}>{statusLabel[task.status] || task.status}</span>
                            </div>
                            {task.description && <p className="text-[12px] text-neutral-500 mb-1.5 line-clamp-2">{task.description}</p>}
                            <div className="flex items-center gap-3 text-[11px] text-neutral-400">
                              {task.assignedToName && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">person</span>{task.assignedToName}</span>}
                              {task.dueDate && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">event</span>{new Date(task.dueDate).toLocaleDateString("fr-FR")}</span>}
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{new Date(task.createdAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {task.status !== "TERMINEE" && (
                              <select value={task.status} onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                                className="h-7 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] px-1.5 text-[11px] text-neutral-600 dark:text-neutral-300 focus:outline-none">
                                <option value="A_FAIRE">À faire</option>
                                <option value="EN_COURS">En cours</option>
                                <option value="TERMINEE">Terminée</option>
                              </select>
                            )}
                            {task.status === "TERMINEE" && <span className="material-symbols-outlined text-emerald-600 text-base">check_circle</span>}
                            {isAdmin && (
                              <button onClick={() => handleDeleteTask(task.id)}
                                className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All tasks summary */}
                {tasks.length > stageTasks.length && (
                  <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide mb-2">Toutes les tâches du projet</h3>
                    <div className="space-y-1.5">
                      {stages.map((s) => {
                        const st = tasks.filter((t) => t.stage === s.key);
                        const done = st.filter((t) => t.status === "TERMINEE").length;
                        return st.length > 0 ? (
                          <div key={s.key} className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-sm ${s.key === selected.currentStage ? "text-[#0066B3] dark:text-blue-400" : "text-neutral-300 dark:text-neutral-600"}`}>{s.icon}</span>
                            <span className="text-[12px] font-medium text-neutral-700 dark:text-neutral-300 w-32 shrink-0">{s.label}</span>
                            <div className="flex-1 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${(done / st.length) * 100}%` }} />
                            </div>
                            <span className="text-[11px] font-medium text-neutral-500 w-10 text-right tabular-nums">{done}/{st.length}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── TEAM TAB ── */}
            {activeTab === "team" && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                    Équipe du projet
                    <span className="badge bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">{teamMembers.length}</span>
                  </h2>
                  {isAdmin && !isProjectFinished && (
                    <button onClick={() => setShowAddMember(!showAddMember)} className="btn-primary">
                      <span className="material-symbols-outlined text-sm">{showAddMember ? "close" : "person_add"}</span>
                      {showAddMember ? "Annuler" : "Ajouter un membre"}
                    </button>
                  )}
                </div>

                {showAddMember && isAdmin && !isProjectFinished && (
                  <div className="card mb-4 p-4 space-y-3">
                    <div>
                      <label className="text-[11px] font-medium text-neutral-500 uppercase mb-1 block">Employé</label>
                      <select value={addMemberForm.userId} onChange={(e) => setAddMemberForm((f) => ({ ...f, userId: e.target.value }))}
                        className={selectClass}>
                        <option value="">Sélectionner un employé...</option>
                        {allUsers
                          .filter((u) => !teamMembers.some((m) => m.userId === u.id))
                          .map((u) => <option key={u.id} value={u.id}>{u.fullName} — {u.email}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-neutral-500 uppercase mb-1 block">Rôle dans le projet (optionnel)</label>
                      <input type="text" value={addMemberForm.teamRole} onChange={(e) => setAddMemberForm((f) => ({ ...f, teamRole: e.target.value }))}
                        placeholder="Ex: Chef de projet, Développeur, Analyste..."
                        className={inputClass} />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-neutral-500 uppercase mb-1 block">Délai de réponse (optionnel)</label>
                      <input type="datetime-local" value={addMemberForm.responseDeadline} onChange={(e) => setAddMemberForm((f) => ({ ...f, responseDeadline: e.target.value }))}
                        className={inputClass} />
                      <p className="text-[11px] text-neutral-400 mt-1">L&apos;employé devra accepter ou refuser avant cette date</p>
                    </div>
                    <button onClick={handleAddTeamMember} disabled={actionLoading || !addMemberForm.userId} className="btn-primary w-full justify-center">
                      {actionLoading ? "Envoi..." : "Envoyer l’invitation"}
                    </button>
                  </div>
                )}

                {teamMembers.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-3xl text-neutral-300 dark:text-neutral-600">group_off</span>
                    <p className="text-[13px] text-neutral-500 mt-2">Aucun membre dans l&apos;équipe.</p>
                    {isAdmin && <p className="text-[12px] text-neutral-400 mt-1">Ajoutez des employés pour constituer l&apos;équipe projet.</p>}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {teamMembers.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 p-3 rounded-md border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                        <div className="size-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-medium text-[12px] shrink-0">
                          {m.fullName.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[13px] font-medium text-neutral-900 dark:text-white truncate">{m.fullName}</p>
                            {m.teamRole && editingMemberId !== m.id && (
                              <span className="badge bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">{m.teamRole}</span>
                            )}
                          </div>
                          {editingMemberId === m.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input type="text" value={editRoleValue} onChange={(e) => setEditRoleValue(e.target.value)}
                                placeholder="Rôle dans le projet"
                                className={`${inputClass} flex-1 !h-7`}
                                onKeyDown={(e) => e.key === "Enter" && handleUpdateTeamRole(m.id)} />
                              <button onClick={() => handleUpdateTeamRole(m.id)}
                                className="btn-primary !py-1 !px-2">
                                <span className="material-symbols-outlined text-sm">check</span>
                              </button>
                              <button onClick={() => setEditingMemberId(null)}
                                className="btn-ghost !py-1 !px-2">
                                <span className="material-symbols-outlined text-sm">close</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                              <span>{m.email}</span>
                              {m.department && <><span>&middot;</span><span>{m.department}</span></>}
                              <span>&middot;</span>
                              <span>Ajouté le {new Date(m.addedAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                          )}
                        </div>
                        {isAdmin && editingMemberId !== m.id && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => { setEditingMemberId(m.id); setEditRoleValue(m.teamRole || ""); }}
                              aria-label="Modifier le rôle"
                              className="size-7 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#0066B3] dark:hover:text-blue-400 transition-colors">
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button onClick={() => handleRemoveTeamMember(m.id)}
                              aria-label="Retirer de l'équipe"
                              className="size-7 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors">
                              <span className="material-symbols-outlined text-sm">person_remove</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── CHAT TAB ── */}
            {activeTab === "chat" && selected && (
              <ProjectChat projectId={selected.id} />
            )}

            {/* ── DOCUMENTS TAB ── */}
            {activeTab === "documents" && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Documents du projet</h2>
                  <div>
                    <input ref={fileRef} type="file" onChange={handleUpload} className="hidden" />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading} className="btn-primary">
                      <span className="material-symbols-outlined text-sm">{uploading ? "progress_activity" : "upload_file"}</span>
                      {uploading ? "Upload..." : "Ajouter un fichier"}
                    </button>
                  </div>
                </div>
                {docs.length === 0 ? (
                  <div className="text-center py-10">
                    <span className="material-symbols-outlined text-3xl text-neutral-300 dark:text-neutral-600">cloud_upload</span>
                    <p className="text-[13px] text-neutral-500 mt-2">Aucun document. Ajoutez des fichiers pour ce projet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {docs.map((d) => (
                      <button key={d.id} onClick={() => downloadFile(d.id, d.fileName)}
                        className="w-full flex items-center gap-3 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors text-left group first:pt-0 last:pb-0">
                        <div className="size-9 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-neutral-500 text-lg">{fileIcon(d.fileType)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#0066B3] dark:text-blue-400 truncate group-hover:text-[#005299] dark:group-hover:text-blue-300">{d.fileName}</p>
                          <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                            <span>{formatBytes(d.fileSizeBytes)}</span>
                            <span>&middot;</span>
                            <span>par {d.uploadedByName}</span>
                            {d.taskTitle && (
                              <>
                                <span>&middot;</span>
                                <span className="text-neutral-600 dark:text-neutral-300 font-medium">Tâche : {d.taskTitle}</span>
                              </>
                            )}
                            <span>&middot;</span>
                            <span>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</span>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 text-sm shrink-0">download</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DETAILS TAB ── */}
            {activeTab === "details" && (
              <div className="card p-5">
                <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white mb-4">Détails du projet</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
                      <div className="size-8 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300"><span className="material-symbols-outlined text-base">person</span></div>
                      <div><p className="text-[11px] text-neutral-500">Responsable</p><p className="text-[13px] font-medium text-neutral-900 dark:text-white">{selected.owner?.fullName || "N/A"}</p></div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
                      <div className="size-8 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300"><span className="material-symbols-outlined text-base">calendar_today</span></div>
                      <div><p className="text-[11px] text-neutral-500">Lancé le</p><p className="text-[13px] font-medium text-neutral-900 dark:text-white">{selected.launchedAt ? new Date(selected.launchedAt).toLocaleDateString("fr-FR") : "N/A"}</p></div>
                    </div>
                    {selected.dueDate && (
                      <div className="flex items-center gap-3 p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
                        <div className="size-8 rounded-md bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300"><span className="material-symbols-outlined text-base">event</span></div>
                        <div><p className="text-[11px] text-neutral-500">Échéance</p><p className="text-[13px] font-medium text-neutral-900 dark:text-white">{new Date(selected.dueDate).toLocaleDateString("fr-FR")}</p></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
                      <p className="text-[11px] text-neutral-500 font-medium uppercase mb-1">Idée d&apos;origine</p>
                      <p className="text-[13px] font-medium text-neutral-900 dark:text-white">{selected.ideaTitle}</p>
                      <p className="text-[11px] text-neutral-400 mt-1">Créé automatiquement lors de la clôture.</p>
                    </div>
                    <div className="p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
                      <p className="text-[11px] text-neutral-500 font-medium uppercase mb-1">Progression globale</p>
                      <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-[#0066B3] dark:bg-blue-400 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
                      </div>
                      <p className="text-[13px] text-neutral-900 dark:text-white font-medium text-center mt-2 tabular-nums">{completionPct}%</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="space-y-4">
            <div className="card p-4">
              <h3 className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide mb-3">{isViewingPastStage ? "Étape consultée" : "Étape actuelle"}</h3>
              <div className="p-3 rounded-md bg-[#0066B3] dark:bg-blue-400 text-white">
                <span className="material-symbols-outlined text-xl mb-1">{stages[viewStageIdx]?.icon}</span>
                <p className="text-[13px] font-semibold">{stages[viewStageIdx]?.label}</p>
                <p className="text-[12px] opacity-70 mt-0.5">Étape {viewStageIdx + 1} sur {stages.length}</p>
                {isViewingPastStage && <p className="text-[11px] font-medium mt-0.5 opacity-80">Étape terminée</p>}
              </div>
            </div>

            <div className="card p-4">
              <h3 className="text-[12px] font-medium text-neutral-500 uppercase tracking-wide mb-3">Résumé</h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Livrables (étape)</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{doneDelivs}/{stageDeliverables.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Tâches (étape)</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{doneTasks}/{stageTasks.length}</span></div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Livrables totaux</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{selected.deliverables.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Tâches totales</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{tasks.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Membres équipe</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{teamMembers.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Documents</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white tabular-nums">{docs.length}</span></div>
                <hr className="border-neutral-200 dark:border-neutral-800" />
                <div className="flex items-center justify-between"><span className="text-[12px] text-neutral-500">Responsable</span><span className="text-[12px] font-medium text-neutral-900 dark:text-white">{selected.owner?.fullName || "N/A"}</span></div>
              </div>
            </div>

            {/* Advance stage card */}
            {isProjectFinished ? (
              <div className="card p-4 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800">
                <h3 className="text-[12px] font-medium text-emerald-700 dark:text-emerald-400 uppercase mb-2">Projet Terminé</h3>
                <p className="text-[12px] text-emerald-700 dark:text-emerald-400">Toutes les étapes ont été complétées avec succès.</p>
                {selected.closedAt && (
                  <p className="text-[11px] text-neutral-500 mt-2">Clôturé le {new Date(selected.closedAt).toLocaleDateString("fr-FR")}</p>
                )}
              </div>
            ) : isAdmin && (
              <div className={`card p-4 ${canAdvance ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" : ""}`}>
                <h3 className="text-[12px] font-medium text-neutral-500 uppercase mb-2">Avancement</h3>
                {canAdvance ? (
                  <>
                    <p className="text-[12px] text-emerald-700 dark:text-emerald-400 font-medium mb-2">Tous les éléments sont terminés. Vous pouvez avancer.</p>
                    <button onClick={advanceStage} disabled={actionLoading} className="btn-primary w-full justify-center">
                      <span className="material-symbols-outlined text-sm">skip_next</span>
                      {stageIdx >= stages.length - 1 ? "Terminer le projet" : `Passer à ${stages[stageIdx + 1]?.label}`}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-neutral-500 mb-1">Pour avancer, terminez :</p>
                    <ul className="text-[11px] text-neutral-400 space-y-0.5">
                      {currentStageDelivs.filter((d) => !d.isDone).length > 0 && (
                        <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-amber-500">pending</span>{currentStageDelivs.filter((d) => !d.isDone).length} livrable(s)</li>
                      )}
                      {currentStageTasks.filter((t) => t.status !== "TERMINEE").length > 0 && (
                        <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-amber-500">pending</span>{currentStageTasks.filter((t) => t.status !== "TERMINEE").length} tâche(s)</li>
                      )}
                      {currentTotalItems === 0 && <li className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px] text-neutral-400">info</span>Créez au moins un livrable ou une tâche</li>}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
