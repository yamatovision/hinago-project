/**
 * 収益性試算結果取得API（GET /api/v1/analysis/profitability/:id）の統合テスト
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

describe('収益性試算結果取得API（GET /api/v1/analysis/profitability/:id）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '収益性試算結果取得テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: '収益性試算結果取得テスト用',
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
  
  // テスト用の収益性試算パラメータ
  const testFinancialParams: FinancialParams = {
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 30,             // 運用期間（年）
    capRate: 4.0                  // 還元利回り（%）
  };
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testProfitabilityId: string;
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
    
    // テスト用のボリュームチェックを実行
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    
    // テスト用の収益性試算を実行
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    testProfitabilityId = profitabilityRes.body.data.id;
  }, 180000); // 3分のタイムアウト
  
  it('認証済みユーザーは収益性試算結果を取得できる', async () => {
    if (!testProfitabilityId) {
      throw new Error('テスト用収益性試算IDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id', testProfitabilityId);
    expect(res.body.data).toHaveProperty('propertyId');
    expect(res.body.data).toHaveProperty('volumeCheckId');
    expect(res.body.data).toHaveProperty('assetType');
    expect(res.body.data).toHaveProperty('parameters');
    expect(res.body.data).toHaveProperty('landPrice');
    expect(res.body.data).toHaveProperty('constructionCost');
    expect(res.body.data).toHaveProperty('annualRentalIncome');
    expect(res.body.data).toHaveProperty('noiYield');
    expect(res.body.data).toHaveProperty('irr');
    
    // 収益性試算パラメータを検証
    expect(res.body.data.parameters).toHaveProperty('rentPerSqm');
    expect(res.body.data.parameters).toHaveProperty('occupancyRate');
    expect(res.body.data.parameters).toHaveProperty('managementCostRate');
    expect(res.body.data.parameters).toHaveProperty('constructionCostPerSqm');
    expect(res.body.data.parameters).toHaveProperty('rentalPeriod');
    expect(res.body.data.parameters).toHaveProperty('capRate');
    
    // 年次財務情報が含まれていることを確認
    expect(res.body.data).toHaveProperty('annualFinancials');
    expect(Array.isArray(res.body.data.annualFinancials)).toBe(true);
    if (res.body.data.annualFinancials.length > 0) {
      const firstYear = res.body.data.annualFinancials[0];
      expect(firstYear).toHaveProperty('year');
      expect(firstYear).toHaveProperty('rentalIncome');
      expect(firstYear).toHaveProperty('operatingExpenses');
      expect(firstYear).toHaveProperty('noi');
      expect(firstYear).toHaveProperty('cashFlow');
    }
  });
  
  it('認証なしで収益性試算結果を取得できない', async () => {
    if (!testProfitabilityId) {
      throw new Error('テスト用収益性試算IDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('存在しない収益性試算IDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});