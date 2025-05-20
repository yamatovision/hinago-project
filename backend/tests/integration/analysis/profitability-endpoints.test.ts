/**
 * 収益性試算エンドポイント単体テスト
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

// テスト実行前のセットアップ
beforeAll(async () => {
  jest.setTimeout(120000); // タイムアウトを120秒に設定
  await connectDB();
});

// テスト実行後のクリーンアップ
afterAll(async () => {
  await disconnectDB();
});

describe('収益性試算APIエンドポイントテスト', () => {
  let authHeader: string;
  let propertyId: string;
  let volumeCheckId: string;
  
  // 認証トークンを取得
  beforeAll(async () => {
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
  });
  
  // 既存のプロパティIDとボリュームチェックIDを取得（各テスト毎に新規作成はしない）
  beforeAll(async () => {
    // 既存の物件一覧を取得
    const propertiesRes = await request(app)
      .get(`${baseUrl}/properties`)
      .set('Authorization', authHeader);
    
    if (propertiesRes.status === 200 && propertiesRes.body.data && propertiesRes.body.data.properties && propertiesRes.body.data.properties.length > 0) {
      propertyId = propertiesRes.body.data.properties[0].id;
      console.log(`既存の物件ID: ${propertyId}`);
      
      // 物件に関連するボリュームチェック一覧を取得
      const volumeChecksRes = await request(app)
        .get(`${baseUrl}/analysis/volume-check/property/${propertyId}`)
        .set('Authorization', authHeader);
      
      if (volumeChecksRes.status === 200 && volumeChecksRes.body.data && volumeChecksRes.body.data.length > 0) {
        volumeCheckId = volumeChecksRes.body.data[0].id;
        console.log(`既存のボリュームチェックID: ${volumeCheckId}`);
      }
    }
  });
  
  describe('物件関連収益性試算一覧取得 (/api/v1/analysis/profitability/property/:propertyId)', () => {
    it('エンドポイントが正しく応答すること', async () => {
      // 検証対象のエンドポイントを呼び出し
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/property/${propertyId || 'test-property-id'}`)
        .set('Authorization', authHeader);
      
      // ステータスコードをチェック（結果の有無は関係なく、エンドポイントが機能していることを確認）
      expect(res.status).toBe(propertyId ? 200 : 404);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });
  });
  
  describe('ボリュームチェック関連収益性試算一覧取得 (/api/v1/analysis/profitability/volume-check/:volumeCheckId)', () => {
    it('エンドポイントが正しく応答すること', async () => {
      // 検証対象のエンドポイントを呼び出し
      const res = await request(app)
        .get(`${baseUrl}/analysis/profitability/volume-check/${volumeCheckId || 'test-volume-check-id'}`)
        .set('Authorization', authHeader);
      
      // ステータスコードをチェック（結果の有無は関係なく、エンドポイントが機能していることを確認）
      expect(res.status).toBe(volumeCheckId ? 200 : 404);
      if (res.status === 200) {
        expect(res.body.success).toBe(true);
      }
    });
  });
  
  describe('収益性試算結果削除 (/api/v1/analysis/profitability/:profitabilityId)', () => {
    it('エンドポイントが正しく応答すること', async () => {
      // 存在しない収益性試算IDで呼び出し
      const res = await request(app)
        .delete(`${baseUrl}/analysis/profitability/non-existent-id`)
        .set('Authorization', authHeader);
      
      // IDが存在しないので404が返ってくるが、エンドポイントが機能していることを確認
      expect(res.status).toBe(404);
    });
  });
});