/**
 * シナリオ作成テスト - データベース直接操作版
 * - APIをバイパスして直接MongoDBモデルを使用
 * - タイムアウト問題を回避
 */
const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../../utils/db-test-helper');
const { getTestAuth } = require('../../utils/test-auth-helper');
const { ZoneType, FireZoneType, ShadowRegulationType, AssetType } = require('../../../src/types');
const { MilestoneTracker } = require('./utils/milestone-tracker');

// Scenario.tsとVolumCheckModel.tsに依存しないよう、直接スキーマをインポート
const { ScenarioModel: MongoScenarioModel } = require('../../../src/db/models/schemas/scenario.schema');

describe('シナリオ作成テスト - DB直接版', () => {
  // マイルストーントラッカー
  const tracker = new MilestoneTracker();
  
  // テスト用のIDs
  let testPropertyId;
  let testVolumeCheckId;
  let testScenarioId;
  
  // テスト実行前のセットアップ
  beforeAll(async () => {
    tracker.mark('テスト開始');
    tracker.setOperation('データベース接続');
    await connectDB();
    tracker.mark('DB接続完了');
    
    // DBモデルをインポート
    const { PropertyModel, VolumeCheckModel } = require('../../../src/db/models');
    
    // テスト用の物件を直接作成
    tracker.setOperation('テスト物件の作成');
    const propertyData = {
      name: 'シナリオDB直接テスト物件',
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
          { x: 5, y: 0 }, 
          { x: 5, y: 10 },
          { x: 0, y: 10 }
        ],
        width: 5,
        depth: 10
      }
    };
    
    const property = await PropertyModel.create(propertyData);
    testPropertyId = property.id;
    tracker.mark('物件作成完了');
    
    // テスト用のボリュームチェックを直接作成
    tracker.setOperation('ボリュームチェックの作成');
    const volumeCheckData = {
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
    };
    
    const volumeCheck = await VolumeCheckModel.create(volumeCheckData);
    testVolumeCheckId = volumeCheck.id;
    tracker.mark('ボリュームチェック作成完了');
    
    console.log(`セットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
  }, 10000);
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    try {
      tracker.setOperation('テストデータ削除');
      // 作成したテストデータを削除
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
  
  // シナリオ作成テスト - DBに直接挿入
  it('MongoDBに直接シナリオを作成できる', async () => {
    tracker.setOperation('シナリオの直接作成');
    
    // シナリオデータを準備
    const scenarioData = {
      propertyId: testPropertyId,
      volumeCheckId: testVolumeCheckId,
      name: 'DB直接テストシナリオ',
      params: {
        assetType: AssetType.MANSION,
        rentPerSqm: 3000,
        occupancyRate: 95,
        managementCostRate: 10,
        constructionCostPerSqm: 350000,
        rentalPeriod: 3,
        capRate: 4.0
      }
    };
    
    // MongoDBモデルを直接使用して保存
    const newScenario = await MongoScenarioModel.create(scenarioData);
    testScenarioId = newScenario._id.toString();
    
    tracker.mark('シナリオ作成完了');
    console.log(`作成されたシナリオID: ${testScenarioId}`);
    
    // 検証
    expect(newScenario).toBeDefined();
    expect(newScenario.propertyId).toBe(testPropertyId);
    expect(newScenario.volumeCheckId).toBe(testVolumeCheckId);
    expect(newScenario.params.assetType).toBe(AssetType.MANSION);
    
    // シナリオが取得できることを確認
    const savedScenario = await MongoScenarioModel.findById(testScenarioId).lean();
    expect(savedScenario).toBeDefined();
    expect(savedScenario.name).toBe('DB直接テストシナリオ');
    
    tracker.mark('シナリオ検証完了');
  }, 5000);
  
  // シナリオ削除テスト - DBから直接削除
  it('作成したシナリオを削除できる', async () => {
    tracker.setOperation('シナリオの削除');
    
    // 直接削除
    const deleteResult = await MongoScenarioModel.findByIdAndDelete(testScenarioId);
    
    tracker.mark('シナリオ削除完了');
    
    // 検証
    expect(deleteResult).toBeDefined();
    
    // 削除されたことを確認
    const deletedScenario = await MongoScenarioModel.findById(testScenarioId);
    expect(deletedScenario).toBeNull();
    
    tracker.mark('削除検証完了');
  }, 5000);
});