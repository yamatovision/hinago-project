"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRefreshToken = exports.validateLogin = void 0;
/**
 * 認証関連のバリデーションルール
 */
var express_validator_1 = require("express-validator");
var validators_1 = require("../../common/validators");
/**
 * ログインリクエストのバリデーション
 */
exports.validateLogin = [
    // メールアドレスのバリデーション
    validators_1.commonValidator.validateEmail(),
    // パスワードのバリデーション
    validators_1.commonValidator.validatePassword(),
    // リメンバーミーのバリデーション（オプショナル）
    (0, express_validator_1.body)('rememberMe')
        .optional()
        .isBoolean()
        .withMessage('rememberMeはブール値である必要があります')
        .toBoolean(),
];
/**
 * リフレッシュトークンリクエストのバリデーション
 */
exports.validateRefreshToken = [
    (0, express_validator_1.body)('refreshToken')
        .isString()
        .withMessage('リフレッシュトークンは必須です')
        .notEmpty()
        .withMessage('リフレッシュトークンは空であってはなりません'),
];
