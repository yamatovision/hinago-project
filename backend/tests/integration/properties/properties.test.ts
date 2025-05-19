/**
 * 物件API統合テスト
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { setupTestDatabase, cleanupTestDatabase } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { ZoneType, FireZoneType, ShadowRegulationType, PropertyStatus } from '../../../src/types';

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

describe('物件API', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'テスト物件',
    address: '福岡県福岡市中央区大名2-1-1',
    area: 250.5,
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.SEMI_FIRE,
    shadowRegulation: ShadowRegulationType.TYPE1,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 120000000,
    status: PropertyStatus.ACTIVE,
    notes: '駅から徒歩5分の好立地',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 25.05 },
        { x: 0, y: 25.05 }
      ],
      width: 10,
      depth: 25.05
    }
  };
  
  let testPropertyId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  // 物件作成のテスト
  describe('POST /properties', () => {
    it('認証済みユーザーは新しい物件を作成できる', async () => {
      const res = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(testPropertyData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(testPropertyData.name);
      expect(res.body.data.address).toBe(testPropertyData.address);
      expect(res.body.data.area).toBe(testPropertyData.area);
      expect(res.body.data.allowedBuildingArea).toBeCloseTo(testPropertyData.area * testPropertyData.buildingCoverage / 100, 2);
      
      // 後続のテストのために物件IDを保存
      testPropertyId = res.body.data.id;
    });
    
    it('認証なしで物件を作成できない', async () => {
      const res = await request(app)
        .post(`${baseUrl}/properties`)
        .send(testPropertyData);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('必須フィールドが欠けている場合はエラーになる', async () => {
      // 必須フィールドを欠いたデータ
      const invalidData = {
        name: 'テスト物件',
        // addressが欠けている
        area: 250.5
        // その他の必須フィールドも欠けている
      };
      
      const res = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(invalidData);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
      // 期待されるバリデーションエラーのフィールドを持っているか
      expect(res.body.error.details).toHaveProperty('address');
      expect(res.body.error.details).toHaveProperty('zoneType');
      expect(res.body.error.details).toHaveProperty('fireZone');
    });
  });
  
  // 物件一覧取得のテスト
  describe('GET /properties', () => {
    it('認証済みユーザーは物件一覧を取得できる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      
      // 作成した物件が一覧に含まれているか
      const foundProperty = res.body.data.find((p: any) => p.id === testPropertyId);
      expect(foundProperty).toBeDefined();
      expect(foundProperty.name).toBe(testPropertyData.name);
    });
    
    it('認証なしで物件一覧を取得できない', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('クエリパラメータでフィルタリングができる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties?status=${PropertyStatus.ACTIVE}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // すべての物件が指定したステータスを持っているか確認
      res.body.data.forEach((property: any) => {
        expect(property.status).toBe(PropertyStatus.ACTIVE);
      });
    });
    
    it('クエリパラメータでページネーションができる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties?page=1&limit=5`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('page', 1);
      expect(res.body.meta).toHaveProperty('limit', 5);
      
      // 返された物件数がページサイズ以下であることを確認
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });
  });
  
  // 物件詳細取得のテスト
  describe('GET /properties/:propertyId', () => {
    it('認証済みユーザーは物件詳細を取得できる', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testPropertyId);
      expect(res.body.data.name).toBe(testPropertyData.name);
      expect(res.body.data.address).toBe(testPropertyData.address);
      expect(res.body.data).toHaveProperty('shapeData');
      expect(res.body.data.shapeData).toHaveProperty('points');
    });
    
    it('認証なしで物件詳細を取得できない', async () => {
      const res = await request(app)
        .get(`${baseUrl}/properties/${testPropertyId}`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('存在しない物件IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .get(`${baseUrl}/properties/${nonExistentId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
  
  // 物件更新のテスト
  describe('PUT /properties/:propertyId', () => {
    it('認証済みユーザーは物件を更新できる', async () => {
      const updateData = {
        name: '更新されたテスト物件',
        price: 150000000,
        status: PropertyStatus.NEGOTIATING
      };
      
      const res = await request(app)
        .put(`${baseUrl}/properties/${testPropertyId}`)
        .set('Authorization', authHeader)
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testPropertyId);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.price).toBe(updateData.price);
      expect(res.body.data.status).toBe(updateData.status);
      expect(res.body.data.address).toBe(testPropertyData.address); // 更新していないフィールドは維持される
    });
    
    it('認証なしで物件を更新できない', async () => {
      const res = await request(app)
        .put(`${baseUrl}/properties/${testPropertyId}`)
        .send({ name: '無断更新' });
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    });
    
    it('存在しない物件IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .put(`${baseUrl}/properties/${nonExistentId}`)
        .set('Authorization', authHeader)
        .send({ name: '存在しない物件' });
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
  
  // 物件削除のテスト
  describe('DELETE /properties/:propertyId', () => {
    it('認証済みユーザーは物件を削除できる', async () => {
      // 削除用に新しいテスト物件を作成
      const createRes = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(testPropertyData);
      
      const deletePropertyId = createRes.body.data.id;
      
      // 物件IDが存在することを確認
      expect(deletePropertyId).toBeDefined();
      
      // 物件を削除
      const res = await request(app)
        .delete(`${baseUrl}/properties/${deletePropertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(204); // No Content
      
      // 削除されたことを確認するために物件詳細を取得
      const checkRes = await request(app)
        .get(`${baseUrl}/properties/${deletePropertyId}`)
        .set('Authorization', authHeader);
      
      expect(checkRes.status).toBe(404);
      expect(checkRes.body.success).toBe(false);
      expect(checkRes.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
    
    it('認証なしで物件を削除できない', async () => {
      // 削除用に新たな物件を作成
      const createRes = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(testPropertyData);
      
      const newPropertyId = createRes.body.data.id;
      
      // 認証なしで削除を試みる
      const res = await request(app)
        .delete(`${baseUrl}/properties/${newPropertyId}`);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      // 削除されていないことを確認
      const checkRes = await request(app)
        .get(`${baseUrl}/properties/${newPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.success).toBe(true);
      
      // テストの後始末として作成した物件を削除
      await request(app)
        .delete(`${baseUrl}/properties/${newPropertyId}`)
        .set('Authorization', authHeader);
    });
    
    it('存在しない物件IDでは404が返される', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011'; // 適当な MongoDB ObjectId フォーマット
      
      const res = await request(app)
        .delete(`${baseUrl}/properties/${nonExistentId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
});