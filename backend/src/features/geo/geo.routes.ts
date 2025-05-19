/**
 * ジオコーディングルート
 * 
 * ジオコーディング関連のエンドポイントを定義します。
 */
import express from 'express';
import * as geoController from './geo.controller';
import { validateGeocode } from './geo.validator';
import { authRequired } from '../../common/middlewares/auth.middleware';

const router = express.Router();

/**
 * @route GET /api/v1/geocode
 * @desc 住所から緯度経度情報を取得
 * @access 認証済みユーザー
 */
router.get(
  '/', 
  authRequired,
  validateGeocode,
  geoController.getGeocode
);

export default router;