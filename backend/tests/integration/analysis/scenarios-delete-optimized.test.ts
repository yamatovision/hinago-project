/**
 * シナリオ削除API（DELETE /api/v1/analysis/scenarios/:id）の統合テスト（最適化版）
 * - テスト実行時間を短縮するため、シナリオ削除の機能のみをテスト
 * - テストケースを独立させることで実行を高速化
 * - タイムアウト値を最適化
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

describe('シナリオ削除API - 最適化版（DELETE /api/v1/analysis/scenarios/:id）', () => {
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  
  // テスト用のシナリオパラメータ（計算を軽く）
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 5, // 運用期間を短くして計算を軽く
    capRate: 4.0
  };

  // テスト用の物件データ（最小限のサイズで計算を軽く）
  const testPropertyData = {
    name: 'シナリオ削除テスト物件（最適化）',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 100, // 小さい面積
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ削除テスト用（最適化）',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 }, // 小さいサイズ
        { x: 10, y: 10 },
        { x: 0, y: 10 }
      ],
      width: 10, // 小さいサイズ
      depth: 10
    }
  };
  
  // テスト用のボリュームチェックパラメータ（計算を軽く）
  const testBuildingParams = {
    floorHeight: 3.0,
    commonAreaRatio: 15,
    floors: 2, // 最小フロア数
    roadWidth: 6,
    assetType: AssetType.MANSION
  };

  // テスト実行前のセットアップ
  beforeAll(async () => {
    // データベースに接続
    await connectDB();
    
    // 認証情報を取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    console.log('テスト物件作成中...');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    
    // テスト用のボリュームチェックを実行
    console.log('ボリュームチェック実行中...');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    
    // テスト用のシナリオを作成
    console.log('テストシナリオ作成中...');
    const scenarioName = 'シナリオ削除テスト用' + Date.now();
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: testScenarioParams
      });
    
    testScenarioId = scenarioRes.body.data.id;
    
    console.log(`テストセットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}, シナリオID=${testScenarioId}`);
  }, 300000); // タイムアウトを5分に設定
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    await disconnectDB();
  });
  
  // 認証なしでのアクセス禁止テスト
  it('認証なしでシナリオを削除できない', async () => {
    // 前提条件のチェック
    expect(testScenarioId).toBeDefined();
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${testScenarioId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  // 存在しないIDのテスト
  it('存在しないシナリオIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  // 削除用の専用シナリオを作成して削除するテスト
  it('認証済みユーザーはシナリオを削除できる', async () => {
    // 削除用の新しいシナリオを作成
    console.log('削除テスト用シナリオ作成中...');
    const deleteScenarioName = 'シナリオ削除テスト専用' + Date.now();
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: deleteScenarioName,
        params: testScenarioParams
      });
    
    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data).toHaveProperty('id');
    
    const deleteScenarioId = createRes.body.data.id;
    console.log(`削除用シナリオ作成完了: ID=${deleteScenarioId}`);
    
    // 作成されたシナリオが取得できることを確認
    console.log('シナリオ取得確認中...');
    const getBeforeRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${deleteScenarioId}`)
      .set('Authorization', authHeader);
    
    expect(getBeforeRes.status).toBe(200);
    expect(getBeforeRes.body.success).toBe(true);
    
    // シナリオを削除
    console.log('シナリオ削除中...');
    const deleteRes = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${deleteScenarioId}`)
      .set('Authorization', authHeader);
    
    expect(deleteRes.status).toBe(204); // No Content
    
    // 削除されたことを確認するためにシナリオを取得
    console.log('削除確認中...');
    const getAfterRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${deleteScenarioId}`)
      .set('Authorization', authHeader);
    
    expect(getAfterRes.status).toBe(404);
    expect(getAfterRes.body.success).toBe(false);
    expect(getAfterRes.body.error).toHaveProperty('code', 'NOT_FOUND');
    
    console.log('シナリオ削除テスト完了');
  }, 300000); // タイムアウトを5分に設定
});