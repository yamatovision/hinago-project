"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScenarioModel = void 0;
/**
 * シナリオスキーマ定義
 */
var mongoose_1 = require("mongoose");
var types_1 = require("../../../types");
// シナリオパラメータのサブスキーマ
var ScenarioParamsSchema = new mongoose_1.Schema({
    assetType: {
        type: String,
        enum: Object.values(types_1.AssetType),
        required: true
    },
    rentPerSqm: { type: Number, required: true, min: 0 },
    occupancyRate: { type: Number, required: true, min: 0, max: 100 },
    managementCostRate: { type: Number, required: true, min: 0, max: 100 },
    constructionCostPerSqm: { type: Number, required: true, min: 0 },
    rentalPeriod: { type: Number, required: true, min: 1, max: 100 },
    capRate: { type: Number, required: true, min: 0, max: 20 }
}, { _id: false });
// シナリオスキーマ定義
var ScenarioSchema = new mongoose_1.Schema({
    propertyId: {
        type: String,
        ref: 'Property',
        required: true
    },
    volumeCheckId: {
        type: String,
        ref: 'VolumeCheck',
        required: true
    },
    name: {
        type: String,
        required: true,
        minlength: 1,
        maxlength: 100
    },
    params: {
        type: ScenarioParamsSchema,
        required: true
    },
    profitabilityResult: {
        type: String,
        ref: 'Profitability'
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
// インデックスの設定
ScenarioSchema.index({ propertyId: 1 });
ScenarioSchema.index({ volumeCheckId: 1 });
ScenarioSchema.index({ createdAt: -1 });
ScenarioSchema.index({ name: 1 });
// モデル定義
exports.ScenarioModel = mongoose_1.default.model('Scenario', ScenarioSchema);
exports.default = exports.ScenarioModel;
