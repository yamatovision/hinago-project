/**
 * 収益性試算実行API（POST /api/v1/analysis/profitability）の統合テスト
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

describe('収益性試算実行API（POST /api/v1/analysis/profitability）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '収益性試算テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: '収益性試算テスト用',
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
  
  it('認証済みユーザーは収益性試算を実行できる', async () => {
    if (!testPropertyId || !testVolumeCheckId) {
      throw new Error('テスト用物件IDまたはボリュームチェックIDが設定されていません');
    }
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
    expect(res.body.data).toHaveProperty('assetType', AssetType.MANSION);
    expect(res.body.data).toHaveProperty('landPrice');
    expect(res.body.data).toHaveProperty('constructionCost');
    expect(res.body.data).toHaveProperty('totalInvestment');
    expect(res.body.data).toHaveProperty('annualRentalIncome');
    expect(res.body.data).toHaveProperty('annualNOI');
    expect(res.body.data).toHaveProperty('noiYield');
    expect(res.body.data).toHaveProperty('irr');
    expect(res.body.data).toHaveProperty('paybackPeriod');
    expect(res.body.data).toHaveProperty('npv');
    expect(res.body.data).toHaveProperty('annualFinancials');
    expect(Array.isArray(res.body.data.annualFinancials)).toBe(true);
    
    // 後続のテストのために収益性試算IDを保存
    testProfitabilityId = res.body.data.id;
  });
  
  it('認証なしで収益性試算を実行できない', async () => {
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('必須パラメータが欠けている場合はエラーになる', async () => {
    // 必須パラメータを欠いたデータ
    const invalidData = {
      propertyId: testPropertyId,
      volumeCheckId: testVolumeCheckId,
      // assetTypeが欠けている
      financialParams: {
        rentPerSqm: 3000,
        // occupancyRateが欠けている
        managementCostRate: 10,
        constructionCostPerSqm: 350000,
        rentalPeriod: 30,
        capRate: 4.0
      }
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send(invalidData);
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
  it('存在しない物件IDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: nonExistentId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: nonExistentId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  it('ボリュームチェックと物件の関連性が不正な場合はエラーになる', async () => {
    // 別の物件を作成
    const otherPropertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send({
        ...testPropertyData,
        name: '収益性試算別テスト物件'
      });
    
    const otherPropertyId = otherPropertyRes.body.data.id;
    
    // ボリュームチェックIDと物件IDの組み合わせが不正な場合
    const res = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: otherPropertyId,  // 別の物件ID
        volumeCheckId: testVolumeCheckId,  // 元の物件のボリュームチェックID
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});