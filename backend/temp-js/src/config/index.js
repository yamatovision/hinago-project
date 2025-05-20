"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authConfig = exports.appConfig = void 0;
/**
 * 設定をまとめてエクスポートする
 */
var app_config_1 = require("./app.config");
exports.appConfig = app_config_1.default;
var auth_config_1 = require("./auth.config");
exports.authConfig = auth_config_1.default;
exports.default = {
    app: app_config_1.default,
    auth: auth_config_1.default,
};
