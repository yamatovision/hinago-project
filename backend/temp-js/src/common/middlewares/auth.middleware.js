"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiter = exports.adminOnly = exports.hasRole = exports.authRequired = void 0;
var auth_utils_1 = require("../../features/auth/auth.utils");
var types_1 = require("../../types");
var utils_1 = require("../utils");
/**
 * 認証が必要なルートを保護する
 * パブリックエンドポイントのリストに含まれていないルートへのアクセスには認証が必要
 */
var authRequired = function (req, res, next) {
    // パブリックエンドポイントへのアクセスは認証不要
    if (types_1.PUBLIC_ENDPOINTS.includes(req.path)) {
        return next();
    }
    // Authorizationヘッダーからトークンを取得
    var token = (0, auth_utils_1.extractTokenFromBearer)(req.headers.authorization);
    if (!token) {
        return utils_1.responseUtils.sendAuthError(res);
    }
    // トークンを検証
    var payload = (0, auth_utils_1.verifyAccessToken)(token);
    if (!payload) {
        return utils_1.responseUtils.sendError(res, 'トークンが無効です', 'INVALID_TOKEN', 401);
    }
    // リクエストにユーザー情報を追加
    req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
    };
    next();
};
exports.authRequired = authRequired;
/**
 * 特定のロールを持つユーザーのみアクセスを許可する
 * @param roles アクセスを許可するロールの配列
 */
var hasRole = function (roles) {
    return function (req, res, next) {
        // 認証チェック（ユーザー情報が存在するか）
        if (!req.user) {
            return utils_1.responseUtils.sendAuthError(res);
        }
        // ロールチェック
        if (!roles.includes(req.user.role)) {
            return utils_1.responseUtils.sendForbiddenError(res);
        }
        next();
    };
};
exports.hasRole = hasRole;
/**
 * 管理者ロールを持つユーザーのみアクセスを許可する
 */
exports.adminOnly = (0, exports.hasRole)([types_1.UserRole.ADMIN]);
/**
 * リクエスト制限ミドルウェア（レート制限）
 * 実際のプロジェクトでは Redis などを使用した実装に置き換えてください
 */
var requestLimits = {};
var rateLimiter = function (maxRequests, timeWindowMs) {
    if (maxRequests === void 0) { maxRequests = 10; }
    if (timeWindowMs === void 0) { timeWindowMs = 60000; }
    return function (req, res, next) {
        var ip = req.ip || 'unknown';
        var key = "".concat(ip, ":").concat(req.path);
        var now = Date.now();
        // 初めてのリクエストまたはリセット時間が過ぎた場合
        if (!requestLimits[key] || requestLimits[key].resetTime < now) {
            requestLimits[key] = {
                count: 1,
                resetTime: now + timeWindowMs,
            };
            return next();
        }
        // 既存のリクエスト数をインクリメント
        requestLimits[key].count += 1;
        // リクエスト制限を超えた場合
        if (requestLimits[key].count > maxRequests) {
            // 429 Too Many Requests
            return utils_1.responseUtils.sendError(res, 'リクエスト回数の制限を超えました。しばらく経ってから再試行してください。', 'TOO_MANY_REQUESTS', 429, { retryAfter: Math.ceil((requestLimits[key].resetTime - now) / 1000) });
        }
        next();
    };
};
exports.rateLimiter = rateLimiter;
