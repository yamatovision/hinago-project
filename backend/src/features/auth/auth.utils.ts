/**
 * 認証関連のユーティリティ関数
 */
import jwt from 'jsonwebtoken';
import { AuthUser, JwtPayload, UserRole } from '../../types';
import { authConfig } from '../../config';
import { logger } from '../../common/utils';

/**
 * アクセストークンを生成する
 * @param user ユーザー情報
 * @returns 生成されたアクセストークン
 */
export const generateAccessToken = (user: AuthUser): string => {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(
    payload,
    authConfig.jwt.secret,
    { expiresIn: authConfig.jwt.accessTokenExpiration }
  );
};

/**
 * アクセストークンを検証する
 * @param token トークン文字列
 * @returns 検証結果（成功時はペイロード、失敗時はnull）
 */
export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, authConfig.jwt.secret) as JwtPayload;
  } catch (error) {
    logger.debug('トークン検証エラー', { error });
    return null;
  }
};

/**
 * Bearer トークンからアクセストークンを抽出する
 * @param bearerToken Authorization ヘッダーの値
 * @returns アクセストークンまたはnull
 */
export const extractTokenFromBearer = (bearerToken?: string): string | null => {
  if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
    return null;
  }
  return bearerToken.split(' ')[1];
};

/**
 * リフレッシュトークンの有効期限を計算する
 * @param rememberMe 長期間ログインを保持するかどうか
 * @returns 有効期限（秒）
 */
export const calculateRefreshTokenExpiration = (rememberMe?: boolean): number => {
  // rememberMe が true の場合は通常の有効期限、それ以外の場合は1日
  return rememberMe ? authConfig.jwt.refreshTokenExpiration : 86400; // 86400秒 = 1日
};

/**
 * ユーザー情報から認証用のユーザー情報を抽出する（パスワードなどの機密情報を除外）
 * @param user ユーザー情報
 * @returns 認証用のユーザー情報
 */
export const extractAuthUser = (user: any): AuthUser => {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
  };
};