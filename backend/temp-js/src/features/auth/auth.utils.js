"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractAuthUser = exports.calculateRefreshTokenExpiration = exports.extractTokenFromBearer = exports.verifyAccessToken = exports.generateAccessToken = void 0;
/**
 * 認証関連のユーティリティ関数
 */
var jsonwebtoken_1 = require("jsonwebtoken");
var config_1 = require("../../config");
var utils_1 = require("../../common/utils");
/**
 * アクセストークンを生成する
 * @param user ユーザー情報
 * @returns 生成されたアクセストークン
 */
var generateAccessToken = function (user) {
    var payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.authConfig.jwt.secret, { expiresIn: config_1.authConfig.jwt.accessTokenExpiration });
};
exports.generateAccessToken = generateAccessToken;
/**
 * アクセストークンを検証する
 * @param token トークン文字列
 * @returns 検証結果（成功時はペイロード、失敗時はnull）
 */
var verifyAccessToken = function (token) {
    try {
        return jsonwebtoken_1.default.verify(token, config_1.authConfig.jwt.secret);
    }
    catch (error) {
        utils_1.logger.debug('トークン検証エラー', { error: error });
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
/**
 * Bearer トークンからアクセストークンを抽出する
 * @param bearerToken Authorization ヘッダーの値
 * @returns アクセストークンまたはnull
 */
var extractTokenFromBearer = function (bearerToken) {
    if (!bearerToken || !bearerToken.startsWith('Bearer ')) {
        return null;
    }
    return bearerToken.split(' ')[1];
};
exports.extractTokenFromBearer = extractTokenFromBearer;
/**
 * リフレッシュトークンの有効期限を計算する
 * @param rememberMe 長期間ログインを保持するかどうか
 * @returns 有効期限（秒）
 */
var calculateRefreshTokenExpiration = function (rememberMe) {
    // rememberMe が true の場合は通常の有効期限、それ以外の場合は1日
    return rememberMe ? config_1.authConfig.jwt.refreshTokenExpiration : 86400; // 86400秒 = 1日
};
exports.calculateRefreshTokenExpiration = calculateRefreshTokenExpiration;
/**
 * ユーザー情報から認証用のユーザー情報を抽出する（パスワードなどの機密情報を除外）
 * @param user ユーザー情報
 * @returns 認証用のユーザー情報
 */
var extractAuthUser = function (user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
    };
};
exports.extractAuthUser = extractAuthUser;
