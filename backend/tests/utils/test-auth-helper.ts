/**
 * テスト用認証ヘルパー
 */
import jwt from 'jsonwebtoken';
import { createTestUser, createTestRefreshToken } from './db-test-helper';
import config from '../../src/config';

/**
 * テスト用アクセストークンの生成
 */
export const generateTestAccessToken = (
  userId: string,
  email = 'test@example.com',
  role = 'user',
  organizationId = 'testOrgId'
): string => {
  const payload = {
    id: userId,
    email,
    role,
    organizationId,
  };
  
  return jwt.sign(payload, config.auth.jwt.secret, {
    expiresIn: '15m',
  });
};

/**
 * テスト用認証ユーザーの作成（ユーザー + トークン）
 */
export const createTestAuthUser = async (): Promise<{
  user: any;
  accessToken: string;
  refreshToken: string;
}> => {
  // テストユーザーの作成
  const user = await createTestUser();
  
  // アクセストークンの生成
  const accessToken = generateTestAccessToken(
    user._id.toString(),
    user.email,
    user.role,
    user.organizationId.toString()
  );
  
  // リフレッシュトークンの作成
  const refreshTokenValue = 'test-refresh-token';
  await createTestRefreshToken(user._id, refreshTokenValue);
  
  return {
    user,
    accessToken,
    refreshToken: refreshTokenValue,
  };
};

/**
 * 認証ヘッダーの生成
 */
export const getAuthHeader = (accessToken: string): { Authorization: string } => {
  return { Authorization: `Bearer ${accessToken}` };
};