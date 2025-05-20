/**
 * テスト環境のセットアップファイル
 * Jest設定で各テスト実行前に読み込まれます
 */
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { initializeDatabase } from '../src/db/connection';
import { connectDB, disconnectDB } from './utils/db-test-helper';
import { verifyTestAdminUser } from './utils/test-auth-helper';
import { logger } from '../src/common/utils';

// 環境変数のロード
config();

// テストのタイムアウト設定（10分）- シナリオ関連のテストは時間がかかるため
jest.setTimeout(600000);

// 必要な環境変数が設定されているか確認
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_ACCESS_EXPIRATION',
  'JWT_REFRESH_EXPIRATION',
];

// グローバルなテスト前処理
beforeAll(async () => {
  console.log('テスト環境のセットアップを開始します');
  
  // 環境変数の検証
  const missingVars = requiredEnvVars.filter(name => !process.env[name]);
  if (missingVars.length > 0) {
    console.error(`必要な環境変数が不足しています: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  try {
    // データベース接続
    await connectDB();
    
    // 管理者ユーザーの検証と初期化
    const adminResult = await verifyTestAdminUser();
    if (adminResult.created) {
      console.log('管理者ユーザーを作成しました');
    } else if (adminResult.updated) {
      console.log('管理者ユーザーのパスワードを更新しました');
    } else {
      console.log('管理者ユーザーは既に正しく設定されています');
    }
  } catch (error) {
    console.error('テスト環境セットアップエラー:', error);
    // エラーが発生した場合でもテストを継続できるようにする
    // エラーを再スローしない
  }
});

// グローバルなテスト後処理
afterAll(async () => {
  try {
    // データベース接続のクリーンアップ
    await disconnectDB();
  } catch (error) {
    console.error('テスト環境クリーンアップエラー:', error);
  }
  console.log('テスト環境のクリーンアップを完了しました');
});