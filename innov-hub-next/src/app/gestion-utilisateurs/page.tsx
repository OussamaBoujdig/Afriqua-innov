"use client";

import { useEffect, useState } from "react";
import { users as usersApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface UserItem {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  businessUnit: string | null;
  department: string | null;
  avatarUrl: string | null;
  points: number;
}

const ROLES = [
  { value: "PORTEUR_IDEE", label: "Porteur d'idée", color: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" },
  { value: "RESPONSABLE_INNOVATION", label: "Resp. Innovation", color: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" },
  { value: "DIRECTEUR_BU", label: "Directeur BU", color: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  { value: "DIRECTEUR_GENERAL", label: "Directeur Général", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
];

function roleBadge(role: string) {
  const r = ROLES.find((x) => x.value === role);
  return r ? r : { label: role, color: "bg-neutral-100 text-neutral-600" };
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();
}

const inputClass =
  "w-full h-9 px-3 rounded-md border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#111113] text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-900 dark:focus:border-neutral-400";

export default function GestionUtilisateursPage() {
  const { user: me } = useAuth();
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  const [createForm, setCreateForm] = useState({
    firstName: "", lastName: "", email: "", password: "", role: "PORTEUR_IDEE", businessUnit: "", department: "",
  });
  const [newRole, setNewRole] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loadError, setLoadError] = useState(false);

  const fetchUsers = () => {
    setLoading(true);
    setLoadError(false);
    usersApi.getAll().then((res) => {
      setUsersList((res.data as UserItem[]) || []);
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(""), 3000);
      return () => clearTimeout(t);
    }
  }, [success]);

  const filtered = usersList.filter((u) => {
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || roleBadge(u.role).label.toLowerCase().includes(q);
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      await usersApi.create(createForm);
      setSuccess("Utilisateur créé avec succès");
      setShowCreateModal(false);
      setCreateForm({ firstName: "", lastName: "", email: "", password: "", role: "PORTEUR_IDEE", businessUnit: "", department: "" });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la création");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;
    setError("");
    setActionLoading(true);
    try {
      await usersApi.updateRole(selectedUser.id, newRole);
      setSuccess(`Rôle de ${selectedUser.fullName} mis à jour`);
      setShowRoleModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setError("");
    setActionLoading(true);
    try {
      await usersApi.delete(selectedUser.id);
      setSuccess(`${selectedUser.fullName} a été supprimé`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la suppression");
    } finally {
      setActionLoading(false);
    }
  };

  if (!me || me.role !== "RESPONSABLE_INNOVATION") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <span className="material-symbols-outlined text-xl text-neutral-300 dark:text-neutral-600 mb-3">lock</span>
        <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Accès restreint</h2>
        <p className="text-[13px] text-neutral-500 mt-1 max-w-sm">Seul le responsable innovation peut gérer les utilisateurs.</p>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-5">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900 dark:text-white">Gestion des Utilisateurs</h1>
            <p className="text-neutral-500 text-[13px] mt-0.5">Créez, modifiez les rôles ou supprimez des comptes utilisateurs.</p>
          </div>
          <button
            onClick={() => { setError(""); setShowCreateModal(true); }}
            className="btn-primary"
          >
            <span className="material-symbols-outlined text-[15px]">person_add</span>
            Créer un utilisateur
          </button>
        </div>

        {/* Success toast */}
        {success && (
          <div
            role="status"
            className="mb-4 card flex items-center gap-2 px-4 py-3 text-[13px] font-medium text-emerald-700 dark:text-emerald-400"
          >
            <span className="material-symbols-outlined text-[15px] text-emerald-600 shrink-0">check_circle</span>
            {success}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <span className="material-symbols-outlined pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-[16px] text-neutral-400">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou rôle..."
            aria-label="Rechercher des utilisateurs"
            className="search-input"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-16">
            <span className="material-symbols-outlined animate-spin text-neutral-400 text-xl">progress_activity</span>
          </div>
        ) : loadError ? (
          <div className="card flex flex-col items-center py-12 text-center">
            <span className="material-symbols-outlined mb-2 text-xl text-neutral-400">error</span>
            <p className="text-[13px] text-red-600 dark:text-red-400 font-medium">Erreur lors du chargement des utilisateurs.</p>
            <button onClick={fetchUsers} className="mt-2 text-[13px] font-medium text-[#0066B3] dark:text-blue-400 hover:underline">Réessayer</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="card flex flex-col items-center py-16 text-center">
            <span className="material-symbols-outlined mb-2 text-xl text-neutral-300 dark:text-neutral-600">group_off</span>
            <p className="text-[13px] text-neutral-500">Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-400">Utilisateur</th>
                    <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-400 md:table-cell">Email</th>
                    <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-400">Rôle</th>
                    <th className="hidden px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-neutral-400 lg:table-cell">Département</th>
                    <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const badge = roleBadge(u.role);
                    const isMe = u.id === me.id;
                    return (
                      <tr
                        key={u.id}
                        className="border-b border-neutral-50 dark:border-neutral-800/50 last:border-0 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-900"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatarUrl ? (
                              <img src={u.avatarUrl} alt="" className="size-8 rounded-md object-cover" />
                            ) : (
                              <div
                                className={`flex size-8 shrink-0 items-center justify-center rounded-md text-[11px] font-medium ${
                                  isMe
                                    ? "bg-[#0066B3] text-white"
                                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                                }`}
                              >
                                {initials(u.firstName, u.lastName)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                {u.fullName}
                                {isMe && <span className="ml-1.5 text-[11px] text-neutral-400">(vous)</span>}
                              </p>
                              <p className="text-[12px] text-neutral-400 md:hidden">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-4 py-3 text-neutral-500 md:table-cell">{u.email}</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="hidden px-4 py-3 text-neutral-500 lg:table-cell">
                          {u.department || u.businessUnit || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedUser(u); setNewRole(u.role); setError(""); setShowRoleModal(true); }}
                              disabled={isMe}
                              aria-label={`Modifier le rôle de ${u.fullName}`}
                              className="flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 disabled:pointer-events-none disabled:opacity-30"
                            >
                              <span className="material-symbols-outlined text-[16px]">manage_accounts</span>
                            </button>
                            <button
                              onClick={() => { setSelectedUser(u); setError(""); setShowDeleteModal(true); }}
                              disabled={isMe}
                              aria-label={`Supprimer ${u.fullName}`}
                              className="flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 disabled:pointer-events-none disabled:opacity-30"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-neutral-100 dark:border-neutral-800 px-4 py-2.5 text-[12px] text-neutral-400">
              {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="card max-h-[90vh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-5 py-4">
              <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Créer un utilisateur</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 flex items-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-[15px]">error</span>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-500">Prénom</label>
                  <input
                    type="text" required value={createForm.firstName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, firstName: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-500">Nom</label>
                  <input
                    type="text" required value={createForm.lastName}
                    onChange={(e) => setCreateForm((p) => ({ ...p, lastName: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-500">Email</label>
                <input
                  type="email" required value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-500">Mot de passe</label>
                <input
                  type="password" required minLength={6} value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-500">Rôle</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm((p) => ({ ...p, role: e.target.value }))}
                    className={inputClass}
                  >
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-neutral-500">Département</label>
                  <input
                    type="text" value={createForm.department}
                    onChange={(e) => setCreateForm((p) => ({ ...p, department: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[12px] font-medium text-neutral-500">Business Unit</label>
                <input
                  type="text" value={createForm.businessUnit}
                  onChange={(e) => setCreateForm((p) => ({ ...p, businessUnit: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Role Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowRoleModal(false)}>
          <div
            className="card w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 px-5 py-4">
              <h2 className="text-[14px] font-medium text-neutral-900 dark:text-white">Modifier le rôle</h2>
              <button type="button" onClick={() => setShowRoleModal(false)} className="flex size-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {error && (
              <div className="mx-5 mt-4 flex items-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400">
                <span className="material-symbols-outlined text-[15px]">error</span>
                {error}
              </div>
            )}

            <div className="space-y-4 p-5">
              <p className="text-[13px] text-neutral-500">
                Modifier le rôle de <strong className="text-neutral-900 dark:text-white">{selectedUser.fullName}</strong>
              </p>

              <div className="space-y-2">
                {ROLES.map((r) => (
                  <label
                    key={r.value}
                    className={`flex cursor-pointer items-center gap-3 rounded-md border p-3 transition-colors ${
                      newRole === r.value
                        ? "border-[#0066B3] dark:border-blue-400"
                        : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"
                    }`}
                  >
                    <input
                      type="radio" name="role" value={r.value}
                      checked={newRole === r.value}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="accent-[#0066B3] dark:accent-blue-400"
                    />
                    <span className={`badge ${r.color}`}>
                      {r.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-end gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleUpdateRole}
                  disabled={actionLoading || newRole === selectedUser.role}
                  className="btn-primary"
                >
                  {actionLoading ? "Mise à jour..." : "Confirmer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setShowDeleteModal(false)}>
          <div
            className="card w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4 p-5 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-red-50 dark:bg-red-900/20">
                <span className="material-symbols-outlined text-xl text-red-600 dark:text-red-400">warning</span>
              </div>

              <div>
                <h3 className="text-[14px] font-medium text-neutral-900 dark:text-white">Supprimer cet utilisateur ?</h3>
                <p className="mt-1 text-[13px] text-neutral-500">
                  <strong className="text-neutral-900 dark:text-white">{selectedUser.fullName}</strong> ne pourra plus se connecter. Cette action est irréversible.
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-left text-[13px] font-medium text-red-600 dark:text-red-400">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  {error}
                </div>
              )}

              <div className="flex justify-center gap-2 border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-ghost"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="btn-danger"
                >
                  {actionLoading ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
