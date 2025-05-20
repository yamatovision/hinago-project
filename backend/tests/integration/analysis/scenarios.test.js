/**
 * シナリオ機能のテスト
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

// テスト実行前のセットアップ
beforeAll(async () => {
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('シナリオ機能のテスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'シナリオテスト物件',
    address: '東京都渋谷区1-1-1',
    area: 800,
    zoneType: ZoneType.CATEGORY8, // 近隣商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 350000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオテスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 0 },
        { x: 25, y: 32 },
        { x: 0, y: 32 }
      ],
      width: 25,
      depth: 32
    }
  };
  
  // テスト用のボリュームチェックパラメータ
  const testBuildingParams = {
    floorHeight: 3.3,
    commonAreaRatio: 12,
    floors: 8,
    roadWidth: 7,
    assetType: AssetType.OFFICE
  };
  
  // テスト用のシナリオデータ（オフィス）
  const testOfficeScenarioData = {
    name: 'オフィスシナリオ',
    params: {
      assetType: AssetType.OFFICE,
      rentPerSqm: 4500,
      occupancyRate: 90,
      managementCostRate: 25,
      constructionCostPerSqm: 430000,
      rentalPeriod: 35,
      capRate: 4.0
    }
  };
  
  // テスト用のシナリオデータ（マンション）
  const testMansionScenarioData = {
    name: 'マンションシナリオ',
    params: {
      assetType: AssetType.MANSION,
      rentPerSqm: 3800,
      occupancyRate: 95,
      managementCostRate: 20,
      constructionCostPerSqm: 380000,
      rentalPeriod: 30,
      capRate: 4.5
    }
  };
  
  // テスト用のシナリオデータ（ホテル）
  const testHotelScenarioData = {
    name: 'ホテルシナリオ',
    params: {
      assetType: AssetType.HOTEL,
      rentPerSqm: 5000,
      occupancyRate: 85,
      managementCostRate: 35,
      constructionCostPerSqm: 450000,
      rentalPeriod: 25,
      capRate: 4.2
    }
  };

  let testPropertyId;
  let testVolumeCheckId;
  let testOfficeScenarioId;
  let testMansionScenarioId;
  let testHotelScenarioId;
  let testProfitabilityId;
  let authHeader;

  // 各テスト前に必要なデータを準備
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(testPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    
    // ボリュームチェックを実行
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
  });

  // 全てのテスト後にテストデータをクリーンアップ
  afterAll(async () => {
    // 各シナリオの収益性試算結果を削除
    if (testProfitabilityId) {
      await request(app)
        .delete(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
        .set('Authorization', authHeader);
    }
    
    // シナリオを削除
    if (testOfficeScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    if (testMansionScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    if (testHotelScenarioId) {
      await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}`)
        .set('Authorization', authHeader);
    }
    
    // ボリュームチェックと物件を削除
    if (testVolumeCheckId) {
      await request(app)
        .delete(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
        .set('Authorization', authHeader);
    }
    
    if (testPropertyId) {
      await request(app)
        .delete(`${baseUrl}/properties/${testPropertyId}`)
        .set('Authorization', authHeader);
    }
  });

  describe('シナリオのCRUD操作', () => {
    it('オフィスシナリオを作成できること', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testOfficeScenarioData.name,
          params: testOfficeScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('name', testOfficeScenarioData.name);
      expect(res.body.data).toHaveProperty('params');
      
      // パラメータが正しく保存されていることを確認
      expect(res.body.data.params).toHaveProperty('assetType', testOfficeScenarioData.params.assetType);
      expect(res.body.data.params).toHaveProperty('rentPerSqm', testOfficeScenarioData.params.rentPerSqm);
      expect(res.body.data.params).toHaveProperty('occupancyRate', testOfficeScenarioData.params.occupancyRate);
      
      // IDを保存して後続テストで使用
      testOfficeScenarioId = res.body.data.id;
    });
    
    it('マンションシナリオを作成できること', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testMansionScenarioData.name,
          params: testMansionScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      
      // IDを保存して後続テストで使用
      testMansionScenarioId = res.body.data.id;
    });
    
    it('ホテルシナリオを作成できること', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          name: testHotelScenarioData.name,
          params: testHotelScenarioData.params
        });
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      
      // IDを保存して後続テストで使用
      testHotelScenarioId = res.body.data.id;
    });
    
    it('シナリオ一覧を取得できること', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scenarios');
      expect(Array.isArray(res.body.data.scenarios)).toBe(true);
      expect(res.body.data.scenarios.length).toBeGreaterThanOrEqual(3);
      
      // 作成したシナリオが含まれていることを確認
      const scenarioIds = res.body.data.scenarios.map((s) => s.id);
      expect(scenarioIds).toContain(testOfficeScenarioId);
      expect(scenarioIds).toContain(testMansionScenarioId);
      expect(scenarioIds).toContain(testHotelScenarioId);
    });
    
    it('物件IDでシナリオをフィルタリングできること', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scenarios');
      
      // 全てのシナリオが指定した物件に関連付けられていることを確認
      const allRelatedToProperty = res.body.data.scenarios.every(
        (s) => s.propertyId === testPropertyId
      );
      expect(allRelatedToProperty).toBe(true);
    });
    
    it('ID指定でシナリオを取得できること', async () => {
      const res = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testOfficeScenarioId);
      expect(res.body.data).toHaveProperty('name', testOfficeScenarioData.name);
      expect(res.body.data.params).toHaveProperty('assetType', testOfficeScenarioData.params.assetType);
    });
    
    it('シナリオを更新できること', async () => {
      const updatedName = 'オフィスシナリオ（更新後）';
      const updatedRentPerSqm = 5000;
      
      const res = await request(app)
        .put(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader)
        .send({
          name: updatedName,
          params: {
            ...testOfficeScenarioData.params,
            rentPerSqm: updatedRentPerSqm
          }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testOfficeScenarioId);
      expect(res.body.data).toHaveProperty('name', updatedName);
      expect(res.body.data.params).toHaveProperty('rentPerSqm', updatedRentPerSqm);
      
      // 更新が永続化されていることを確認
      const checkRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(checkRes.status).toBe(200);
      expect(checkRes.body.data).toHaveProperty('name', updatedName);
      expect(checkRes.body.data.params).toHaveProperty('rentPerSqm', updatedRentPerSqm);
    });
  });
  
  describe('シナリオからの収益性試算', () => {
    it('シナリオから収益性試算を実行できること', async () => {
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('scenarioId', testMansionScenarioId);
      expect(res.body.data).toHaveProperty('assetType', AssetType.MANSION);
      
      // 財務指標が計算されていることを確認
      expect(res.body.data).toHaveProperty('annualRentalIncome');
      expect(res.body.data).toHaveProperty('annualNOI');
      expect(res.body.data).toHaveProperty('noiYield');
      expect(res.body.data).toHaveProperty('irr');
      expect(res.body.data).toHaveProperty('paybackPeriod');
      expect(res.body.data).toHaveProperty('npv');
      
      // 年次財務データが生成されていることを確認
      expect(res.body.data).toHaveProperty('annualFinancials');
      expect(Array.isArray(res.body.data.annualFinancials)).toBe(true);
      expect(res.body.data.annualFinancials.length).toBe(testMansionScenarioData.params.rentalPeriod);
      
      // IDを保存して後続テストで使用
      testProfitabilityId = res.body.data.id;
      
      // シナリオに収益性試算結果が関連付けられていることを確認
      const scenarioRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioRes.status).toBe(200);
      expect(scenarioRes.body.data).toHaveProperty('profitabilityResultId', testProfitabilityId);
    });
    
    it('同じシナリオから再度収益性試算を実行すると既存の関連が更新されること', async () => {
      // 最初の収益性試算結果IDを保存
      const firstProfitabilityId = testProfitabilityId;
      
      // 同じシナリオから再度収益性試算を実行
      const res = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('scenarioId', testMansionScenarioId);
      
      // 新しい収益性試算結果IDを取得
      const secondProfitabilityId = res.body.data.id;
      
      // 異なるIDであることを確認
      expect(secondProfitabilityId).not.toBe(firstProfitabilityId);
      
      // シナリオの関連が更新されていることを確認
      const scenarioRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioRes.status).toBe(200);
      expect(scenarioRes.body.data).toHaveProperty('profitabilityResultId', secondProfitabilityId);
      
      // 最初の収益性試算結果は引き続き存在するが、シナリオとの関連は解除されていることを確認
      const firstProfitabilityRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${firstProfitabilityId}`)
        .set('Authorization', authHeader);
      
      if (firstProfitabilityRes.status === 200) {
        // 関連が解除されていることを確認
        expect(firstProfitabilityRes.body.data.scenarioId).not.toBe(testMansionScenarioId);
      } else {
        // または削除されている可能性もある（実装による）
        expect(firstProfitabilityRes.status).toBe(404);
      }
      
      // 今後のテストのために最新の収益性試算結果IDを更新
      testProfitabilityId = secondProfitabilityId;
    });
    
    it('複数のシナリオの結果を比較できること', async () => {
      // ホテルシナリオの収益性試算を実行
      const hotelRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(hotelRes.status).toBe(201);
      const hotelProfitabilityId = hotelRes.body.data.id;
      
      // オフィスシナリオの収益性試算を実行
      const officeRes = await request(app)
        .post(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}/profitability`)
        .set('Authorization', authHeader);
      
      expect(officeRes.status).toBe(201);
      const officeProfitabilityId = officeRes.body.data.id;
      
      // マンションの収益性試算結果を取得
      const mansionRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(mansionRes.status).toBe(200);
      
      // ホテルの収益性試算結果を取得
      const hotelCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${hotelProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(hotelCheckRes.status).toBe(200);
      
      // オフィスの収益性試算結果を取得
      const officeCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${officeProfitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(officeCheckRes.status).toBe(200);
      
      // 各アセットタイプごとに収益性指標を比較
      console.log('各アセットタイプの収益性指標比較:');
      console.log('マンション:', {
        noiYield: mansionRes.body.data.noiYield,
        irr: mansionRes.body.data.irr,
        paybackPeriod: mansionRes.body.data.paybackPeriod
      });
      console.log('ホテル:', {
        noiYield: hotelCheckRes.body.data.noiYield,
        irr: hotelCheckRes.body.data.irr,
        paybackPeriod: hotelCheckRes.body.data.paybackPeriod
      });
      console.log('オフィス:', {
        noiYield: officeCheckRes.body.data.noiYield,
        irr: officeCheckRes.body.data.irr,
        paybackPeriod: officeCheckRes.body.data.paybackPeriod
      });
      
      // 各アセットタイプの収益性指標が計算されていることを確認
      expect(mansionRes.body.data.noiYield).toBeGreaterThan(0);
      expect(hotelCheckRes.body.data.noiYield).toBeGreaterThan(0);
      expect(officeCheckRes.body.data.noiYield).toBeGreaterThan(0);
    });
  });
  
  describe('削除操作', () => {
    it('シナリオを削除すると関連する収益性試算結果との関連が解除されること', async () => {
      // 収益性試算結果のIDを保存
      const profitabilityId = testProfitabilityId;
      
      // シナリオを削除
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      
      // 削除後はシナリオが取得できないことを確認
      const scenarioCheckRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios/${testMansionScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(scenarioCheckRes.status).toBe(404);
      
      // 収益性試算結果は存在するが、シナリオとの関連が解除されていることを確認
      const profitabilityCheckRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      if (profitabilityCheckRes.status === 200) {
        // 関連が解除されていることを確認
        expect(profitabilityCheckRes.body.data.scenarioId).not.toBe(testMansionScenarioId);
      }
    });
    
    it('残りのシナリオも削除できること', async () => {
      // オフィスシナリオを削除
      const officeDeleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testOfficeScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(officeDeleteRes.status).toBe(200);
      
      // ホテルシナリオを削除
      const hotelDeleteRes = await request(app)
        .delete(`${baseUrl}/analysis/scenarios/${testHotelScenarioId}`)
        .set('Authorization', authHeader);
      
      expect(hotelDeleteRes.status).toBe(200);
      
      // 削除後はシナリオ一覧から該当のシナリオが除外されていることを確認
      const listRes = await request(app)
        .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(listRes.status).toBe(200);
      
      // 削除したシナリオが一覧に含まれていないことを確認
      const scenarioIds = listRes.body.data.scenarios.map((s) => s.id);
      expect(scenarioIds).not.toContain(testOfficeScenarioId);
      expect(scenarioIds).not.toContain(testMansionScenarioId);
      expect(scenarioIds).not.toContain(testHotelScenarioId);
    });
  });
});