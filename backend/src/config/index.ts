/**
 * 設定をまとめてエクスポートする
 */
import appConfig from './app.config';
import authConfig from './auth.config';

export {
  appConfig,
  authConfig,
};

export default {
  app: appConfig,
  auth: authConfig,
};