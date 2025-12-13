/**
 * API client for communicating with @tyos/api
 */

const API_BASE_URL = import.meta.env.VITE_API_URL;
const API_AUTH_TOKEN = import.meta.env.VITE_API_AUTH_TOKEN;

export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (API_AUTH_TOKEN) {
    headers.Authorization = `Bearer ${API_AUTH_TOKEN}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Example usage:
// const albums = await apiRequest<Album[]>('/albums');
