/**
 * 収益性試算結果削除API（DELETE /api/v1/analysis/profitability/:id）の統合テスト
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

describe('収益性試算結果削除API（DELETE /api/v1/analysis/profitability/:id）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '収益性試算削除テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: '収益性試算削除テスト用',
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
  
  it('認証済みユーザーは収益性試算結果を削除できる', async () => {
    if (!testPropertyId || !testVolumeCheckId) {
      throw new Error('テスト用物件IDまたはボリュームチェックIDが設定されていません');
    }
    
    // 削除用に新しい収益性試算を実行
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    // レスポンスの検証
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toHaveProperty('id');
    
    const deleteProfitabilityId = createRes.body.data.id;
    
    // 作成された収益性試算結果が取得できることを確認
    const getBeforeRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${deleteProfitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(getBeforeRes.status).toBe(200);
    expect(getBeforeRes.body.success).toBe(true);
    
    // 収益性試算結果を削除
    const deleteRes = await request(app)
      .delete(`${baseUrl}/analysis/profitability/${deleteProfitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(deleteRes.status).toBe(204); // No Content
    
    // 削除されたことを確認するために収益性試算結果を取得
    const getAfterRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${deleteProfitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(getAfterRes.status).toBe(404);
    expect(getAfterRes.body.success).toBe(false);
    expect(getAfterRes.body.error).toHaveProperty('code', 'NOT_FOUND');
    
    // 物件に関連する収益性試算一覧に含まれていないことを確認
    const listRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}`)
      .set('Authorization', authHeader);
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    
    // 削除したIDが一覧に含まれていないことを確認
    const ids = listRes.body.data.map((item: any) => item.id);
    expect(ids).not.toContain(deleteProfitabilityId);
    
    // ボリュームチェックに関連する収益性試算一覧に含まれていないことも確認
    const vcListRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`)
      .set('Authorization', authHeader);
    
    expect(vcListRes.status).toBe(200);
    expect(vcListRes.body.success).toBe(true);
    
    // 削除したIDが一覧に含まれていないことを確認
    const vcIds = vcListRes.body.data.map((item: any) => item.id);
    expect(vcIds).not.toContain(deleteProfitabilityId);
  }, 180000); // 3分のタイムアウト
  
  it('認証なしで収益性試算結果を削除できない', async () => {
    // 削除テスト用に新しい収益性試算を実行
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/profitability`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        assetType: AssetType.MANSION,
        financialParams: testFinancialParams
      });
    
    const testProfitabilityId = createRes.body.data.id;
    
    // 認証なしで削除を試みる
    const res = await request(app)
      .delete(`${baseUrl}/analysis/profitability/${testProfitabilityId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    
    // 削除されていないことを確認
    const checkRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.success).toBe(true);
  }, 180000); // 3分のタイムアウト
  
  it('存在しない収益性試算IDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/profitability/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/profitability/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});