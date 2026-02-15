import { useAuth } from '@clerk/nextjs';

// API client with auth
export async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`http://localhost:3001${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
}

// Hook for authenticated API calls
export function useAuthenticatedApi() {
  const { getToken } = useAuth();

  return async (endpoint: string, options: RequestInit = {}) => {
    const token = await getToken();
    return apiCall(endpoint, options, token || undefined);
  };
}