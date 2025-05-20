"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendValidationError = exports.sendNotFoundError = exports.sendForbiddenError = exports.sendAuthError = exports.sendError = exports.sendSuccess = void 0;
/**
 * 成功レスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param data レスポンスデータ
 * @param statusCode HTTPステータスコード（デフォルト: 200）
 * @param meta メタデータ（オプショナル）
 */
var sendSuccess = function (res, data, statusCode, meta) {
    if (statusCode === void 0) { statusCode = 200; }
    return res.status(statusCode).json(__assign({ success: true, data: data }, (meta && { meta: meta })));
};
exports.sendSuccess = sendSuccess;
/**
 * エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param error エラーメッセージ
 * @param code エラーコード
 * @param statusCode HTTPステータスコード（デフォルト: 400）
 * @param details 詳細情報（オプショナル）
 */
var sendError = function (res, error, code, statusCode, details) {
    if (statusCode === void 0) { statusCode = 400; }
    return res.status(statusCode).json({
        success: false,
        error: __assign({ code: code, message: error }, (details && { details: details })),
    });
};
exports.sendError = sendError;
/**
 * 認証エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 * @param code エラーコード
 */
var sendAuthError = function (res, message, code) {
    if (message === void 0) { message = '認証が必要です'; }
    if (code === void 0) { code = 'AUTH_REQUIRED'; }
    return (0, exports.sendError)(res, message, code, 401);
};
exports.sendAuthError = sendAuthError;
/**
 * 権限エラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 */
var sendForbiddenError = function (res, message) {
    if (message === void 0) { message = 'この操作を実行する権限がありません'; }
    return (0, exports.sendError)(res, message, 'FORBIDDEN', 403);
};
exports.sendForbiddenError = sendForbiddenError;
/**
 * 存在しないリソースエラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param message エラーメッセージ
 */
var sendNotFoundError = function (res, message) {
    if (message === void 0) { message = 'リソースが見つかりませんでした'; }
    return (0, exports.sendError)(res, message, 'NOT_FOUND', 404);
};
exports.sendNotFoundError = sendNotFoundError;
/**
 * バリデーションエラーレスポンスを返す
 * @param res Expressのレスポンスオブジェクト
 * @param details バリデーションエラーの詳細
 */
var sendValidationError = function (res, details) {
    return (0, exports.sendError)(res, '入力データが無効です', 'VALIDATION_ERROR', 400, details);
};
exports.sendValidationError = sendValidationError;
