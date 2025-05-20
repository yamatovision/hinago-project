"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ジオコーディングルート
 *
 * ジオコーディング関連のエンドポイントを定義します。
 */
var express_1 = require("express");
var geoController = require("./geo.controller");
var geo_validator_1 = require("./geo.validator");
var auth_middleware_1 = require("../../common/middlewares/auth.middleware");
var router = express_1.default.Router();
/**
 * @route GET /api/v1/geocode
 * @desc 住所から緯度経度情報を取得
 * @access 認証済みユーザー
 */
router.get('/', auth_middleware_1.authRequired, geo_validator_1.validateGeocode, geoController.getGeocode);
/**
 * @route GET /api/v1/geocode/reverse
 * @desc 緯度経度から住所情報を取得
 * @access 認証済みユーザー
 */
router.get('/reverse', auth_middleware_1.authRequired, geo_validator_1.validateReverseGeocode, geoController.getReverseGeocode);
exports.default = router;
