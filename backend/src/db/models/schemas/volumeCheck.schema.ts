/**
 * ボリュームチェックスキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import { 
  VolumeCheck, 
  AssetType, 
  FloorData,
  RegulationCheck,
  Model3DData,
  ShadowSimulationResult,
  RegulationLimits
} from '../../../types';

// ボリュームチェックドキュメントインターフェース
export interface VolumeCheckDocument extends Omit<VolumeCheck, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// 階別データのサブスキーマ
const FloorDataSchema = new Schema({
  floor: { type: Number, required: true },
  floorArea: { type: Number, required: true },
  privateArea: { type: Number, required: true },
  commonArea: { type: Number, required: true }
}, { _id: false });

// 法規制チェック結果のサブスキーマ
const RegulationCheckSchema = new Schema({
  name: { type: String, required: true },
  regulationValue: { type: String, required: true },
  plannedValue: { type: String, required: true },
  compliant: { type: Boolean, required: true }
}, { _id: false });

// 3Dモデルデータのサブスキーマ
const Model3DDataSchema = new Schema({
  modelType: { type: String, required: true },
  data: { type: Schema.Types.Mixed, required: true }
}, { _id: false });

// 日影シミュレーション結果のサブスキーマ（追加）
const ShadowSimulationResultSchema = new Schema({
  isochroneMap: { type: Schema.Types.Mixed },
  maxHours: { type: Number, required: true },
  mediumHours: { type: Number, required: true },
  compliant: { type: Boolean, required: true }
}, { _id: false });

// 高さ制限の詳細情報のサブスキーマ（追加）
const RegulationLimitsSchema = new Schema({
  heightDistrictLimit: { type: Number, required: true },
  slopeLimit: { type: Number, required: true },
  shadowLimit: { type: Number, required: true },
  absoluteLimit: { type: Number, required: true },
  finalLimit: { type: Number, required: true }
}, { _id: false });

// ボリュームチェックスキーマ定義
const VolumeCheckSchema = new Schema<VolumeCheckDocument>(
  {
    propertyId: {
      type: String,
      ref: 'Property',
      required: true
    },
    assetType: {
      type: String,
      enum: Object.values(AssetType),
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
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString(); // _idをidとして変換
        delete ret._id;               // _idを削除
        delete ret.__v;               // __vを削除
        return ret;
      }
    }
  }
);

// インデックスの設定
VolumeCheckSchema.index({ propertyId: 1 });
VolumeCheckSchema.index({ assetType: 1 });
VolumeCheckSchema.index({ createdAt: -1 });

// モデル定義
export const VolumeCheckModel = mongoose.model<VolumeCheckDocument>('VolumeCheck', VolumeCheckSchema);

export default VolumeCheckModel;