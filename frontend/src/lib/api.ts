import type { Item, ItemStatus, UserRole, ItemCategory } from "$lib/types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const UPEMOR_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@upemor\.edu\.mx$/i;

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

function headers(token?: string | null): Record<string, string> {
  const h: Record<string, string> = { Accept: "application/json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body: { error?: string } = (await res.json().catch(() => ({}))) ?? {};
    const message = body.error ?? `Error ${res.status}`;
    const err: any = new Error(message);
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export interface ApiClientOptions {
  token?: string;
}

export class ApiClient {
  private token: string | null;

  constructor(token: string | null = null) {
    this.token = token;
  }

  setToken(token: string | null): void {
    this.token = token;
  }

  private async request<T>(
    path: string,
    method: HttpMethod,
    body?: unknown,
    options: ApiClientOptions = {}
  ): Promise<T> {
    const token = options.token ?? this.token;
    const url = path.startsWith("http") ? path : `${API_URL}${path}`;

    const requestHeaders: Record<string, string> = headers(token);
    let requestBody: BodyInit | undefined;

    if (body !== undefined) {
      if (body instanceof FormData) {
        requestBody = body;
      } else {
        requestHeaders["Content-Type"] = "application/json";
        requestBody = JSON.stringify(body);
      }
    }

    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
    });
    return handleResponse<T>(res);
  }

  /* ---------- Auth ---------- */
  async register(
    payload: {
      nombre_completo: string;
      correo: string;
      password: string;
    },
    options?: ApiClientOptions
  ) {
    return this.request<{ token: string; user: any }>(
      "/api/auth/register",
      "POST",
      payload,
      options
    );
  }

  async login(
    payload: { correo: string; password: string },
    options?: ApiClientOptions
  ) {
    return this.request<{ token: string; user: any }>(
      "/api/auth/login",
      "POST",
      payload,
      options
    );
  }

  async me(options?: ApiClientOptions) {
    return this.request<{ user: any }>("/api/auth/me", "GET", undefined, options);
  }

  async logout(options?: ApiClientOptions) {
    return this.request("/api/auth/logout", "POST", undefined, options);
  }

  async updateProfilePhoto(
    file: File,
    options?: ApiClientOptions
  ) {
    const fd = new FormData();
    fd.append("foto", file);
    return this.request<{ user: any }>("/api/auth/profile-photo", "PATCH", fd, options);
  }

  /* ---------- Items ---------- */
  async listItems(params?: {
    estado?: ItemStatus;
    categoria?: string;
    ubicacion?: string;
    search?: string;
    mine?: boolean;
    options?: ApiClientOptions;
  }) {
    const opts = params?.options ?? {};
    const qs = new URLSearchParams();
    if (params?.estado) qs.set("estado", params.estado);
    if (params?.categoria) qs.set("categoria", params.categoria);
    if (params?.ubicacion) qs.set("ubicacion", params.ubicacion);
    if (params?.search) qs.set("search", params.search);
    if (params?.mine) qs.set("mine", "true");
    return this.request<{ items: Item[] }>(
      `/api/items${qs.toString() ? `?${qs.toString()}` : ""}`,
      "GET",
      undefined,
      opts
    );
  }

  async getItem(id: string, options?: ApiClientOptions) {
    return this.request<{ item: Item }>(`/api/items/${id}`, "GET", undefined, options);
  }

  async createItem(form: FormData, options?: ApiClientOptions) {
    return this.request<{ item: Item }>("/api/items", "POST", form, options);
  }

  async updateItem(id: string, form: FormData, options?: ApiClientOptions) {
    return this.request<{ item: Item }>(`/api/items/${id}`, "PUT", form, options);
  }

  async markReturned(id: string, options?: ApiClientOptions) {
    return this.request<{ item: Item }>(`/api/items/${id}/status`, "PATCH", {}, options);
  }

  async deleteItem(id: string, options?: ApiClientOptions) {
    return this.request(`/api/items/${id}`, "DELETE", undefined, options);
  }

  async addComment(id: string, texto: string, options?: ApiClientOptions) {
    return this.request<{ item: Item }>(`/api/items/${id}/comments`, "POST", { texto }, options);
  }

  async deleteComment(itemId: string, commentId: string, options?: ApiClientOptions) {
    return this.request<{ item: Item }>(
      `/api/items/${itemId}/comments/${commentId}`,
      "DELETE",
      undefined,
      options
    );
  }

  /* ---------- Admin ---------- */
  async adminDashboard(options?: ApiClientOptions) {
    return this.request<{ kpis: any; users: any[]; auditLogs: any[] }>(
      "/api/admin/dashboard",
      "GET",
      undefined,
      options
    );
  }

  async toggleUserStatus(
    id: string,
    payload: { motivo?: string },
    options?: ApiClientOptions
  ) {
    return this.request<{ user: any; auditLog: any }>(
      `/api/admin/users/${id}/toggle-status`,
      "PATCH",
      payload,
      options
    );
  }
}

export const api = new ApiClient();

/* ---------- UI helpers ---------- */

export function statusLabels(status: ItemStatus | undefined): {
  label: string;
  bg: string;
  fg: string;
  icon?: string;
} {
  const map: Record<ItemStatus, { label: string; bg: string; fg: string }> = {
    perdido: {
      label: "Perdido",
      bg: "bg-[#FEF2F2]",
      fg: "text-[#DC2626]",
    },
    encontrado: {
      label: "Encontrado",
      bg: "bg-[#FFFBEB]",
      fg: "text-[#D97706]",
    },
    entregado: {
      label: "Devuelto",
      bg: "bg-[#ECFDF5]",
      fg: "text-[#059669]",
    },
  };
  if (!status) return map.perdido;
  return map[status];
}

export function badgeClass(status?: ItemStatus): string {
  if (!status) return "bg-[#F5F5F7] text-[#666666]";
  const { bg, fg } = statusLabels(status);
  return `px-2.5 py-0.5 rounded-full text-xs font-display font-medium ${bg} ${fg}`;
}

export const CATEGORIES: ItemCategory[] = [
  "Electrónica",
  "Documentos",
  "Ropa",
  "Accesorios",
  "Otros",
];

export const CAMPUS_ZONES = [
  "Todas las zonas",
  "UD1",
  "UD2",
  "UD3",
  "LT1",
  "LT2",
  "Biblioteca",
  "Café UD1",
  "Café UD2",
];

export const FULL_NAME_ROLE_LABEL: Record<UserRole, string> = {
  estudiante: "Estudiante",
  admin: "Administrador",
};

export function roleBadge(rol: UserRole): string {
  return rol === "admin"
    ? "bg-[#ECECEC] text-[#330085] border-[#330085]"
    : "bg-[#F5F5F7] text-[#333333]";
}

export function dateOnly(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function relativeTimeAgo(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 1) return "Hace un momento";
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `Hace ${diffHours} h`;
  const diffDays = Math.floor(diffMs / 86400000);
  return `Hace ${diffDays} d`;
}
