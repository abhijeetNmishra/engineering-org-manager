import type { Employee, ModuleNode, ShiptOrgState } from "../domain/types";

const API_BASE = '';

// Helper to handle API responses
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth-storage') 
    ? JSON.parse(localStorage.getItem('auth-storage') || '{}').state?.token 
    : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Request failed: ${res.statusText}`);
  }

  return res.json();
}

export const orgApi = {
  // Full State
  loadState: () => fetchJson<ShiptOrgState>('/api/org-state'),
  saveState: (state: ShiptOrgState) => fetchJson<{ success: boolean }>('/api/org-state', {
    method: 'PUT',
    body: JSON.stringify(state),
  }),

  // Employees
  createEmployee: (emp: Employee) => fetchJson('/api/employees', {
    method: 'POST',
    body: JSON.stringify(emp),
  }),
  updateEmployee: (emp: Employee) => fetchJson('/api/employees', {
    method: 'POST', // Upsert
    body: JSON.stringify(emp),
  }),
  deleteEmployee: (id: string) => fetchJson(`/api/employees?id=${id}`, {
    method: 'DELETE',
  }),

  // Modules
  createModule: (mod: ModuleNode) => fetchJson('/api/modules', {
    method: 'POST',
    body: JSON.stringify(mod),
  }),
  updateModule: (mod: ModuleNode) => fetchJson('/api/modules', {
    method: 'POST', // Upsert
    body: JSON.stringify(mod),
  }),
  deleteModule: (id: string) => fetchJson(`/api/modules?id=${id}`, {
    method: 'DELETE',
  }),

  // Initial Check (to see if backend is ready)
  healthCheck: async () => {
    try {
      await fetchJson('/api/org-state', { method: 'HEAD' }); // Simple check
      return true;
    } catch {
      return false;
    }
  }
};
