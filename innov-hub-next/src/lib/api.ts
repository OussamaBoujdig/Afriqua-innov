export const API_BASE = "http://localhost:8081/api/v1";

/** Resolve a stored imageUrl (relative like /documents/images/xxx.jpg) to a full URL */
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  const path = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  return `${API_BASE}${path}`;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

export function setTokens(access: string, refresh: string) {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; message: string; data: T }> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Session expirée. Veuillez vous reconnecter.");
  }

  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return { success: true, message: "", data: null as T };
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Erreur ${res.status}`);
    return { success: true, message: "", data: text as T };
  }

  if (!res.ok) {
    throw new Error(json.message || `Erreur ${res.status}`);
  }

  return json;
}

// ─────────────────────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  refresh: (refreshToken: string) =>
    api("/auth/refresh", { method: "POST", body: JSON.stringify({ refreshToken }) }),
  logout: () => api("/auth/logout", { method: "POST" }),
};

// ─────────────────────────────────────────────────────────────
//  Ideas  →  /ideas
// ─────────────────────────────────────────────────────────────
export const ideas = {
  submit: (data: {
    title: string;
    category: string;
    problemStatement: string;
    proposedSolution: string;
    expectedRoi?: string;
    estimatedCost?: number;
    campaignId?: string;
    imageUrl?: string;
    draft?: boolean;
  }) =>
    api("/ideas", { method: "POST", body: JSON.stringify(data) }),

  getAll: (page = 0, size = 20) =>
    api(`/ideas?page=${page}&size=${size}`),

  getMine: (page = 0, size = 20) =>
    api(`/ideas/mine?page=${page}&size=${size}`),

  getById: (id: string) => api(`/ideas/${id}`),

  update: (id: string, data: Record<string, unknown>) =>
    api(`/ideas/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /** Any authenticated user — ownership/role enforced server-side */
  delete: (id: string) => api(`/ideas/${id}`, { method: "DELETE" }),

  score: (id: string, data: {
    innovationLevel: number;
    technicalFeasibility: number;
    strategicAlignment: number;
    roiPotential: number;
    riskLevel: number;
    comments?: string;
  }) =>
    api(`/ideas/${id}/score`, { method: "POST", body: JSON.stringify(data) }),

  workflow: (id: string, action: string, comment?: string) =>
    api(`/ideas/${id}/workflow`, { method: "POST", body: JSON.stringify({ action, comment }) }),

  setScoringDeadline: (id: string, deadline: string) =>
    api(`/ideas/${id}/scoring-deadline`, { method: "PATCH", body: JSON.stringify({ scoringDeadline: deadline }) }),

  getDocuments: (id: string) => api(`/ideas/${id}/documents`),

  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api(`/ideas/${id}/documents`, { method: "POST", body: formData });
  },

  vote: (id: string) =>
    api(`/ideas/${id}/vote`, { method: "POST" }),

  comment: (id: string, content: string, parentId?: string) =>
    api(`/ideas/${id}/comments`, { method: "POST", body: JSON.stringify({ content, parentId }) }),
};

// ─────────────────────────────────────────────────────────────
//  Campaigns  →  /campaigns
// ─────────────────────────────────────────────────────────────
export const campaigns = {
  getAll: (page = 0, size = 20) =>
    api(`/campaigns?page=${page}&size=${size}`),

  getById: (id: string) => api(`/campaigns/${id}`),

  getIdeas: (id: string, page = 0, size = 50) =>
    api(`/campaigns/${id}/ideas?page=${page}&size=${size}`),

  create: (data: {
    title: string;
    description: string;
    category: string;
    categoryColor?: string;
    imageUrl?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api("/campaigns", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: Record<string, unknown>) =>
    api(`/campaigns/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  /** PATCH /campaigns/{id}/close  (RESPONSABLE_INNOVATION only) */
  close: (id: string) =>
    api(`/campaigns/${id}/close`, { method: "PATCH" }),
};

// ─────────────────────────────────────────────────────────────
//  Projects  →  /projects
// ─────────────────────────────────────────────────────────────
export const projects = {
  getAll: (page = 0, size = 20) =>
    api(`/projects?page=${page}&size=${size}`),

  getById: (id: string) => api(`/projects/${id}`),

  /** DG only */
  delete: (id: string) =>
    api(`/projects/${id}`, { method: "DELETE" }),

  advanceStage: (id: string) =>
    api(`/projects/${id}/stage`, { method: "PATCH" }),

  updateProgress: (id: string, progress: number) =>
    api(`/projects/${id}/progress`, { method: "PATCH", body: JSON.stringify({ progress }) }),

  createDeliverable: (id: string, data: { title: string; stage?: string }) =>
    api(`/projects/${id}/deliverables`, { method: "POST", body: JSON.stringify(data) }),

  toggleDeliverable: (id: string, delivId: string) =>
    api(`/projects/${id}/deliverables/${delivId}`, { method: "PATCH" }),

  deleteDeliverable: (id: string, delivId: string) =>
    api(`/projects/${id}/deliverables/${delivId}`, { method: "DELETE" }),

  getDocuments: (id: string) => api(`/projects/${id}/documents`),

  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api(`/projects/${id}/documents`, { method: "POST", body: formData });
  },

  getTasks: (id: string) => api(`/projects/${id}/tasks`),

  createTask: (id: string, data: {
    title: string;
    description?: string;
    stage: string;
    assignedToId?: string;
    dueDate?: string;
  }) =>
    api(`/projects/${id}/tasks`, { method: "POST", body: JSON.stringify(data) }),

  updateTask: (id: string, taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    assignedToId?: string;
    dueDate?: string;
  }) =>
    api(`/projects/${id}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteTask: (id: string, taskId: string) =>
    api(`/projects/${id}/tasks/${taskId}`, { method: "DELETE" }),

  getTeam: (id: string) => api(`/projects/${id}/team`),

  addTeamMember: (id: string, data: { userId: string; teamRole?: string; responseDeadline?: string }) =>
    api(`/projects/${id}/team`, { method: "POST", body: JSON.stringify(data) }),

  getProjectInvitations: (id: string) => api(`/projects/${id}/invitations`),

  getMyInvitations: () => api(`/projects/invitations/mine`),

  getInvitationsSent: () => api(`/projects/invitations/sent`),

  /** GET /projects/my-team  — projects where current user is a team member */
  getMyTeamProjects: () => api(`/projects/my-team`),
  getMyTeam: () => api(`/projects/my-team`),   // alias

  respondToInvitation: (invitationId: string, data: { action: string; message?: string }) =>
    api(`/projects/invitations/${invitationId}/respond`, { method: "POST", body: JSON.stringify(data) }),

  deleteInvitation: (invitationId: string) =>
    api(`/projects/invitations/${invitationId}`, { method: "DELETE" }),

  updateTeamMemberRole: (id: string, memberId: string, teamRole: string) =>
    api(`/projects/${id}/team/${memberId}`, { method: "PATCH", body: JSON.stringify({ teamRole }) }),

  removeTeamMember: (id: string, memberId: string) =>
    api(`/projects/${id}/team/${memberId}`, { method: "DELETE" }),

  /** GET /projects/{projectId}/messages */
  getMessages: (projectId: string, page = 0, size = 50) =>
    api(`/projects/${projectId}/messages?page=${page}&size=${size}`),

  /** POST /projects/{projectId}/messages  (multipart: content + optional file) */
  sendMessage: (projectId: string, content?: string, file?: File) => {
    const formData = new FormData();
    if (content) formData.append("content", content);
    if (file) formData.append("file", file);
    return api(`/projects/${projectId}/messages`, { method: "POST", body: formData });
  },
};

// ─────────────────────────────────────────────────────────────
//  Dashboard  →  /dashboard
// ─────────────────────────────────────────────────────────────
export const dashboard = {
  getStats: () => api("/dashboard/stats"),
};

// ─────────────────────────────────────────────────────────────
//  Notifications  →  /notifications
// ─────────────────────────────────────────────────────────────
export const notifications = {
  getAll: (page = 0, size = 20) =>
    api(`/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => api<number>("/notifications/unread-count"),
  markAllRead: () => api("/notifications/read-all", { method: "PATCH" }),
  markRead: (id: string) => api(`/notifications/${id}/read`, { method: "PATCH" }),
  clearAll: () => api("/notifications", { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
//  Users  →  /users
// ─────────────────────────────────────────────────────────────
export const users = {
  getMe: () => api("/users/me"),
  getAll: () => api("/users"),
  create: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    businessUnit?: string;
    department?: string;
  }) =>
    api("/users", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: string, role: string) =>
    api(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  delete: (id: string) =>
    api(`/users/${id}`, { method: "DELETE" }),
};

// ─────────────────────────────────────────────────────────────
//  Tasks  →  /tasks
// ─────────────────────────────────────────────────────────────
export const tasks = {
  getMine: () => api("/tasks/mine"),
  getDocuments: (projectId: string, taskId: string) =>
    api(`/projects/${projectId}/tasks/${taskId}/documents`),
  uploadDocument: (projectId: string, taskId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api(`/projects/${projectId}/tasks/${taskId}/documents`, { method: "POST", body: formData });
  },
};

// ─────────────────────────────────────────────────────────────
//  Documents  →  /documents
// ─────────────────────────────────────────────────────────────
export const documents = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api<{ fileName: string }>("/documents/upload-image", { method: "POST", body: formData });
  },
};

// ─────────────────────────────────────────────────────────────
//  Chatbot  →  /chatbot
// ─────────────────────────────────────────────────────────────
export const chatbot = {
  send: (message: string) =>
    api<{ reply: string }>("/chatbot", { method: "POST", body: JSON.stringify({ message }) }),
};

// ─────────────────────────────────────────────────────────────
//  File download helper
// ─────────────────────────────────────────────────────────────
export async function downloadFile(docId: string, fileName: string) {
  const token = getToken();
  const res = await fetch(`${API_BASE}/documents/${docId}/download`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Téléchargement échoué");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
