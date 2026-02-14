import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  start_time: string;
  end_time: string;
  category: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface News {
  id: string;
  title: string;
  body: string;
  image?: string;
  publish_date: string;
  created_by: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface DataState {
  events: Event[];
  news: News[];
  categories: Category[];
  isLoadingEvents: boolean;
  isLoadingNews: boolean;
  
  fetchEvents: (category?: string) => Promise<void>;
  fetchNews: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  
  createEvent: (event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  
  createNews: (news: Omit<News, 'id' | 'created_at' | 'publish_date' | 'created_by'>) => Promise<void>;
  updateNews: (id: string, updates: Partial<News>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
}

const getAuthHeader = async () => {
  const token = await AsyncStorage.getItem('session_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const useDataStore = create<DataState>((set, get) => ({
  events: [],
  news: [],
  categories: [],
  isLoadingEvents: false,
  isLoadingNews: false,
  
  fetchEvents: async (category?: string) => {
    try {
      set({ isLoadingEvents: true });
      const url = category && category !== 'all'
        ? `${API_URL}/api/events?category=${category}`
        : `${API_URL}/api/events`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch events');
      
      const events = await response.json();
      set({ events, isLoadingEvents: false });
    } catch (error) {
      console.error('Fetch events error:', error);
      set({ isLoadingEvents: false });
    }
  },
  
  fetchNews: async () => {
    try {
      set({ isLoadingNews: true });
      const response = await fetch(`${API_URL}/api/news`);
      if (!response.ok) throw new Error('Failed to fetch news');
      
      const news = await response.json();
      set({ news, isLoadingNews: false });
    } catch (error) {
      console.error('Fetch news error:', error);
      set({ isLoadingNews: false });
    }
  },
  
  fetchCategories: async () => {
    try {
      const response = await fetch(`${API_URL}/api/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      
      const categories = await response.json();
      set({ categories });
    } catch (error) {
      console.error('Fetch categories error:', error);
    }
  },
  
  createEvent: async (event) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(event),
      });
      
      if (!response.ok) throw new Error('Failed to create event');
      
      await get().fetchEvents();
    } catch (error) {
      console.error('Create event error:', error);
      throw error;
    }
  },
  
  updateEvent: async (id, updates) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update event');
      
      await get().fetchEvents();
    } catch (error) {
      console.error('Update event error:', error);
      throw error;
    }
  },
  
  deleteEvent: async (id) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/events/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) throw new Error('Failed to delete event');
      
      await get().fetchEvents();
    } catch (error) {
      console.error('Delete event error:', error);
      throw error;
    }
  },
  
  createNews: async (news) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/news`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(news),
      });
      
      if (!response.ok) throw new Error('Failed to create news');
      
      await get().fetchNews();
    } catch (error) {
      console.error('Create news error:', error);
      throw error;
    }
  },
  
  updateNews: async (id, updates) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/news/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) throw new Error('Failed to update news');
      
      await get().fetchNews();
    } catch (error) {
      console.error('Update news error:', error);
      throw error;
    }
  },
  
  deleteNews: async (id) => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_URL}/api/news/${id}`, {
        method: 'DELETE',
        headers,
      });
      
      if (!response.ok) throw new Error('Failed to delete news');
      
      await get().fetchNews();
    } catch (error) {
      console.error('Delete news error:', error);
      throw error;
    }
  },
}));
