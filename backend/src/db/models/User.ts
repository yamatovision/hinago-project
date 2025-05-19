/**
 * ユーザーモデル
 * 
 * MongoDBとMongooseを使用して実装しています。
 */
import { User, UserRole } from '../../types';
import { UserModel as MongoUserModel } from './schemas/user.schema';
import { authConfig } from '../../config';
import { logger } from '../../common/utils';

/**
 * ユーザーモデルのクラス
 */
export class UserModel {
  /**
   * メールアドレスでユーザーを検索
   * @param email メールアドレス
   * @returns ユーザーオブジェクトまたはnull
   */
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await MongoUserModel.findOne({ email }).lean();
      if (!user) return null;
      
      // _id を id に変換
      return {
        ...user,
        id: String(user._id),
      } as User;
    } catch (error) {
      logger.error('ユーザー検索エラー', { error, email });
      throw error;
    }
  }

  /**
   * IDでユーザーを検索
   * @param id ユーザーID
   * @returns ユーザーオブジェクトまたはnull
   */
  static async findById(id: string): Promise<User | null> {
    try {
      const user = await MongoUserModel.findById(id).lean();
      if (!user) return null;
      
      // _id を id に変換
      return {
        ...user,
        id: String(user._id),
      } as User;
    } catch (error) {
      logger.error('ユーザー検索エラー', { error, id });
      throw error;
    }
  }

  /**
   * 新しいユーザーを作成
   * @param userData ユーザーデータ
   * @returns 作成されたユーザーオブジェクト
   */
  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    try {
      const newUser = await MongoUserModel.create(userData);
      const userObject = newUser.toObject();
      
      // _id を id に変換
      return {
        ...userObject,
        id: String(userObject._id),
      } as User;
    } catch (error) {
      logger.error('ユーザー作成エラー', { error });
      throw error;
    }
  }

  /**
   * ユーザー情報を更新
   * @param id ユーザーID
   * @param userData 更新するユーザーデータ
   * @returns 更新されたユーザーオブジェクトまたはnull
   */
  static async update(
    id: string,
    userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User | null> {
    try {
      const updatedUser = await MongoUserModel.findByIdAndUpdate(
        id,
        { ...userData },
        { new: true }
      );
      
      if (!updatedUser) return null;
      
      const userObject = updatedUser.toObject();
      
      // _id を id に変換
      return {
        ...userObject,
        id: String(userObject._id),
      } as User;
    } catch (error) {
      logger.error('ユーザー更新エラー', { error, id });
      throw error;
    }
  }

  /**
   * ユーザーを削除
   * @param id ユーザーID
   * @returns 削除が成功したかどうか
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const result = await MongoUserModel.findByIdAndDelete(id);
      return !!result;
    } catch (error) {
      logger.error('ユーザー削除エラー', { error, id });
      throw error;
    }
  }

  /**
   * パスワードを検証
   * @param plainPassword 平文パスワード
   * @param hashedPassword ハッシュ化されたパスワード
   * @returns パスワードが一致するかどうか
   */
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return MongoUserModel.verifyPassword(plainPassword, hashedPassword);
    } catch (error) {
      logger.error('パスワード検証エラー', { error });
      throw error;
    }
  }

  /**
   * パスワードをハッシュ化
   * @param password 平文パスワード
   * @returns ハッシュ化されたパスワード
   */
  static async hashPassword(password: string): Promise<string> {
    try {
      return MongoUserModel.hashPassword(password);
    } catch (error) {
      logger.error('パスワードハッシュ化エラー', { error });
      throw error;
    }
  }

  /**
   * デフォルトの管理者ユーザーを初期化
   * 既存のユーザーがいない場合にのみ作成
   */
  static async initializeDefaultUsers(): Promise<void> {
    try {
      // 管理者ユーザーが存在するか確認
      const adminExists = await this.findByEmail(authConfig.auth.adminUser.email);
      
      // 存在しない場合は作成
      if (!adminExists) {
        logger.info('デフォルト管理者ユーザーを作成します');
        await this.create({
          email: authConfig.auth.adminUser.email,
          name: authConfig.auth.adminUser.name,
          password: authConfig.auth.adminUser.password, // 保存時に自動的にハッシュ化される
          role: UserRole.ADMIN,
        });
        logger.info('デフォルト管理者ユーザーの作成が完了しました');
      } else {
        logger.debug('デフォルト管理者ユーザーは既に存在します');
      }
    } catch (error) {
      logger.error('デフォルトユーザー初期化エラー', { error });
      throw error;
    }
  }
}

export default UserModel;