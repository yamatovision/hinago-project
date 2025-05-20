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
exports.RefreshTokenModel = void 0;
/**
 * リフレッシュトークンモデル
 *
 * MongoDBとMongooseを使用して実装しています。
 */
var uuid_1 = require("uuid");
var refreshToken_schema_1 = require("./schemas/refreshToken.schema");
var utils_1 = require("../../common/utils");
/**
 * リフレッシュトークンモデルのクラス
 */
var RefreshTokenModel = /** @class */ (function () {
    function RefreshTokenModel() {
    }
    /**
     * トークン文字列でリフレッシュトークンを検索
     * @param token トークン文字列
     * @returns リフレッシュトークンオブジェクトまたはnull
     */
    RefreshTokenModel.findByToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var refreshToken, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.findOne({ token: token }).lean()];
                    case 1:
                        refreshToken = _a.sent();
                        if (!refreshToken)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, refreshToken), { id: String(refreshToken._id) })];
                    case 2:
                        error_1 = _a.sent();
                        utils_1.logger.error('リフレッシュトークン検索エラー', { error: error_1 });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ユーザーIDでリフレッシュトークンを検索
     * @param userId ユーザーID
     * @returns リフレッシュトークンオブジェクトの配列
     */
    RefreshTokenModel.findByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var refreshTokens, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.find({ userId: userId }).lean()];
                    case 1:
                        refreshTokens = _a.sent();
                        // _id を id に変換
                        return [2 /*return*/, refreshTokens.map(function (token) { return (__assign(__assign({}, token), { id: String(token._id) })); })];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('リフレッシュトークン検索エラー', { error: error_2 });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 新しいリフレッシュトークンを作成
     * @param userId ユーザーID
     * @param expiresIn 有効期限（秒）
     * @returns 作成されたリフレッシュトークンオブジェクト
     */
    RefreshTokenModel.create = function (userId, expiresIn) {
        return __awaiter(this, void 0, void 0, function () {
            var now, expiresAt, newRefreshToken, tokenObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        now = new Date();
                        expiresAt = new Date(now.getTime() + expiresIn * 1000);
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.create({
                                userId: userId,
                                token: (0, uuid_1.v4)(), // UUIDを使用してユニークなトークンを生成
                                expiresAt: expiresAt,
                            })];
                    case 1:
                        newRefreshToken = _a.sent();
                        tokenObject = newRefreshToken.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, tokenObject), { id: String(tokenObject._id) })];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('リフレッシュトークン作成エラー', { error: error_3 });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 特定のトークンを削除
     * @param token トークン文字列
     * @returns 削除が成功したかどうか
     */
    RefreshTokenModel.delete = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.deleteOne({ token: token })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount > 0];
                    case 2:
                        error_4 = _a.sent();
                        utils_1.logger.error('リフレッシュトークン削除エラー', { error: error_4 });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ユーザーのリフレッシュトークンをすべて削除
     * @param userId ユーザーID
     * @returns 削除されたトークンの数
     */
    RefreshTokenModel.deleteAllForUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.deleteMany({ userId: userId })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount];
                    case 2:
                        error_5 = _a.sent();
                        utils_1.logger.error('リフレッシュトークン一括削除エラー', { error: error_5 });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 期限切れのトークンをすべて削除
     * @returns 削除されたトークンの数
     */
    RefreshTokenModel.deleteExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, result, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        now = new Date();
                        return [4 /*yield*/, refreshToken_schema_1.RefreshTokenModel.deleteMany({ expiresAt: { $lt: now } })];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, result.deletedCount];
                    case 2:
                        error_6 = _a.sent();
                        utils_1.logger.error('期限切れリフレッシュトークン削除エラー', { error: error_6 });
                        throw error_6;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return RefreshTokenModel;
}());
exports.RefreshTokenModel = RefreshTokenModel;
exports.default = RefreshTokenModel;
