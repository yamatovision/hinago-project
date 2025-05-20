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
exports.dumpDatabaseState = exports.createTestUser = exports.clearCollection = exports.cleanupTestDatabase = exports.setupTestDatabase = exports.disconnectDB = exports.connectDB = void 0;
/**
 * データベース接続のテストヘルパー
 * MongoDB Memory Serverを使用したテストデータベース管理
 */
var mongodb_memory_server_1 = require("mongodb-memory-server");
var mongoose_1 = require("mongoose");
var models_1 = require("../../src/db/models");
var utils_1 = require("../../src/common/utils");
// MongoDB Memory Serverインスタンス
var mongoServer;
/**
 * テスト用データベースのセットアップ
 */
var connectDB = function () { return __awaiter(void 0, void 0, void 0, function () {
    var uri, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                // すでに接続されている場合はスキップ
                if (mongoose_1.default.connection.readyState === 1) {
                    utils_1.logger.info('テスト用データベースにすでに接続されています');
                    return [2 /*return*/];
                }
                return [4 /*yield*/, mongodb_memory_server_1.MongoMemoryServer.create()];
            case 1:
                // MongoDB Memory Serverを起動
                mongoServer = _a.sent();
                uri = mongoServer.getUri();
                // Mongooseで接続
                return [4 /*yield*/, mongoose_1.default.connect(uri)];
            case 2:
                // Mongooseで接続
                _a.sent();
                utils_1.logger.info('テスト用データベースに接続しました');
                // 初期データを設定
                return [4 /*yield*/, setupInitialData()];
            case 3:
                // 初期データを設定
                _a.sent();
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                utils_1.logger.error('テスト用データベース初期化エラー', { error: error_1 });
                throw error_1;
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.connectDB = connectDB;
/**
 * テスト後のデータベースクリーンアップ
 */
var disconnectDB = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                if (!(mongoose_1.default.connection.readyState !== 0)) return [3 /*break*/, 2];
                // コレクションをクリアする場合はここで実行
                // const collections = mongoose.connection.collections;
                // for (const key in collections) {
                //   await collections[key].deleteMany({});
                // }
                // データベース接続を終了
                return [4 /*yield*/, mongoose_1.default.disconnect()];
            case 1:
                // コレクションをクリアする場合はここで実行
                // const collections = mongoose.connection.collections;
                // for (const key in collections) {
                //   await collections[key].deleteMany({});
                // }
                // データベース接続を終了
                _a.sent();
                _a.label = 2;
            case 2:
                if (!mongoServer) return [3 /*break*/, 4];
                return [4 /*yield*/, mongoServer.stop()];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                utils_1.logger.info('テスト用データベースをクリーンアップしました');
                return [3 /*break*/, 6];
            case 5:
                error_2 = _a.sent();
                utils_1.logger.error('テスト用データベースクリーンアップエラー', { error: error_2 });
                throw error_2;
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.disconnectDB = disconnectDB;
// テスト互換性のために、別名でも関数をエクスポート
exports.setupTestDatabase = exports.connectDB;
exports.cleanupTestDatabase = exports.disconnectDB;
/**
 * 初期テストデータのセットアップ
 */
var setupInitialData = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // 管理者ユーザーの初期化
                return [4 /*yield*/, models_1.UserModel.initializeDefaultUsers()];
            case 1:
                // 管理者ユーザーの初期化
                _a.sent();
                utils_1.logger.info('テスト用初期データのセットアップが完了しました');
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                utils_1.logger.error('テスト用初期データセットアップエラー', { error: error_3 });
                throw error_3;
            case 3: return [2 /*return*/];
        }
    });
}); };
/**
 * コレクションをクリアする
 * @param collectionName コレクション名
 */
var clearCollection = function (collectionName) { return __awaiter(void 0, void 0, void 0, function () {
    var error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                if (mongoose_1.default.connection.readyState !== 1) {
                    utils_1.logger.warn('データベースに接続されていません');
                    return [2 /*return*/, false];
                }
                return [4 /*yield*/, mongoose_1.default.connection.collection(collectionName).deleteMany({})];
            case 1:
                _a.sent();
                utils_1.logger.info("\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3 ".concat(collectionName, " \u3092\u30AF\u30EA\u30A2\u3057\u307E\u3057\u305F"));
                return [2 /*return*/, true];
            case 2:
                error_4 = _a.sent();
                utils_1.logger.error("\u30B3\u30EC\u30AF\u30B7\u30E7\u30F3 ".concat(collectionName, " \u306E\u30AF\u30EA\u30A2\u306B\u5931\u6557\u3057\u307E\u3057\u305F"), { error: error_4 });
                throw error_4;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.clearCollection = clearCollection;
/**
 * テスト用のユーザーを作成する
 * @param userData ユーザーデータ
 * @returns 作成されたユーザー
 */
var createTestUser = function (userData) { return __awaiter(void 0, void 0, void 0, function () {
    var error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, models_1.UserModel.create(userData)];
            case 1: return [2 /*return*/, _a.sent()];
            case 2:
                error_5 = _a.sent();
                utils_1.logger.error('テストユーザー作成エラー', { error: error_5 });
                throw error_5;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createTestUser = createTestUser;
/**
 * デバッグ用：データベースの状態をダンプする
 */
var dumpDatabaseState = function () { return __awaiter(void 0, void 0, void 0, function () {
    var db, users, refreshTokens, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (mongoose_1.default.connection.readyState !== 1) {
                    return [2 /*return*/, { status: 'disconnected' }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                db = mongoose_1.default.connection.db;
                if (!db) {
                    return [2 /*return*/, { status: 'no-database' }];
                }
                return [4 /*yield*/, db.collection('users').find({}).toArray()];
            case 2:
                users = _a.sent();
                return [4 /*yield*/, db.collection('refreshtokens').find({}).toArray()];
            case 3:
                refreshTokens = _a.sent();
                return [2 /*return*/, {
                        users: users.map(function (u) { return ({ id: u._id, email: u.email, role: u.role }); }),
                        refreshTokens: refreshTokens.length,
                        collections: Object.keys(mongoose_1.default.connection.collections),
                    }];
            case 4:
                error_6 = _a.sent();
                utils_1.logger.error('データベース状態ダンプエラー', { error: error_6 });
                return [2 /*return*/, { error: String(error_6) }];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.dumpDatabaseState = dumpDatabaseState;
