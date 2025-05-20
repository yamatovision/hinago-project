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
exports.UserModel = void 0;
/**
 * ユーザーモデル
 *
 * MongoDBとMongooseを使用して実装しています。
 */
var types_1 = require("../../types");
var user_schema_1 = require("./schemas/user.schema");
var config_1 = require("../../config");
var utils_1 = require("../../common/utils");
/**
 * ユーザーモデルのクラス
 */
var UserModel = /** @class */ (function () {
    function UserModel() {
    }
    /**
     * メールアドレスでユーザーを検索
     * @param email メールアドレス
     * @returns ユーザーオブジェクトまたはnull
     */
    UserModel.findByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_schema_1.UserModel.findOne({ email: email }).lean()];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, user), { id: String(user._id) })];
                    case 2:
                        error_1 = _a.sent();
                        utils_1.logger.error('ユーザー検索エラー', { error: error_1, email: email });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * IDでユーザーを検索
     * @param id ユーザーID
     * @returns ユーザーオブジェクトまたはnull
     */
    UserModel.findById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var user, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_schema_1.UserModel.findById(id).lean()];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, null];
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, user), { id: String(user._id) })];
                    case 2:
                        error_2 = _a.sent();
                        utils_1.logger.error('ユーザー検索エラー', { error: error_2, id: id });
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 新しいユーザーを作成
     * @param userData ユーザーデータ
     * @returns 作成されたユーザーオブジェクト
     */
    UserModel.create = function (userData) {
        return __awaiter(this, void 0, void 0, function () {
            var newUser, userObject, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_schema_1.UserModel.create(userData)];
                    case 1:
                        newUser = _a.sent();
                        userObject = newUser.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, userObject), { id: String(userObject._id) })];
                    case 2:
                        error_3 = _a.sent();
                        utils_1.logger.error('ユーザー作成エラー', { error: error_3 });
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ユーザー情報を更新
     * @param id ユーザーID
     * @param userData 更新するユーザーデータ
     * @returns 更新されたユーザーオブジェクトまたはnull
     */
    UserModel.update = function (id, userData) {
        return __awaiter(this, void 0, void 0, function () {
            var updatedUser, userObject, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_schema_1.UserModel.findByIdAndUpdate(id, __assign({}, userData), { new: true })];
                    case 1:
                        updatedUser = _a.sent();
                        if (!updatedUser)
                            return [2 /*return*/, null];
                        userObject = updatedUser.toObject();
                        // _id を id に変換
                        return [2 /*return*/, __assign(__assign({}, userObject), { id: String(userObject._id) })];
                    case 2:
                        error_4 = _a.sent();
                        utils_1.logger.error('ユーザー更新エラー', { error: error_4, id: id });
                        throw error_4;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * ユーザーを削除
     * @param id ユーザーID
     * @returns 削除が成功したかどうか
     */
    UserModel.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, user_schema_1.UserModel.findByIdAndDelete(id)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, !!result];
                    case 2:
                        error_5 = _a.sent();
                        utils_1.logger.error('ユーザー削除エラー', { error: error_5, id: id });
                        throw error_5;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * パスワードを検証
     * @param plainPassword 平文パスワード
     * @param hashedPassword ハッシュ化されたパスワード
     * @returns パスワードが一致するかどうか
     */
    UserModel.verifyPassword = function (plainPassword, hashedPassword) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, user_schema_1.UserModel.verifyPassword(plainPassword, hashedPassword)];
                }
                catch (error) {
                    utils_1.logger.error('パスワード検証エラー', { error: error });
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * パスワードをハッシュ化
     * @param password 平文パスワード
     * @returns ハッシュ化されたパスワード
     */
    UserModel.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    return [2 /*return*/, user_schema_1.UserModel.hashPassword(password)];
                }
                catch (error) {
                    utils_1.logger.error('パスワードハッシュ化エラー', { error: error });
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * デフォルトの管理者ユーザーを初期化
     * 既存のユーザーがいない場合にのみ作成
     */
    UserModel.initializeDefaultUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminExists, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        return [4 /*yield*/, this.findByEmail(config_1.authConfig.auth.adminUser.email)];
                    case 1:
                        adminExists = _a.sent();
                        if (!!adminExists) return [3 /*break*/, 3];
                        utils_1.logger.info('デフォルト管理者ユーザーを作成します');
                        return [4 /*yield*/, this.create({
                                email: config_1.authConfig.auth.adminUser.email,
                                name: config_1.authConfig.auth.adminUser.name,
                                password: config_1.authConfig.auth.adminUser.password, // 保存時に自動的にハッシュ化される
                                role: types_1.UserRole.ADMIN,
                            })];
                    case 2:
                        _a.sent();
                        utils_1.logger.info('デフォルト管理者ユーザーの作成が完了しました');
                        return [3 /*break*/, 4];
                    case 3:
                        utils_1.logger.debug('デフォルト管理者ユーザーは既に存在します');
                        _a.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_6 = _a.sent();
                        utils_1.logger.error('デフォルトユーザー初期化エラー', { error: error_6 });
                        throw error_6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return UserModel;
}());
exports.UserModel = UserModel;
exports.default = UserModel;
