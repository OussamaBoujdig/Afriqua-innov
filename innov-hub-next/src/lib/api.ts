const API_BASE = "http://localhost:8080/api/v1";

function getToken(): string | null {
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
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || `Erreur ${res.status}`);
  }

  return json;
}

export const auth = {
  login: (email: string, password: string) =>
    api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    businessUnit?: string;
    department?: string;
  }) =>
    api("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  refresh: (refreshToken: string) =>
    api("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }),
  logout: () => api("/auth/logout", { method: "POST" }),
};

export const ideas = {
  submit: (data: {
    title: string;
    category: string;
    problemStatement: string;
    proposedSolution: string;
    expectedRoi?: string;
    estimatedCost?: number;
    campaignId?: string;
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
    api(`/ideas/${id}/workflow`, {
      method: "POST",
      body: JSON.stringify({ action, comment }),
    }),
  vote: (id: string) =>
    api(`/ideas/${id}/vote`, { method: "POST" }),
  comment: (id: string, content: string, parentId?: string) =>
    api(`/ideas/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId }),
    }),
};

export const campaigns = {
  getAll: (page = 0, size = 20) =>
    api(`/campaigns?page=${page}&size=${size}`),
  getById: (id: string) => api(`/campaigns/${id}`),
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
};

export const projects = {
  getAll: (page = 0, size = 20) =>
    api(`/projects?page=${page}&size=${size}`),
  getById: (id: string) => api(`/projects/${id}`),
  advanceStage: (id: string) =>
    api(`/projects/${id}/stage`, { method: "PATCH" }),
  updateProgress: (id: string, progress: number) =>
    api(`/projects/${id}/progress`, {
      method: "PATCH",
      body: JSON.stringify({ progress }),
    }),
  toggleDeliverable: (id: string, delivId: string) =>
    api(`/projects/${id}/deliverables/${delivId}`, { method: "PATCH" }),
  getDocuments: (id: string) =>
    api(`/projects/${id}/documents`),
  uploadDocument: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api(`/projects/${id}/documents`, { method: "POST", body: formData });
  },
};

export const dashboard = {
  getStats: () => api("/dashboard/stats"),
};

export const notifications = {
  getAll: (page = 0, size = 20) =>
    api(`/notifications?page=${page}&size=${size}`),
  getUnreadCount: () => api<number>("/notifications/unread-count"),
  markAllRead: () =>
    api("/notifications/read-all", { method: "PATCH" }),
  markRead: (id: string) =>
    api(`/notifications/${id}/read`, { method: "PATCH" }),
};

export const users = {
  getMe: () => api("/users/me"),
};
