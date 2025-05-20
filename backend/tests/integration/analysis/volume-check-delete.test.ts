/**
 * ボリュームチェック結果削除API（DELETE /api/v1/analysis/volume-check/:id）の統合テスト
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus, 
  AssetType
} from '../../../src/types';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// テスト実行前のセットアップ
beforeAll(async () => {
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('ボリュームチェック結果削除API（DELETE /api/v1/analysis/volume-check/:id）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ボリュームチェック削除テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ボリュームチェック削除テスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 0 },
        { x: 20, y: 25 },
        { x: 0, y: 25 }
      ],
      width: 20,
      depth: 25
    }
  };
  
  // テスト用のボリュームチェックパラメータ
  const testBuildingParams = {
    floorHeight: 3.2,
    commonAreaRatio: 15,
    floors: 9,
    roadWidth: 6,
    assetType: AssetType.MANSION
  };
  
  let testPropertyId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件を作成
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
  });
  
  it('認証済みユーザーはボリュームチェック結果を削除できる', async () => {
    if (!testPropertyId) {
      throw new Error('テスト用物件IDが設定されていません');
    }
    
    // 削除用に新しいボリュームチェックを実行
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    // レスポンスの検証
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toHaveProperty('id');
    
    const deleteVolumeCheckId = createRes.body.data.id;
    
    // 作成されたボリュームチェック結果が取得できることを確認
    const getBeforeRes = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(getBeforeRes.status).toBe(200);
    expect(getBeforeRes.body.success).toBe(true);
    
    // ボリュームチェック結果を削除
    const deleteRes = await request(app)
      .delete(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(deleteRes.status).toBe(204); // No Content
    
    // 削除されたことを確認するためにボリュームチェック結果を取得
    const getAfterRes = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(getAfterRes.status).toBe(404);
    expect(getAfterRes.body.success).toBe(false);
    expect(getAfterRes.body.error).toHaveProperty('code', 'NOT_FOUND');
    
    // 物件に関連するボリュームチェック一覧に含まれていないことを確認
    const listRes = await request(app)
      .get(`${baseUrl}/analysis/volume-check/property/${testPropertyId}`)
      .set('Authorization', authHeader);
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    
    // 削除したIDが一覧に含まれていないことを確認
    const ids = listRes.body.data.map((item: any) => item.id);
    expect(ids).not.toContain(deleteVolumeCheckId);
  }, 180000); // 3分のタイムアウト
  
  it('認証なしでボリュームチェック結果を削除できない', async () => {
    // 削除テスト用に新しいボリュームチェックを実行
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    const testVolumeCheckId = createRes.body.data.id;
    
    // 認証なしで削除を試みる
    const res = await request(app)
      .delete(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    
    // 削除されていないことを確認
    const checkRes = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.success).toBe(true);
  }, 180000); // 3分のタイムアウト
  
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/volume-check/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/volume-check/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});