/**
 * リフレッシュトークンスキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import { RefreshToken } from '../../../types';

// リフレッシュトークンドキュメントインターフェース
export interface RefreshTokenDocument extends Omit<RefreshToken, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// リフレッシュトークンスキーマ定義
const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
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

// 有効期限に基づくインデックス (TTL)
// MongoDBが自動的に期限切れのドキュメントを削除
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// userId + tokenの複合インデックス
RefreshTokenSchema.index({ userId: 1, token: 1 });

// モデル定義
export const RefreshTokenModel = mongoose.model<RefreshTokenDocument>(
  'RefreshToken', 
  RefreshTokenSchema
);

export default RefreshTokenModel;