/**
 * Global application state using Zustand.
 */
"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language } from "./i18n";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "passenger" | "admin";
  preferredLanguage: Language;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  language: Language;
  darkMode: boolean;
  notifications: Notification[];
  unreadCount: number;
  setUser: (user: User | null, token: string | null) => void;
  setLanguage: (lang: Language) => void;
  toggleDarkMode: () => void;
  addNotification: (n: Notification) => void;
  markAllRead: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      language: "en",
      darkMode: false,
      notifications: [],
      unreadCount: 0,

      setUser: (user, token) => set({ user, token }),
      setLanguage: (lang) => set({ language: lang }),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      addNotification: (n) =>
        set((s) => ({
          notifications: [n, ...s.notifications].slice(0, 50),
          unreadCount: s.unreadCount + 1,
        })),

      markAllRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        })),

      logout: () => set({ user: null, token: null }),
    }),
    { name: "mahast-store", partialize: (s) => ({ user: s.user, token: s.token, language: s.language, darkMode: s.darkMode }) }
  )
);
