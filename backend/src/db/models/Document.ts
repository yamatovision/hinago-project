/**
 * 文書モデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { Document, DocumentType } from '../../types';
import { DocumentModel as MongoDocumentModel } from './schemas/document.schema';
import { logger } from '../../common/utils';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * 文書モデルのクラス
 */
export class DocumentModel {
  /**
   * 物件に関連する文書一覧を取得
   * @param propertyId 物件ID
   * @param documentType 文書タイプ（オプション）
   * @returns 文書リスト
   */
  static async findByPropertyId(
    propertyId: string,
    documentType?: DocumentType
  ): Promise<Document[]> {
    try {
      // クエリ条件を構築
      const query: any = { propertyId };
      if (documentType) {
        query.documentType = documentType;
      }
      
      // 文書を取得
      const documents = await MongoDocumentModel.find(query)
        .sort({ updatedAt: -1 })
        .lean();
      
      // _id を id に変換
      return documents.map(doc => ({
        ...doc,
        id: String(doc._id),
      })) as Document[];
    } catch (error) {
      logger.error('文書一覧取得エラー', { error, propertyId });
      throw error;
    }
  }

  /**
   * 文書をIDで検索
   * @param id 文書ID
   * @returns 文書オブジェクトまたはnull
   */
  static async findById(id: string): Promise<Document | null> {
    try {
      // IDが有効なMongoDBのObjectIDかチェック
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return null;
      }
      
      const document = await MongoDocumentModel.findById(id).lean();
      if (!document) return null;
      
      // _id を id に変換
      return {
        ...document,
        id: String(document._id),
      } as Document;
    } catch (error) {
      logger.error('文書検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しい文書を作成
   * @param documentData 文書データ
   * @returns 作成された文書オブジェクト
   */
  static async create(documentData: Omit<Document, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    try {
      const newDocument = await MongoDocumentModel.create(documentData);
      const documentObject = newDocument.toObject();
      
      // _id を id に変換
      return {
        ...documentObject,
        id: String(documentObject._id),
      } as Document;
    } catch (error) {
      logger.error('文書作成エラー', { error });
      throw error;
    }
  }

  /**
   * 文書を削除
   * @param id 文書ID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      // 文書を取得
      const document = await MongoDocumentModel.findById(id);
      if (!document) {
        return false;
      }
      
      // ファイルパスを取得
      const fileUrl = document.fileUrl;
      const filePath = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
      
      // ドキュメントを削除
      const result = await MongoDocumentModel.findByIdAndDelete(id);
      
      // ファイルが存在すれば削除
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          logger.info(`ファイルを削除しました: ${filePath}`);
        } catch (unlinkError) {
          logger.error('ファイル削除エラー', { error: unlinkError, filePath });
          // ドキュメント自体は削除できているので、エラーはスローしない
        }
      }
      
      return !!result;
    } catch (error) {
      logger.error('文書削除エラー', { error, id });
      throw error;
    }
  }

  /**
   * 物件に関連する全ての文書を削除
   * @param propertyId 物件ID
   * @returns 削除した文書の数
   */
  static async deleteByPropertyId(propertyId: string): Promise<number> {
    try {
      // 物件に関連する全ての文書を取得
      const documents = await MongoDocumentModel.find({ propertyId }).lean();
      
      // 各文書を削除
      for (const doc of documents) {
        await this.delete(String(doc._id));
      }
      
      return documents.length;
    } catch (error) {
      logger.error('物件関連文書削除エラー', { error, propertyId });
      throw error;
    }
  }
}