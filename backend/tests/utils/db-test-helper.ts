/**
 * データベース接続のテストヘルパー
 * MongoDB Memory Serverを使用したテストデータベース管理
 */
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { UserModel } from '../../src/db/models';
import { logger } from '../../src/common/utils';
import { authConfig } from '../../src/config';

// MongoDB Memory Serverインスタンス
let mongoServer: MongoMemoryServer;

/**
 * テスト用データベースのセットアップ
 */
export const connectDB = async () => {
  try {
    // すでに接続されている場合はスキップ
    if (mongoose.connection.readyState === 1) {
      logger.info('テスト用データベースにすでに接続されています');
      return;
    }

    // MongoDB Memory Serverを起動
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Mongooseで接続
    await mongoose.connect(uri);
    logger.info('テスト用データベースに接続しました');
    
    // 初期データを設定
    await setupInitialData();
  } catch (error) {
    logger.error('テスト用データベース初期化エラー', { error });
    throw error;
  }
};

/**
 * テスト後のデータベースクリーンアップ
 */
export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      // コレクションをクリアする場合はここで実行
      // const collections = mongoose.connection.collections;
      // for (const key in collections) {
      //   await collections[key].deleteMany({});
      // }
      
      // データベース接続を終了
      await mongoose.disconnect();
    }
    
    // MongoDB Memory Serverを停止
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    logger.info('テスト用データベースをクリーンアップしました');
  } catch (error) {
    logger.error('テスト用データベースクリーンアップエラー', { error });
    throw error;
  }
};

// テスト互換性のために、別名でも関数をエクスポート
export const setupTestDatabase = connectDB;
export const cleanupTestDatabase = disconnectDB;

/**
 * 初期テストデータのセットアップ
 */
const setupInitialData = async () => {
  try {
    // 管理者ユーザーの初期化
    await UserModel.initializeDefaultUsers();
    logger.info('テスト用初期データのセットアップが完了しました');
  } catch (error) {
    logger.error('テスト用初期データセットアップエラー', { error });
    throw error;
  }
};

/**
 * コレクションをクリアする
 * @param collectionName コレクション名
 */
export const clearCollection = async (collectionName: string) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('データベースに接続されていません');
      return false;
    }
    
    await mongoose.connection.collection(collectionName).deleteMany({});
    logger.info(`コレクション ${collectionName} をクリアしました`);
    return true;
  } catch (error) {
    logger.error(`コレクション ${collectionName} のクリアに失敗しました`, { error });
    throw error;
  }
};

/**
 * テスト用のユーザーを作成する
 * @param userData ユーザーデータ
 * @returns 作成されたユーザー
 */
export const createTestUser = async (userData: any) => {
  try {
    return await UserModel.create(userData);
  } catch (error) {
    logger.error('テストユーザー作成エラー', { error });
    throw error;
  }
};

/**
 * デバッグ用：データベースの状態をダンプする
 */
export const dumpDatabaseState = async () => {
  if (mongoose.connection.readyState !== 1) {
    return { status: 'disconnected' };
  }
  
  try {
    const db = mongoose.connection.db;
    if (!db) {
      return { status: 'no-database' };
    }
    
    // ユーザーコレクションの状態
    const users = await db.collection('users').find({}).toArray();
    
    // リフレッシュトークンコレクションの状態
    const refreshTokens = await db.collection('refreshtokens').find({}).toArray();
    
    return {
      users: users.map((u: any) => ({ id: u._id, email: u.email, role: u.role })),
      refreshTokens: refreshTokens.length,
      collections: Object.keys(mongoose.connection.collections),
    };
  } catch (error) {
    logger.error('データベース状態ダンプエラー', { error });
    return { error: String(error) };
  }
};