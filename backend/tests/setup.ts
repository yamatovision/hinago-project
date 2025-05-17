/**
 * Jestテスト用のセットアップファイル
 */
import { connectTestDB, disconnectTestDB, clearTestDB } from './utils/db-test-helper';

// タイムアウトの延長（デフォルトは5秒）
jest.setTimeout(30000);

// テスト実行前にデータベース接続
beforeAll(async () => {
  await connectTestDB();
});

// 各テストケース前にデータベースをクリア
beforeEach(async () => {
  await clearTestDB();
});

// テスト実行後にデータベース切断
afterAll(async () => {
  await disconnectTestDB();
});