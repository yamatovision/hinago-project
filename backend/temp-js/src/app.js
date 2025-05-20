"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * アプリケーションのエントリーポイント
 */
var express_1 = require("express");
var cors_1 = require("cors");
var morgan_1 = require("morgan");
var config_1 = require("./config");
var middlewares_1 = require("./common/middlewares");
var utils_1 = require("./common/utils");
var connection_1 = require("./db/connection");
var routes_1 = require("./routes");
// Expressアプリケーションを初期化
var app = (0, express_1.default)();
// 環境変数とポート設定
var env = config_1.appConfig.app.env;
var port = config_1.appConfig.app.port;
// ミドルウェアの設定
app.use((0, cors_1.default)(config_1.appConfig.cors));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ロギングミドルウェア（開発環境のみ詳細表示）
if (env === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// 認証ミドルウェア（すべてのルートに適用）
app.use(middlewares_1.authRequired);
// ルーターをマウント
app.use(routes_1.default);
// 404ハンドラー
app.use(middlewares_1.notFoundHandler);
// エラーハンドラー
app.use(middlewares_1.errorHandler);
// サーバーを起動
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var UserModel, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                // データベース接続の初期化
                return [4 /*yield*/, (0, connection_1.initializeDatabase)()];
            case 1:
                // データベース接続の初期化
                _a.sent();
                UserModel = require('./db/models').UserModel;
                return [4 /*yield*/, UserModel.initializeDefaultUsers()];
            case 2:
                _a.sent();
                // サーバーを起動
                app.listen(port, function () {
                    utils_1.logger.info("\u30B5\u30FC\u30D0\u30FC\u304C\u8D77\u52D5\u3057\u307E\u3057\u305F: ".concat(env, "\u74B0\u5883 \u30DD\u30FC\u30C8").concat(port));
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                utils_1.logger.error('サーバー起動に失敗しました', { error: error_1 });
                process.exit(1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
// 非テスト環境の場合、サーバーを起動
if (process.env.NODE_ENV !== 'test') {
    startServer();
}
// テスト用にアプリケーションをエクスポート
exports.default = app;
