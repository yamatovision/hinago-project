"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenModel = void 0;
/**
 * リフレッシュトークンスキーマ定義
 */
var mongoose_1 = require("mongoose");
// リフレッシュトークンスキーマ定義
var RefreshTokenSchema = new mongoose_1.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            ret.id = ret._id.toString(); // _idをidとして変換
            delete ret._id; // _idを削除
            delete ret.__v; // __vを削除
            return ret;
        }
    }
});
// 有効期限に基づくインデックス (TTL)
// MongoDBが自動的に期限切れのドキュメントを削除
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// userId + tokenの複合インデックス
RefreshTokenSchema.index({ userId: 1, token: 1 });
// モデル定義
exports.RefreshTokenModel = mongoose_1.default.model('RefreshToken', RefreshTokenSchema);
exports.default = exports.RefreshTokenModel;
