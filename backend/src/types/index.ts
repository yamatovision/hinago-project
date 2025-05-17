/**
 * このファイルはshared/index.tsをリファレンスとして、バックエンドで必要な型定義を実装します。
 * ここではバックエンド固有の拡張も行います。
 */

// 共通型定義
export type ID = string;

export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

// 認証・ユーザー関連
export enum UserRole {
  USER = 'user',
}

export interface User extends Timestamps {
  id: ID;
  email: string;
  name: string;
  role: UserRole;
  organizationId: ID;
  password: string; // DBモデル用（API応答には含めない）
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthResponse {
  user: Omit<User, 'password'>;
  token: AuthToken;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  organizationName: string;
}

// 組織関連
export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  PREMIUM = 'premium',
}

export interface Organization extends Timestamps {
  id: ID;
  name: string;
  subscription: SubscriptionType;
}

// トークン保存用モデル (MongoDBモデル用)
export interface RefreshToken extends Timestamps {
  id: ID;
  userId: ID;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
}

// バックエンド専用 - リクエスト拡張
export interface RequestWithUser extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

// APIパス定義
export const API_PATHS = {
  // 認証関連
  AUTH: {
    BASE: '/api/auth',
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh',
    PASSWORD_RESET_REQUEST: '/api/auth/password-reset/request',
    PASSWORD_RESET_CONFIRM: '/api/auth/password-reset/confirm',
    ME: '/api/auth/me'
  }
};

// 認証設定
export const API_AUTH_CONFIG = {
  // 認証が不要なパブリックエンドポイント
  PUBLIC_ENDPOINTS: [
    API_PATHS.AUTH.LOGIN,
    API_PATHS.AUTH.REGISTER,
    API_PATHS.AUTH.REFRESH,
    API_PATHS.AUTH.PASSWORD_RESET_REQUEST,
    API_PATHS.AUTH.PASSWORD_RESET_CONFIRM,
  ],
  
  // アクセストークン設定
  TOKEN_CONFIG: {
    ACCESS_TOKEN_EXPIRY: 15 * 60, // 15分（秒単位）
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60, // 7日（秒単位）
    REFRESH_TOKEN_EXPIRY_REMEMBER: 30 * 24 * 60 * 60, // 30日（秒単位）
  }
};