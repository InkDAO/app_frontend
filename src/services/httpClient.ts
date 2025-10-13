import { authService } from './authService';

// Enhanced fetch wrapper that automatically includes JWT token
export const authenticatedFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = authService.getAuthToken();
  
  // Prepare headers
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Only set Content-Type to JSON if body is not FormData
  // FormData needs the browser to set Content-Type automatically with the boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add JWT token if available
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the request
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized - token might be expired
  if (response.status === 401) {
    console.warn('🔒 Authentication required or token expired');
    authService.logout();
    // You could trigger a re-authentication here if needed
    throw new Error('Authentication required. Please reconnect your wallet.');
  }

  // Handle 403 Forbidden - user cannot access files for different owner
  if (response.status === 403) {
    console.warn('🔒 Access forbidden: Cannot access files for different owner');
    authService.logout();
    throw new Error('Access forbidden. You have been signed out. Please sign in again.');
  }

  return response;
};

// API service class with authentication
export class ApiService {
  private static instance: ApiService;
  
  private constructor() {}
  
  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // Helper method to build full URL
  private buildUrl(endpoint: string): string {
    return `${import.meta.env.VITE_SERVER_URL}${endpoint}`;
  }

  // GET request with authentication
  async get(endpoint: string): Promise<any> {
    const response = await authenticatedFetch(this.buildUrl(endpoint), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GET ${endpoint} failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // POST request with authentication
  async post(endpoint: string, data: any): Promise<any> {
    const response = await authenticatedFetch(this.buildUrl(endpoint), {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`POST ${endpoint} failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // PUT request with authentication
  async put(endpoint: string, data: any): Promise<any> {
    const response = await authenticatedFetch(this.buildUrl(endpoint), {
      method: 'PUT',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PUT ${endpoint} failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // DELETE request with authentication
  async delete(endpoint: string): Promise<any> {
    const response = await authenticatedFetch(this.buildUrl(endpoint), {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DELETE ${endpoint} failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // Raw fetch for special cases (like file uploads)
  async rawFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
    return authenticatedFetch(this.buildUrl(endpoint), options);
  }
}

// Singleton instance
export const apiService = ApiService.getInstance();
