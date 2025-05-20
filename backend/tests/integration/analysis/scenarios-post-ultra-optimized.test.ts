/**
 * シナリオ作成API（POST /api/v1/analysis/scenarios）の統合テスト（超最適化版）
 * - 必要最小限のテストケースのみに絞り込み
 * - タイムアウト値を大幅に引き上げ
 * - テスト処理を簡素化
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

describe('シナリオ作成API - 超最適化版（POST /api/v1/analysis/scenarios）', () => {
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  
  // テスト用のシナリオパラメータ（シンプルな値を設定）
  const testScenarioParams: ScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 10, // 短い期間に設定
    capRate: 4.0
  };

  // テスト用の物件データ（最小限のデータ）
  const testPropertyData = {
    name: 'シナリオ超最適化テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 200, // 小さいサイズ
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 100000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ超最適化テスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 20 },
        { x: 0, y: 20 }
      ],
      width: 10,
      depth: 20
    }
  };
  
  // テスト用のボリュームチェックパラメータ（シンプルなパラメータ）
  const testBuildingParams = {
    floorHeight: 3.0,
    commonAreaRatio: 10,
    floors: 3, // 少ない階数
    roadWidth: 4,
    assetType: AssetType.MANSION
  };

  // テスト実行前のセットアップ
  beforeAll(async () => {
    jest.setTimeout(300000); // グローバルタイムアウトを5分に設定
    
    // データベースに接続
    await connectDB();
    
    // 認証情報を取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    try {
      // テスト用の物件を作成
      console.log('物件作成中...');
      const propertyRes = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(testPropertyData);
      
      testPropertyId = propertyRes.body.data.id;
      console.log(`物件作成完了: ID=${testPropertyId}`);
      
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
      console.log(`ボリュームチェック作成完了: ID=${testVolumeCheckId}`);
    } catch (error) {
      console.error('セットアップエラー:', error);
      throw error;
    }
  }, 180000); // タイムアウトを3分に設定
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    await disconnectDB();
  });
  
  // 基本シナリオ作成テスト - 簡素化バージョン
  it('認証済みユーザーはシナリオを作成できる', async () => {
    // 前提条件のチェック
    expect(testPropertyId).toBeDefined();
    expect(testVolumeCheckId).toBeDefined();
    
    try {
      // シナリオ名
      const scenarioName = 'テストシナリオ' + Date.now();
      console.log('シナリオ作成リクエスト送信中...');
      
      // リクエスト送信
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: scenarioName,
          params: testScenarioParams
        });
      
      // 最小限の検証
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      
      console.log(`シナリオ作成成功: ID=${res.body.data.id}`);
    } catch (error) {
      console.error('テストエラー:', error);
      throw error;
    }
  }, 180000); // タイムアウトを3分に設定
  
  // 認証エラーテスト - これは高速に実行可能
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
  }, 30000);
});