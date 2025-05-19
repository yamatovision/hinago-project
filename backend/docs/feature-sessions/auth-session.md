# 認証機能 テスト分析セッション

## 1. 問題概要
- **問題内容**: 認証テストが失敗している（特にログイン処理）
- **失敗テストケース**: 
  - `POST /auth/login` - 有効な認証情報でログインができる
  - `GET /auth/me` - 有効なトークンで認証ユーザー情報を取得できる
  - `POST /auth/refresh` - 有効なリフレッシュトークンで新しいアクセストークンを取得できる
  - `POST /auth/logout` - 有効なトークンでログアウトできる
- **期待される動作**: 認証情報を使用したログインが成功し、アクセストークンが発行される
- **実際の動作**: ログイン処理が401エラー（INVALID_CREDENTIALS）で失敗している

## 2. 実行フロー分析
| # | ステップ | 状態 | 時間 | 備考 |
|---|---------|------|------|------|
| 1 | テスト環境セットアップ | ✅ | - | メモリ内DBの初期化 |
| 2 | ユーザー認証情報検証 | ❌ | - | パスワード検証に失敗している |
| 3 | アクセストークン生成 | ❌ | - | 認証失敗のため未実行 |
| 4 | リフレッシュトークン生成 | ❌ | - | 認証失敗のため未実行 |
| 5 | ユーザー情報取得 | ❌ | - | 認証失敗のため未実行 |
| 6 | トークン更新 | ❌ | - | 認証失敗のため未実行 |
| 7 | ログアウト処理 | ❌ | - | 認証失敗のため未実行 |

## 3. 根本原因分析

### 3.1 パスワードハッシュ化と検証の問題
- **コード分析**: 
  - User.tsの初期化処理でパスワードハッシュ化が非同期で行われている（26-31行）
  - ハッシュ化処理が完了する前にテストが実行されている可能性がある
  - パスワードハッシュ化テスト単体は成功しているが、統合テスト内では問題が発生

### 3.2 メモリ内DBの環境一貫性問題
- **存在する問題**:
  - テスト用にメモリ内DBを使用（本番環境との乖離）
  - DBの初期化と実際のデータ状態の検証が不足
  - 実際のデータベースを使わないため、本番環境での動作と差異がある

### 3.3 環境変数とコンフィグの問題
- **.env分析**:
  - 基本的な.envファイルは存在しているが、テスト環境特有の設定がない
  - NODE_ENVがdevelopmentに設定されている
  - 本番環境とテスト環境の環境変数の一貫性が確保できていない

## 4. 解決策案

### 4.1 パスワードハッシュ化と初期化順序の修正
1. **同期的な初期化プロセスの実装**:
   - アプリケーション起動前に初期ユーザーの作成とパスワードハッシュ化を確実に完了させる
   - テスト開始前に必要なデータの存在を検証するステップを追加

```typescript
// User.tsの改善案
// 非同期IIFE（即時実行関数）を避け、明示的な初期化関数を提供
export class UserModel {
  // 既存のユーザーを初期化
  static async initializeDefaultUsers(): Promise<void> {
    // 管理者ユーザーが存在しない場合のみ作成
    const adminExists = await this.findByEmail(authConfig.auth.adminUser.email);
    if (!adminExists) {
      const hashedPassword = await this.hashPassword(authConfig.auth.adminUser.password);
      users.push({
        id: authConfig.auth.adminUser.id,
        email: authConfig.auth.adminUser.email,
        name: authConfig.auth.adminUser.name,
        password: hashedPassword,
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
  
  // 他のメソッドは変更なし
}
```

### 4.2 実データベース導入計画
1. **MongoDB実装の導入**:
   - メモリ内DBから実際のMongoDBへの移行
   - テスト専用のコレクション名を使用したMongoDBテスト環境の構築

```typescript
// connection.tsの改善案
import mongoose from 'mongoose';
import { logger } from '../common/utils';

// データベース接続URI
const getDbUri = () => {
  const dbName = process.env.NODE_ENV === 'test' 
    ? process.env.TEST_DB_NAME || 'hinago_test'
    : process.env.DB_NAME || 'hinago';
    
  return process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    const uri = getDbUri();
    await mongoose.connect(uri);
    logger.info(`データベースに接続しました: ${uri}`);
  } catch (error) {
    logger.error('データベース初期化エラー', { error });
    throw error;
  }
};
```

### 4.3 テスト環境設定の改善
1. **テスト前の環境検証**:
   - テスト開始前に必要な環境変数とデータベース接続を検証
   - 管理者ユーザーの存在を確認し、必要に応じて作成

```typescript
// setup.tsの改善案
import { config } from 'dotenv';
import { UserModel } from '../src/db/models';
import { initializeDatabase, closeDatabase } from '../src/db/connection';

// 環境変数のロード
config();

// テストのタイムアウト設定
jest.setTimeout(30000);

// 環境変数の検証
const requiredEnvVars = [
  'JWT_SECRET',
  'JWT_ACCESS_EXPIRATION',
  'JWT_REFRESH_EXPIRATION',
];

// グローバルなテスト前処理
beforeAll(async () => {
  console.log('テスト環境のセットアップを開始します');
  
  // 環境変数の検証
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`必要な環境変数 ${envVar} が設定されていません`);
    }
  }
  
  // データベース接続
  await initializeDatabase();
  
  // 初期ユーザーの初期化
  await UserModel.initializeDefaultUsers();
});

// グローバルなテスト後処理
afterAll(async () => {
  // データベース接続の終了
  await closeDatabase();
  console.log('テスト環境のクリーンアップを完了しました');
});
```

## 5. 次回セッションへの引継ぎ

### 残課題
1. 実データベース（MongoDB）の導入とテスト
2. パスワードハッシュ化の初期化順序の修正
3. 実際のトークン検証と認証フローの詳細テスト
4. 環境一貫性確保のための設定改善

### 検証すべき仮説
1. 認証失敗の主要原因はパスワードハッシュ化の非同期処理問題である
2. メモリ内DBからMongoDBへの移行で環境一貫性が向上する
3. テスト前の明示的なデータ初期化で再現性が向上する