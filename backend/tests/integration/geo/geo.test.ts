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

  // 逆ジオコーディングのテスト
  describe('GET /geocode/reverse', () => {
    it('認証済みユーザーは緯度経度から住所情報を取得できる', async () => {
      const lat = 35.6764;
      const lng = 139.6500;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('lat');
      expect(res.body.data).toHaveProperty('lng');
      expect(res.body.data).toHaveProperty('formatted_address');
      expect(typeof res.body.data.lat).toBe('number');
      expect(typeof res.body.data.lng).toBe('number');
      expect(typeof res.body.data.formatted_address).toBe('string');
      // 入力した緯度経度が返却値にも含まれていることを確認
      expect(res.body.data.lat).toBe(lat);
      expect(res.body.data.lng).toBe(lng);
    });
    
    it('認証なしで逆ジオコーディングできない', async () => {
      const lat = 35.6764;
      const lng = 139.6500;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('latパラメータが必須', async () => {
      const lng = 139.6500;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lat');
    });
    
    it('lngパラメータが必須', async () => {
      const lat = 35.6764;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lng');
    });
    
    it('latは数値であること', async () => {
      const lat = 'invalid';
      const lng = 139.6500;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lat');
    });
    
    it('lngは数値であること', async () => {
      const lat = 35.6764;
      const lng = 'invalid';
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lng');
    });
    
    it('latの範囲は-90から90までであること', async () => {
      const lat = 100; // 範囲外
      const lng = 139.6500;
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lat');
    });
    
    it('lngの範囲は-180から180までであること', async () => {
      const lat = 35.6764;
      const lng = 200; // 範囲外
      
      const res = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat}&lng=${lng}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      expect(res.body.error.details).toHaveProperty('lng');
    });
    
    it('異なる緯度経度には異なる住所が返される', async () => {
      // 東京付近
      const lat1 = 35.6764;
      const lng1 = 139.6500;
      
      // 大阪付近
      const lat2 = 34.6937;
      const lng2 = 135.5022;
      
      const res1 = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat1}&lng=${lng1}`)
        .set('Authorization', authHeader);
      
      const res2 = await request(app)
        .get(`${baseUrl}/geocode/reverse?lat=${lat2}&lng=${lng2}`)
        .set('Authorization', authHeader);
      
      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      
      // 住所が異なることを確認
      expect(res1.body.data.formatted_address).not.toBe(res2.body.data.formatted_address);
    });
  });
});