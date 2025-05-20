/**
 * 収益性試算機能API統合テスト
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
  FinancialParams
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

describe('収益性試算API統合テスト', () => {
  // テスト用の物件データ
  const testPropertyData = {
    name: '収益性テスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 500,
    zoneType: ZoneType.CATEGORY9, // 商業地域
    fireZone: FireZoneType.FIRE, // 防火地域
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 200000000,
    status: PropertyStatus.ACTIVE,
    notes: '収益性試算テスト用',
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
  
  // テスト用の収益性試算パラメータ
  const testFinancialParams: FinancialParams = {
    rentPerSqm: 3000,             // 賃料単価（円/m²）
    occupancyRate: 95,            // 稼働率（%）
    managementCostRate: 10,       // 管理コスト率（%）
    constructionCostPerSqm: 350000, // 建設単価（円/m²）
    rentalPeriod: 30,             // 運用期間（年）
    capRate: 4.0                  // 還元利回り（%）
  };
  
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testProfitabilityId: string;
  let authHeader: string;
  
  // 各テスト前に認証トークンを取得
  beforeAll(async () => {
    console.log('収益性試算テスト環境セットアップ開始...');
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    // テスト用の物件を作成
    console.log('テスト用物件作成中...');
    const res = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send({
        ...testPropertyData,
        name: `収益性テスト物件 ${Date.now()}`, // 一意の名前
        address: `福岡県福岡市中央区天神1-1-${Date.now() % 100}` // 一意の住所
      });
    
    testPropertyId = res.body.data.id;
    console.log('テスト用物件作成完了:', testPropertyId);
    
    // テスト用のボリュームチェックを作成
    console.log('テスト用ボリュームチェック作成中...');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: testBuildingParams
      });
    
    if (volumeCheckRes.body.data && volumeCheckRes.body.data.id) {
      testVolumeCheckId = volumeCheckRes.body.data.id;
      console.log('テスト用ボリュームチェック作成完了:', testVolumeCheckId);
    } else {
      console.error('ボリュームチェック作成エラー:', volumeCheckRes.status, volumeCheckRes.body);
    }
  }, 300000); // 5分のタイムアウト
  
  // 収益性試算の実行テスト
  describe('POST /analysis/profitability', () => {
    it('認証済みユーザーは収益性試算を実行できる', async () => {
      console.log('収益性試算実行テスト開始...');
      
      if (!testPropertyId || !testVolumeCheckId) {
        console.log('テスト用物件IDまたはボリュームチェックIDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('使用するID:', { propertyId: testPropertyId, volumeCheckId: testVolumeCheckId });
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          assetType: AssetType.MANSION,
          financialParams: testFinancialParams
        });
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
      expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
      expect(res.body.data).toHaveProperty('assetType', AssetType.MANSION);
      expect(res.body.data).toHaveProperty('landPrice');
      expect(res.body.data).toHaveProperty('constructionCost');
      expect(res.body.data).toHaveProperty('totalInvestment');
      expect(res.body.data).toHaveProperty('annualRentalIncome');
      expect(res.body.data).toHaveProperty('annualNOI');
      expect(res.body.data).toHaveProperty('noiYield');
      expect(res.body.data).toHaveProperty('irr');
      expect(res.body.data).toHaveProperty('paybackPeriod');
      expect(res.body.data).toHaveProperty('npv');
      expect(res.body.data).toHaveProperty('annualFinancials');
      expect(Array.isArray(res.body.data.annualFinancials)).toBe(true);
      
      // 後続のテストのために収益性試算IDを保存
      testProfitabilityId = res.body.data.id;
      console.log('テスト完了: 収益性試算ID', testProfitabilityId);
    }, 180000); // 3分のタイムアウト
    
    it('認証なしで収益性試算を実行できない', async () => {
      console.log('認証なしの収益性試算実行テスト開始...');
      
      const res = await request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          assetType: AssetType.MANSION,
          financialParams: testFinancialParams
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
        volumeCheckId: testVolumeCheckId,
        // assetTypeが欠けている
        financialParams: {
          rentPerSqm: 3000,
          // occupancyRateが欠けている
          managementCostRate: 10,
          constructionCostPerSqm: 350000,
          rentalPeriod: 30,
          capRate: 4.0
        }
      };
      
      console.log('リクエスト送信中...');
      const res = await request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .set('Authorization', authHeader)
        .send(invalidData);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      
      console.log('テスト完了: 必須パラメータ欠如時のエラー確認');
    });
  });
  
  // 収益性試算結果取得のテスト
  describe('GET /analysis/profitability/:id', () => {
    it('認証済みユーザーは収益性試算結果を取得できる', async () => {
      console.log('収益性試算結果取得テスト開始...');
      
      if (!testProfitabilityId) {
        console.log('テスト用収益性試算IDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('使用する収益性試算ID:', testProfitabilityId);
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id', testProfitabilityId);
      expect(res.body.data).toHaveProperty('propertyId');
      expect(res.body.data).toHaveProperty('volumeCheckId');
      expect(res.body.data).toHaveProperty('assetType');
      expect(res.body.data).toHaveProperty('parameters');
      expect(res.body.data).toHaveProperty('landPrice');
      expect(res.body.data).toHaveProperty('constructionCost');
      expect(res.body.data).toHaveProperty('annualRentalIncome');
      expect(res.body.data).toHaveProperty('noiYield');
      expect(res.body.data).toHaveProperty('irr');
      
      console.log('テスト完了: 収益性試算結果取得');
    }, 120000); // 2分のタイムアウト
    
    it('認証なしで収益性試算結果を取得できない', async () => {
      console.log('認証なしの収益性試算結果取得テスト開始...');
      
      if (!testProfitabilityId) {
        console.log('テスト用収益性試算IDが未設定のためテストをスキップします');
        return;
      }
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/${testProfitabilityId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの取得確認');
    });
    
    it('存在しない収益性試算IDでは404が返される', async () => {
      console.log('存在しない収益性試算IDテスト開始...');
      
      const nonExistentId = new mongoose.Types.ObjectId().toString(); // 有効なIDだが存在しない
      console.log('使用する存在しないID:', nonExistentId);
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/${nonExistentId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'NOT_FOUND');
      
      console.log('テスト完了: 存在しないIDでの404確認');
    });
  });
  
  // 収益性試算結果一覧取得のテスト
  describe('GET /analysis/profitability/property/:propertyId', () => {
    it('認証済みユーザーは物件に関連する収益性試算結果一覧を取得できる', async () => {
      console.log('物件関連収益性試算一覧取得テスト開始...');
      
      if (!testPropertyId) {
        console.log('テスト用物件IDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('使用する物件ID:', testPropertyId);
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      console.log('データ件数:', res.body.data ? res.body.data.length : 0);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        // データが存在する場合は追加の検証を行う
        expect(res.body.data[0]).toHaveProperty('propertyId', testPropertyId);
      }
      
      // メタデータがあるか確認
      expect(res.body.meta).toHaveProperty('total');
      
      console.log('テスト完了: 物件関連収益性試算一覧取得');
    }, 120000); // 2分のタイムアウト
    
    it('認証なしで収益性試算結果一覧を取得できない', async () => {
      console.log('認証なしの物件関連収益性試算一覧取得テスト開始...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/property/${testPropertyId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの取得確認');
    });
  });
  
  // ボリュームチェックに関連する収益性試算結果一覧取得のテスト
  describe('GET /analysis/profitability/volume-check/:volumeCheckId', () => {
    it('認証済みユーザーはボリュームチェックに関連する収益性試算結果一覧を取得できる', async () => {
      console.log('ボリュームチェック関連収益性試算一覧取得テスト開始...');
      
      if (!testVolumeCheckId) {
        console.log('テスト用ボリュームチェックIDが未設定のためテストをスキップします');
        return;
      }
      
      console.log('使用するボリュームチェックID:', testVolumeCheckId);
      console.log('リクエスト送信中...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`)
        .set('Authorization', authHeader);
      
      console.log('レスポンス受信:', res.status);
      console.log('データ件数:', res.body.data ? res.body.data.length : 0);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      if (res.body.data.length > 0) {
        // データが存在する場合は追加の検証を行う
        expect(res.body.data[0]).toHaveProperty('volumeCheckId', testVolumeCheckId);
      }
      
      // メタデータがあるか確認
      expect(res.body.meta).toHaveProperty('total');
      
      console.log('テスト完了: ボリュームチェック関連収益性試算一覧取得');
    }, 120000); // 2分のタイムアウト
    
    it('認証なしでボリュームチェック関連収益性試算結果一覧を取得できない', async () => {
      console.log('認証なしのボリュームチェック関連収益性試算一覧取得テスト開始...');
      
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/volume-check/${testVolumeCheckId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの取得確認');
    });
  });
  
  // 収益性試算結果削除のテスト
  describe('DELETE /analysis/profitability/:id', () => {
    it('認証済みユーザーは収益性試算結果を削除できる', async () => {
      console.log('収益性試算結果削除テスト開始...');
      console.log('削除用収益性試算作成準備中...');
      
      // 新しい収益性試算の作成
      console.log('収益性試算作成中...');
      const profitabilityRes = await request(app)
        .post(`${baseUrl}/analysis/profitability`)
        .set('Authorization', authHeader)
        .send({
          propertyId: testPropertyId,
          volumeCheckId: testVolumeCheckId,
          assetType: AssetType.MANSION,
          financialParams: testFinancialParams
        });

      const profitabilityId = profitabilityRes.body.data.id;
      console.log('収益性試算作成完了:', profitabilityId);
      
      // 削除前に存在確認
      console.log('削除前確認中...');
      const getRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      
      // 収益性試算結果を削除
      console.log('収益性試算削除中...');
      const deleteRes = await request(app)
        .delete(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      console.log('削除レスポンス:', deleteRes.status);
      expect(deleteRes.status).toBe(204); // No Content
      
      // 削除されたことを確認するために収益性試算結果を取得
      console.log('削除確認中...');
      const checkRes = await request(app)
        .get(`${baseUrl}/analysis/profitability/${profitabilityId}`)
        .set('Authorization', authHeader);
      
      expect(checkRes.status).toBe(404);
      expect(checkRes.body.success).toBe(false);
      expect(checkRes.body.error).toHaveProperty('code', 'NOT_FOUND');
      
      console.log('テスト完了: 収益性試算結果削除');
    }, 300000); // 5分のタイムアウト
    
    it('認証なしで収益性試算結果を削除できない', async () => {
      console.log('認証なしの収益性試算結果削除テスト開始...');
      
      if (!testProfitabilityId) {
        console.log('テスト用収益性試算IDが未設定のためテストをスキップします');
        return;
      }
      
      const res = await request(app)
        .delete(`${baseUrl}/analysis/profitability/${testProfitabilityId}`);
      
      console.log('レスポンス受信:', res.status);
      
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
      
      console.log('テスト完了: 認証なしの削除確認');
    });
  });
});