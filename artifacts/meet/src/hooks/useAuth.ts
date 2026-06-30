import { create } from "zustand";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Member";
  phoneNumber?: string;
  jobTitle?: string;
  department?: string;
  bio?: string;
  timezone?: string;
  avatar?: string;
  profileColor?: string;
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setToken: (token: string) => void;
}

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

let refreshTimer: any = null;

const startRefreshTimer = (token: string, refreshFn: () => void) => {
  if (refreshTimer) clearTimeout(refreshTimer);
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) return;

  const expTime = decoded.exp * 1000;
  const timeUntilRefresh = expTime - Date.now() - 60000; // Refresh 1 minute before expiration

  if (timeUntilRefresh > 0) {
    refreshTimer = setTimeout(refreshFn, timeUntilRefresh);
  } else {
    // If it's already expired or very close, refresh immediately
    refreshFn();
  }
};

export const useAuth = create<AuthState>((set, get) => {
  const savedToken = localStorage.getItem("intell_meet_token");
  let savedUser: User | null = null;
  try {
    const rawUser = localStorage.getItem("intell_meet_user");
    if (rawUser) {
      savedUser = JSON.parse(rawUser);
    }
  } catch (e) {
    console.error("Failed to parse saved user", e);
  }

  const triggerRefresh = async () => {
    try {
      const response = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        get().setToken(data.token);
      } else {
        get().logout();
      }
    } catch (err) {
      console.error("Failed to refresh token", err);
    }
  };

  // If there is an existing token, start refresh timer
  if (savedToken) {
    startRefreshTimer(savedToken, triggerRefresh);
  }

  return {
    token: savedToken,
    user: savedUser,
    isAuthenticated: !!savedToken,
    login: (token, user) => {
      localStorage.setItem("intell_meet_token", token);
      localStorage.setItem("intell_meet_user", JSON.stringify(user));
      localStorage.setItem("intell_meet_uid", user.id);
      localStorage.setItem("intell_meet_name", user.name);
      sessionStorage.setItem("intell_meet_just_logged_in", "true");
      set({ token, user, isAuthenticated: true });
      startRefreshTimer(token, triggerRefresh);
    },
    logout: () => {
      localStorage.removeItem("intell_meet_token");
      localStorage.removeItem("intell_meet_user");
      localStorage.removeItem("intell_meet_uid");
      localStorage.removeItem("intell_meet_name");
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      set({ token: null, user: null, isAuthenticated: false });
      // Call logout API in background (best effort)
      fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    },
    updateUser: (updatedFields) => {
      const currentUser = get().user;
      if (!currentUser) return;
      const newUser = { ...currentUser, ...updatedFields };
      localStorage.setItem("intell_meet_user", JSON.stringify(newUser));
      localStorage.setItem("intell_meet_name", newUser.name);
      set({ user: newUser });
    },
    setToken: (token) => {
      localStorage.setItem("intell_meet_token", token);
      set({ token });
      startRefreshTimer(token, triggerRefresh);
    },
  };
});
