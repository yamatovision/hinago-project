/**
 * 設定ファイルをまとめてエクスポート
 */
import appConfig from './app.config';
import authConfig from './auth.config';
import dbConfig from './db.config';

export const config = {
  app: appConfig,
  auth: authConfig,
  db: dbConfig,
};

export default config;