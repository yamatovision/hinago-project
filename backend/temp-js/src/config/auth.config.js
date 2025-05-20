"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 認証関連の設定
 */
var dotenv_1 = require("dotenv");
// .env ファイルを読み込む
dotenv_1.default.config();
var authConfig = {
    // JWT関連設定
    jwt: {
        secret: process.env.JWT_SECRET || 'your_jwt_secret_key_should_be_long_and_complex',
        accessTokenExpiration: parseInt(process.env.JWT_ACCESS_EXPIRATION || '900', 10), // 15分（秒単位）
        refreshTokenExpiration: parseInt(process.env.JWT_REFRESH_EXPIRATION || '604800', 10), // 7日間（秒単位）
    },
    // 認証関連設定
    auth: {
        saltRounds: 10, // bcryptのソルトラウンド数
        // 固定管理者ユーザー（開発用）
        adminUser: {
            id: '1',
            email: 'higano@gmail.com',
            name: '管理者',
            password: 'aikakumei', // 実際のシステムではハッシュ化されたパスワードを保存
            role: 'ADMIN',
        }
    }
};
exports.default = authConfig;
