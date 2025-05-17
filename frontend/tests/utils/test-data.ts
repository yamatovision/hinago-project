import { User, UserRole, AuthResponse } from '../mock-types';

/**
 * テスト用のユーザーデータ
 */
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'テストユーザー',
  role: UserRole.USER,
  organizationId: 'test-org-id',
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
};

/**
 * テスト用の認証レスポンス
 */
export const mockAuthResponse: AuthResponse = {
  user: mockUser,
  token: {
    token: 'mock-token',
    refreshToken: 'mock-refresh-token',
    expiresAt: new Date(Date.now() + 3600000).toISOString() // 1時間後
  }
};

/**
 * テスト用のログインデータ
 */
export const mockLoginData = {
  email: 'test@example.com',
  password: 'password123',
  rememberMe: true
};

/**
 * テスト用の登録データ
 */
export const mockRegisterData = {
  name: 'テストユーザー',
  email: 'newuser@example.com',
  password: 'password123',
  organizationName: 'テスト株式会社'
};

/**
 * テスト用のパスワードリセットデータ
 */
export const mockPasswordResetData = {
  email: 'test@example.com',
  token: 'mock-reset-token',
  password: 'newpassword123'
};