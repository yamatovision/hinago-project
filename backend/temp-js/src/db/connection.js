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
exports.getDatabaseInfo = exports.getDatabaseStatus = exports.closeDatabase = exports.initializeDatabase = exports.getDbUri = void 0;
/**
 * データベース接続モジュール
 *
 * MongoDBデータベースへの接続と切断を管理します。
 */
var mongoose_1 = require("mongoose");
var utils_1 = require("../common/utils");
// 接続オプション
var connectionOptions = {
// オプション設定
};
/**
 * データベース接続URI取得
 * @returns 接続URI
 */
var getDbUri = function () {
    var dbName = process.env.DB_NAME || 'hinago';
    return process.env.MONGODB_URI || "mongodb://localhost:27017/".concat(dbName);
};
exports.getDbUri = getDbUri;
/**
 * データベース接続を初期化
 */
var initializeDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var uri, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                uri = (0, exports.getDbUri)();
                // すでに接続されている場合はスキップ
                if (mongoose_1.default.connection.readyState === 1) {
                    utils_1.logger.info('データベースにすでに接続されています');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, mongoose_1.default.connect(uri, connectionOptions)];
            case 1:
                _a.sent();
                utils_1.logger.info("\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u306B\u63A5\u7D9A\u3057\u307E\u3057\u305F: ".concat(uri));
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                utils_1.logger.error('データベース初期化エラー', { error: error_1 });
                throw error_1;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.initializeDatabase = initializeDatabase;
/**
 * データベース接続を閉じる
 */
var closeDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                if (!(mongoose_1.default.connection.readyState !== 0)) return [3 /*break*/, 2];
                return [4 /*yield*/, mongoose_1.default.disconnect()];
            case 1:
                _a.sent();
                utils_1.logger.info('データベース接続を終了しました');
                _a.label = 2;
            case 2: return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                utils_1.logger.error('データベース切断エラー', { error: error_2 });
                throw error_2;
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.closeDatabase = closeDatabase;
/**
 * データベース接続状態を取得
 * @returns 接続状態（0: 切断, 1: 接続, 2: 接続中, 3: 切断中）
 */
var getDatabaseStatus = function () {
    return mongoose_1.default.connection.readyState;
};
exports.getDatabaseStatus = getDatabaseStatus;
/**
 * データベース情報を取得
 * @returns データベース情報
 */
var getDatabaseInfo = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, dbName, collections, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (mongoose_1.default.connection.readyState !== 1) {
                    return [2 /*return*/, { status: 'disconnected' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                db = mongoose_1.default.connection.db;
                if (!db) {
                    return [2 /*return*/, { status: 'no-database' }];
                }
                dbName = db.databaseName;
                return [4 /*yield*/, db.listCollections().toArray()];
            case 2:
                collections = _a.sent();
                return [2 /*return*/, {
                        status: 'connected',
                        name: dbName,
                        collections: collections.map(function (c) { return c.name; }),
                        host: mongoose_1.default.connection.host,
                        port: mongoose_1.default.connection.port,
                    }];
            case 3:
                error_3 = _a.sent();
                utils_1.logger.error('データベース情報取得エラー', { error: error_3 });
                return [2 /*return*/, {
                        status: 'error',
                        error: String(error_3)
                    }];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getDatabaseInfo = getDatabaseInfo;
