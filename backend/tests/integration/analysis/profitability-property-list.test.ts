/**
 * 物件関連収益性試算一覧取得API（GET /api/v1/analysis/profitability/property/:propertyId）の統合テスト
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
  AssetType,
  FinancialParams
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

describe('物件関連収益性試算一覧取得API（GET /api/v1/analysis/profitability/property/:propertyId）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '物件関連収益性試算一覧テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: '物件関連収益性試算一覧テスト用',
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
  
  // 2つ目のボリュームチェックパラメータ（アセットタイプと階数を変更）
  const secondBuildingParams = {
    ...testBuildingParams,
    floors: 12,
    commonAreaRatio: 18,
    assetType: AssetType.OFFICE
  };
  
  // テスト用の収益性試算パラメータ
  const testFinancialParams: FinancialParams = {
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 30,             // 運用期間（年）
    capRate: 4.0                  // 還元利回り（%）
  };
  
  // 2つ目の収益性試算パラメータ（賃料と稼働率を変更）
  const secondFinancialParams: FinancialParams = {
    ...testFinancialParams,
    rentPerSqm: 3500,
    occupancyRate: 90,
  };
  
  let testPropertyId: string;
  let testVolumeCheckId1: string;
  let testVolumeCheckId2: string;
  let testProfitabilityId1: string;
  let testProfitabilityId2: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件、ボリュームチェック結果、収益性試算結果を作成
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    
    // 1つ目のボリュームチェックを実行
    const volumeCheckRes1 = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId1 = volumeCheckRes1.body.data.id;
    
    // 2つ目のボリュームチェックを実行（異なるパラメータ）
    const volumeCheckRes2 = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: secondBuildingParams
      });
    
    testVolumeCheckId2 = volumeCheckRes2.body.data.id;
    
    // 1つ目のボリュームチェックに対する収益性試算を実行
    const profitabilityRes1 = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId1,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    testProfitabilityId1 = profitabilityRes1.body.data.id;
    
    // 2つ目のボリュームチェックに対する収益性試算を実行（異なるパラメータ）
    const profitabilityRes2 = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId2,
        assetType: AssetType.OFFICE,
        financialParams: secondFinancialParams
      });
    
    testProfitabilityId2 = profitabilityRes2.body.data.id;
  }, 300000); // 5分のタイムアウト
  
  it('認証済みユーザーは物件に関連する収益性試算結果一覧を取得できる', async () => {
    if (!testPropertyId) {
      throw new Error('テスト用物件IDが設定されていません');
    }
    
    // このテストの前に収益性試算結果が少なくとも2つは作成されていることを確認
    expect(testProfitabilityId1).toBeDefined();
    expect(testProfitabilityId2).toBeDefined();
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2); // 少なくとも2つの結果がある
    
    // すべての結果が同じ物件IDを持っているか確認
    res.body.data.forEach((profitability: any) => {
      expect(profitability.propertyId).toBe(testPropertyId);
    });
    
    // 結果に含まれるフィールドの検証
    const firstResult = res.body.data[0];
    expect(firstResult).toHaveProperty('id');
    expect(firstResult).toHaveProperty('propertyId');
    expect(firstResult).toHaveProperty('volumeCheckId');
    expect(firstResult).toHaveProperty('assetType');
    expect(firstResult).toHaveProperty('totalInvestment');
    expect(firstResult).toHaveProperty('annualRentalIncome');
    expect(firstResult).toHaveProperty('noiYield');
    expect(firstResult).toHaveProperty('irr');
    expect(firstResult).toHaveProperty('createdAt');
    
    // メタデータがあるか確認
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2);
  });
  
  it('ページネーションパラメータを指定できる', async () => {
    if (!testPropertyId) {
      throw new Error('テスト用物件IDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}?page=1&limit=1`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    
    // limit=1を指定したので、結果は1件のみのはず
    expect(res.body.data.length).toBeLessThanOrEqual(1);
    
    // メタデータを確認
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page', 1);
    expect(res.body.meta).toHaveProperty('limit', 1);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(2); // 合計は2件以上
  });
  
  it('認証なしで物件に関連する収益性試算結果一覧を取得できない', async () => {
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('存在しない物件IDでは空の結果が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0); // 結果は空
    
    // メタデータの確認
    expect(res.body.meta).toHaveProperty('total', 0);
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});