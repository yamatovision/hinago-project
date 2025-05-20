/**
 * シナリオ削除API（DELETE /api/v1/analysis/scenarios/:id）の統合テスト
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

describe('シナリオ削除API（DELETE /api/v1/analysis/scenarios/:id）', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'シナリオ削除テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ削除テスト用',
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
    rentalPeriod: 5,              // 運用期間（年）- 短くして計算負荷を減らす
    capRate: 4.0                  // 還元利回り（%）
  };
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得し、テスト物件とボリュームチェック結果を作成
  beforeAll(async () => {
    try {
      // 認証情報を取得
      const auth = await getTestAuth();
      authHeader = auth.authHeader;
      
      // テスト用の物件を作成（サイズを小さく最適化）
      const smallerTestPropertyData = {
        ...testPropertyData,
        name: 'シナリオ削除テスト物件' + Date.now(),  // 一意の名前
        shapeData: {
          points: [
            { x: 0, y: 0 },
            { x: 10, y: 0 },  // より小さいシンプルな形状
            { x: 10, y: 10 },
            { x: 0, y: 10 }
          ],
          width: 10,  // 小さいサイズ
          depth: 10
        }
      };
      
      const propertyRes = await request(app)
        .post(`${baseUrl}/properties`)
        .set('Authorization', authHeader)
        .send(smallerTestPropertyData);
      
      testPropertyId = propertyRes.body.data.id;
      
      // より単純なボリュームチェックパラメータ
      const simpleParams = {
        ...testBuildingParams,
        floors: 3  // フロア数を減らして計算を軽くする
      };
      
      // テスト用のボリュームチェックを実行
      const volumeCheckRes = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          buildingParams: simpleParams
        });
      
      testVolumeCheckId = volumeCheckRes.body.data.id;
      
      // 初期化完了をログ
      console.log(`削除テスト初期化完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
    } catch (error) {
      console.error('テストセットアップエラー:', error);
      throw error;
    }
  }, 240000); // 4分のタイムアウト
  
  it('認証済みユーザーはシナリオを削除できる', async () => {
    if (!testPropertyId || !testVolumeCheckId) {
      throw new Error('テスト用物件IDまたはボリュームチェックIDが設定されていません');
    }
    
    console.log('シナリオ削除テスト開始');
    
    try {
      // 削除用に新しいシナリオを作成（よりシンプルなパラメータで）
      console.log('テスト用シナリオを作成中...');
      const createRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: 'テスト削除用シナリオ' + Date.now(),
          params: {
            ...testScenarioParams,
            rentalPeriod: 10  // より短い期間に設定して計算を軽くする
          }
        });
      
      // レスポンスの検証
      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toHaveProperty('id');
      
      const deleteScenarioId = createRes.body.data.id;
      console.log(`削除テスト用シナリオを作成しました: ID=${deleteScenarioId}`);
      
      // シナリオを削除
      console.log('シナリオを削除しています...');
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${deleteScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(204); // No Content
      console.log('シナリオを削除しました');
      
      // 削除されたことを確認するためにシナリオを取得
      const getAfterRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${deleteScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(getAfterRes.status).toBe(404);
      expect(getAfterRes.body.success).toBe(false);
      
      console.log('シナリオ削除テスト完了');
    } catch (error) {
      console.error('シナリオ削除テストエラー:', error);
      throw error;
    }
  }, 120000); // 2分のタイムアウト
  
  it('認証なしでシナリオを削除できない', async () => {
    // 削除テスト用に新しいシナリオを作成
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: 'テスト削除用シナリオ2',
        params: testScenarioParams
      });
    
    const testScenarioId = createRes.body.data.id;
    
    // 認証なしで削除を試みる
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${testScenarioId}`);
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    
    // 削除されていないことを確認
    const checkRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${testScenarioId}`)
      .set('Authorization', authHeader);
    
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.success).toBe(true);
  });
  
  it('存在しないシナリオIDでは404が返される', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
  });
  
  it('無効なフォーマットのIDでは404が返される', async () => {
    const invalidId = 'invalid-id-format';
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${invalidId}`)
      .set('Authorization', authHeader);
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
  
  // 収益性試算結果を持つシナリオのテスト - 最適化版
  it('関連する収益性試算結果がある場合でもシナリオを削除できる', async () => {
    if (!testPropertyId || !testVolumeCheckId) {
      throw new Error('テスト用物件IDまたはボリュームチェックIDが設定されていません');
    }
    
    console.log('収益性試算結果を持つシナリオの削除テスト開始');
    
    try {
      // 1. 削除用にシナリオを作成（超軽量のパラメータで）
      console.log('収益性試算用シナリオを作成中...');
      const scenarioRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: 'テスト収益性シナリオ' + Date.now(),
          params: {
            ...testScenarioParams,
            rentalPeriod: 3  // さらに短い期間に設定
          }
        });
      
      expect(scenarioRes.status).toBe(201);
      const scenarioId = scenarioRes.body.data.id;
      
      // 2. シナリオから収益性試算を実行
      console.log('シナリオから収益性試算を実行中...');
      const profitabilityRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(profitabilityRes.status).toBe(201);
      const profitabilityId = profitabilityRes.body.data.id;
      console.log(`収益性試算結果を作成しました: ID=${profitabilityId}`);
      
      // 3. シナリオを取得して収益性試算結果との関連を確認
      const scenarioCheckRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioCheckRes.status).toBe(200);
      expect(scenarioCheckRes.body.data.profitabilityResultId).toBe(profitabilityId);
      
      // 4. シナリオを削除
      console.log('収益性試算結果を持つシナリオを削除中...');
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${scenarioId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(204); // No Content
      
      // 5. シナリオが削除されたことを確認
      const scenarioAfterRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioAfterRes.status).toBe(404);
      
      // 6. 収益性試算結果はまだ存在するがシナリオIDの参照が解除されていることを確認
      const profitabilityAfterRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      // 収益性試算結果はまだ存在するはず
      expect(profitabilityAfterRes.status).toBe(200);
      // シナリオIDの参照が解除されていることを確認
      expect(profitabilityAfterRes.body.data.scenarioId).toBeUndefined();
      
      console.log('収益性試算結果を持つシナリオの削除テスト完了');
    } catch (error) {
      console.error('収益性試算結果を持つシナリオの削除テストエラー:', error);
      throw error;
    }
  }, 30000); // より短いタイムアウト（30秒）に設定
});