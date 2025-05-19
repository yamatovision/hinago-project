# メモリ内DBからMongoDBへの移行計画

## 1. 現状分析

現在のシステムはメモリ内データベースを使用しており、以下の問題があります：

1. **環境一貫性の欠如**：
   - テスト環境と本番環境で異なるデータストレージメカニズムを使用
   - アプリケーション再起動時にデータが失われる
   - 本番環境との挙動の違いがテストでは検出できない

2. **実装上の問題**：
   - `User.ts`と`RefreshToken.ts`でメモリ内配列を使用
   - パスワードハッシュ化の非同期初期化が問題を引き起こしている
   - クエリ最適化やインデックスなどの実データベース機能を活用できない

## 2. 移行計画

### 2.1 必要なパッケージ

```
npm install mongoose 
npm install --save-dev @types/mongoose mongodb-memory-server
```

### 2.2 実装ステップ

#### ステップ1: Mongooseスキーマとモデルの定義

```typescript
// src/db/models/schemas/user.schema.ts
import mongoose, { Schema, Document } from 'mongoose';
import { User, UserRole } from '../../../types';
import bcrypt from 'bcrypt';
import { authConfig } from '../../../config';

export interface UserDocument extends User, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: Object.values(UserRole),
      default: UserRole.USER,
      required: true 
    }
  },
  { timestamps: true }
);

// パスワードハッシュ化のミドルウェア
UserSchema.pre('save', async function(next) {
  // パスワードが変更されていない場合はスキップ
  if (!this.isModified('password')) return next();
  
  try {
    // パスワードをハッシュ化
    this.password = await bcrypt.hash(this.password, authConfig.auth.saltRounds);
    next();
  } catch (error: any) {
    next(error);
  }
});

// パスワード検証のスタティックメソッド
UserSchema.statics.verifyPassword = async function(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const UserModel = mongoose.model<UserDocument>('User', UserSchema);
```

```typescript
// src/db/models/schemas/refreshToken.schema.ts
import mongoose, { Schema, Document } from 'mongoose';
import { RefreshToken } from '../../../types';

export interface RefreshTokenDocument extends RefreshToken, Document {}

const RefreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    userId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// インデックスを追加
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel = mongoose.model<RefreshTokenDocument>('RefreshToken', RefreshTokenSchema);
```

#### ステップ2: データベース接続管理の改善

```typescript
// src/db/connection.ts
import mongoose from 'mongoose';
import { logger } from '../common/utils';

// 接続オプション
const connectionOptions: mongoose.ConnectOptions = {
  // 接続オプションを必要に応じて設定
};

// データベース接続URI取得
export const getDbUri = (): string => {
  const dbName = process.env.DB_NAME || 'hinago';
  return process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;
};

// データベース接続
export const initializeDatabase = async (): Promise<void> => {
  try {
    const uri = getDbUri();
    await mongoose.connect(uri, connectionOptions);
    logger.info(`データベースに接続しました: ${uri}`);
  } catch (error) {
    logger.error('データベース初期化エラー', { error });
    throw error;
  }
};

// データベース切断
export const closeDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    logger.info('データベース接続を終了しました');
  } catch (error) {
    logger.error('データベース切断エラー', { error });
    throw error;
  }
};
```

#### ステップ3: モデルインターフェースの実装

```typescript
// src/db/models/User.ts
import { User, UserRole } from '../../types';
import { UserModel as MongoUserModel } from './schemas/user.schema';
import bcrypt from 'bcrypt';
import { authConfig } from '../../config';

export class UserModel {
  // メールアドレスでユーザーを検索
  static async findByEmail(email: string): Promise<User | null> {
    return MongoUserModel.findOne({ email }).lean();
  }

  // IDでユーザーを検索
  static async findById(id: string): Promise<User | null> {
    return MongoUserModel.findById(id).lean();
  }

  // 新しいユーザーを作成
  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const newUser = await MongoUserModel.create(userData);
    return newUser.toObject();
  }

  // ユーザー情報を更新
  static async update(
    id: string,
    userData: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<User | null> {
    const user = await MongoUserModel.findByIdAndUpdate(id, userData, { new: true });
    return user ? user.toObject() : null;
  }

  // ユーザーを削除
  static async delete(id: string): Promise<boolean> {
    const result = await MongoUserModel.findByIdAndDelete(id);
    return !!result;
  }

  // パスワードを検証
  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return MongoUserModel.verifyPassword(plainPassword, hashedPassword);
  }

  // パスワードをハッシュ化
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, authConfig.auth.saltRounds);
  }

  // デフォルトユーザーの初期化
  static async initializeDefaultUsers(): Promise<void> {
    // 管理者ユーザーを検索
    const adminExists = await this.findByEmail(authConfig.auth.adminUser.email);
    
    // 存在しない場合は作成
    if (!adminExists) {
      await this.create({
        email: authConfig.auth.adminUser.email,
        name: authConfig.auth.adminUser.name,
        password: authConfig.auth.adminUser.password, // 保存時に自動的にハッシュ化される
        role: UserRole.ADMIN,
      });
    }
  }
}

export default UserModel;
```

```typescript
// src/db/models/RefreshToken.ts
import { RefreshToken } from '../../types';
import { RefreshTokenModel as MongoRefreshTokenModel } from './schemas/refreshToken.schema';
import { v4 as uuidv4 } from 'uuid';

export class RefreshTokenModel {
  // トークンでリフレッシュトークンを検索
  static async findByToken(token: string): Promise<RefreshToken | null> {
    return MongoRefreshTokenModel.findOne({ token }).lean();
  }

  // ユーザーIDでリフレッシュトークンを検索
  static async findByUserId(userId: string): Promise<RefreshToken[]> {
    return MongoRefreshTokenModel.find({ userId }).lean();
  }

  // 新しいリフレッシュトークンを作成
  static async create(userId: string, expiresIn: number): Promise<RefreshToken> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresIn * 1000);
    
    const newRefreshToken = await MongoRefreshTokenModel.create({
      userId,
      token: uuidv4(),
      expiresAt,
    });
    
    return newRefreshToken.toObject();
  }

  // 特定のトークンを削除
  static async delete(token: string): Promise<boolean> {
    const result = await MongoRefreshTokenModel.deleteOne({ token });
    return result.deletedCount > 0;
  }

  // ユーザーのリフレッシュトークンをすべて削除
  static async deleteAllForUser(userId: string): Promise<number> {
    const result = await MongoRefreshTokenModel.deleteMany({ userId });
    return result.deletedCount;
  }

  // 期限切れのトークンをすべて削除
  static async deleteExpired(): Promise<number> {
    const now = new Date();
    const result = await MongoRefreshTokenModel.deleteMany({ expiresAt: { $lt: now } });
    return result.deletedCount;
  }
}

export default RefreshTokenModel;
```

### 2.3 テスト用の設定

```typescript
// tests/utils/db-test-helper.ts
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { UserModel, RefreshTokenModel } from '../../src/db/models';
import { logger } from '../../src/common/utils';

let mongoServer: MongoMemoryServer;

/**
 * テスト用のデータベース接続を設定
 */
export const setupTestDatabase = async () => {
  try {
    // MongoMemoryServerを作成（テスト用インメモリMongoDB）
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    // Mongooseで接続
    await mongoose.connect(uri);
    
    // 初期データ作成
    await UserModel.initializeDefaultUsers();
    
    logger.info('テスト用データベースを初期化しました');
  } catch (error) {
    logger.error('テストデータベース初期化エラー', { error });
    throw error;
  }
};

/**
 * テスト用のデータベース接続を終了
 */
export const cleanupTestDatabase = async () => {
  try {
    // データベース接続を終了
    await mongoose.disconnect();
    
    // MongoMemoryServerを停止
    if (mongoServer) {
      await mongoServer.stop();
    }
    
    logger.info('テスト用データベースをクリーンアップしました');
  } catch (error) {
    logger.error('テストデータベースクリーンアップエラー', { error });
    throw error;
  }
};

/**
 * テスト用のユーザーを作成
 */
export const createTestUser = async (userData: any) => {
  try {
    return await UserModel.create(userData);
  } catch (error) {
    logger.error('テストユーザー作成エラー', { error });
    throw error;
  }
};
```

## 3. データベース検証と状態確認の追加

### 3.1 テスト前の状態検証

```typescript
// tests/integration/auth/auth.flow.test.ts の一部
import { UserModel } from '../../../src/db/models';

// テスト用の事前検証関数
async function verifyTestPrerequisites() {
  // 管理者ユーザーが存在するか確認
  const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
  if (!adminUser) {
    throw new Error('管理者ユーザーが存在しません。テスト前提条件を満たしていません。');
  }
  
  // パスワードハッシュが正しく設定されているか確認
  const isValidPassword = await UserModel.verifyPassword(
    authConfig.auth.adminUser.password, 
    adminUser.password
  );
  
  if (!isValidPassword) {
    throw new Error('管理者パスワードが正しくハッシュ化されていません。');
  }
  
  return adminUser;
}

// テストセットアップでの使用例
beforeAll(async () => {
  await setupTestDatabase();
  
  // テスト前提条件の検証
  const adminUser = await verifyTestPrerequisites();
  console.log(`管理者ユーザーが正しく設定されています: ${adminUser.email}`);
});
```

### 3.2 テスト後のデータ一貫性確認

```typescript
// テスト後の検証関数
async function verifyDatabaseConsistency() {
  // リフレッシュトークンが正しく保存されたか確認
  const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
  if (!adminUser) return false;
  
  // ユーザーのリフレッシュトークンを確認
  const tokens = await RefreshTokenModel.findByUserId(adminUser.id);
  console.log(`データベース内のリフレッシュトークン数: ${tokens.length}`);
  
  return true;
}

// テスト後の確認
afterAll(async () => {
  // データベースの一貫性を検証
  await verifyDatabaseConsistency();
  
  // クリーンアップ
  await cleanupTestDatabase();
});
```

## 4. .env設定の改善

以下の環境変数を`.env`に追加することで、データベース接続の設定を一元管理します：

```
# データベース設定
MONGODB_URI=mongodb://localhost:27017/hinago
DB_NAME=hinago
```

## 5. マイグレーション戦略

1. 開発環境で上記の変更を実装しテスト
2. 単体テスト（User.ts, RefreshToken.ts）で動作確認
3. 統合テスト（auth.flow.test.ts）で認証フロー確認
4. MongoDB接続とデータ永続化を確認

## 6. 環境一貫性に関する注意点

1. 本番環境とテスト環境で同じデータモデルを使用
2. テスト専用のデータベース名（hinago_test）を使用してデータ分離
3. テスト用の特殊パターンや迂回策を使用しない
4. 実データで動作するコードを書き、テストも実データで行う