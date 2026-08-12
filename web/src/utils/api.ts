/* Thin fetch wrapper. Same origin in production; Vite proxies /api in dev. */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    });
  } catch {
    throw new ApiError('Server unreachable', 0);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || res.statusText, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};

/* ---------- vault ---------- */

export type VaultNoteRef = { name: string; path: string; folder?: string };

export type VaultFolder = {
  name: string;
  path: string;
  folders: VaultFolder[];
  notes: { name: string; path: string }[];
};

export type VaultTree = { vault: string; noteCount: number; tree: VaultFolder };

export type VaultLink = {
  raw: string;
  embed: boolean;
  target: string;
  heading: string | null;
  alias: string | null;
  resolved: string | null;
};

export type VaultNote = {
  path: string;
  name: string;
  folder: string;
  frontmatter: Record<string, unknown>;
  body: string;
  links: VaultLink[];
};

export const vault = {
  tree: (refresh = false) =>
    api.get<VaultTree>(`/api/vault/tree${refresh ? '?refresh=1' : ''}`),
  note: (path: string) =>
    api.get<VaultNote>(`/api/vault/note?path=${encodeURIComponent(path)}`),
  backlinks: (path: string) =>
    api.get<{ backlinks: VaultNoteRef[] }>(
      `/api/vault/backlinks?path=${encodeURIComponent(path)}`,
    ),
  mediaUrl: (path: string) => `/api/vault/media?path=${encodeURIComponent(path)}`,
};

/* ---------- media upload ---------- */

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch('/api/media', { method: 'POST', body: form });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || 'Upload failed', res.status);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

/* ---------- settings ---------- */

export type SettingsStatus = { anthropicKeySet: boolean; anthropicKeyPreview: string | null };

export const settings = {
  /** Never returns the real key — a masked preview only. See server/settings.mjs. */
  get: () => api.get<SettingsStatus>('/api/settings'),
  /** Pass null to remove the saved key. */
  saveKey: (anthropicApiKey: string | null) => api.put<SettingsStatus>('/api/settings', { anthropicApiKey }),
};

/* ---------- diagnosis ---------- */

/**
 * What the server needs to compare a trade's own note against every setup's
 * checklist. Built fresh from data/framework.ts on every call — the server
 * carries no copy of the framework, so this payload is the framework as far
 * as that one request is concerned. See server/diagnose.mjs.
 */
export type DiagnoseRequest = {
  note: string;
  loggedAs: { id: string; label: string };
  setups: { id: string; label: string; what: string; checks: { id: string; label: string; must: string }[] }[];
  failedGates: { id: string; label: string; avoid: string }[];
};

export const diagnose = (payload: DiagnoseRequest) => api.post<{ diagnosis: string }>('/api/diagnose', payload);
