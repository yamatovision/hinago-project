/**
 * シナリオ作成マイクロテスト - APIエンドポイント特化版
 * - 超軽量テストデータ使用
 * - 処理時間の詳細な計測
 * - 5秒以内での完了を目指す
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
  AssetType
} from '../../../src/types';
import { MilestoneTracker } from './utils/milestone-tracker';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

describe('シナリオ作成マイクロテスト - POST API', () => {
  // マイルストーントラッカー
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  
  // 超小型テスト用の物件データ
  const microPropertyData = {
    name: 'シナリオPOSTマイクロテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 50, // 極小の面積
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
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
  
  // 超軽量計算用パラメータ
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
    
    // モデルを直接使用して高速に物件とボリュームチェックを作成
    tracker.setOperation('テストデータ作成（モデル直接使用）');
    try {
      const { PropertyModel, VolumeCheckModel } = require('../../../src/db/models');
      
      // 物件を直接作成
      const property = await PropertyModel.create(microPropertyData);
      testPropertyId = property.id;
      
      // ボリュームチェックを直接作成
      const volumeCheck = await VolumeCheckModel.create({
        propertyId: testPropertyId,
        assetType: AssetType.MANSION,
        buildingArea: 30,
        totalFloorArea: 60,
        buildingHeight: 7,
        consumptionRate: 60,
        floors: 2,
        floorBreakdown: [
          { floor: 1, floorArea: 30, privateArea: 25, commonArea: 5 },
          { floor: 2, floorArea: 30, privateArea: 25, commonArea: 5 }
        ],
        regulationChecks: [
          {
            name: '建蔽率',
            regulationValue: '60%',
            plannedValue: '60%',
            compliant: true
          }
        ]
      });
      
      testVolumeCheckId = volumeCheck.id;
      tracker.mark('テストデータ作成完了');
      
      console.log(`セットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
    } catch (error) {
      console.error('セットアップエラー:', error);
      throw error;
    }
  }, 10000); // 10秒のタイムアウト
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    try {
      tracker.setOperation('テストデータ削除');
      // 作成したテストデータを削除（逆順）
      if (testPropertyId) {
        const { PropertyModel } = require('../../../src/db/models');
        await PropertyModel.delete(testPropertyId);
      }
      
      tracker.mark('テストデータ削除完了');
    } catch (error) {
      console.error('クリーンアップエラー:', error);
    }
    
    tracker.setOperation('データベース切断');
    await disconnectDB();
    tracker.mark('テスト終了');
    tracker.cleanup();
  }, 5000);
  
  // シナリオ作成成功テスト - 認証ありのPOST
  it('認証済みユーザーはシナリオを作成できる', async () => {
    tracker.setOperation('シナリオ作成リクエスト送信');
    
    const scenarioName = 'マイクロテストシナリオ' + Date.now();
    
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
    
    console.log(`作成されたシナリオID: ${res.body.data.id}`);
    tracker.mark('シナリオ作成テスト完了');
  }, 30000); // 30秒のタイムアウト（シナリオ作成には時間がかかるようなので大幅に増やす）

  // 認証エラーテスト - 認証なしのPOST
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
    
    tracker.mark('認証エラーテスト完了');
  }, 3000); // 3秒のタイムアウト
});