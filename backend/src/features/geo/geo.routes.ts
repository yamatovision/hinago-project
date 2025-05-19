/**
 * ジオコーディングルート
 * 
 * ジオコーディング関連のエンドポイントを定義します。
 */
import express from 'express';
import * as geoController from './geo.controller';
import { validateGeocode, validateReverseGeocode } from './geo.validator';
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

/**
 * @route GET /api/v1/geocode/reverse
 * @desc 緯度経度から住所情報を取得
 * @access 認証済みユーザー
 */
router.get(
  '/reverse', 
  authRequired,
  validateReverseGeocode,
  geoController.getReverseGeocode
);

export default router;