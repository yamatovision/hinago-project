/**
 * ボリュームチェック実行API（POST /api/v1/analysis/volume-check）の統合テスト
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

describe('ボリュームチェック実行API（POST /api/v1/analysis/volume-check）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ボリュームチェックテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ボリュームチェックテスト用',
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
    const res = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = res.body.data.id;
  });
  
  it('認証済みユーザーはボリュームチェックを実行できる', async () => {
    console.log('ボリュームチェック実行テスト開始...');
    console.log('使用する物件ID:', testPropertyId);
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    console.log('レスポンス受信:', res.status);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('assetType', testBuildingParams.assetType);
    expect(res.body.data).toHaveProperty('buildingArea');
    expect(res.body.data).toHaveProperty('totalFloorArea');
    expect(res.body.data).toHaveProperty('buildingHeight');
    expect(res.body.data).toHaveProperty('consumptionRate');
    expect(res.body.data).toHaveProperty('floors');
    expect(res.body.data).toHaveProperty('floorBreakdown');
    expect(res.body.data).toHaveProperty('regulationChecks');
    expect(res.body.data).toHaveProperty('model3dData');
    
    // 各フロアのデータをチェック
    expect(res.body.data.floorBreakdown.length).toBeGreaterThan(0);
    
    // 法規制チェックのデータをチェック
    expect(res.body.data.regulationChecks.length).toBeGreaterThan(0);
    
    // 3Dモデルデータをチェック
    expect(res.body.data.model3dData).toHaveProperty('modelType', 'three.js');
    expect(res.body.data.model3dData).toHaveProperty('data');
  }, 180000); // 3分のタイムアウト
  
  it('異なるパラメータで再度ボリュームチェックを実行できる', async () => {
    const differentParams = {
      ...testBuildingParams,
      floors: 12,
      commonAreaRatio: 20,
      assetType: AssetType.OFFICE
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: differentParams
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('assetType', differentParams.assetType);
    expect(res.body.data).toHaveProperty('floors');
  }, 180000); // 3分のタイムアウト
  
  it('認証なしでボリュームチェックを実行できない', async () => {
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('必須パラメータが欠けている場合はエラーになる', async () => {
    // 必須パラメータを欠いたデータ
    const invalidData = {
      propertyId: testPropertyId,
      buildingParams: {
        floorHeight: 3.2,
        // commonAreaRatioが欠けている
        floors: 9,
        assetType: AssetType.MANSION
      }
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send(invalidData);
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
  it('無効な物件IDではエラーになる', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: nonExistentId,
        buildingParams: testBuildingParams
      });
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  it('建築パラメータの値が範囲外の場合はエラーになる', async () => {
    const invalidParams = {
      ...testBuildingParams,
      floorHeight: -1, // 負の値は無効
      commonAreaRatio: 150 // 100%を超える値は無効
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: invalidParams
      });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});