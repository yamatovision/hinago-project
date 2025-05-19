/**
 * アプリケーションのエントリーポイント
 */
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { appConfig } from './config';
import { authRequired, errorHandler, notFoundHandler } from './common/middlewares';
import { logger } from './common/utils';
import { initializeDatabase } from './db/connection';
import routes from './routes';

// Expressアプリケーションを初期化
const app = express();

// 環境変数とポート設定
const env = appConfig.app.env;
const port = appConfig.app.port;

// ミドルウェアの設定
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ロギングミドルウェア（開発環境のみ詳細表示）
if (env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 認証ミドルウェア（すべてのルートに適用）
app.use(authRequired);

// ルーターをマウント
app.use(routes);

// 404ハンドラー
app.use(notFoundHandler);

// エラーハンドラー
app.use(errorHandler);

// サーバーを起動
const startServer = async () => {
  try {
    // データベース接続の初期化
    await initializeDatabase();
    
    // デフォルトユーザーの初期化
    const { UserModel } = require('./db/models');
    await UserModel.initializeDefaultUsers();
    
    // サーバーを起動
    app.listen(port, () => {
      logger.info(`サーバーが起動しました: ${env}環境 ポート${port}`);
    });
  } catch (error) {
    logger.error('サーバー起動に失敗しました', { error });
    process.exit(1);
  }
};

// 非テスト環境の場合、サーバーを起動
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

// テスト用にアプリケーションをエクスポート
export default app;