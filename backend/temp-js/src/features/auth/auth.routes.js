"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 認証ルーター
 * 認証関連のエンドポイントを定義
 */
var express_1 = require("express");
var middlewares_1 = require("../../common/middlewares");
var authController = require("./auth.controller");
var auth_validator_1 = require("./auth.validator");
var auth_middleware_1 = require("../../common/middlewares/auth.middleware");
var router = express_1.default.Router();
/**
 * @route   POST /api/v1/auth/login
 * @desc    ユーザー認証とトークン取得
 * @access  Public
 */
router.post('/login', (0, auth_middleware_1.rateLimiter)(10, 60000), // 1分間に10回までの制限
(0, middlewares_1.validate)(auth_validator_1.validateLogin), authController.login);
/**
 * @route   GET /api/v1/auth/me
 * @desc    認証ユーザー情報取得
 * @access  Private
 */
router.get('/me', authController.getAuthUser);
/**
 * @route   POST /api/v1/auth/refresh
 * @desc    リフレッシュトークンによるアクセストークン更新
 * @access  Public
 */
router.post('/refresh', (0, middlewares_1.validate)(auth_validator_1.validateRefreshToken), authController.refreshToken);
/**
 * @route   POST /api/v1/auth/logout
 * @desc    ユーザーログアウト
 * @access  Private
 */
router.post('/logout', authController.logout);
exports.default = router;
