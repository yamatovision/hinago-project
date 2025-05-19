/**
 * 認証フロー統合テスト
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig, authConfig } from '../../../src/config';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// テスト実行前のセットアップ
beforeAll(async () => {
  await setupTestDatabase();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await cleanupTestDatabase();
});

describe('認証フロー', () => {
  let accessToken: string;
  let refreshToken: string;
  
  // ログインのテスト
  describe('POST /auth/login', () => {
    it('有効な認証情報でログインができる', async () => {
      const credentials = {
        email: authConfig.auth.adminUser.email,
        password: authConfig.auth.adminUser.password,
      };
      
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send(credentials);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(credentials.email);
      
      // 後続のテストのためにトークンを保存
      accessToken = res.body.data.accessToken;
      refreshToken = res.body.data.refreshToken;
    });
    
    it('無効なメールアドレスでログインできない', async () => {
      const invalidCredentials = {
        email: 'invalid@example.com',
        password: authConfig.auth.adminUser.password,
      };
      
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send(invalidCredentials);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
    
    it('無効なパスワードでログインできない', async () => {
      const invalidCredentials = {
        email: authConfig.auth.adminUser.email,
        password: 'invalidpassword',
      };
      
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send(invalidCredentials);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_CREDENTIALS');
    });
  });
  
  // 認証状態確認のテスト
  describe('GET /auth/me', () => {
    it('有効なトークンで認証ユーザー情報を取得できる', async () => {
      const { authHeader } = await getTestAuth();
      
      const res = await request(app)
        .get(`${baseUrl}/auth/me`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe(authConfig.auth.adminUser.email);
    });
    
    it('トークンなしでユーザー情報を取得できない', async () => {
      const res = await request(app)
        .get(`${baseUrl}/auth/me`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('無効なトークンでユーザー情報を取得できない', async () => {
      const res = await request(app)
        .get(`${baseUrl}/auth/me`)
        .set('Authorization', 'Bearer invalid.token.here');
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });
  });
  
  // トークン更新のテスト
  describe('POST /auth/refresh', () => {
    it('有効なリフレッシュトークンで新しいアクセストークンを取得できる', async () => {
      // まずログインして有効なリフレッシュトークンを取得
      const { refreshToken } = await getTestAuth();
      
      const res = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
    });
    
    it('無効なリフレッシュトークンで新しいアクセストークンを取得できない', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({ refreshToken: 'invalid-refresh-token' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'INVALID_TOKEN');
    });
  });
  
  // ログアウトのテスト
  describe('POST /auth/logout', () => {
    it('有効なトークンでログアウトできる', async () => {
      const { authHeader, refreshToken } = await getTestAuth();
      
      const res = await request(app)
        .post(`${baseUrl}/auth/logout`)
        .set('Authorization', authHeader)
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message', 'ログアウトしました');
      
      // ログアウト後にリフレッシュトークンが無効になっていることを確認
      const refreshRes = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({ refreshToken });
      
      expect(refreshRes.status).toBe(401);
      expect(refreshRes.body.success).toBe(false);
    });
    
    it('トークンなしでログアウトできない', async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/logout`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
  });
});