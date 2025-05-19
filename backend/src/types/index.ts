/**
 * ===== 統合型定義 =====
 * 
 * このファイルはshared/index.ts をリファレンスとして、
 * 必要な型定義をコピーしたものです。
 * デプロイ時の問題を回避するためのアプローチです。
 */

// 基本ID型
export type ID = string;

// タイムスタンプ関連
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// レスポンス共通構造
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: Record<string, any>;
}

/**
 * =================
 * 認証関連の型定義
 * =================
 */

// ユーザーロールの列挙型
export enum UserRole {
  ADMIN = 'ADMIN', // 管理者
  USER = 'USER',   // 一般ユーザー（将来拡張用）
  GUEST = 'GUEST'  // ゲスト（将来拡張用）
}

// ユーザーの型（DBモデルに対応）
export interface User extends Timestamps {
  id: ID;
  email: string;      // メールアドレス
  name?: string;      // ユーザー名
  password: string;   // ハッシュ化されたパスワード（保存用）
  role: UserRole;     // ユーザーロール
}

// 認証用ユーザー情報（パスワードなどのセキュリティ情報を除いた情報）
export interface AuthUser {
  id: ID;
  email: string;
  name?: string;
  role: UserRole;
}

// リフレッシュトークンの型（DBモデルに対応）
export interface RefreshToken extends Timestamps {
  id: ID;
  userId: ID;        // ユーザーID
  token: string;     // トークン文字列
  expiresAt: Date;   // 有効期限
}

// ログインリクエストの型
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ログインレスポンスの型
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// リフレッシュトークンリクエストの型
export interface RefreshTokenRequest {
  refreshToken: string;
}

// リフレッシュトークンレスポンスの型
export interface RefreshTokenResponse {
  accessToken: string;
}

// JWT Payloadの型
export interface JwtPayload {
  sub: string;     // ユーザーID
  email: string;   // メールアドレス
  role: UserRole;  // ロール
  iat: number;     // 発行時間
  exp: number;     // 有効期限
}

/**
 * =================
 * APIパスの定義
 * =================
 */

export const API_PATHS = {
  // 認証関連
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
  },
};

/**
 * =================
 * 認証設定
 * =================
 */

// 認証が不要なパブリックエンドポイント
export const PUBLIC_ENDPOINTS = [
  API_PATHS.AUTH.LOGIN,
  API_PATHS.AUTH.REFRESH
];

// 固定管理者ユーザー（開発用）
export const FIXED_ADMIN_USER: AuthUser = {
  id: '1',
  email: 'higano@gmail.com',
  name: '管理者',
  role: UserRole.ADMIN
};