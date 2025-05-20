/**
 * ボリュームチェック結果取得API（GET /api/v1/analysis/volume-check/:id）の統合テスト
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

describe('ボリュームチェック結果取得API（GET /api/v1/analysis/volume-check/:id）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ボリュームチェック結果取得テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ボリュームチェック結果取得テスト用',
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
  let testVolumeCheckId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件とボリュームチェック結果を作成
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    
    // テスト用のボリュームチェックを実行
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
  }, 180000); // 3分のタイムアウト
  
  it('認証済みユーザーはボリュームチェック結果を取得できる', async () => {
    console.log('テスト用ID:', { testVolumeCheckId, testPropertyId });
    
    if (!testVolumeCheckId) {
      throw new Error('テスト用ボリュームチェックIDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId');
    expect(res.body.data).toHaveProperty('assetType');
    expect(res.body.data).toHaveProperty('buildingArea');
    expect(res.body.data).toHaveProperty('totalFloorArea');
    expect(res.body.data).toHaveProperty('buildingHeight');
    expect(res.body.data).toHaveProperty('consumptionRate');
    expect(res.body.data).toHaveProperty('floors');
    
    // レスポンスデータの詳細検証
    expect(typeof res.body.data.buildingArea).toBe('number');
    expect(typeof res.body.data.totalFloorArea).toBe('number');
    expect(typeof res.body.data.buildingHeight).toBe('number');
    expect(typeof res.body.data.consumptionRate).toBe('number');
    
    // 各フロアのデータを検証
    expect(Array.isArray(res.body.data.floorBreakdown)).toBe(true);
    expect(res.body.data.floorBreakdown.length).toBeGreaterThan(0);
    res.body.data.floorBreakdown.forEach((floor: any) => {
      expect(floor).toHaveProperty('floor');
      expect(floor).toHaveProperty('floorArea');
      expect(floor).toHaveProperty('privateArea');
      expect(floor).toHaveProperty('commonArea');
    });
    
    // 法規制チェックを検証
    expect(Array.isArray(res.body.data.regulationChecks)).toBe(true);
    res.body.data.regulationChecks.forEach((check: any) => {
      expect(check).toHaveProperty('name');
      expect(check).toHaveProperty('regulationValue');
      expect(check).toHaveProperty('plannedValue');
      expect(check).toHaveProperty('compliant');
      expect(typeof check.compliant).toBe('boolean');
    });
  });
  
  it('認証なしでボリュームチェック結果を取得できない', async () => {
    if (!testVolumeCheckId) {
      throw new Error('テスト用ボリュームチェックIDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/volume-check/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});