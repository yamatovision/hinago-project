/**
 * ジオコーディングAPI統合テスト
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
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

describe('ジオコーディングAPI', () => {
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  // ジオコーディングのテスト
  describe('GET /geocode', () => {
    it('認証済みユーザーは住所から緯度経度情報を取得できる', async () => {
      const address = '福岡県福岡市中央区大名2-1-1';
      
      const res = await request(app)
        .get(`${baseUrl}/geocode?address=${encodeURIComponent(address)}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('lat');
      expect(res.body.data).toHaveProperty('lng');
      expect(res.body.data).toHaveProperty('formatted_address');
      expect(typeof res.body.data.lat).toBe('number');
      expect(typeof res.body.data.lng).toBe('number');
    });
    
    it('認証なしでジオコーディングできない', async () => {
      const address = '福岡県福岡市中央区大名2-1-1';
      
      const res = await request(app)
        .get(`${baseUrl}/geocode?address=${encodeURIComponent(address)}`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('addressパラメータが必須', async () => {
      const res = await request(app)
        .get(`${baseUrl}/geocode`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('address');
    });
    
    it('空のaddressパラメータはエラーになる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/geocode?address=`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('address');
    });
    
    it('異なる住所には異なる緯度経度が返される', async () => {
      const address1 = '福岡県福岡市中央区大名2-1-1';
      const address2 = '東京都新宿区新宿1-1-1';
      
      const res1 = await request(app)
        .get(`${baseUrl}/geocode?address=${encodeURIComponent(address1)}`)
        .set('Authorization', authHeader);
      
      const res2 = await request(app)
        .get(`${baseUrl}/geocode?address=${encodeURIComponent(address2)}`)
        .set('Authorization', authHeader);
      
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      // 緯度経度が異なることを確認
      expect(res1.body.data.lat).not.toBe(res2.body.data.lat);
      expect(res1.body.data.lng).not.toBe(res2.body.data.lng);
    });
  });
});