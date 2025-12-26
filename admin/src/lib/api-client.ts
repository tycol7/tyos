/**
 * API client for communicating with @tyos/api via Netlify Functions proxy
 *
 * Security architecture:
 * - Client stores a JWT session token (from login)
 * - All API requests go through Netlify Functions (not directly to Fly.io)
 * - Netlify Function validates JWT and adds the real API_AUTH_TOKEN server-side
 * - This keeps the Fly.io API token secure and never exposes it to the browser
 */

const SESSION_TOKEN_KEY = 'tyos-session-token';

// Get session token from localStorage
function getSessionToken(): string | null {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

// Set session token in localStorage
export function setSessionToken(token: string): void {
  localStorage.setItem(SESSION_TOKEN_KEY, token);
}

// Clear session token from localStorage
export function clearSessionToken(): void {
  localStorage.removeItem(SESSION_TOKEN_KEY);
}

// Login function - calls Netlify Function to validate credentials
export async function login(username: string, password: string): Promise<boolean> {
  try {
    const response = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    if (data.success && data.token) {
      setSessionToken(data.token);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
}

// API request function - proxies through Netlify Function
export async function apiRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const sessionToken = getSessionToken();

  if (!sessionToken) {
    throw new Error('Not authenticated - please login');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${sessionToken}`, // JWT session token
    ...(options?.headers as Record<string, string>),
  };

  // Only set Content-Type for JSON requests (let browser set it for FormData)
  const isFormData = options?.body instanceof FormData;
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Proxy all requests through Netlify Function
  const response = await fetch(`/.netlify/functions/api-proxy${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    // Handle 401 by clearing token (session expired)
    if (response.status === 401) {
      clearSessionToken();
      throw new Error('Session expired - please login again');
    }
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Example usage:
// const loggedIn = await login('admin', 'password');
// const albums = await apiRequest<Album[]>('/albums');
