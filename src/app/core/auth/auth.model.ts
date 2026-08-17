export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneCountryCode: string | null;
  phone: string | null;
  enabled: boolean;
  deleted: boolean;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneCountryCode?: string | null;
  phone?: string | null;
  password: string;
}

export interface ApiErrorBody {
  data: null;
  msg: string;
  code?: string;
}
