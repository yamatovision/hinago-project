"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VolumeCheckModel = void 0;
/**
 * ボリュームチェックスキーマ定義
 */
var mongoose_1 = require("mongoose");
var types_1 = require("../../../types");
// 階別データのサブスキーマ
var FloorDataSchema = new mongoose_1.Schema({
    floor: { type: Number, required: true },
    floorArea: { type: Number, required: true },
    privateArea: { type: Number, required: true },
    commonArea: { type: Number, required: true }
}, { _id: false });
// 法規制チェック結果のサブスキーマ
var RegulationCheckSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    regulationValue: { type: String, required: true },
    plannedValue: { type: String, required: true },
    compliant: { type: Boolean, required: true }
}, { _id: false });
// 3Dモデルデータのサブスキーマ
var Model3DDataSchema = new mongoose_1.Schema({
    modelType: { type: String, required: true },
    data: { type: mongoose_1.Schema.Types.Mixed, required: true }
}, { _id: false });
// 日影シミュレーション結果のサブスキーマ（追加）
var ShadowSimulationResultSchema = new mongoose_1.Schema({
    isochroneMap: { type: mongoose_1.Schema.Types.Mixed },
    maxHours: { type: Number, required: true },
    mediumHours: { type: Number, required: true },
    compliant: { type: Boolean, required: true }
}, { _id: false });
// 高さ制限の詳細情報のサブスキーマ（追加）
var RegulationLimitsSchema = new mongoose_1.Schema({
    heightDistrictLimit: { type: Number, required: true },
    slopeLimit: { type: Number, required: true },
    shadowLimit: { type: Number, required: true },
    absoluteLimit: { type: Number, required: true },
    finalLimit: { type: Number, required: true }
}, { _id: false });
// ボリュームチェックスキーマ定義
var VolumeCheckSchema = new mongoose_1.Schema({
    propertyId: {
        type: String,
        ref: 'Property',
        required: true
    },
    assetType: {
        type: String,
        enum: Object.values(types_1.AssetType),
        required: true
    },
    buildingArea: {
        type: Number,
        required: true,
        min: 0
    },
    totalFloorArea: {
        type: Number,
        required: true,
        min: 0
    },
    buildingHeight: {
        type: Number,
        required: true,
        min: 0
    },
    consumptionRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    floors: {
        type: Number,
        required: true,
        min: 1
    },
    floorBreakdown: {
        type: [FloorDataSchema],
        required: true
    },
    model3dData: {
        type: Model3DDataSchema
    },
    regulationChecks: {
        type: [RegulationCheckSchema],
        required: true
    },
    userId: {
        type: String,
        ref: 'User'
    },
    // 新規追加フィールド（すべて任意）
    shadowSimulation: {
        type: ShadowSimulationResultSchema
    },
    regulationLimits: {
        type: RegulationLimitsSchema
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
VolumeCheckSchema.index({ propertyId: 1 });
VolumeCheckSchema.index({ assetType: 1 });
VolumeCheckSchema.index({ createdAt: -1 });
// モデル定義
exports.VolumeCheckModel = mongoose_1.default.model('VolumeCheck', VolumeCheckSchema);
exports.default = exports.VolumeCheckModel;
