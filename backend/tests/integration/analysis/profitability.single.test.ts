/**
 * 収益性試算削除機能のシングルテスト
 * 他のテストからの干渉を避けて単一の機能のみを検証
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
  FinancialParams,
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

describe('収益性試算削除の単一テスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'シングルテスト物件',
    address: '東京都新宿区1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シングルテスト用',
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
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 30,             // 運用期間（年）
    capRate: 4.0                  // 還元利回り（%）
  };
  
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  // 単一テストケース: 収益性試算削除機能
  it('1対1モデルでの収益性試算削除機能が正しく動作する', async () => {
    // テスト用の物件を作成
    console.log('物件を作成中...');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    expect(propertyRes.status).toBe(201);
    const propertyId = propertyRes.body.data.id;
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
    const volumeCheckId = volumeCheckRes.body.data.id;
    console.log(`ボリュームチェック作成完了: ${volumeCheckId}`);
    
    // シナリオを作成
    console.log('シナリオを作成中...');
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        volumeCheckId: volumeCheckId,
        name: `シングルテストシナリオ`,
        params: testScenarioParams
      });
    
    expect(scenarioRes.status).toBe(201);
    const scenarioId = scenarioRes.body.data.id;
    console.log(`シナリオ作成完了: ${scenarioId}`);
    
    // シナリオから収益性試算を実行
    console.log('収益性試算を実行中...');
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(profitabilityRes.status).toBe(201);
    const profitabilityId = profitabilityRes.body.data.id;
    console.log(`収益性試算作成完了: ${profitabilityId}`);
    
    // シナリオの収益性試算結果との関連を確認
    console.log('シナリオの関連を確認中...');
    const scenarioCheckRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(scenarioCheckRes.status).toBe(200);
    console.log(`シナリオの収益性試算結果ID: ${scenarioCheckRes.body.data.profitabilityResultId}`);
    expect(scenarioCheckRes.body.data.profitabilityResultId).toBe(profitabilityId);
    
    // 収益性試算結果の確認
    console.log('収益性試算結果を確認中...');
    const profitabilityCheckRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(profitabilityCheckRes.status).toBe(200);
    console.log(`収益性試算のシナリオID: ${profitabilityCheckRes.body.data.scenarioId}`);
    expect(profitabilityCheckRes.body.data.scenarioId).toBe(scenarioId);
    
    // 削除処理の実行時間を計測
    console.log('収益性試算結果の削除処理を実行中...');
    await measurePerformance('収益性試算結果削除（1対1モデル）', async () => {
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(204);
    });
    
    // 削除されたことを確認
    console.log('削除確認中...');
    const deletedCheckRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(deletedCheckRes.status).toBe(404);
    
    // シナリオの収益性試算結果への参照も解除されていることを確認
    console.log('シナリオの参照解除を確認中...');
    const scenarioAfterDeleteRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(scenarioAfterDeleteRes.status).toBe(200);
    expect(scenarioAfterDeleteRes.body.data.profitabilityResultId).toBeUndefined();
    console.log('テスト完了');
  }, 90000); // 90秒のタイムアウトを設定
});