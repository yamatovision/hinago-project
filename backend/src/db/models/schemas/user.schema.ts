/**
 * ユーザースキーマ定義
 */
import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../../../types';
import { authConfig } from '../../../config';
import { logger } from '../../../common/utils';

// ユーザードキュメントインターフェース
export interface UserDocument extends Omit<User, 'id'>, Document {
  // ここではMongooseのDocumentが提供する_idをidとして使用
}

// スタティックメソッド用のインターフェース
interface UserModelInterface extends mongoose.Model<UserDocument> {
  verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
}

// ユーザースキーマ定義
const UserSchema = new Schema<UserDocument>(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: { 
      type: String, 
      required: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: Object.values(UserRole),
      default: UserRole.USER,
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
        delete ret.password;         // パスワードを削除
        return ret;
      }
    }
  }
);

// パスワードハッシュ化のミドルウェア
UserSchema.pre('save', async function(next) {
  try {
    // パスワードが変更されていない場合はスキップ
    if (!this.isModified('password')) {
      return next();
    }
    
    // パスワードをハッシュ化
    this.password = await bcrypt.hash(
      this.password, 
      authConfig.auth.saltRounds
    );
    
    next();
  } catch (error: any) {
    logger.error('パスワードハッシュ化エラー', { error });
    next(error);
  }
});

// パスワード検証のスタティックメソッド
UserSchema.statics.verifyPassword = async function(
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
};

// パスワードハッシュ化のスタティックメソッド
UserSchema.statics.hashPassword = async function(
  password: string
): Promise<string> {
  return bcrypt.hash(password, authConfig.auth.saltRounds);
};

// モデル定義
export const UserModel = mongoose.model<UserDocument, UserModelInterface>('User', UserSchema);

export default UserModel;