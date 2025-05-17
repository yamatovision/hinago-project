import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@common/hooks/useAuth';
import AuthAPI from '@features/auth/api';
import { authStorage } from '@common/utils/api';
import { mockUser, mockAuthResponse, mockLoginData } from '../utils/test-data';

// AuthAPIのモック
jest.mock('@features/auth/api', () => ({
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
}));

// authStorageのモック
jest.mock('@common/utils/api', () => ({
  authStorage: {
    saveTokens: jest.fn(),
    clearTokens: jest.fn(),
    isTokenExpired: jest.fn(),
    getAuthInfo: jest.fn(),
  },
}));

// モジュールのモックを削除

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    // AuthStorageのデフォルトの振る舞いを設定
    (authStorage.getAuthInfo as jest.Mock).mockReturnValue({
      token: null,
      refreshToken: null,
      expiresAt: null,
      rememberMe: false,
    });
    (authStorage.isTokenExpired as jest.Mock).mockReturnValue(true);
  });

  it('初期状態ではユーザーがnullである', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // 初期ロード中はisLoadingがtrue
    expect(result.current.isLoading).toBe(true);
    
    // ロード完了後
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // 認証されていない場合
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ログイン成功時にユーザーが設定される', async () => {
    // AuthAPIのログイン成功のモック
    (AuthAPI.login as jest.Mock).mockResolvedValue(mockAuthResponse);
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // ローディング完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // ログイン処理
    await act(async () => {
      await result.current.login(mockLoginData.email, mockLoginData.password, mockLoginData.rememberMe);
    });
    
    // ログイン成功後の状態
    expect(result.current.user).toEqual(mockAuthResponse.user);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.error).toBeNull();
    expect(AuthAPI.login).toHaveBeenCalledWith({
      email: mockLoginData.email,
      password: mockLoginData.password,
      rememberMe: mockLoginData.rememberMe,
    });
  });

  it('ログインエラー時にエラーが設定される', async () => {
    // AuthAPIのログイン失敗のモック
    const errorMessage = 'Invalid credentials';
    (AuthAPI.login as jest.Mock).mockRejectedValue(new Error(errorMessage));
    
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // ローディング完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // ログイン処理（エラーをキャッチするため try-catch を使用）
    await act(async () => {
      try {
        await result.current.login(mockLoginData.email, mockLoginData.password);
      } catch (error) {
        // エラーはuseAuthフックでキャッチされるのでここでは何もしない
      }
    });
    
    // ログイン失敗後の状態
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).not.toBeNull();
  });

  it('ログアウト時にユーザー情報がクリアされる', async () => {
    // 最初にログイン状態にする
    (AuthAPI.login as jest.Mock).mockResolvedValue(mockAuthResponse);
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    await act(async () => {
      await result.current.login(mockLoginData.email, mockLoginData.password);
    });
    
    expect(result.current.user).toEqual(mockAuthResponse.user);
    
    // ログアウト処理
    await act(async () => {
      await result.current.logout();
    });
    
    // ログアウト後の状態
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(AuthAPI.logout).toHaveBeenCalled();
  });

  it('トークンが有効な場合は自動的にユーザー情報を取得する', async () => {
    // 有効なトークンがある状態をモック
    (authStorage.getAuthInfo as jest.Mock).mockReturnValue({
      token: 'valid-token',
      refreshToken: 'valid-refresh-token',
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      rememberMe: true,
    });
    (authStorage.isTokenExpired as jest.Mock).mockReturnValue(false);
    (AuthAPI.getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    
    // レンダリング（初期化時にAuthProviderがトークンチェックを行う）
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // ユーザー情報の取得完了を待つ
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    // 正しくユーザー情報が設定されていることを確認
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(AuthAPI.getCurrentUser).toHaveBeenCalled();
  });
});