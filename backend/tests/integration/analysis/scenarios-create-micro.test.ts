/**
 * シナリオ作成マイクロテスト
 * - 超軽量テストデータ使用
 * - 処理時間の詳細な計測
 * - 60秒以内での完了を目指す
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
import { MilestoneTracker } from './utils/milestone-tracker';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

describe('シナリオ作成マイクロテスト', () => {
  // マイルストーントラッカー
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  
  // 超小型テスト用の物件データ
  const microPropertyData = {
    name: 'シナリオ作成マイクロテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 50, // 極小の面積
    zoneType: ZoneType.CATEGORY1,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 100000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ作成マイクロテスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 0 }, // 極小サイズ
        { x: 5, y: 10 },
        { x: 0, y: 10 }
      ],
      width: 5, // 極小サイズ
      depth: 10
    }
  };
  
  // 超軽量建築パラメータ
  const microBuildingParams = {
    floorHeight: 3.0,
    commonAreaRatio: 10,
    floors: 2, // 最小フロア数
    roadWidth: 4,
    assetType: AssetType.MANSION
  };
  
  // 超軽量シナリオパラメータ
  const microScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 3, // 超短期間
    capRate: 4.0
  };

  // テスト実行前のセットアップ
  beforeAll(async () => {
    tracker.mark('テスト開始');
    tracker.setOperation('データベース接続');
    await connectDB();
    tracker.mark('DB接続完了');
    
    tracker.setOperation('認証情報取得');
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    tracker.mark('認証情報取得完了');
    
    // テスト用の物件を作成
    tracker.setOperation('テスト物件作成');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(microPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    tracker.mark('物件作成完了');
    
    // テスト用のボリュームチェックを実行
    tracker.setOperation('ボリュームチェック実行');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: microBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    tracker.mark('ボリュームチェック完了');
    
    console.log(`セットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
  }, 120000); // 2分のタイムアウト
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    tracker.setOperation('データベース切断');
    await disconnectDB();
    tracker.mark('テスト終了');
    tracker.cleanup();
  });
  
  // シナリオ作成成功テスト - タイムアウト値を120秒に増加
  it('認証済みユーザーはシナリオを作成できる', async () => {
    tracker.setOperation('シナリオ作成リクエスト準備');
    
    // 前提条件のチェック
    expect(testPropertyId).toBeDefined();
    expect(testVolumeCheckId).toBeDefined();
    
    const scenarioName = 'テストシナリオ' + Date.now();
    
    tracker.setOperation('シナリオ作成リクエスト送信');
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: microScenarioParams
      });
    
    tracker.mark('シナリオ作成レスポンス受信');
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
    expect(res.body.data).toHaveProperty('name', scenarioName);
    
    // 後続のテストのためにシナリオIDを保存
    testScenarioId = res.body.data.id;
    console.log(`作成されたシナリオID: ${testScenarioId}`);
    
    tracker.mark('シナリオ作成テスト完了');
  }, 120000); // 120秒のタイムアウト

  // 認証エラーテスト
  it('認証なしでシナリオを作成できない', async () => {
    tracker.setOperation('認証なしリクエスト送信');
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('認証なしレスポンス受信');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    
    tracker.mark('認証エラーテスト完了');
  }, 30000); // 30秒のタイムアウト

  // バリデーションエラーテスト - タイムアウト値を30秒に増加
  it('必須パラメータが欠けている場合はエラーになる', async () => {
    tracker.setOperation('バリデーションエラーリクエスト送信');
    
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
        rentalPeriod: 3,
        capRate: 4.0
      }
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send(invalidData);
    
    tracker.mark('バリデーションエラーレスポンス受信');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    
    tracker.mark('バリデーションエラーテスト完了');
  }, 30000); // 30秒のタイムアウト

  // 存在しない物件IDテスト - タイムアウト値を30秒に増加
  it('存在しない物件IDでは404が返される', async () => {
    tracker.setOperation('存在しない物件IDリクエスト送信');
    
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: nonExistentId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('存在しない物件IDレスポンス受信');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    
    tracker.mark('存在しない物件IDテスト完了');
  }, 30000); // 30秒のタイムアウト

  // 存在しないボリュームチェックIDテスト - タイムアウト値を30秒に増加
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    tracker.setOperation('存在しないVCIDリクエスト送信');
    
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: nonExistentId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('存在しないVCIDレスポンス受信');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    
    tracker.mark('存在しないVCIDテスト完了');
  }, 30000); // 30秒のタイムアウト

  // シナリオ作成後の一覧取得テスト - タイムアウト値を30秒に増加
  it('作成したシナリオが一覧に表示される', async () => {
    tracker.setOperation('シナリオ一覧リクエスト送信');
    
    // 作成したシナリオを含む一覧を取得
    const listRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}&limit=5`)
      .set('Authorization', authHeader);
    
    tracker.mark('シナリオ一覧レスポンス受信');
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    
    // 作成したシナリオが一覧に含まれていることを確認
    const ids = listRes.body.data.map((item: any) => item.id);
    expect(ids).toContain(testScenarioId);
    
    tracker.mark('シナリオ一覧テスト完了');
  }, 30000); // 30秒のタイムアウト
});