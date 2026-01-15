import { create } from "zustand";
import Cookies from "js-cookie";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "OWNER" | "MANAGER" | "STAFF" | "CUSTOMER";
  tenantId: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const useAuthStore = create<AuthState>()((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => {
    // Store in cookies (7 days expiry)
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: "lax" });
    Cookies.set(USER_KEY, JSON.stringify(user), {
      expires: 7,
      sameSite: "lax",
    });
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY);
    Cookies.remove(USER_KEY);
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = Cookies.get(TOKEN_KEY);
    const userStr = Cookies.get(USER_KEY);

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        set({ token, user, isAuthenticated: true });
      } catch {
        // Invalid user data, clear cookies
        Cookies.remove(TOKEN_KEY);
        Cookies.remove(USER_KEY);
      }
    }
  },
}));
