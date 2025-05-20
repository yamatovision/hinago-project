/**
 * 収益性試算API統合テスト
 */
import request from 'supertest';
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

// パフォーマンス測定用ユーティリティ
async function measurePerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
}

// テスト実行前のセットアップ
beforeAll(async () => {
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('収益性試算APIテスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '新規APIテスト物件',
    address: '東京都新宿区1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'APIテスト用',
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
  
  // テスト用のシナリオパラメータ
  const testScenarioData = {
    name: 'APIテストシナリオ',
    params: {
      assetType: AssetType.MANSION,
      rentPerSqm: 3000,             // 賃料単価（円/m²）
      occupancyRate: 95,            // 稼働率（%）
      managementCostRate: 10,       // 管理コスト率（%）
      constructionCostPerSqm: 350000, // 建設単価（円/m²）
      rentalPeriod: 30,             // 運用期間（年）
      capRate: 4.0                  // 還元利回り（%）
    } as ScenarioParams
  };
  
  let authHeader: string;
  let propertyId: string;
  let volumeCheckId: string;
  let scenarioId: string;
  let profitabilityId: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  // テストデータの準備
  beforeAll(async () => {
    // テスト用の物件を作成
    console.log('物件を作成中...');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    expect(propertyRes.status).toBe(201);
    propertyId = propertyRes.body.data.id;
    console.log(`物件作成完了: ${propertyId}`);
    
    // テスト用のボリュームチェックを作成
    console.log('ボリュームチェックを作成中...');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        buildingParams: testBuildingParams
      });
    
    expect(volumeCheckRes.status).toBe(201);
    volumeCheckId = volumeCheckRes.body.data.id;
    console.log(`ボリュームチェック作成完了: ${volumeCheckId}`);
    
    // シナリオを作成
    console.log('シナリオを作成中...');
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        volumeCheckId: volumeCheckId,
        name: testScenarioData.name,
        params: testScenarioData.params
      });
    
    expect(scenarioRes.status).toBe(201);
    scenarioId = scenarioRes.body.data.id;
    console.log(`シナリオ作成完了: ${scenarioId}`);
    
    // シナリオから収益性試算を実行
    console.log('収益性試算を実行中...');
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(profitabilityRes.status).toBe(201);
    profitabilityId = profitabilityRes.body.data.id;
    console.log(`収益性試算作成完了: ${profitabilityId}`);
  });
  
  // テスト後のクリーンアップ
  afterAll(async () => {
    if (scenarioId) {
      console.log('シナリオを削除中...');
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${scenarioId}`)
        .set('Authorization', authHeader);
    }
    
    if (volumeCheckId) {
      console.log('ボリュームチェックを削除中...');
      await request(app)
        .delete(`${baseUrl}/analysis/volume-check/${volumeCheckId}`)
        .set('Authorization', authHeader);
    }
    
    if (propertyId) {
      console.log('物件を削除中...');
      await request(app)
        .delete(`${baseUrl}/properties/${propertyId}`)
        .set('Authorization', authHeader);
    }
    
    console.log('テストデータのクリーンアップ完了');
  });
  
  describe('物件関連収益性試算一覧取得', () => {
    it('正しく物件に関連する収益性試算結果一覧を取得できること', async () => {
      console.log('物件に関連する収益性試算一覧を取得中...');
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/property/${propertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // 少なくとも1件以上取得できることを確認
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // 結果が物件IDと関連していることを確認
      const foundProfitability = res.body.data.find((p: any) => p.id === profitabilityId);
      expect(foundProfitability).toBeDefined();
      expect(foundProfitability.propertyId).toBe(propertyId);
      
      console.log(`物件関連収益性試算一覧取得成功: ${res.body.data.length}件取得`);
    });
  });
  
  describe('ボリュームチェック関連収益性試算一覧取得', () => {
    it('正しくボリュームチェックに関連する収益性試算結果一覧を取得できること', async () => {
      console.log('ボリュームチェックに関連する収益性試算一覧を取得中...');
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/volume-check/${volumeCheckId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // 少なくとも1件以上取得できることを確認
      expect(res.body.data.length).toBeGreaterThan(0);
      
      // 結果がボリュームチェックIDと関連していることを確認
      const foundProfitability = res.body.data.find((p: any) => p.id === profitabilityId);
      expect(foundProfitability).toBeDefined();
      expect(foundProfitability.volumeCheckId).toBe(volumeCheckId);
      
      console.log(`ボリュームチェック関連収益性試算一覧取得成功: ${res.body.data.length}件取得`);
    });
  });
  
  describe('収益性試算結果削除', () => {
    it('正しく収益性試算結果を削除できること', async () => {
      // 事前に新たな収益性試算を作成
      console.log('削除テスト用の収益性試算を新たに作成中...');
      const newProfitabilityRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(newProfitabilityRes.status).toBe(201);
      const newProfitabilityId = newProfitabilityRes.body.data.id;
      console.log(`削除テスト用の収益性試算作成完了: ${newProfitabilityId}`);
      
      // 削除処理の実行
      console.log('収益性試算結果の削除処理を実行中...');
      const deleteRes = await measurePerformance('収益性試算結果削除', async () => {
        return await request(app)
          .delete(`${baseUrl}/analysis/profitability/${newProfitabilityId}`)
          .set('Authorization', authHeader);
      });
      
      expect(deleteRes.status).toBe(204);
      console.log('収益性試算結果削除完了');
      
      // 削除されたことを確認
      console.log('削除確認中...');
      const verifyRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${newProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(verifyRes.status).toBe(404);
      console.log('削除確認完了: 削除されていることを確認');
      
      // シナリオの収益性試算結果への参照も解除されていることを確認
      console.log('シナリオの参照解除を確認中...');
      const scenarioRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioRes.status).toBe(200);
      // 最新の収益性試算結果IDはprofitabilityIdのはず
      expect(scenarioRes.body.data.profitabilityResultId).not.toBe(newProfitabilityId);
      console.log('シナリオの参照解除確認完了');
    });
  });
});