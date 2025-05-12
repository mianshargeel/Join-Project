// For sign-up only
export interface SignUpCredentials {
  name: string;
  email: string;
  password: string;
}

// For sign-in only
export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  uid: string;
  email: string | null;
}