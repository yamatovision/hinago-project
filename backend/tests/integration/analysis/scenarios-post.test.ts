/**
 * シナリオ作成API（POST /api/v1/analysis/scenarios）の統合テスト
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
  ScenarioParams
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

describe('シナリオ作成API（POST /api/v1/analysis/scenarios）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'シナリオ作成テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 100, // 小さい値に変更
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ作成テスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }, // サイズを小さく
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ],
      width: 10, // サイズを小さく
      depth: 10
    }
  };
  
  // テスト用のボリュームチェックパラメータ
  const testBuildingParams = {
    floorHeight: 3.0,
    commonAreaRatio: 15,
    floors: 3, // フロア数を小さく
    roadWidth: 6,
    assetType: AssetType.MANSION
  };
  
  // テスト用のシナリオパラメータ
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 10,             // 運用期間を短くする（年）
    capRate: 4.0                  // 還元利回り（%）
  };
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件とボリュームチェック結果を作成
  beforeAll(async () => {
    try {
      // 認証情報を取得
      const auth = await getTestAuth();
      authHeader = auth.authHeader;
      
      // テスト用の物件を作成（小さいサイズ）
      const propertyRes = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(testPropertyData);
      
      testPropertyId = propertyRes.body.data.id;
      
      // テスト用のボリュームチェックを実行（小さい建物）
      const volumeCheckRes = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          buildingParams: testBuildingParams
        });
      
      testVolumeCheckId = volumeCheckRes.body.data.id;
      
      // 初期化完了をログ
      console.log(`テスト初期化完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
    } catch (error) {
      console.error('テストセットアップエラー:', error);
      throw error;
    }
  }, 300000); // 5分のタイムアウト
  
  it('認証済みユーザーはシナリオを作成できる', async () => {
    if (!testPropertyId || !testVolumeCheckId) {
      throw new Error('テスト用物件IDまたはボリュームチェックIDが設定されていません');
    }
    
    console.log('シナリオ作成テスト開始');
    const scenarioName = 'テストシナリオ' + Date.now();
    
    try {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: scenarioName,
          params: testScenarioParams
        });
      
      console.log('シナリオ作成APIレスポンス:', res.status);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('name', scenarioName);
      expect(res.body.data).toHaveProperty('params');
      expect(res.body.data.params).toHaveProperty('assetType', testScenarioParams.assetType);
      expect(res.body.data.params).toHaveProperty('rentPerSqm', testScenarioParams.rentPerSqm);
      
      // 後続のテストのためにシナリオIDを保存
      testScenarioId = res.body.data.id;
      console.log(`作成されたシナリオID: ${testScenarioId}`);
      
      // シナリオ一覧クエリを最適化（取得項目を制限）
      const listRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}&limit=5`)
        .set('Authorization', authHeader);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      
      // 作成したシナリオが一覧に含まれていることを確認
      const ids = listRes.body.data.map((item: any) => item.id);
      expect(ids).toContain(testScenarioId);
      
      console.log('シナリオ作成テスト完了');
    } catch (error) {
      console.error('シナリオ作成テストエラー:', error);
      throw error;
    }
  }, 120000); // 2分のタイムアウト
  
  it('認証なしでシナリオを作成できない', async () => {
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: testScenarioParams
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
      // nameが欠けている
      params: {
        assetType: AssetType.MANSION,
        rentPerSqm: 3000,
        // occupancyRateが欠けている
        managementCostRate: 10,
        constructionCostPerSqm: 350000,
        rentalPeriod: 30,
        capRate: 4.0
      }
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send(invalidData);
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
  it('存在しない物件IDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: nonExistentId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: testScenarioParams
      });
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: nonExistentId,
        name: 'テストシナリオ',
        params: testScenarioParams
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
        name: 'シナリオ作成別テスト物件'
      });
    
    const otherPropertyId = otherPropertyRes.body.data.id;
    
    // ボリュームチェックIDと物件IDの組み合わせが不正な場合
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: otherPropertyId,  // 別の物件ID
        volumeCheckId: testVolumeCheckId,  // 元の物件のボリュームチェックID
        name: 'テストシナリオ',
        params: testScenarioParams
      });
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
  
  it('シナリオからの収益性試算実行のためのエンドポイントが機能している', async () => {
    if (!testScenarioId) {
      throw new Error('テスト用シナリオIDが設定されていません');
    }
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${testScenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId');
    expect(res.body.data).toHaveProperty('volumeCheckId');
    expect(res.body.data).toHaveProperty('annualRentalIncome');
    expect(res.body.data).toHaveProperty('totalInvestment');
    expect(res.body.data).toHaveProperty('noiYield');
    expect(res.body.data).toHaveProperty('irr');
  });
});