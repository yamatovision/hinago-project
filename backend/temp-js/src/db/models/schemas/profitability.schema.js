"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProfitabilityModel = void 0;
/**
 * 収益性試算スキーマ定義
 */
var mongoose_1 = require("mongoose");
var types_1 = require("../../../types");
// 収益性試算パラメータのサブスキーマ
var FinancialParamsSchema = new mongoose_1.Schema({
    rentPerSqm: { type: Number, required: true, min: 0 },
    occupancyRate: { type: Number, required: true, min: 0, max: 100 },
    managementCostRate: { type: Number, required: true, min: 0, max: 100 },
    constructionCostPerSqm: { type: Number, required: true, min: 0 },
    rentalPeriod: { type: Number, required: true, min: 1, max: 100 },
    capRate: { type: Number, required: true, min: 0, max: 20 }
}, { _id: false });
// 年間財務データのサブスキーマ
var AnnualFinancialDataSchema = new mongoose_1.Schema({
    year: { type: Number, required: true },
    rentalIncome: { type: Number, required: true },
    operatingExpenses: { type: Number, required: true },
    netOperatingIncome: { type: Number, required: true },
    accumulatedIncome: { type: Number, required: true }
}, { _id: false });
// 収益性試算スキーマ定義
var ProfitabilitySchema = new mongoose_1.Schema({
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
    assetType: {
        type: String,
        enum: Object.values(types_1.AssetType),
        required: true
    },
    parameters: {
        type: FinancialParamsSchema,
        required: true
    },
    // 投資概要
    landPrice: {
        type: Number,
        required: true,
        min: 0
    },
    constructionCost: {
        type: Number,
        required: true,
        min: 0
    },
    miscExpenses: {
        type: Number,
        required: true,
        min: 0
    },
    totalInvestment: {
        type: Number,
        required: true,
        min: 0
    },
    // 年間収支
    annualRentalIncome: {
        type: Number,
        required: true,
        min: 0
    },
    annualOperatingExpenses: {
        type: Number,
        required: true,
        min: 0
    },
    annualMaintenance: {
        type: Number,
        required: true,
        min: 0
    },
    annualPropertyTax: {
        type: Number,
        required: true,
        min: 0
    },
    annualNOI: {
        type: Number,
        required: true
    },
    // 収益指標
    noiYield: {
        type: Number,
        required: true
    },
    irr: {
        type: Number,
        required: true
    },
    paybackPeriod: {
        type: Number,
        required: true
    },
    npv: {
        type: Number,
        required: true
    },
    // 詳細データ
    annualFinancials: {
        type: [AnnualFinancialDataSchema],
        required: true
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
ProfitabilitySchema.index({ propertyId: 1 });
ProfitabilitySchema.index({ volumeCheckId: 1 });
ProfitabilitySchema.index({ assetType: 1 });
ProfitabilitySchema.index({ createdAt: -1 });
// モデル定義
exports.ProfitabilityModel = mongoose_1.default.model('Profitability', ProfitabilitySchema);
exports.default = exports.ProfitabilityModel;
