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
exports.verifyTestAdminUser = exports.authenticatedRequest = exports.getTestAuth = void 0;
/**
 * 認証関連のテストヘルパー
 */
var supertest_1 = require("supertest");
var app_1 = require("../../src/app");
var config_1 = require("../../src/config");
var utils_1 = require("../../src/common/utils");
var models_1 = require("../../src/db/models");
// APIのベースURL
var baseUrl = config_1.appConfig.app.apiPrefix;
/**
 * テスト用の認証情報を取得
 * @returns ログイン情報とトークン
 */
var getTestAuth = function () { return __awaiter(void 0, void 0, void 0, function () {
    var credentials, existingUser, response, _a, accessToken, refreshToken, user, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                credentials = {
                    email: config_1.authConfig.auth.adminUser.email,
                    password: config_1.authConfig.auth.adminUser.password,
                };
                return [4 /*yield*/, models_1.UserModel.findByEmail(credentials.email)];
            case 1:
                existingUser = _b.sent();
                if (!!existingUser) return [3 /*break*/, 3];
                utils_1.logger.debug('テスト認証用のユーザーが存在しないため作成します', { email: credentials.email });
                return [4 /*yield*/, models_1.UserModel.initializeDefaultUsers()];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                _b.trys.push([3, 5, , 6]);
                return [4 /*yield*/, (0, supertest_1.default)(app_1.default)
                        .post("".concat(baseUrl, "/auth/login"))
                        .send(credentials)];
            case 4:
                response = _b.sent();
                if (response.status !== 200) {
                    utils_1.logger.error('テスト認証でログインに失敗しました', {
                        status: response.status,
                        body: response.body,
                        credentials: { email: credentials.email, passwordLength: credentials.password.length }
                    });
                    throw new Error("\u30C6\u30B9\u30C8\u8A8D\u8A3C\u3067\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F: ".concat(response.status));
                }
                _a = response.body.data, accessToken = _a.accessToken, refreshToken = _a.refreshToken, user = _a.user;
                // 認証情報を返す
                return [2 /*return*/, {
                        user: user,
                        accessToken: accessToken,
                        refreshToken: refreshToken,
                        authHeader: "Bearer ".concat(accessToken),
                    }];
            case 5:
                error_1 = _b.sent();
                utils_1.logger.error('テスト認証情報取得エラー', { error: error_1 });
                throw error_1;
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getTestAuth = getTestAuth;
/**
 * 認証済みのリクエストを作成
 * @param method HTTPメソッド
 * @param url エンドポイントURL
 * @returns Supertestリクエスト（認証済み）
 */
var authenticatedRequest = function (method, url) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, req, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, exports.getTestAuth)()];
            case 1:
                authHeader = (_a.sent()).authHeader;
                req = (0, supertest_1.default)(app_1.default)[method](url).set('Authorization', authHeader);
                return [2 /*return*/, req];
            case 2:
                error_2 = _a.sent();
                utils_1.logger.error('認証済みリクエスト作成エラー', { error: error_2, method: method, url: url });
                throw error_2;
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.authenticatedRequest = authenticatedRequest;
/**
 * テスト用に管理者ユーザーを事前検証
 * テスト前にこの関数を使用して管理者ユーザーを確実にセットアップ
 */
var verifyTestAdminUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var adminUser, isValidPassword;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, models_1.UserModel.findByEmail(config_1.authConfig.auth.adminUser.email)];
            case 1:
                adminUser = _a.sent();
                if (!!adminUser) return [3 /*break*/, 3];
                utils_1.logger.info('テスト用管理者ユーザーを作成します');
                return [4 /*yield*/, models_1.UserModel.initializeDefaultUsers()];
            case 2:
                _a.sent();
                return [2 /*return*/, { created: true }];
            case 3: return [4 /*yield*/, models_1.UserModel.verifyPassword(config_1.authConfig.auth.adminUser.password, adminUser.password)];
            case 4:
                isValidPassword = _a.sent();
                if (!!isValidPassword) return [3 /*break*/, 6];
                utils_1.logger.warn('テスト用管理者ユーザーのパスワードが正しくありません。更新します。');
                return [4 /*yield*/, models_1.UserModel.update(adminUser.id, {
                        password: config_1.authConfig.auth.adminUser.password,
                    })];
            case 5:
                _a.sent();
                return [2 /*return*/, { updated: true }];
            case 6: return [2 /*return*/, { exists: true }];
        }
    });
}); };
exports.verifyTestAdminUser = verifyTestAdminUser;
