/**
 * シナリオ基本機能テスト - 最小限のテストケースのみ
 * - 認証済みユーザーは認証なしでシナリオを作成できないかだけをテスト
 * - 前処理でボリュームチェックなど重い処理を行わない
 */
import request from 'supertest';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { AssetType } from '../../../src/types';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

describe('シナリオAPI基本機能テスト', () => {
  // 認証ヘッダー
  let authHeader: string;
  
  // テスト実行前のセットアップ
  beforeAll(async () => {
    await connectDB();
    
    // 認証情報を取得
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    
    console.log('基本テストのセットアップ完了');
  }, 30000);
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    await disconnectDB();
  });
  
  // 認証エラーテスト - これは高速に実行可能
  it('認証なしでシナリオ関連APIにアクセスできない', async () => {
    // 認証なしでシナリオ一覧取得
    const listRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios?propertyId=000000000000000000000000`);
    
    expect(listRes.status).toBe(401);
    expect(listRes.body.success).toBe(false);
    
    // 認証なしでシナリオ作成
    const createRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .send({
        propertyId: '000000000000000000000000',
        volumeCheckId: '000000000000000000000000',
        name: 'テストシナリオ',
        params: {
          assetType: AssetType.MANSION,
          rentPerSqm: 3000,
          occupancyRate: 95,
          managementCostRate: 10,
          constructionCostPerSqm: 350000,
          rentalPeriod: 10,
          capRate: 4.0
        }
      });
    
    expect(createRes.status).toBe(401);
    expect(createRes.body.success).toBe(false);
    
    console.log('認証テスト完了: 全ての認証チェックが正常に動作');
  }, 30000);
});