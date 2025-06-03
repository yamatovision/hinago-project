/**
 * 物件スキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import { 
  Property, 
  PropertyShape, 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus,
  HeightDistrictType,
  DistrictPlanInfo,
  ShadowRegulationDetail
} from '../../../types';

// 物件ドキュメントインターフェース
export interface PropertyDocument extends Omit<Property, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// 境界点座標のサブスキーマ
const BoundaryPointSchema = new Schema({
  x: { type: Number, required: true },
  y: { type: Number, required: true }
}, { _id: false });

// 座標点データのサブスキーマ（測量座標）
const CoordinatePointSchema = new Schema({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  length: { type: Number }
}, { _id: false });

// 座標抽出結果のサブスキーマ
const CoordinateExtractionResultSchema = new Schema({
  coordinatePoints: { type: [CoordinatePointSchema], required: true },
  totalArea: { type: Number, required: true },
  area: { type: Number, required: true },
  registeredArea: { type: Number, required: true },
  plotNumber: { type: String },
  confidence: { type: Number },
  extractedImageUrl: { type: String }
}, { _id: false });

// 敷地形状のサブスキーマ
const PropertyShapeSchema = new Schema({
  points: { 
    type: [BoundaryPointSchema], 
    required: true,
    validate: {
      validator: function(v: any[]) {
        return v && v.length >= 3;
      },
      message: 'pointsは少なくとも3つの点を含む配列である必要があります'
    }
  },
  width: { type: Number },
  depth: { type: Number },
  sourceFile: { type: String },
  // 新規追加フィールド
  coordinatePoints: { type: [CoordinatePointSchema] },
  area: { type: Number },
  perimeter: { type: Number },
  coordinateSystem: { type: String },
  extractionResult: { type: CoordinateExtractionResultSchema }
}, { _id: false });

// 日影規制詳細情報のサブスキーマ（追加）
const ShadowRegulationDetailSchema = new Schema({
  measurementHeight: { type: Number, required: true },
  hourRanges: {
    primary: { type: Number, required: true },
    secondary: { type: Number, required: true }
  }
}, { _id: false });

// 地区計画情報のサブスキーマ（追加）
const DistrictPlanInfoSchema = new Schema({
  name: { type: String, required: true },
  wallSetbackDistance: { type: Number, min: 0 },
  maxHeight: { type: Number, min: 0 },
  specialRegulations: { type: [String] }
}, { _id: false });

// 物件スキーマ定義
const PropertySchema = new Schema<PropertyDocument>(
  {
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
      enum: Object.values(ZoneType),
      required: true 
    },
    fireZone: { 
      type: String, 
      enum: Object.values(FireZoneType),
      required: true 
    },
    shadowRegulation: { 
      type: String, 
      enum: Object.values(ShadowRegulationType),
      default: ShadowRegulationType.NONE 
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
      enum: Object.values(PropertyStatus),
      default: PropertyStatus.NEW
    },
    notes: { 
      type: String,
      maxlength: 1000
    },
    shapeData: { 
      type: PropertyShapeSchema
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // 新規追加フィールド（すべて任意）
    heightDistrict: {
      type: String,
      enum: Object.values(HeightDistrictType),
      default: HeightDistrictType.NONE
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
  },
  { 
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // _idをidとして変換
        delete ret._id;              // _idを削除
        delete ret.__v;              // __vを削除
        return ret;
      }
    }
  }
);

// allowedBuildingArea を自動計算するミドルウェア
PropertySchema.pre('save', function(next) {
  // 敷地面積と建蔽率から許容建築面積を計算
  if (this.area && this.buildingCoverage) {
    this.allowedBuildingArea = this.area * (this.buildingCoverage / 100);
  }
  next();
});

// モデル定義
export const PropertyModel = mongoose.model<PropertyDocument>('Property', PropertySchema);

export default PropertyModel;