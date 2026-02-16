import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Get API URL - for web, use relative path; for native, use the full URL
const getApiUrl = () => {
  // Try environment variable first
  const envUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.length > 0) {
    console.log('[Auth] Using env URL:', envUrl);
    return envUrl;
  }
  
  // Try expo config
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const baseUrl = `https://${hostUri.split(':')[0]}`;
    console.log('[Auth] Using hostUri URL:', baseUrl);
    return baseUrl;
  }
  
  // For web, relative paths work due to proxy
  if (Platform.OS === 'web') {
    console.log('[Auth] Using relative URL for web');
    return '';
  }
  
  // Fallback - use the known preview URL
  const fallbackUrl = 'https://borka-mobile-dev.preview.emergentagent.com';
  console.log('[Auth] Using fallback URL:', fallbackUrl);
  return fallbackUrl;
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
      set({ isLoading: true, error: null });
      
      const loginUrl = `${API_URL}/api/auth/login`;
      console.log('[Auth] Attempting login to:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      console.log('[Auth] Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Inloggning misslyckades';
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
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('[Auth] Login error:', error.message);
      set({ isLoading: false, isAuthenticated: false, error: error.message });
      throw error;
    }
  },
  
  register: async (email: string, password: string, name: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Registrering misslyckades');
      }
      
      const data = await response.json();
      
      await AsyncStorage.setItem('session_token', data.session_token);
      
      set({
        user: data.user,
        sessionToken: data.session_token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      set({ isLoading: false, isAuthenticated: false, error: error.message });
      throw error;
    }
  },
  
  login: async (sessionId: string) => {
    try {
      set({ isLoading: true, error: null });
      
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
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      
      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${storedToken}` },
        credentials: 'include',
      });
      
      if (!response.ok) {
        await AsyncStorage.removeItem('session_token');
        set({ isLoading: false, isAuthenticated: false });
        return;
      }
      
      const user = await response.json();
      
      set({
        user,
        sessionToken: storedToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Check auth error:', error);
      set({ isLoading: false, isAuthenticated: false });
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
}));
