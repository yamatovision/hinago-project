/**
 * 認証関連のテストヘルパー
 */
import request from 'supertest';
import app from '../../src/app';
import { appConfig, authConfig } from '../../src/config';
import { logger } from '../../src/common/utils';
import { UserModel } from '../../src/db/models';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

/**
 * テスト用の認証情報を取得
 * @returns ログイン情報とトークン
 */
export const getTestAuth = async () => {
  // テスト用の認証情報
  const credentials = {
    email: authConfig.auth.adminUser.email,
    password: authConfig.auth.adminUser.password,
  };

  // 既存のユーザーがいなければ作成
  const existingUser = await UserModel.findByEmail(credentials.email);
  if (!existingUser) {
    logger.debug('テスト認証用のユーザーが存在しないため作成します', { email: credentials.email });
    await UserModel.initializeDefaultUsers();
  }

  try {
    // ログインリクエスト
    const response = await request(app)
      .post(`${baseUrl}/auth/login`)
      .send(credentials);

    if (response.status !== 200) {
      logger.error('テスト認証でログインに失敗しました', { 
        status: response.status,
        body: response.body,
        credentials: { email: credentials.email, passwordLength: credentials.password.length }
      });
      throw new Error(`テスト認証でログインに失敗しました: ${response.status}`);
    }

    const { accessToken, refreshToken, user } = response.body.data;

    // 認証情報を返す
    return {
      user,
      accessToken,
      refreshToken,
      authHeader: `Bearer ${accessToken}`,
    };
  } catch (error) {
    logger.error('テスト認証情報取得エラー', { error });
    throw error;
  }
};

/**
 * 認証済みのリクエストを作成
 * @param method HTTPメソッド
 * @param url エンドポイントURL
 * @returns Supertestリクエスト（認証済み）
 */
export const authenticatedRequest = async (method: 'get' | 'post' | 'put' | 'delete', url: string) => {
  try {
    const { authHeader } = await getTestAuth();

    // メソッドに応じてリクエストを作成
    const req = request(app)[method](url).set('Authorization', authHeader);

    return req;
  } catch (error) {
    logger.error('認証済みリクエスト作成エラー', { error, method, url });
    throw error;
  }
};

/**
 * テスト用に管理者ユーザーを事前検証
 * テスト前にこの関数を使用して管理者ユーザーを確実にセットアップ
 */
export const verifyTestAdminUser = async () => {
  // 管理者ユーザーが存在するか確認
  const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
  
  // 存在しない場合は作成
  if (!adminUser) {
    logger.info('テスト用管理者ユーザーを作成します');
    await UserModel.initializeDefaultUsers();
    return { created: true };
  }
  
  // 存在する場合はパスワードを検証
  const isValidPassword = await UserModel.verifyPassword(
    authConfig.auth.adminUser.password, 
    adminUser.password
  );
  
  if (!isValidPassword) {
    logger.warn('テスト用管理者ユーザーのパスワードが正しくありません。更新します。');
    await UserModel.update(adminUser.id, {
      password: authConfig.auth.adminUser.password,
    });
    return { updated: true };
  }
  
  return { exists: true };
};