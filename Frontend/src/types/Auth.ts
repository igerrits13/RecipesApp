// Interface for registration credentials
export interface RegistrationCredentials {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

// Interface for login credentials
export interface LoginCredentials {
  login: string;
  password: string;
}
