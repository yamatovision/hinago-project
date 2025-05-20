"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ログユーティリティ
 */
var winston_1 = require("winston");
var config_1 = require("../../config");
// ログフォーマットの定義
var logFormat = winston_1.default.format.printf(function (_a) {
    var level = _a.level, message = _a.message, timestamp = _a.timestamp, meta = __rest(_a, ["level", "message", "timestamp"]);
    return "".concat(timestamp, " ").concat(level, ": ").concat(message, " ").concat(Object.keys(meta).length ? JSON.stringify(meta) : '');
});
// Winstonロガーの設定
var logger = winston_1.default.createLogger({
    level: config_1.appConfig.logging.level,
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), logFormat),
    transports: [
        // コンソールへの出力
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), logFormat)
        }),
    ],
});
// 開発環境以外の場合はファイルへの出力も追加
if (config_1.appConfig.app.env !== 'development' && config_1.appConfig.logging.file) {
    logger.add(new winston_1.default.transports.File({
        filename: config_1.appConfig.logging.file,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
exports.default = logger;
