import axios from "axios";
import { create } from "zustand";
import type { User } from "../types/User";
import type { LoginCredentials, RegistrationCredentials } from "../types/Auth";

// Types for user data
interface UserState {
  user: User | null;
  isRegistering: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  isCheckingAuth: boolean;
  authError: string | null;
  logoutError: string | null;
}

// Types of user actions
interface UserActions {
  registerUser: (credentials: RegistrationCredentials) => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  authCheck: () => Promise<void>;
  clearAuthError: () => void;
}

// Combine user state and actions
type UserStore = UserState & UserActions;

// Define the initial state
const initialAuthState: UserState = {
  user: null,
  isRegistering: false,
  isLoggingIn: false,
  isLoggingOut: false,
  isCheckingAuth: true,
  authError: null,
  logoutError: null,
};

// Create the user store
export const useAuthStore = create<UserStore>((set) => ({
  // Initial state
  ...initialAuthState,

  // Register user
  registerUser: async (credentials) => {
    set({ authError: null, isRegistering: true });
    try {
      const { confirmPassword, ...credentialsWithoutConfirmPassword } =
        credentials;

      const response = await axios.post(
        "/api/v1/auth/register",
        credentialsWithoutConfirmPassword,
      );
      set({ user: response.data.user, authError: null, isRegistering: false });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        set({
          authError: error.response?.data?.message || "Registration failed",
          isRegistering: false,
        });
        throw error;
      } else {
        set({
          authError: "Unable to register. Please try again",
          isRegistering: false,
        });
        throw error;
      }
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
        set({
          user: null,
          authError: "Unable to log in. Please try again",
          isLoggingIn: false,
        });
        throw error;
      }
    }
  },

  // Logout user
  logout: async () => {
    set({ logoutError: null, isLoggingOut: true });
    try {
      await axios.post("/api/v1/auth/logout");
      set({ user: null, isLoggingOut: false });
    } catch {
      set({
        logoutError: "Unable to log out. Please try again",
        isLoggingOut: false,
      });
    }
  },

  // Check authentication
  authCheck: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axios.get("/api/v1/auth/authCheck");
      set({ user: response.data.user, isCheckingAuth: false });
    } catch (error) {
      // If the user is not authenticated, this is expected
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        set({ user: null, isCheckingAuth: false });
        return;
      }

      // Otherwise, something went wrong
      console.error("Error checking authentication:", error);
      set({ user: null, isCheckingAuth: false });
    }
  },

  // Clear authentication error
  clearAuthError: () => set({ authError: null }),
}));
