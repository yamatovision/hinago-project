/**
 * 文書スキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import { Document as PropertyDocument, DocumentType } from '../../../types';

// 文書ドキュメントインターフェース
export interface DocumentDocument extends Omit<PropertyDocument, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// 文書スキーマ定義
const DocumentSchema = new Schema<DocumentDocument>(
  {
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
      enum: Object.values(DocumentType),
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

// インデックス設定
DocumentSchema.index({ propertyId: 1, documentType: 1 });

// モデル定義
export const DocumentModel = mongoose.model<DocumentDocument>('Document', DocumentSchema);

export default DocumentModel;