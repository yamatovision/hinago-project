/**
 * 認証関連のカスタムフック
 */
import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AuthUser, LoginRequest } from 'shared';
import { login, logout, getCurrentUser } from '../../features/auth/api/auth';

// 認証コンテキストの型定義
interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認証プロバイダーのProps型定義
interface AuthProviderProps {
  children: ReactNode;
}

// 認証プロバイダーコンポーネント
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初期ロード時にトークンがあればユーザー情報を取得
  useEffect(() => {
    const initAuth = async () => {
      if (localStorage.getItem('accessToken')) {
        try {
          const user = await getCurrentUser();
          setUser(user);
        } catch (error) {
          console.error('認証初期化エラー:', error);
          // エラー時は認証情報をクリア
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ログイン処理
  const handleLogin = async (data: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(data);
      
      if (response) {
        setUser(response.user);
        setIsLoading(false);
        return true;
      } else {
        setError('ログインに失敗しました');
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      setError('ログイン処理中にエラーが発生しました');
      setIsLoading(false);
      return false;
    }
  };

  // ログアウト処理
  const handleLogout = async (): Promise<void> => {
    setIsLoading(true);
    
    try {
      await logout();
      setUser(null);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
    
    setIsLoading(false);
  };

  // コンテキスト値
  const value = {
    user,
    isLoading,
    error,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 認証フックを使用するためのカスタムフック
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};