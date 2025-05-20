"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
var utils_1 = require("../utils");
var utils_2 = require("../utils");
/**
 * アプリケーションエラークラス
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(message, statusCode, code, details) {
        if (statusCode === void 0) { statusCode = 500; }
        if (code === void 0) { code = 'SERVER_ERROR'; }
        var _this = _super.call(this, message) || this;
        _this.name = _this.constructor.name;
        _this.statusCode = statusCode;
        _this.code = code;
        _this.details = details;
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
/**
 * 存在しないルートへのアクセス時のエラーハンドリング
 */
var notFoundHandler = function (req, res, next) {
    var err = new AppError("\u8981\u6C42\u3055\u308C\u305F\u30D1\u30B9 ".concat(req.originalUrl, " \u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093"), 404, 'NOT_FOUND');
    next(err);
};
exports.notFoundHandler = notFoundHandler;
/**
 * グローバルエラーハンドラ
 */
var errorHandler = function (err, req, res, next) {
    // デフォルトのエラー情報
    var statusCode = 500;
    var message = 'サーバーエラーが発生しました';
    var code = 'SERVER_ERROR';
    var details = undefined;
    // AppErrorの場合は詳細情報を取得
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
        details = err.details;
    }
    else {
        // その他のエラーの場合
        message = err.message || message;
    }
    // 本番環境では内部エラーの詳細を隠す
    if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
        message = 'サーバーエラーが発生しました';
        details = undefined;
    }
    // エラーをログに記録
    var logMethod = statusCode >= 500 ? utils_1.logger.error : utils_1.logger.warn;
    logMethod("".concat(statusCode, " - ").concat(message, " - ").concat(req.originalUrl, " - ").concat(req.method, " - ").concat(req.ip), {
        error: err.stack || err,
        body: req.body,
        params: req.params,
        query: req.query,
    });
    // クライアントにレスポンスを返す
    return utils_2.responseUtils.sendError(res, message, code, statusCode, details);
};
exports.errorHandler = errorHandler;
