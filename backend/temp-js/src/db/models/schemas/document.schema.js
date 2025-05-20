"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentModel = void 0;
/**
 * 文書スキーマ定義
 */
var mongoose_1 = require("mongoose");
var types_1 = require("../../../types");
// 文書スキーマ定義
var DocumentSchema = new mongoose_1.Schema({
    propertyId: {
        type: String,
        ref: 'Property',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true,
        min: 0
    },
    fileUrl: {
        type: String,
        required: true
    },
    documentType: {
        type: String,
        enum: Object.values(types_1.DocumentType),
        required: true
    },
    description: {
        type: String,
        trim: true,
        maxlength: 500
    },
    userId: {
        type: String,
        ref: 'User'
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
// インデックス設定
DocumentSchema.index({ propertyId: 1, documentType: 1 });
// モデル定義
exports.DocumentModel = mongoose_1.default.model('Document', DocumentSchema);
exports.default = exports.DocumentModel;
