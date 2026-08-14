import axios from "axios";
import { create } from "zustand";

// Interface for user
interface User {
  username: string;
  displayName: string;
  email: string;
}

// Interface for registration credentials
interface RegistrationCredentials {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

// Interface for login credentials
interface LoginCredentials {
  login: string;
  password: string;
}

// Types for user data
interface UserState {
  user: User | null;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isCheckingAuth: boolean;
  authError: string | null;
}

// Types of user actions
interface UserActions {
  register: (credentials: RegistrationCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  authCheck: () => Promise<void>;
}

// Combine user state and actions
type UserStore = UserState & UserActions;

// Define the initial state
const initialAuthState: UserState = {
  user: null,
  isRegistering: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  authError: null,
};

// Create the user store
export const useAuthStore = create<UserStore>((set) => ({
  // Initial state
  ...initialAuthState,

  // Register user
  register: async (credentials) => {
    set({ isRegistering: true });
    try {
      const response = await axios.post("/api/v1/auth/register", credentials);
      set({ user: response.data.user, isRegistering: false });
    } catch (error) {
      console.log(error);
      set({ isRegistering: false });
    }
  },

  // Login user
  login: async (credentials) => {
    set({ authError: null, isLoggingIn: true });
    try {
      const response = await axios.post("/api/v1/auth/login", credentials);
      set({ user: response.data.user, authError: null, isLoggingIn: false });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          authError: error.response?.data?.message || "Login failed",
          isLoggingIn: false,
        });
        throw error;
      } else {
        set({ authError: "An unexpected error occurred", isLoggingIn: false });
        throw error;
      }
    }
  },

  logout: async () => {},

  // Check authentication
  authCheck: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axios.get("/api/v1/auth/authCheck");
      set({ user: response.data.user, isCheckingAuth: false });
    } catch (error) {
      console.log(error);
      set({ user: null, isCheckingAuth: false });
    }
  },
}));
