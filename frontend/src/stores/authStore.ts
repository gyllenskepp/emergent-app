import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API base URL — EXPO_PUBLIC_BACKEND_URL overrides (local dev / EAS builds).
// Falls back to the known backend for both web and native.
const normalizeApiBase = (url: string) =>
  url.replace(/\/+$/, '').replace(/\/api$/, '');

const getApiUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
  if (envUrl && envUrl.length > 0) {
    return normalizeApiBase(envUrl);
  }

  // On web we can use same-origin API rewrites (e.g. Vercel /api -> backend).
  if (typeof window !== 'undefined') {
    return '';
  }

  return 'https://borka-mobile-dev.preview.emergentagent.com';
};

const API_URL = getApiUrl();

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'member' | 'guest';
  phone?: string;
  auth_type?: 'email' | 'google';
  notification_preferences: {
    enabled: boolean;
    categories: {
      open_game_night: boolean;
      member_night: boolean;
      tournament: boolean;
      special_event: boolean;
      news: boolean;
    };
    reminder_times: string[];
  };
  push_token?: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  login: (sessionId: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePushToken: (token: string) => Promise<void>;
  createUserAsAdmin: (payload: { email: string; name: string; role?: 'member' | 'admin' }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  loginWithEmail: async (email: string, password: string) => {
    try {
      set({ error: null });

      const loginUrl = `${API_URL}/api/auth/login`;
      console.log('[Auth] Attempting login to:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      console.log('[Auth] Response status:', response.status, 'URL:', loginUrl);

      if (!response.ok) {
        let errorMessage = `Inloggning misslyckades (${response.status})`;
        try {
          const data = await response.json();
          errorMessage = data.detail || errorMessage;
        } catch (e) {
          console.error('[Auth] Could not parse error response');
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('[Auth] Login successful for:', data.user?.email);
      
      await AsyncStorage.setItem('session_token', data.session_token);
      
      set({
        user: data.user,
        sessionToken: data.session_token,
        isAuthenticated: true,
        error: null,
      });
    } catch (error: any) {
      console.error('[Auth] Login error:', error.message);
      set({ isAuthenticated: false, error: error.message });
      throw error;
    }
  },
  
  register: async () => {
  throw new Error('Registrering är avstängd. Kontakta admin för att få ett konto.');
},
  
  login: async (sessionId: string) => {
    try {
      set({ error: null });
      
      const response = await fetch(`${API_URL}/api/auth/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const data = await response.json();
      
      await AsyncStorage.setItem('session_token', data.session_token);
      
      set({
        user: data.user,
        sessionToken: data.session_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Login error:', error);
      set({ isLoading: false, isAuthenticated: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      const { sessionToken } = get();
      
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: sessionToken ? { 'Authorization': `Bearer ${sessionToken}` } : {},
        credentials: 'include',
      });
      
      await AsyncStorage.removeItem('session_token');
      
      set({
        user: null,
        sessionToken: null,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Clear state anyway
      await AsyncStorage.removeItem('session_token');
      set({ user: null, sessionToken: null, isAuthenticated: false });
    }
  },
  
  checkAuth: async () => {
  try {
    set({ isLoading: true });

    const storedToken = await AsyncStorage.getItem('session_token');

    if (!storedToken) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    const response = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${storedToken}` },
      credentials: 'include',
    });

    if (!response.ok) {
      await AsyncStorage.removeItem('session_token');
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    const user = await response.json();

    if (!user || !user.user_id) {
      await AsyncStorage.removeItem('session_token');
      set({ isLoading: false, isAuthenticated: false, user: null });
      return;
    }

    set({
      user,
      sessionToken: storedToken,
      isAuthenticated: true,
      isLoading: false,
    });

  } catch (error) {
    console.error('Check auth error:', error);
    await AsyncStorage.removeItem('session_token');
    set({ isLoading: false, isAuthenticated: false, user: null });
  }
  },
  
  updateUser: async (updates: Partial<User>) => {
    try {
      const { sessionToken } = get();
      
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify(updates),
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Update failed');
      
      const updatedUser = await response.json();
      set({ user: updatedUser });
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  },
  
  updatePushToken: async (token: string) => {
    try {
      const { sessionToken } = get();
      
      await fetch(`${API_URL}/api/users/me/push-token`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({ push_token: token }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Update push token error:', error);
    }
  },
  
  createUserAsAdmin: async ({ email, name, password, role = 'member' }: { email: string; name: string; password: string; role?: 'member' | 'admin' }) => {
  try {
    const { sessionToken } = get();
    if (!sessionToken) throw new Error('Inte inloggad');

    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      body: JSON.stringify({ email, name, password, role }),
      credentials: 'include',
    });

    if (!response.ok) {
      let msg = 'Kunde inte skapa användare';
      try {
        const data = await response.json();
        msg = data.detail || msg;
      } catch {}
      throw new Error(msg);
    }
  } catch (error: any) {
    console.error('[Auth] createUserAsAdmin error:', error.message);
    throw error;
  }
},
}));
