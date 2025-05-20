/**
 * シナリオ収益性試算API（POST /api/v1/analysis/scenarios/:id/profitability）の統合テスト（最適化版）
 * - シナリオからの収益性試算機能のみに特化
 * - テスト実行時間を短縮するために処理を最適化
 * - シンプルなテストケースに制限
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

describe('シナリオ収益性試算API - 最適化版（POST /api/v1/analysis/scenarios/:id/profitability）', () => {
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  
  // テスト用のシナリオパラメータ（シンプルな値を設定してパフォーマンスを最適化）
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 10, // 期間を短くして計算を軽く
    capRate: 4.0
  };

  // テスト用の物件データ
  const testPropertyData = {
    name: 'シナリオ収益性テスト物件（最適化）',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 300, // 面積を小さくして計算を軽く
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 100000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ収益性テスト用（最適化）',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 15, y: 0 },
        { x: 15, y: 20 },
        { x: 0, y: 20 }
      ],
      width: 15,
      depth: 20
    }
  };
  
  // テスト用のボリュームチェックパラメータ（階数を少なくして計算を軽く）
  const testBuildingParams = {
    floorHeight: 3.2,
    commonAreaRatio: 15,
    floors: 5, // 階数を減らして計算を軽く
    roadWidth: 6,
    assetType: AssetType.MANSION
  };

  // テスト実行前のセットアップ
  beforeAll(async () => {
    // ログ出力開始
    console.log('テスト環境のセットアップを開始します');
    
    // データベースに接続
    await connectDB();
    
    // 認証情報を取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    console.log('テスト物件を作成中...');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    console.log(`物件作成完了: ID=${testPropertyId}`);
    
    // テスト用のボリュームチェックを実行
    console.log('ボリュームチェックを実行中...');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    console.log(`ボリュームチェック完了: ID=${testVolumeCheckId}`);
    
    // テスト用のシナリオを作成
    console.log('テストシナリオを作成中...');
    const scenarioName = 'シナリオ収益性テスト用' + Date.now();
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
    console.log(`シナリオ作成完了: ID=${testScenarioId}`);
    
    console.log('テストセットアップ完了');
  }, 60000); // タイムアウトを1分に設定
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    await disconnectDB();
    console.log('テスト環境のクリーンアップが完了しました');
  });
  
  // 認証なしでのアクセス禁止テスト
  it('認証なしでシナリオからの収益性試算を実行できない', async () => {
    // 前提条件のチェック
    expect(testScenarioId).toBeDefined();
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${testScenarioId}/profitability`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
  });
  
  // 存在しないIDのテスト
  it('存在しないシナリオIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${nonExistentId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  // 収益性試算実行テスト
  it('認証済みユーザーはシナリオから収益性試算を実行できる', async () => {
    // 前提条件のチェック
    expect(testScenarioId).toBeDefined();
    
    console.log(`シナリオID=${testScenarioId}から収益性試算を実行中...`);
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${testScenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
    expect(res.body.data).toHaveProperty('annualRentalIncome');
    expect(res.body.data).toHaveProperty('totalInvestment');
    expect(res.body.data).toHaveProperty('noiYield');
    expect(res.body.data).toHaveProperty('irr');
    
    console.log(`収益性試算が正常に作成されました: ID=${res.body.data.id}`);
  }, 40000); // タイムアウトを40秒に設定
});