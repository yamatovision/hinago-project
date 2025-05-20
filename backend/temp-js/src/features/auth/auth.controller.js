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
exports.logout = exports.refreshToken = exports.getAuthUser = exports.login = void 0;
var utils_1 = require("../../common/utils");
var authService = require("./auth.service");
var auth_utils_1 = require("./auth.utils");
/**
 * ログイン処理
 * POST /api/v1/auth/login
 */
var login = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var loginResult, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, authService.authenticateUser(req.body)];
            case 1:
                loginResult = _a.sent();
                return [2 /*return*/, utils_1.responseUtils.sendSuccess(res, loginResult)];
            case 2:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.login = login;
/**
 * 認証状態確認
 * GET /api/v1/auth/me
 */
var getAuthUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // この時点でリクエストには認証ミドルウェアにより追加されたユーザー情報が含まれている
                if (!req.user) {
                    return [2 /*return*/, utils_1.responseUtils.sendAuthError(res)];
                }
                return [4 /*yield*/, authService.getUserById(req.user.id)];
            case 1:
                user = _a.sent();
                return [2 /*return*/, utils_1.responseUtils.sendSuccess(res, { user: user })];
            case 2:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAuthUser = getAuthUser;
/**
 * アクセストークン更新
 * POST /api/v1/auth/refresh
 */
var refreshToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshResult, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, authService.refreshAccessToken(req.body)];
            case 1:
                refreshResult = _a.sent();
                return [2 /*return*/, utils_1.responseUtils.sendSuccess(res, refreshResult)];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.refreshToken = refreshToken;
/**
 * ログアウト処理
 * POST /api/v1/auth/logout
 */
var logout = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var refreshToken_1, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                // この時点でリクエストには認証ミドルウェアにより追加されたユーザー情報が含まれている
                if (!req.user) {
                    return [2 /*return*/, utils_1.responseUtils.sendAuthError(res)];
                }
                refreshToken_1 = req.body.refreshToken || (0, auth_utils_1.extractTokenFromBearer)(req.headers.authorization);
                // ユーザーをログアウト
                return [4 /*yield*/, authService.logoutUser(req.user.id, refreshToken_1)];
            case 1:
                // ユーザーをログアウト
                _a.sent();
                return [2 /*return*/, utils_1.responseUtils.sendSuccess(res, { message: 'ログアウトしました' })];
            case 2:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.logout = logout;
