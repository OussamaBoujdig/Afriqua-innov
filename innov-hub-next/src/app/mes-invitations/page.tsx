"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { projects as projectsApi, getToken, API_BASE } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

interface Invitation {
  id: string;
  projectId: string;
  projectName: string;
  ideaTitle: string | null;
  teamRole: string | null;
  status: "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "EXPIREE";
  invitedByName: string;
  invitedUserName: string | null;
  invitedUserId: string | null;
  responseDeadline: string | null;
  responseMessage: string | null;
  respondedAt: string | null;
  createdAt: string;
}

const STATUS_CFG: Record<string, { label: string; badgeClass: string }> = {
  EN_ATTENTE: {
    label: "En attente",
    badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  },
  ACCEPTEE: {
    label: "Acceptée",
    badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
  },
  REFUSEE: {
    label: "Refusée",
    badgeClass: "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400",
  },
  EXPIREE: {
    label: "Expirée",
    badgeClass: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
  },
};

export default function MesInvitationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [refuseModal, setRefuseModal] = useState<{ id: string; projectName: string } | null>(null);
  const [refuseMessage, setRefuseMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [filter, setFilter] = useState<"all" | "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "EXPIREE">("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isResponsable = user?.role === "RESPONSABLE_INNOVATION";

  const flash = (setter: (v: string) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(""), 4500);
  };

  const loadInvitations = useCallback(async () => {
    try {
      const res = isResponsable
        ? await projectsApi.getInvitationsSent()
        : await projectsApi.getMyInvitations();
      setInvitations(res.data as Invitation[]);
    } catch {
      flash(setErrorMsg, "Erreur lors du chargement des invitations");
    } finally {
      setLoading(false);
    }
  }, [isResponsable]);

  useEffect(() => {
    if (!authLoading && user) loadInvitations();
  }, [authLoading, user, loadInvitations]);

  const clientRef = useRef<Client | null>(null);
  useEffect(() => {
    if (isResponsable) return;
    const token = getToken();
    if (!user?.id || !token) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws`) as WebSocket,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/user/${user.id}/queue/invitations`, () => {
          loadInvitations();
        });
      },
    });
    client.activate();
    clientRef.current = client;

    return () => { client.deactivate(); clientRef.current = null; };
  }, [user?.id, loadInvitations, isResponsable]);

  const handleAccept = async (id: string) => {
    setActionLoading(true);
    setRespondingId(id);
    try {
      await projectsApi.respondToInvitation(id, { action: "ACCEPT" });
      flash(setSuccessMsg, "Invitation acceptée ! Vous faites maintenant partie de l'équipe.");
      await loadInvitations();
    } catch (e) {
      flash(setErrorMsg, e instanceof Error ? e.message : "Erreur lors de l'acceptation");
    } finally {
      setActionLoading(false);
      setRespondingId(null);
    }
  };

  const handleRefuse = async () => {
    if (!refuseModal) return;
    setActionLoading(true);
    setRespondingId(refuseModal.id);
    try {
      await projectsApi.respondToInvitation(refuseModal.id, { action: "REFUSE", message: refuseMessage || undefined });
      flash(setSuccessMsg, "Invitation refusée.");
      setRefuseModal(null);
      setRefuseMessage("");
      await loadInvitations();
    } catch (e) {
      flash(setErrorMsg, e instanceof Error ? e.message : "Erreur lors du refus");
    } finally {
      setActionLoading(false);
      setRespondingId(null);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm("Supprimer cette invitation ?")) return;
    setDeletingId(id);
    try {
      await projectsApi.deleteInvitation(id);
      flash(setSuccessMsg, "Invitation supprimée.");
      await loadInvitations();
    } catch (e) {
      flash(setErrorMsg, e instanceof Error ? e.message : "Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `Il y a ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Il y a ${hrs}h`;
    return `Il y a ${Math.floor(hrs / 24)}j`;
  };

  const deadlineInfo = (deadline: string | null) => {
    if (!deadline) return null;
    const d = new Date(deadline);
    const diffMs = d.getTime() - Date.now();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffMs < 0) return { text: "Délai dépassé", urgent: true };
    if (diffH < 24) return { text: `${diffH}h restantes`, urgent: true };
    return { text: `${Math.floor(diffH / 24)}j restants`, urgent: Math.floor(diffH / 24) <= 2 };
  };

  const filtered = filter === "all" ? invitations : invitations.filter((i) => i.status === filter);
  const pending = invitations.filter((i) => i.status === "EN_ATTENTE").length;

  const countByStatus = (s: string) => invitations.filter((i) => i.status === s).length;

  if (loading || authLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Alerts */}
      {successMsg && (
        <div className="mx-4 md:mx-6 mt-4 card px-4 py-3 flex items-center gap-2 animate-fade-in-up">
          <span className="material-symbols-outlined text-emerald-600 text-[15px]">check_circle</span>
          <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-400">{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="mx-4 md:mx-6 mt-4 card px-4 py-3 flex items-center gap-2 animate-fade-in-up">
          <span className="material-symbols-outlined text-red-500 text-[15px]">error</span>
          <span className="text-[13px] font-medium text-red-700 dark:text-red-400">{errorMsg}</span>
        </div>
      )}

      <div className="px-4 md:px-6 py-5 flex flex-col gap-4 flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                {isResponsable ? "Invitations envoyées" : "Mes Invitations"}
                {pending > 0 && !isResponsable && (
                  <span className="badge bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                    {pending}
                  </span>
                )}
              </h1>
              <p className="text-[13px] text-neutral-500 mt-0.5">
                {isResponsable
                  ? "Suivi des invitations que vous avez envoyées aux membres d'équipe"
                  : "Gérez vos invitations à rejoindre des équipes projets"}
              </p>
            </div>
            <button onClick={loadInvitations} className="btn-ghost text-[13px]">
              <span className="material-symbols-outlined text-[15px]">refresh</span>
              Actualiser
            </button>
          </div>

          {/* Filter tabs */}
          <div className="filter-tabs w-fit overflow-x-auto">
            {[
              { key: "all" as const, label: "Toutes", count: invitations.length },
              { key: "EN_ATTENTE" as const, label: "En attente", count: countByStatus("EN_ATTENTE") },
              { key: "ACCEPTEE" as const, label: "Acceptées", count: countByStatus("ACCEPTEE") },
              { key: "REFUSEE" as const, label: "Refusées", count: countByStatus("REFUSEE") },
              { key: "EXPIREE" as const, label: "Expirées", count: countByStatus("EXPIREE") },
            ].map((tab) => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`filter-tab${filter === tab.key ? " active" : ""}`}>
                {tab.label}
                {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
              </button>
            ))}
          </div>

          {/* Invitation list */}
          {filtered.length === 0 ? (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-xl text-neutral-300 dark:text-neutral-600 mb-2">
                {isResponsable ? "send" : "mail"}
              </span>
              <p className="text-[13px] font-medium text-neutral-700 dark:text-neutral-300">
                {filter === "all"
                  ? isResponsable ? "Aucune invitation envoyée" : "Aucune invitation"
                  : `Aucune invitation ${(STATUS_CFG as Record<string, { label: string }>)[filter]?.label.toLowerCase() || ""}`}
              </p>
              <p className="mt-1 text-[12px] text-neutral-400">
                {isResponsable
                  ? "Invitez des employés depuis les projets pour constituer vos équipes."
                  : "Les invitations à rejoindre des équipes projets apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((inv) => {
                const cfg = STATUS_CFG[inv.status];
                const dl = deadlineInfo(inv.responseDeadline);
                const isPending = inv.status === "EN_ATTENTE";
                return (
                  <div
                    key={inv.id}
                    className="card p-4 transition-colors hover:border-neutral-300 dark:hover:border-neutral-600"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white truncate">{inv.projectName}</h3>
                          <span className={`badge ${cfg.badgeClass}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {inv.ideaTitle && (
                          <p className="text-[12px] text-neutral-500 mt-0.5 truncate">Idée : {inv.ideaTitle}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          {inv.teamRole && (
                            <span className="badge bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                              {inv.teamRole}
                            </span>
                          )}
                          <span className="text-[11px] text-neutral-400">
                            {isResponsable
                              ? `Employé : ${inv.invitedUserName || "—"}`
                              : `Invité par ${inv.invitedByName}`}
                          </span>
                          <span className="text-[11px] text-neutral-400">{timeAgo(inv.createdAt)}</span>
                          {dl && (
                            <span className={`text-[11px] font-medium ${dl.urgent ? "text-red-500" : "text-neutral-500"}`}>
                              {dl.text}
                            </span>
                          )}
                        </div>
                        {inv.responseMessage && (inv.status === "REFUSEE") && (
                          <div className="mt-2 p-2 rounded-md bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/30">
                            <p className="text-[11px] text-red-600 dark:text-red-400">
                              <span className="font-medium">Justification :</span> {inv.responseMessage}
                            </p>
                          </div>
                        )}
                        {inv.respondedAt && inv.status !== "EN_ATTENTE" && (
                          <p className="text-[11px] text-neutral-400 mt-1">
                            Répondu le {new Date(inv.respondedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>

                      {isPending && !isResponsable && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleAccept(inv.id)}
                            disabled={actionLoading && respondingId === inv.id}
                            className="btn-primary text-[13px]"
                            style={{ background: "#059669" }}
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => setRefuseModal({ id: inv.id, projectName: inv.projectName })}
                            disabled={actionLoading && respondingId === inv.id}
                            className="btn-danger text-[13px]"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                      {isResponsable && (
                        <button
                          onClick={() => handleDeleteInvitation(inv.id)}
                          disabled={deletingId === inv.id}
                          className="btn-danger text-[13px] shrink-0"
                        >
                          <span className={`material-symbols-outlined text-[15px] ${deletingId === inv.id ? "animate-spin" : ""}`}>
                            {deletingId === inv.id ? "progress_activity" : "delete"}
                          </span>
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Refuse modal */}
      {refuseModal && (
        <>
          <div className="fixed inset-0 z-50 bg-black/30" onClick={() => { setRefuseModal(null); setRefuseMessage(""); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="card w-full max-w-md animate-fade-in-up">
              <div className="p-5 border-b border-neutral-100 dark:border-neutral-800">
                <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">
                  Refuser l&apos;invitation
                </h3>
                <p className="text-[12px] text-neutral-500 mt-1">
                  Projet : <strong className="text-neutral-900 dark:text-white">{refuseModal.projectName}</strong>
                </p>
              </div>
              <div className="p-5">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-1.5 block">
                  Justification
                </label>
                <textarea
                  value={refuseMessage}
                  onChange={(e) => setRefuseMessage(e.target.value)}
                  placeholder="Expliquez la raison de votre refus..."
                  rows={4}
                  className="search-input !h-auto !pl-3 !py-2 resize-none"
                />
              </div>
              <div className="p-5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => { setRefuseModal(null); setRefuseMessage(""); }}
                  className="btn-ghost text-[13px]"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRefuse}
                  disabled={actionLoading || !refuseMessage.trim()}
                  className="btn-danger text-[13px]"
                >
                  {actionLoading ? "Envoi..." : "Confirmer le refus"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
