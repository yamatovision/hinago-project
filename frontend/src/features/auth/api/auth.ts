/**
 * 認証関連のAPI
 */
import { API_PATHS, LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse, AuthUser } from 'shared';
import { post, get } from '../../../common/utils/api';

/**
 * ログイン処理
 * @param loginData ログインリクエストデータ
 * @returns ログインレスポンス
 */
export const login = async (loginData: LoginRequest): Promise<LoginResponse | null> => {
  const response = await post<LoginResponse>(API_PATHS.AUTH.LOGIN, loginData);
  
  if (response.success && response.data) {
    // トークンをローカルストレージに保存
    localStorage.setItem('accessToken', response.data.accessToken);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data;
  }
  
  return null;
};

/**
 * ログアウト処理
 */
export const logout = async (): Promise<boolean> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  // リフレッシュトークンがある場合のみAPIを呼び出す
  if (refreshToken) {
    const response = await post(API_PATHS.AUTH.LOGOUT, { refreshToken });
    
    if (!response.success) {
      console.error('ログアウトエラー:', response.error);
    }
  }
  
  // ローカルストレージからトークンを削除
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  
  return true;
};

/**
 * トークンをリフレッシュ
 * @returns 新しいアクセストークン
 */
export const refreshToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!refreshToken) {
    return null;
  }
  
  const refreshData: RefreshTokenRequest = { refreshToken };
  const response = await post<RefreshTokenResponse>(API_PATHS.AUTH.REFRESH, refreshData);
  
  if (response.success && response.data) {
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data.accessToken;
  }
  
  return null;
};

/**
 * 現在のユーザー情報を取得
 * @returns ユーザー情報
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const response = await get<AuthUser>(API_PATHS.AUTH.ME);
  
  if (response.success && response.data) {
    return response.data;
  }
  
  return null;
};