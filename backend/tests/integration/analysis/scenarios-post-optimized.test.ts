/**
 * シナリオ作成API（POST /api/v1/analysis/scenarios）の統合テスト（最適化版）
 * - テスト実行時間を短縮するため、シナリオ作成の機能のみをテスト
 * - 一覧取得などの追加検証を省略
 * - 各テストケースを独立させることで実行を高速化
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

describe('シナリオ作成API - 最適化版（POST /api/v1/analysis/scenarios）', () => {
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  
  // テスト用のシナリオパラメータ（計算を軽く）
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 5,             // 運用期間を短く（年）
    capRate: 4.0                  // 還元利回り（%）
  };

  // テスト用の物件データ（最小限のサイズで計算を軽く）
  const testPropertyData = {
    name: 'シナリオ作成テスト物件（最適化）',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 100, // 小さい面積
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ作成テスト用（最適化）',
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
    
    console.log(`テストセットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
  }, 300000); // タイムアウトを5分に設定
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    await disconnectDB();
  });
  
  // 基本シナリオ作成テスト
  it('認証済みユーザーはシナリオを作成できる', async () => {
    // 前提条件のチェック
    expect(testPropertyId).toBeDefined();
    expect(testVolumeCheckId).toBeDefined();
    
    // シナリオ名（一意にするためにタイムスタンプを付加）
    const scenarioName = 'テストシナリオ' + Date.now();
    
    // リクエスト送信
    console.log('シナリオ作成リクエスト送信中...');
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: testScenarioParams
      });
    
    // レスポンスの検証
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
    expect(res.body.data).toHaveProperty('name', scenarioName);
    expect(res.body.data).toHaveProperty('params');
    expect(res.body.data.params).toHaveProperty('assetType', testScenarioParams.assetType);
    expect(res.body.data.params).toHaveProperty('rentPerSqm', testScenarioParams.rentPerSqm);
    
    console.log(`シナリオ作成成功: ID=${res.body.data.id}`);
  }, 300000); // 5分のタイムアウト
  
  // 認証エラーテスト
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
  }, 10000);
  
  // バリデーションエラーテスト
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
  }, 10000);
  
  // 存在しない物件IDのテスト
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
  }, 10000);
  
  // 存在しないボリュームチェックIDのテスト
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
  }, 10000);
});