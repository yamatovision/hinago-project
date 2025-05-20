"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * アプリケーション全体の設定
 */
var dotenv_1 = require("dotenv");
// .env ファイルを読み込む
dotenv_1.default.config();
// NODE_ENV から環境を設定（デフォルトは development）
var environment = process.env.NODE_ENV || 'development';
var config = {
    // アプリケーション設定
    app: {
        env: environment,
        port: parseInt(process.env.PORT || '3000', 10),
        apiPrefix: process.env.API_PREFIX || '/api/v1',
    },
    // CORS設定
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        credentials: true,
    },
    // ログ設定
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        file: process.env.LOG_FILE,
    },
};
exports.default = config;
