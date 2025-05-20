/**
 * ボリュームチェック機能API統合テスト
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
  AssetType
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

describe('ボリュームチェックAPI統合テスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: 'ボリュームチェックテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: 'ボリュームチェクテスト用',
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
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testSecondVolumeCheckId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    console.log('ボリュームチェックテスト環境セットアップ開始...');
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    console.log('テスト用物件作成中...');
    const res = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send({
        ...testPropertyData,
        name: `ボリュームチェックテスト物件 ${Date.now()}`, // 一意の名前
        address: `福岡県福岡市中央区天神1-1-${Date.now() % 100}` // 一意の住所
      });
    
    testPropertyId = res.body.data.id;
    console.log('テスト用物件作成完了:', testPropertyId);
  });
  
  // ボリュームチェック実行のテスト
  describe('POST /analysis/volume-check', () => {
    it('認証済みユーザーはボリュームチェックを実行できる', async () => {
      console.log('ボリュームチェック実行テスト開始...');
      console.log('使用する物件ID:', testPropertyId);
      
      // テスト前のログ
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          buildingParams: testBuildingParams
        });
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('assetType', testBuildingParams.assetType);
      expect(res.body.data).toHaveProperty('buildingArea');
      expect(res.body.data).toHaveProperty('totalFloorArea');
      expect(res.body.data).toHaveProperty('buildingHeight');
      expect(res.body.data).toHaveProperty('consumptionRate');
      expect(res.body.data).toHaveProperty('floors');
      expect(res.body.data).toHaveProperty('floorBreakdown');
      expect(res.body.data).toHaveProperty('regulationChecks');
      expect(res.body.data).toHaveProperty('model3dData');
      
      // 各フロアのデータをチェック
      expect(res.body.data.floorBreakdown.length).toBeGreaterThan(0);
      
      // 法規制チェックのデータをチェック
      expect(res.body.data.regulationChecks.length).toBeGreaterThan(0);
      
      // 3Dモデルデータをチェック
      expect(res.body.data.model3dData).toHaveProperty('modelType', 'three.js');
      expect(res.body.data.model3dData).toHaveProperty('data');
      
      // 後続のテストのためにボリュームチェックIDを保存
      testVolumeCheckId = res.body.data.id;
      console.log('テスト完了: ボリュームチェックID', testVolumeCheckId);
    }, 180000); // 3分のタイムアウト
    
    it('異なるパラメータで再度ボリュームチェックを実行できる', async () => {
      console.log('異なるパラメータでのボリュームチェック実行テスト開始...');
      const differentParams = {
        ...testBuildingParams,
        floors: 12,
        commonAreaRatio: 20,
        assetType: AssetType.OFFICE
      };
      
      console.log('リクエスト送信中...');
      const res = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          buildingParams: differentParams
        });
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('assetType', differentParams.assetType);
      expect(res.body.data).toHaveProperty('floors');
      
      // 後続のテストのために2つ目のボリュームチェックIDを保存
      testSecondVolumeCheckId = res.body.data.id;
      console.log('テスト完了: 2つ目のボリュームチェックID', testSecondVolumeCheckId);
    }, 180000); // 3分のタイムアウト
    
    it('認証なしでボリュームチェックを実行できない', async () => {
      console.log('認証なしのボリュームチェック実行テスト開始...');
      
      const res = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .send({
          propertyId: testPropertyId,
          buildingParams: testBuildingParams
        });
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの実行確認');
    });
    
    it('必須パラメータが欠けている場合はエラーになる', async () => {
      console.log('必須パラメータ欠如時のテスト開始...');
      
      // 必須パラメータを欠いたデータ
      const invalidData = {
        propertyId: testPropertyId,
        buildingParams: {
          floorHeight: 3.2,
          // commonAreaRatioが欠けている
          floors: 9,
          assetType: AssetType.MANSION
        }
      };
      
      console.log('リクエスト送信中...');
      const res = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send(invalidData);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      
      console.log('テスト完了: 必須パラメータ欠如時のエラー確認');
    });
    
    it('無効な物件IDではエラーになる', async () => {
      console.log('無効な物件IDの場合のテスト開始...');
      
      const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
      
      console.log('使用する存在しない物件ID:', nonExistentId);
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: nonExistentId,
          buildingParams: testBuildingParams
        });
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      
      console.log('テスト完了: 無効な物件IDでのエラー確認');
    });
  });
  
  // ボリュームチェック結果取得のテスト
  describe('GET /analysis/volume-check/:id', () => {
    it('認証済みユーザーはボリュームチェック結果を取得できる', async () => {
      // テスト前のログでIDを確認
      console.log('ボリュームチェック結果取得テスト開始...');
      console.log('テスト用ID:', { testVolumeCheckId, testPropertyId });
      
      if (!testVolumeCheckId) {
        console.log('テスト用ボリュームチェックIDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('リクエスト送信中...');
      const res = await request(app)
        .get(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId');
      expect(res.body.data).toHaveProperty('assetType');
      expect(res.body.data).toHaveProperty('buildingArea');
      expect(res.body.data).toHaveProperty('totalFloorArea');
      expect(res.body.data).toHaveProperty('buildingHeight');
      expect(res.body.data).toHaveProperty('consumptionRate');
      expect(res.body.data).toHaveProperty('floors');
      
      // レスポンスデータの詳細検証
      expect(typeof res.body.data.buildingArea).toBe('number');
      expect(typeof res.body.data.totalFloorArea).toBe('number');
      expect(typeof res.body.data.buildingHeight).toBe('number');
      expect(typeof res.body.data.consumptionRate).toBe('number');
      
      // 各フロアのデータを検証
      expect(Array.isArray(res.body.data.floorBreakdown)).toBe(true);
      expect(res.body.data.floorBreakdown.length).toBeGreaterThan(0);
      res.body.data.floorBreakdown.forEach((floor: any) => {
        expect(floor).toHaveProperty('floor');
        expect(floor).toHaveProperty('floorArea');
        expect(floor).toHaveProperty('privateArea');
        expect(floor).toHaveProperty('commonArea');
      });
      
      // 法規制チェックを検証
      expect(Array.isArray(res.body.data.regulationChecks)).toBe(true);
      res.body.data.regulationChecks.forEach((check: any) => {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('regulationValue');
        expect(check).toHaveProperty('plannedValue');
        expect(check).toHaveProperty('compliant');
        expect(typeof check.compliant).toBe('boolean');
      });
      
      console.log('テスト完了: ボリュームチェック結果取得');
    }, 120000); // 2分のタイムアウト
    
    it('認証なしでボリュームチェック結果を取得できない', async () => {
      console.log('認証なしのボリュームチェック結果取得テスト開始...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの取得確認');
    });
    
    it('存在しないボリュームチェックIDでは404が返される', async () => {
      console.log('存在しないボリュームチェックIDテスト開始...');
      
      const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
      console.log('使用する存在しないID:', nonExistentId);
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/volume-check/${nonExistentId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
      
      console.log('テスト完了: 存在しないIDでの404確認');
    });
  });
  
  // 物件に関連するボリュームチェック結果一覧取得のテスト
  describe('GET /analysis/volume-check/property/:propertyId', () => {
    it('認証済みユーザーは物件に関連するボリュームチェック結果一覧を取得できる', async () => {
      console.log('物件関連ボリュームチェック一覧取得テスト開始...');
      
      if (!testPropertyId) {
        console.log('テスト用物件IDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('使用する物件ID:', testPropertyId);
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/volume-check/property/${testPropertyId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      console.log('データ件数:', res.body.data ? res.body.data.length : 0);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0); // 結果がある
      
      // すべての結果が同じ物件IDを持っているか確認
      res.body.data.forEach((volumeCheck: any) => {
        expect(volumeCheck.propertyId).toBe(testPropertyId);
      });
      
      // 結果に含まれるフィールドの検証
      const firstResult = res.body.data[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('assetType');
      expect(firstResult).toHaveProperty('buildingArea');
      expect(firstResult).toHaveProperty('totalFloorArea');
      expect(firstResult).toHaveProperty('floors');
      expect(firstResult).toHaveProperty('createdAt');
      
      // メタデータがあるか確認
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta.total).toBeGreaterThan(0);
      
      console.log('テスト完了: 物件関連ボリュームチェック一覧取得');
    }, 120000); // 2分のタイムアウト
    
    it('認証なしで物件に関連するボリュームチェック結果一覧を取得できない', async () => {
      console.log('認証なしの物件関連ボリュームチェック一覧取得テスト開始...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/volume-check/property/${testPropertyId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの取得確認');
    });
  });
  
  // ボリュームチェック結果削除のテスト
  describe('DELETE /analysis/volume-check/:id', () => {
    it('認証済みユーザーはボリュームチェック結果を削除できる', async () => {
      console.log('ボリュームチェック結果削除テスト開始...');
      
      if (!testPropertyId) {
        console.log('テスト用物件IDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('削除用ボリュームチェック作成中...');
      // 削除用に新しいボリュームチェックを実行
      const createRes = await request(app)
        .post(`${baseUrl}/analysis/volume-check`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          buildingParams: testBuildingParams
        });
      
      // レスポンスの検証
      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data).toHaveProperty('id');
      
      const deleteVolumeCheckId = createRes.body.data.id;
      console.log('削除用ボリュームチェック作成完了:', deleteVolumeCheckId);
      
      // 作成されたボリュームチェック結果が取得できることを確認
      console.log('削除前確認中...');
      const getBeforeRes = await request(app)
        .get(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      expect(getBeforeRes.status).toBe(200);
      expect(getBeforeRes.body.success).toBe(true);
      
      // ボリュームチェック結果を削除
      console.log('ボリュームチェック削除中...');
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      console.log('削除レスポンス:', deleteRes.status);
      expect(deleteRes.status).toBe(204); // No Content
      
      // 削除されたことを確認するためにボリュームチェック結果を取得
      console.log('削除確認中...');
      const getAfterRes = await request(app)
        .get(`${baseUrl}/analysis/volume-check/${deleteVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      expect(getAfterRes.status).toBe(404);
      expect(getAfterRes.body.success).toBe(false);
      expect(getAfterRes.body.error).toHaveProperty('code', 'NOT_FOUND');
      
      // 物件に関連するボリュームチェック一覧に含まれていないことを確認
      console.log('一覧からの削除確認中...');
      const listRes = await request(app)
        .get(`${baseUrl}/analysis/volume-check/property/${testPropertyId}`)
        .set('Authorization', authHeader);
      
      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      
      // 削除したIDが一覧に含まれていないことを確認
      const ids = listRes.body.data.map((item: any) => item.id);
      expect(ids).not.toContain(deleteVolumeCheckId);
      
      console.log('テスト完了: ボリュームチェック結果削除');
    }, 300000); // 5分のタイムアウト
    
    it('認証なしでボリュームチェック結果を削除できない', async () => {
      console.log('認証なしのボリュームチェック結果削除テスト開始...');
      
      // テスト用ボリュームチェックIDが存在することを確認
      expect(testVolumeCheckId).toBeDefined();
      
      const res = await request(app)
        .delete(`${baseUrl}/analysis/volume-check/${testVolumeCheckId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの削除確認');
    });
  });
});