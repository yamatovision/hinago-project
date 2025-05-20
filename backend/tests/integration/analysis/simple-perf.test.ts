/**
 * 収益性試算の簡易パフォーマンステスト
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

describe('収益性試算最適化検証', () => {
  const testPropertyData = {
    name: 'テスト物件',
    address: '東京都新宿区1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE
  };
  
  const testBuildingParams = {
    floorHeight: 3.2,
    commonAreaRatio: 15,
    floors: 9,
    roadWidth: 6,
    assetType: AssetType.MANSION
  };
  
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 30,
    capRate: 4.0
  };
  
  let authHeader: string;
  
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  it('1対1モデルが正しく機能することを確認', async () => {
    // 物件登録
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    expect(propertyRes.status).toBe(201);
    const propertyId = propertyRes.body.data.id;
    
    // ボリュームチェック作成
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        buildingParams: testBuildingParams
      });
    
    expect(volumeCheckRes.status).toBe(201);
    const volumeCheckId = volumeCheckRes.body.data.id;
    
    // シナリオ作成
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: propertyId,
        volumeCheckId: volumeCheckId,
        name: 'テストシナリオ',
        params: testScenarioParams
      });
    
    expect(scenarioRes.status).toBe(201);
    const scenarioId = scenarioRes.body.data.id;
    
    // シナリオから収益性試算を実行
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(profitabilityRes.status).toBe(201);
    const profitabilityId = profitabilityRes.body.data.id;
    
    // シナリオを確認して収益性試算結果が関連付けられていることを確認
    const scenarioCheckRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(scenarioCheckRes.status).toBe(200);
    expect(scenarioCheckRes.body.data.profitabilityResultId).toBe(profitabilityId);
    
    // 収益性試算結果の削除時間を計測
    console.log('収益性試算結果の削除処理時間を計測します...');
    const deleteTime = await measurePerformance('収益性試算結果削除', async () => {
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(204);
    });
    
    // 削除後にシナリオの収益性試算結果への参照が解除されていることを確認
    const scenarioAfterDeleteRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(scenarioAfterDeleteRes.status).toBe(200);
    expect(scenarioAfterDeleteRes.body.data.profitabilityResultId).toBeUndefined();
    
    // 収益性試算結果が実際に削除されていることを確認
    const profitabilityCheckRes = await request(app)
      .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
      .set('Authorization', authHeader);
    
    expect(profitabilityCheckRes.status).toBe(404);
  }, 60000);
});