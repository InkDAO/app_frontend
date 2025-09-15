import { signMessageWithMetaMask } from './dXService';

const API_BASE_URL = 'http://localhost:8888';
const JWT_COOKIE_NAME = 'dx_jwt_token';

// Cookie utilities
export const setCookie = (name: string, value: string, expiresIn?: string) => {
  let cookieString = `${name}=${value}; path=/; SameSite=Strict; Secure`;
  
  if (expiresIn) {
    // Parse the expiresIn value (e.g., "2h" -> 2 hours from now)
    const now = new Date();
    if (expiresIn.includes('h')) {
      const hours = parseInt(expiresIn.replace('h', ''));
      now.setTime(now.getTime() + (hours * 60 * 60 * 1000));
    } else if (expiresIn.includes('d')) {
      const days = parseInt(expiresIn.replace('d', ''));
      now.setTime(now.getTime() + (days * 24 * 60 * 60 * 1000));
    }
    cookieString += `; expires=${now.toUTCString()}`;
  }
  
  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
};

// Authentication interfaces
export interface LoginRequest {
  salt: string;
  address: string;
  signature: string;
}

export interface LoginResponse {
  token: string;
  address: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  address: string | null;
}

// Authentication service
export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Login with wallet signature
  async login(address: string): Promise<LoginResponse> {
    try {
      console.log('🔐 Starting authentication process...');
      
      // Generate salt (current timestamp in seconds)
      const timestamp = Math.floor(Date.now() / 1000);
      const salt = timestamp.toString();
      
      console.log('1. Generated salt:', salt);
      console.log('2. User address:', address);
      
      // Sign the salt with MetaMask
      const signature = await signMessageWithMetaMask(salt);
      
      console.log('3. Signature received:', signature);
      
      // Send authentication request
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salt,
          address,
          signature
        }),
      });

      console.log('4. Auth response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Authentication failed:', errorText);
        throw new Error(`Authentication failed: ${response.status} - ${errorText}`);
      }

      const data: LoginResponse = await response.json();
      
      console.log('✅ Authentication successful');
      console.log('   - Token received:', data.token.substring(0, 20) + '...');
      console.log('   - Address:', data.address);
      
      // Store JWT in cookie
      this.setAuthToken(data.token, '2h'); // 2 hours expiry, matching backend
      
      return data;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      throw error;
    }
  }

  // Store JWT token in cookie
  setAuthToken(token: string, expiresIn: string = '2h') {
    setCookie(JWT_COOKIE_NAME, token, expiresIn);
  }

  // Get JWT token from cookie
  getAuthToken(): string | null {
    return getCookie(JWT_COOKIE_NAME);
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    if (!token) return false;
    
    try {
      // Check if token is expired (basic check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Math.floor(Date.now() / 1000);
      return payload.exp > now;
    } catch {
      return false;
    }
  }

  // Get current auth state
  getAuthState(): AuthState {
    const token = this.getAuthToken();
    const isAuth = this.isAuthenticated();
    
    let address = null;
    if (token && isAuth) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        address = payload.address;
      } catch {
        // Token parsing failed
      }
    }

    return {
      isAuthenticated: isAuth,
      token: isAuth ? token : null,
      address,
    };
  }

  // Logout
  logout() {
    deleteCookie(JWT_COOKIE_NAME);
    console.log('🚪 User logged out');
  }

  // Auto-authenticate if wallet is connected but no JWT
  async autoAuthenticate(address: string): Promise<boolean> {
    try {
      if (this.isAuthenticated()) {
        console.log('✅ Already authenticated');
        return true;
      }

      console.log('🔄 Auto-authenticating with wallet...');
      await this.login(address);
      return true;
    } catch (error) {
      console.error('❌ Auto-authentication failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const authService = AuthService.getInstance();
