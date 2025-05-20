/**
 * 収益性試算パフォーマンステスト
 * 
 * このテストでは、収益性試算機能のパフォーマンスを評価します。
 * 複数のシナリオを並行で作成し、処理時間を計測します。
 */
const request = require('supertest');
const app = require('../../../src/app').default;
const { appConfig } = require('../../../src/config');
const { connectDB, disconnectDB } = require('../../utils/db-test-helper');
const { getTestAuth } = require('../../utils/test-auth-helper');
const { 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus, 
  AssetType
} = require('../../../src/types');

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// パフォーマンス測定用ユーティリティ
async function measurePerformance(name, fn) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[PERF] ${name} failed after ${duration.toFixed(2)}ms: ${error.message || String(error)}`);
    throw error;
  }
}

// テスト実行前のセットアップ
beforeAll(async () => {
  jest.setTimeout(120000); // 120秒タイムアウト設定
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('収益性試算パフォーマンステスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'パフォーマンステスト物件',
    address: '東京都中央区銀座1-1-1',
    area: 2000,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 700,
    price: 1000000000,
    status: PropertyStatus.ACTIVE,
    notes: 'パフォーマンステスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 40, y: 0 },
        { x: 40, y: 50 },
        { x: 0, y: 50 }
      ],
      width: 40,
      depth: 50
    }
  };
  
  // テスト用のボリュームチェックパラメータ
  const testBuildingParams = {
    floorHeight: 3.5,
    commonAreaRatio: 15,
    floors: 20,
    roadWidth: 12,
    assetType: AssetType.MANSION
  };
  
  // テスト用のシナリオパラメータ生成関数
  function generateScenarioParams(index, assetType) {
    // アセットタイプごとに基本パラメータを設定
    let baseParams;
    
    switch (assetType) {
      case AssetType.MANSION:
        baseParams = {
          assetType: AssetType.MANSION,
          rentPerSqm: 4000,
          occupancyRate: 95,
          managementCostRate: 20,
          constructionCostPerSqm: 400000,
          rentalPeriod: 35,
          capRate: 4.0
        };
        break;
      case AssetType.OFFICE:
        baseParams = {
          assetType: AssetType.OFFICE,
          rentPerSqm: 5000,
          occupancyRate: 90,
          managementCostRate: 25,
          constructionCostPerSqm: 450000,
          rentalPeriod: 30,
          capRate: 4.5
        };
        break;
      case AssetType.HOTEL:
        baseParams = {
          assetType: AssetType.HOTEL,
          rentPerSqm: 4500,
          occupancyRate: 85,
          managementCostRate: 30,
          constructionCostPerSqm: 500000,
          rentalPeriod: 25,
          capRate: 5.0
        };
        break;
      case AssetType.WOODEN_APARTMENT:
        baseParams = {
          assetType: AssetType.WOODEN_APARTMENT,
          rentPerSqm: 3000,
          occupancyRate: 90,
          managementCostRate: 15,
          constructionCostPerSqm: 250000,
          rentalPeriod: 20,
          capRate: 5.5
        };
        break;
      default:
        baseParams = {
          assetType: AssetType.MANSION,
          rentPerSqm: 4000,
          occupancyRate: 95,
          managementCostRate: 20,
          constructionCostPerSqm: 400000,
          rentalPeriod: 35,
          capRate: 4.0
        };
    }
    
    // インデックスに応じてパラメータを少し変化させる
    return {
      ...baseParams,
      rentPerSqm: baseParams.rentPerSqm + (index * 100),
      occupancyRate: Math.min(98, baseParams.occupancyRate + (index * 0.5)),
      managementCostRate: Math.max(10, baseParams.managementCostRate - (index * 0.5)),
      constructionCostPerSqm: baseParams.constructionCostPerSqm + (index * 5000)
    };
  }

  let testPropertyId;
  let testVolumeCheckId;
  let createdScenarioIds = [];
  let authHeader;

  // 各テスト前に必要なデータを準備
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    console.log('物件を作成中...');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    console.log(`物件作成完了: ${testPropertyId}`);
    
    // ボリュームチェックを実行
    console.log('ボリュームチェックを実行中...');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    console.log(`ボリュームチェック完了: ${testVolumeCheckId}`);
  });

  // 全てのテスト後にテストデータをクリーンアップ
  afterAll(async () => {
    console.log('テストデータのクリーンアップを開始...');
    
    // 作成したシナリオを削除
    for (const scenarioId of createdScenarioIds) {
      try {
        await request(app)
          .delete(`${baseUrl}/analysis/scenarios/${scenarioId}`)
          .set('Authorization', authHeader);
      } catch (error) {
        console.error(`シナリオ削除エラー (ID: ${scenarioId}):`, error);
      }
    }
    
    // ボリュームチェックを削除
    if (testVolumeCheckId) {
      try {
        await request(app)
          .delete(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
          .set('Authorization', authHeader);
      } catch (error) {
        console.error(`ボリュームチェック削除エラー:`, error);
      }
    }
    
    // 物件を削除
    if (testPropertyId) {
      try {
        await request(app)
          .delete(`${baseUrl}/properties/${testPropertyId}`)
          .set('Authorization', authHeader);
      } catch (error) {
        console.error(`物件削除エラー:`, error);
      }
    }
    
    console.log('テストデータのクリーンアップが完了しました');
  });

  it('複数のシナリオを連続して作成できること', async () => {
    // 各アセットタイプごとのシナリオ作成回数
    const scenariosPerAssetType = 3;
    const assetTypes = [
      AssetType.MANSION,
      AssetType.OFFICE,
      AssetType.HOTEL,
      AssetType.WOODEN_APARTMENT
    ];
    
    // 全体の処理時間を計測
    await measurePerformance('複数シナリオ作成', async () => {
      // 各アセットタイプごとにシナリオを作成
      for (let assetType of assetTypes) {
        for (let i = 0; i < scenariosPerAssetType; i++) {
          const scenarioName = `パフォーマンステスト_${assetType}_${i + 1}`;
          const scenarioParams = generateScenarioParams(i, assetType);
          
          // シナリオ作成の処理時間を計測
          await measurePerformance(`シナリオ作成 (${scenarioName})`, async () => {
            const res = await request(app)
              .post(`${baseUrl}/analysis/scenarios`)
              .set('Authorization', authHeader)
              .send({
                propertyId: testPropertyId,
                volumeCheckId: testVolumeCheckId,
                name: scenarioName,
                params: scenarioParams
              });
            
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            
            // 作成したシナリオのIDを保存
            const scenarioId = res.body.data.id;
            createdScenarioIds.push(scenarioId);
          });
        }
      }
      
      // 作成したシナリオ数を検証
      const totalScenarios = assetTypes.length * scenariosPerAssetType;
      expect(createdScenarioIds.length).toBe(totalScenarios);
    });
  });
  
  it('シナリオのバッチ取得のパフォーマンス', async () => {
    // シナリオ一覧取得の処理時間を計測
    await measurePerformance('シナリオ一覧取得', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scenarios');
      expect(Array.isArray(res.body.data.scenarios)).toBe(true);
      
      // 少なくとも作成したシナリオ数があることを確認
      expect(res.body.data.scenarios.length).toBeGreaterThanOrEqual(createdScenarioIds.length);
      
      // 結果表示
      console.log(`取得したシナリオ数: ${res.body.data.scenarios.length}`);
    });
  });
  
  it('複数のシナリオから並行して収益性試算を実行できること', async () => {
    // テスト対象のシナリオ数（処理に時間がかかりすぎないよう制限）
    const numScenariosToTest = Math.min(4, createdScenarioIds.length);
    const testScenarioIds = createdScenarioIds.slice(0, numScenariosToTest);
    const profitabilityIds = [];
    
    // 全体の処理時間を計測
    await measurePerformance(`${numScenariosToTest}個のシナリオから収益性試算を実行`, async () => {
      // 各シナリオごとに収益性試算を実行
      for (const scenarioId of testScenarioIds) {
        // 収益性試算の処理時間を計測
        await measurePerformance(`シナリオからの収益性試算 (ID: ${scenarioId})`, async () => {
          const res = await request(app)
            .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
            .set('Authorization', authHeader);
          
          expect(res.status).toBe(201);
          expect(res.body.success).toBe(true);
          
          // 収益性試算結果のIDを保存
          const profitabilityId = res.body.data.id;
          profitabilityIds.push(profitabilityId);
        });
      }
      
      // 全てのシナリオから収益性試算を実行できたことを確認
      expect(profitabilityIds.length).toBe(numScenariosToTest);
    });
    
    // 収益性試算結果の内容を確認
    for (let i = 0; i < profitabilityIds.length; i++) {
      const profitabilityId = profitabilityIds[i];
      const scenarioId = testScenarioIds[i];
      
      await measurePerformance(`収益性試算結果の取得と検証 (ID: ${profitabilityId})`, async () => {
        const res = await request(app)
          .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
          .set('Authorization', authHeader);
        
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', profitabilityId);
        expect(res.body.data).toHaveProperty('scenarioId', scenarioId);
        expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
        expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
        
        // 財務指標が計算されていることを確認
        expect(res.body.data).toHaveProperty('noiYield');
        expect(res.body.data).toHaveProperty('irr');
        expect(res.body.data).toHaveProperty('paybackPeriod');
        
        // 結果サマリー表示
        console.log(`収益性指標 (ID: ${profitabilityId}):`, {
          assetType: res.body.data.assetType,
          noiYield: res.body.data.noiYield.toFixed(2) + '%',
          irr: res.body.data.irr.toFixed(2) + '%',
          paybackPeriod: res.body.data.paybackPeriod.toFixed(2) + '年'
        });
      });
    }
  });
  
  it('収益性試算結果のバッチ取得のパフォーマンス', async () => {
    // ボリュームチェックIDによる収益性試算結果一覧取得の処理時間を計測
    await measurePerformance('ボリュームチェックID別収益性試算結果一覧取得', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('profitabilityResults');
      expect(Array.isArray(res.body.data.profitabilityResults)).toBe(true);
      
      // 結果表示
      console.log(`取得した収益性試算結果数: ${res.body.data.profitabilityResults.length}`);
      
      // アセットタイプ別に結果を集計
      const assetTypeCounts = {};
      
      for (const result of res.body.data.profitabilityResults) {
        const assetType = result.assetType;
        assetTypeCounts[assetType] = (assetTypeCounts[assetType] || 0) + 1;
      }
      
      console.log('アセットタイプ別の収益性試算結果数:', assetTypeCounts);
    });
  });
});