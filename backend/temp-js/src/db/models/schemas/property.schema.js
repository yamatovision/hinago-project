"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertyModel = void 0;
/**
 * 物件スキーマ定義
 */
var mongoose_1 = require("mongoose");
var types_1 = require("../../../types");
// 境界点座標のサブスキーマ
var BoundaryPointSchema = new mongoose_1.Schema({
    x: { type: Number, required: true },
    y: { type: Number, required: true }
}, { _id: false });
// 敷地形状のサブスキーマ
var PropertyShapeSchema = new mongoose_1.Schema({
    points: { type: [BoundaryPointSchema], required: true },
    width: { type: Number },
    depth: { type: Number },
    sourceFile: { type: String }
}, { _id: false });
// 日影規制詳細情報のサブスキーマ（追加）
var ShadowRegulationDetailSchema = new mongoose_1.Schema({
    measurementHeight: { type: Number, required: true },
    hourRanges: {
        primary: { type: Number, required: true },
        secondary: { type: Number, required: true }
    }
}, { _id: false });
// 地区計画情報のサブスキーマ（追加）
var DistrictPlanInfoSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    wallSetbackDistance: { type: Number, min: 0 },
    maxHeight: { type: Number, min: 0 },
    specialRegulations: { type: [String] }
}, { _id: false });
// 物件スキーマ定義
var PropertySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    address: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    area: {
        type: Number,
        required: true,
        min: 0.1,
        max: 100000
    },
    zoneType: {
        type: String,
        enum: Object.values(types_1.ZoneType),
        required: true
    },
    fireZone: {
        type: String,
        enum: Object.values(types_1.FireZoneType),
        required: true
    },
    shadowRegulation: {
        type: String,
        enum: Object.values(types_1.ShadowRegulationType),
        default: types_1.ShadowRegulationType.NONE
    },
    buildingCoverage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    floorAreaRatio: {
        type: Number,
        required: true,
        min: 0,
        max: 1000
    },
    allowedBuildingArea: {
        type: Number
    },
    heightLimit: {
        type: Number,
        min: 0
    },
    roadWidth: {
        type: Number,
        min: 0
    },
    price: {
        type: Number,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(types_1.PropertyStatus),
        default: types_1.PropertyStatus.NEW
    },
    notes: {
        type: String,
        maxlength: 1000
    },
    shapeData: {
        type: PropertyShapeSchema
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User'
    },
    // 新規追加フィールド（すべて任意）
    heightDistrict: {
        type: String,
        enum: Object.values(types_1.HeightDistrictType),
        default: types_1.HeightDistrictType.NONE
    },
    northBoundaryDistance: {
        type: Number,
        min: 0
    },
    districtPlanInfo: {
        type: DistrictPlanInfoSchema
    },
    shadowRegulationDetail: {
        type: ShadowRegulationDetailSchema
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
// allowedBuildingArea を自動計算するミドルウェア
PropertySchema.pre('save', function (next) {
    // 敷地面積と建蔽率から許容建築面積を計算
    if (this.area && this.buildingCoverage) {
        this.allowedBuildingArea = this.area * (this.buildingCoverage / 100);
    }
    next();
});
// モデル定義
exports.PropertyModel = mongoose_1.default.model('Property', PropertySchema);
exports.default = exports.PropertyModel;
