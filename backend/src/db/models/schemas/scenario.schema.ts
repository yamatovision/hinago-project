/**
 * シナリオスキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import { 
  Scenario, 
  AssetType, 
  ScenarioParams
} from '../../../types';

// シナリオドキュメントインターフェース
export interface ScenarioDocument extends Omit<Scenario, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// シナリオパラメータのサブスキーマ
const ScenarioParamsSchema = new Schema({
  assetType: { 
    type: String, 
    enum: Object.values(AssetType),
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
const ScenarioSchema = new Schema<ScenarioDocument>(
  {
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
    profitabilityResultId: {
      type: String,
      ref: 'Profitability'
    },
    userId: {
      type: String,
      ref: 'User'
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
ScenarioSchema.index({ propertyId: 1 });
ScenarioSchema.index({ volumeCheckId: 1 });
ScenarioSchema.index({ createdAt: -1 });
ScenarioSchema.index({ name: 1 });

// モデル定義
export const ScenarioModel = mongoose.model<ScenarioDocument>('Scenario', ScenarioSchema);

export default ScenarioModel;