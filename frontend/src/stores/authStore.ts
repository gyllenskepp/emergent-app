import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  role: 'admin' | 'member' | 'guest';
  phone?: string;
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
  
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  login: (sessionId: string) => Promise<void>;
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
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
  setLoading: (isLoading) => set({ isLoading }),
  
  login: async (sessionId: string) => {
    try {
      set({ isLoading: true });
      
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
