/**
 * データベース接続モジュール
 * 
 * MongoDBデータベースへの接続と切断を管理します。
 */
import mongoose from 'mongoose';
import { logger } from '../common/utils';

// 接続オプション
const connectionOptions: mongoose.ConnectOptions = {
  // オプション設定
};

/**
 * データベース接続URI取得
 * @returns 接続URI
 */
export const getDbUri = (): string => {
  const dbName = process.env.DB_NAME || 'hinago';
  return process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;
};

/**
 * データベース接続を初期化
 */
export const initializeDatabase = async (): Promise<void> => {
  try {
    const uri = getDbUri();
    // すでに接続されている場合はスキップ
    if (mongoose.connection.readyState === 1) {
      logger.info('データベースにすでに接続されています');
      return;
    }

    await mongoose.connect(uri, connectionOptions);
    logger.info(`データベースに接続しました: ${uri}`);
  } catch (error) {
    logger.error('データベース初期化エラー', { error });
    throw error;
  }
};

/**
 * データベース接続を閉じる
 */
export const closeDatabase = async (): Promise<void> => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      logger.info('データベース接続を終了しました');
    }
  } catch (error) {
    logger.error('データベース切断エラー', { error });
    throw error;
  }
};

/**
 * データベース接続状態を取得
 * @returns 接続状態（0: 切断, 1: 接続, 2: 接続中, 3: 切断中）
 */
export const getDatabaseStatus = (): number => {
  return mongoose.connection.readyState;
};

/**
 * データベース情報を取得
 * @returns データベース情報
 */
export const getDatabaseInfo = async (): Promise<any> => {
  if (mongoose.connection.readyState !== 1) {
    return { status: 'disconnected' };
  }

  try {
    const db = mongoose.connection.db;
    if (!db) {
      return { status: 'no-database' };
    }
    
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    
    return {
      status: 'connected',
      name: dbName,
      collections: collections.map(c => c.name),
      host: mongoose.connection.host,
      port: mongoose.connection.port,
    };
  } catch (error) {
    logger.error('データベース情報取得エラー', { error });
    return { 
      status: 'error',
      error: String(error)
    };
  }
};