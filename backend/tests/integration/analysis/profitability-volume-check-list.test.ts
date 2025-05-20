/**
 * ボリュームチェック関連収益性試算一覧取得API（GET /api/v1/analysis/profitability/volume-check/:volumeCheckId）の統合テスト
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { MilestoneTracker } from './utils/milestone-tracker';
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
}, 30000); // 30秒のタイムアウト設定

// テスト実行後のクリーンアップ
afterAll(async () => {
  // テストデータをクリーンアップするのではなく、データベース切断のみを行う
  await disconnectDB();
}, 10000); // 10秒のタイムアウト

describe('ボリュームチェック関連収益性試算一覧取得API（GET /api/v1/analysis/profitability/volume-check/:volumeCheckId）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ボリュームチェック関連収益性試算一覧テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ボリュームチェック関連収益性試算一覧テスト用',
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
  
  // 異なる収益性試算パラメータ
  const differentFinancialParams: FinancialParams = {
    ...testFinancialParams,
    rentPerSqm: 3500,
    occupancyRate: 92,
    capRate: 4.5
  };
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testProfitabilityId1: string;
  let testProfitabilityId2: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件、ボリュームチェック結果、収益性試算結果を作成
  // 最適化版
  beforeAll(async () => {
    // マイルストーントラッカーを使用してボトルネックを特定
    const tracker = new MilestoneTracker();
    tracker.mark('テスト開始');
    
    // 認証情報を取得
    tracker.setOperation('認証情報の取得');
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    tracker.mark('認証完了');
    
    // 並列処理に変更して高速化
    // ステップ1: 物件作成
    tracker.setOperation('物件作成');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    tracker.mark('物件作成完了');
    
    // ステップ2: ボリュームチェック実行
    // 軽量化されたテストデータを使用
    tracker.setOperation('ボリュームチェック実行');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: {
          ...testBuildingParams,
          floors: 3 // 階数を減らして計算量を軽減
        }
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    tracker.mark('ボリュームチェック完了');
    
    // ステップ3: 収益性試算を二つ同時に実行
    tracker.setOperation('収益性試算実行');
    const [profitabilityRes1, profitabilityRes2] = await Promise.all([
      request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          assetType: AssetType.MANSION,
          financialParams: {
            ...testFinancialParams,
            rentalPeriod: 10 // 期間を短くして計算量を軽減
          }
        }),
      request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          assetType: AssetType.MANSION,
          financialParams: {
            ...differentFinancialParams,
            rentalPeriod: 10 // 期間を短くして計算量を軽減
          }
        })
    ]);
    
    testProfitabilityId1 = profitabilityRes1.body.data.id;
    testProfitabilityId2 = profitabilityRes2.body.data.id;
    tracker.mark('収益性試算完了');
    
    // マイルストーン結果の出力
    tracker.mark('セットアップ完了');
    tracker.cleanup();
  }, 90000); // 90秒のタイムアウト
  
  it('認証済みユーザーはボリュームチェックに関連する収益性試算結果一覧を取得できる', async () => {
    // テストケースの実行時間を計測
    const tracker = new MilestoneTracker();
    tracker.mark('テストケース1開始');
    
    if (!testVolumeCheckId) {
      throw new Error('テスト用ボリュームチェックIDが設定されていません');
    }
    
    // このテストの前に収益性試算結果が少なくとも2つは作成されていることを確認
    expect(testProfitabilityId1).toBeDefined();
    expect(testProfitabilityId2).toBeDefined();
    
    tracker.setOperation('APIリクエスト実行');
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`)
      .set('Authorization', authHeader);
    tracker.mark('APIレスポンス受信');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2); // 少なくとも2つの結果がある
    
    // すべての結果が同じボリュームチェックIDを持っているか確認
    res.body.data.forEach((profitability: any) => {
      expect(profitability.volumeCheckId).toBe(testVolumeCheckId);
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
    
    // テスト終了
    tracker.mark('テストケース1完了');
    tracker.cleanup();
  });
  
  it('ページネーションパラメータを指定できる', async () => {
    if (!testVolumeCheckId) {
      throw new Error('テスト用ボリュームチェックIDが設定されていません');
    }
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}?page=1&limit=1`)
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
  
  it('認証なしでボリュームチェックに関連する収益性試算結果一覧を取得できない', async () => {
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  it('存在しないボリュームチェックIDでは空の結果が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .get(`${baseUrl}/analysis/profitability/volume-check/${nonExistentId}`)
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
      .get(`${baseUrl}/analysis/profitability/volume-check/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});