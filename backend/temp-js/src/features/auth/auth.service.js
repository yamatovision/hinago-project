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
exports.getUserById = exports.logoutUser = exports.refreshAccessToken = exports.authenticateUser = void 0;
/**
 * 認証サービス
 * 認証関連のビジネスロジックを実装
 */
var middlewares_1 = require("../../common/middlewares");
var utils_1 = require("../../common/utils");
var models_1 = require("../../db/models");
var auth_utils_1 = require("./auth.utils");
/**
 * ユーザー認証を行う
 * @param loginData ログインリクエストデータ
 * @returns ユーザー情報、アクセストークン、リフレッシュトークン
 */
var authenticateUser = function (loginData) { return __awaiter(void 0, void 0, void 0, function () {
    var email, password, rememberMe, user, isPasswordValid, authUser, accessToken, refreshTokenExpiration, refreshTokenObj;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                email = loginData.email, password = loginData.password, rememberMe = loginData.rememberMe;
                return [4 /*yield*/, models_1.UserModel.findByEmail(email)];
            case 1:
                user = _a.sent();
                if (!user) {
                    utils_1.logger.debug('ログイン失敗: ユーザーが見つかりません', { email: email });
                    throw new middlewares_1.AppError('メールアドレスまたはパスワードが間違っています', 401, 'INVALID_CREDENTIALS');
                }
                return [4 /*yield*/, models_1.UserModel.verifyPassword(password, user.password)];
            case 2:
                isPasswordValid = _a.sent();
                if (!isPasswordValid) {
                    utils_1.logger.debug('ログイン失敗: パスワードが間違っています', { email: email });
                    throw new middlewares_1.AppError('メールアドレスまたはパスワードが間違っています', 401, 'INVALID_CREDENTIALS');
                }
                authUser = (0, auth_utils_1.extractAuthUser)(user);
                accessToken = (0, auth_utils_1.generateAccessToken)(authUser);
                refreshTokenExpiration = (0, auth_utils_1.calculateRefreshTokenExpiration)(rememberMe);
                // 既存のリフレッシュトークンを削除（オプショナル：セキュリティ向上のため）
                return [4 /*yield*/, models_1.RefreshTokenModel.deleteAllForUser(user.id)];
            case 3:
                // 既存のリフレッシュトークンを削除（オプショナル：セキュリティ向上のため）
                _a.sent();
                return [4 /*yield*/, models_1.RefreshTokenModel.create(user.id, refreshTokenExpiration)];
            case 4:
                refreshTokenObj = _a.sent();
                return [2 /*return*/, {
                        user: authUser,
                        accessToken: accessToken,
                        refreshToken: refreshTokenObj.token,
                    }];
        }
    });
}); };
exports.authenticateUser = authenticateUser;
/**
 * リフレッシュトークンを使用して新しいアクセストークンを生成
 * @param refreshData リフレッシュリクエストデータ
 * @returns 新しいアクセストークン
 */
var refreshAccessToken = function (refreshData) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken, tokenObj, user, authUser, accessToken;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                refreshToken = refreshData.refreshToken;
                return [4 /*yield*/, models_1.RefreshTokenModel.findByToken(refreshToken)];
            case 1:
                tokenObj = _a.sent();
                if (!tokenObj) {
                    utils_1.logger.debug('リフレッシュトークンが無効です');
                    throw new middlewares_1.AppError('リフレッシュトークンが無効です', 401, 'INVALID_TOKEN');
                }
                if (!(new Date() > tokenObj.expiresAt)) return [3 /*break*/, 3];
                // 期限切れのトークンを削除
                return [4 /*yield*/, models_1.RefreshTokenModel.delete(refreshToken)];
            case 2:
                // 期限切れのトークンを削除
                _a.sent();
                utils_1.logger.debug('リフレッシュトークンの有効期限が切れています');
                throw new middlewares_1.AppError('リフレッシュトークンの有効期限が切れています', 401, 'EXPIRED_TOKEN');
            case 3: return [4 /*yield*/, models_1.UserModel.findById(tokenObj.userId)];
            case 4:
                user = _a.sent();
                if (!!user) return [3 /*break*/, 6];
                return [4 /*yield*/, models_1.RefreshTokenModel.delete(refreshToken)];
            case 5:
                _a.sent();
                utils_1.logger.debug('リフレッシュトークンに関連するユーザーが見つかりません');
                throw new middlewares_1.AppError('無効なトークンです', 401, 'INVALID_TOKEN');
            case 6:
                authUser = (0, auth_utils_1.extractAuthUser)(user);
                accessToken = (0, auth_utils_1.generateAccessToken)(authUser);
                return [2 /*return*/, { accessToken: accessToken }];
        }
    });
}); };
exports.refreshAccessToken = refreshAccessToken;
/**
 * ユーザーをログアウトする（リフレッシュトークンを無効化）
 * @param userId ユーザーID
 * @param refreshToken リフレッシュトークン
 */
var logoutUser = function (userId, refreshToken) { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                if (!refreshToken) return [3 /*break*/, 2];
                // 特定のリフレッシュトークンのみを無効化
                return [4 /*yield*/, models_1.RefreshTokenModel.delete(refreshToken)];
            case 1:
                // 特定のリフレッシュトークンのみを無効化
                _a.sent();
                return [3 /*break*/, 4];
            case 2: 
            // ユーザーの全てのリフレッシュトークンを無効化
            return [4 /*yield*/, models_1.RefreshTokenModel.deleteAllForUser(userId)];
            case 3:
                // ユーザーの全てのリフレッシュトークンを無効化
                _a.sent();
                _a.label = 4;
            case 4: return [2 /*return*/, { success: true }];
            case 5:
                error_1 = _a.sent();
                utils_1.logger.error('ログアウト処理エラー', { error: error_1, userId: userId });
                throw new middlewares_1.AppError('ログアウト処理中にエラーが発生しました', 500);
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.logoutUser = logoutUser;
/**
 * ユーザーIDからユーザー情報を取得
 * @param userId ユーザーID
 * @returns 認証ユーザー情報
 */
var getUserById = function (userId) { return __awaiter(void 0, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.UserModel.findById(userId)];
            case 1:
                user = _a.sent();
                if (!user) {
                    throw new middlewares_1.AppError('ユーザーが見つかりません', 404, 'USER_NOT_FOUND');
                }
                return [2 /*return*/, (0, auth_utils_1.extractAuthUser)(user)];
        }
    });
}); };
exports.getUserById = getUserById;
