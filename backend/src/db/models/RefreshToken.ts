/**
 * リフレッシュトークンモデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from '../../types';
import { RefreshTokenModel as MongoRefreshTokenModel } from './schemas/refreshToken.schema';
import { logger } from '../../common/utils';

/**
 * リフレッシュトークンモデルのクラス
 */
export class RefreshTokenModel {
  /**
   * トークン文字列でリフレッシュトークンを検索
   * @param token トークン文字列
   * @returns リフレッシュトークンオブジェクトまたはnull
   */
  static async findByToken(token: string): Promise<RefreshToken | null> {
    try {
      const refreshToken = await MongoRefreshTokenModel.findOne({ token }).lean();
      if (!refreshToken) return null;
      
      // _id を id に変換
      return {
        ...refreshToken,
        id: String(refreshToken._id),
      } as RefreshToken;
    } catch (error) {
      logger.error('リフレッシュトークン検索エラー', { error });
      throw error;
    }
  }

  /**
   * ユーザーIDでリフレッシュトークンを検索
   * @param userId ユーザーID
   * @returns リフレッシュトークンオブジェクトの配列
   */
  static async findByUserId(userId: string): Promise<RefreshToken[]> {
    try {
      const refreshTokens = await MongoRefreshTokenModel.find({ userId }).lean();
      
      // _id を id に変換
      return refreshTokens.map(token => ({
        ...token,
        id: String(token._id),
      } as RefreshToken));
    } catch (error) {
      logger.error('リフレッシュトークン検索エラー', { error });
      throw error;
    }
  }

  /**
   * 新しいリフレッシュトークンを作成
   * @param userId ユーザーID
   * @param expiresIn 有効期限（秒）
   * @returns 作成されたリフレッシュトークンオブジェクト
   */
  static async create(userId: string, expiresIn: number): Promise<RefreshToken> {
    try {
      const now = new Date();
      const expiresAt = new Date(now.getTime() + expiresIn * 1000);
      
      const newRefreshToken = await MongoRefreshTokenModel.create({
        userId,
        token: uuidv4(), // UUIDを使用してユニークなトークンを生成
        expiresAt,
      });
      
      const tokenObject = newRefreshToken.toObject();
      
      // _id を id に変換
      return {
        ...tokenObject,
        id: String(tokenObject._id),
      } as RefreshToken;
    } catch (error) {
      logger.error('リフレッシュトークン作成エラー', { error });
      throw error;
    }
  }

  /**
   * 特定のトークンを削除
   * @param token トークン文字列
   * @returns 削除が成功したかどうか
   */
  static async delete(token: string): Promise<boolean> {
    try {
      const result = await MongoRefreshTokenModel.deleteOne({ token });
      return result.deletedCount > 0;
    } catch (error) {
      logger.error('リフレッシュトークン削除エラー', { error });
      throw error;
    }
  }

  /**
   * ユーザーのリフレッシュトークンをすべて削除
   * @param userId ユーザーID
   * @returns 削除されたトークンの数
   */
  static async deleteAllForUser(userId: string): Promise<number> {
    try {
      const result = await MongoRefreshTokenModel.deleteMany({ userId });
      return result.deletedCount;
    } catch (error) {
      logger.error('リフレッシュトークン一括削除エラー', { error });
      throw error;
    }
  }

  /**
   * 期限切れのトークンをすべて削除
   * @returns 削除されたトークンの数
   */
  static async deleteExpired(): Promise<number> {
    try {
      const now = new Date();
      const result = await MongoRefreshTokenModel.deleteMany({ expiresAt: { $lt: now } });
      return result.deletedCount;
    } catch (error) {
      logger.error('期限切れリフレッシュトークン削除エラー', { error });
      throw error;
    }
  }
}

export default RefreshTokenModel;