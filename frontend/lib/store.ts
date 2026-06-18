import { create } from "zustand";

export interface User {
  id: number;
  email: string;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  email_notifications: boolean;
  report_complete_email: boolean;
  weekly_digest: boolean;
  created_at: string;
  last_login_at: string | null;
}

interface UserStore {
  user: User | null;
  setUser: (u: User | null) => void;
  updateUser: (partial: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (partial) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partial } : null,
    })),
  clearUser: () => set({ user: null }),
}));

// Helpers for getting initials / avatar
export function getUserInitials(user: User | null): string {
  if (!user) return "?";
  if (user.full_name) {
    const parts = user.full_name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return user.email.slice(0, 2).toUpperCase();
}
