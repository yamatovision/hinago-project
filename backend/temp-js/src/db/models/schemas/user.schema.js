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
exports.UserModel = void 0;
/**
 * ユーザースキーマ定義
 */
var mongoose_1 = require("mongoose");
var bcrypt_1 = require("bcrypt");
var types_1 = require("../../../types");
var config_1 = require("../../../config");
var utils_1 = require("../../../common/utils");
// ユーザースキーマ定義
var UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: Object.values(types_1.UserRole),
        default: types_1.UserRole.USER,
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id.toString(); // _idをidとして変換
            delete ret._id; // _idを削除
            delete ret.__v; // __vを削除
            delete ret.password; // パスワードを削除
            return ret;
        }
    }
});
// パスワードハッシュ化のミドルウェア
UserSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    // パスワードが変更されていない場合はスキップ
                    if (!this.isModified('password')) {
                        return [2 /*return*/, next()];
                    }
                    // パスワードをハッシュ化
                    _a = this;
                    return [4 /*yield*/, bcrypt_1.default.hash(this.password, config_1.authConfig.auth.saltRounds)];
                case 1:
                    // パスワードをハッシュ化
                    _a.password = _b.sent();
                    next();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _b.sent();
                    utils_1.logger.error('パスワードハッシュ化エラー', { error: error_1 });
                    next(error_1);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
});
// パスワード検証のスタティックメソッド
UserSchema.statics.verifyPassword = function (plainPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bcrypt_1.default.compare(plainPassword, hashedPassword)];
        });
    });
};
// パスワードハッシュ化のスタティックメソッド
UserSchema.statics.hashPassword = function (password) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, bcrypt_1.default.hash(password, config_1.authConfig.auth.saltRounds)];
        });
    });
};
// モデル定義
exports.UserModel = mongoose_1.default.model('User', UserSchema);
exports.default = exports.UserModel;
