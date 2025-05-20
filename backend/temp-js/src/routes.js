"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * アプリケーションのルーター
 * 各機能のルーターをまとめる
 */
var express_1 = require("express");
var config_1 = require("./config");
var auth_routes_1 = require("./features/auth/auth.routes");
var properties_routes_1 = require("./features/properties/properties.routes");
var geo_routes_1 = require("./features/geo/geo.routes");
var analysis_routes_1 = require("./features/analysis/analysis.routes");
var router = express_1.default.Router();
// APIのバージョンプレフィックスを取得
var apiPrefix = config_1.appConfig.app.apiPrefix;
// 各機能のルーターをマウント
router.use("".concat(apiPrefix, "/auth"), auth_routes_1.default);
router.use("".concat(apiPrefix, "/properties"), properties_routes_1.default);
router.use("".concat(apiPrefix, "/geocode"), geo_routes_1.default);
router.use("".concat(apiPrefix, "/analysis"), analysis_routes_1.default);
// API Health Check
router.get("".concat(apiPrefix, "/health"), function (req, res) {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
