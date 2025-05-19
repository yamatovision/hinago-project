# テスト環境設定ガイド

このドキュメントでは、実環境と一貫性のあるテスト環境の構築方法と設定について説明します。

## 1. 環境一貫性の原則

テスト環境は実環境（本番環境）と可能な限り一致させる必要があります。これにより以下のメリットがあります：

- 環境差異による問題を早期に発見できる
- 「テストでは動くが本番では動かない」状況を防止できる
- 実装とテストの乖離が生じない
- 環境特有の条件分岐が不要になり、コードが簡潔になる

## 2. 環境変数とコンフィグ設定

### 2.1 .envファイル管理の鉄則

テスト環境と本番環境で同一の`.env`ファイルを使用することを原則とします：

```
# 共通設定（テスト・本番共通）
NODE_ENV=production  # 常にproductionとして扱う
PORT=3000
API_PREFIX=/api/v1

# JWT設定
JWT_SECRET=your_jwt_secret_key_should_be_long_and_complex
JWT_ACCESS_EXPIRATION=900  # 15分（秒単位）
JWT_REFRESH_EXPIRATION=604800  # 7日間（秒単位）

# データベース設定
MONGODB_URI=mongodb://localhost:27017/hinago
DB_NAME=hinago

# CORS設定
CORS_ORIGIN=http://localhost:5173

# ログ設定
LOG_LEVEL=info
```

### 2.2 テスト用の設定分離方法

テスト特有の設定が必要な場合は、設定を環境変数ではなく、テストコード内で明示的に上書きします：

```typescript
// tests/setup.ts
import { config } from 'dotenv';
import { MongoMemoryServer } from 'mongodb-memory-server';

// 環境変数のロード
config();

// グローバルなテスト前処理
beforeAll(async () => {
  // テスト用MongoDBサーバーの起動
  const mongoServer = await MongoMemoryServer.create();
  
  // 環境変数を直接上書き（テスト中のみ）
  process.env.MONGODB_URI = mongoServer.getUri();
  
  console.log('テスト環境のセットアップを完了しました');
});
```

### 2.3 環境変数の検証

テスト実行前に必要な環境変数が設定されていることを検証します：

```typescript
// 環境変数の検証関数
function validateEnvironmentVariables() {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_ACCESS_EXPIRATION',
    'JWT_REFRESH_EXPIRATION',
    'MONGODB_URI'
  ];
  
  const missingVars = requiredVars.filter(name => !process.env[name]);
  
  if (missingVars.length > 0) {
    throw new Error(`必須環境変数が不足しています: ${missingVars.join(', ')}`);
  }
}

// テスト開始前に実行
beforeAll(() => {
  validateEnvironmentVariables();
});
```

## 3. テストデータベースの設定

### 3.1 実データベース使用の推奨アプローチ

実環境と最も近い状態でテストするためには、実際のMongoDBを使用することを推奨します：

```typescript
// テスト用データベース名を使用
const testDbName = 'hinago_test';
const testDbUri = `mongodb://localhost:27017/${testDbName}`;

// データベース接続
beforeAll(async () => {
  await mongoose.connect(testDbUri);
  
  // テストデータベースをクリア
  await mongoose.connection.dropDatabase();
  
  // 初期データ投入
  await setupInitialData();
});

// テスト終了後のクリーンアップ
afterAll(async () => {
  // データベース接続終了
  await mongoose.disconnect();
});
```

### 3.2 MongoDB Memory Serverの使用

CIパイプライン等で実際のMongoDBサーバーが利用できない場合は、MongoDB Memory Serverを使用します：

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

// テスト用データベース設定
beforeAll(async () => {
  // メモリ内MongoDBサーバーを起動
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  // Mongooseで接続
  await mongoose.connect(uri);
});

// テスト終了後のクリーンアップ
afterAll(async () => {
  // データベース接続終了
  await mongoose.disconnect();
  
  // メモリサーバー停止
  await mongoServer.stop();
});
```

## 4. データ検証と状態確認

### 4.1 テスト前のデータ検証

各テスト実行前に、テストに必要なデータが正しく設定されていることを検証します：

```typescript
// 認証テスト用のデータ検証
async function verifyAuthTestData() {
  // 管理者ユーザーが存在するか確認
  const adminUser = await UserModel.findByEmail('admin@example.com');
  if (!adminUser) {
    // 存在しない場合は作成
    await UserModel.create({
      email: 'admin@example.com',
      name: '管理者',
      password: 'securepassword',
      role: UserRole.ADMIN
    });
    console.log('テスト用管理者ユーザーを作成しました');
  } else {
    console.log('テスト用管理者ユーザーが存在します');
  }
  
  return true;
}

// テスト実行前に検証
beforeEach(async () => {
  await verifyAuthTestData();
});
```

### 4.2 テスト後のデータ整合性確認

テスト実行後にデータの整合性を確認することで、テストの信頼性を高めます：

```typescript
// ログインテスト後のデータ検証
it('有効な認証情報でログインができる', async () => {
  // テスト実行...
  
  // データベースの状態を検証
  const user = await UserModel.findByEmail('admin@example.com');
  expect(user).toBeDefined();
  
  // リフレッシュトークンが保存されているか確認
  const tokens = await RefreshTokenModel.findByUserId(user.id);
  expect(tokens.length).toBeGreaterThan(0);
});
```

## 5. Jest設定の最適化

### 5.1 jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000, // タイムアウト設定
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/types/**/*.ts'],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
}
```

### 5.2 テスト実行スクリプト

package.jsonに以下のスクリプトを追加することで、目的別のテスト実行を容易にします：

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testMatch='**/tests/unit/**/*.test.ts'",
    "test:integration": "jest --testMatch='**/tests/integration/**/*.test.ts'",
    "test:auth": "jest --testMatch='**/tests/**/auth/**/*.test.ts'",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 6. テスト実行のベストプラクティス

### 6.1 一点集中テストの原則

問題のあるテストを修正する際は、単一のテストケースに集中します：

```bash
# 特定のテストファイルのみを実行
npm test -- tests/integration/auth/auth.flow.test.ts

# 特定のテスト名にマッチするテストのみを実行
npm test -- -t "有効な認証情報でログインができる"
```

### 6.2 テスト実行順序のコントロール

テストの依存関係がある場合は、実行順序を明示的に制御します：

```typescript
// 認証フローの順序付けられたテスト
describe.each([
  ['1. ログイン', '有効な認証情報でログインができる'],
  ['2. ユーザー情報取得', '有効なトークンで認証ユーザー情報を取得できる'],
  ['3. トークン更新', '有効なリフレッシュトークンで新しいアクセストークンを取得できる'],
  ['4. ログアウト', '有効なトークンでログアウトできる']
])('%s', (_, testName) => {
  // 順序付けられたテストを実行
});
```

## 7. 環境差異を発見するための追加テスト

環境差異を積極的に検出するための特殊なテストケースを追加します：

```typescript
// 環境変数の一貫性テスト
it('環境変数が正しく設定されている', () => {
  expect(process.env.JWT_SECRET).toBeDefined();
  expect(process.env.MONGODB_URI).toBeDefined();
});

// データベース接続テスト
it('データベースに接続できる', async () => {
  expect(mongoose.connection.readyState).toBe(1); // 1 = 接続済み
});

// データモデルの整合性テスト
it('ユーザーモデルが正しく動作する', async () => {
  const user = await UserModel.create({
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    password: 'password123',
    role: UserRole.USER
  });
  
  expect(user).toBeDefined();
  expect(user.id).toBeDefined();
});
```

## 8. 実データ使用の原則

テストでは実際のデータを使用し、テスト用の特殊パターンを避けます：

```typescript
// 推奨: 実際の住所データを使用
it('実際の住所を正しくジオコーディングできる', async () => {
  const address = '東京都中央区銀座4-5-6';
  const result = await geocodeAddress(address);
  
  expect(result.latitude).toBeDefined();
  expect(result.longitude).toBeDefined();
});

// 非推奨: テスト用データパターンの特別処理
// if (address.includes('test_') || address.includes('テスト')) { ... }
```

## 9. 環境分岐の禁止

環境によって動作が変わる条件分岐は避け、一貫した実装を維持します：

```typescript
// 非推奨: 環境による分岐
// if (process.env.NODE_ENV === 'test') { ... }

// 推奨: 環境に依存しない実装
export const connectToDatabase = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI環境変数が設定されていません');
  }
  
  return mongoose.connect(uri);
};
```

## 10. デバッグとエラー解析

### 10.1 テスト実行時のデバッグ出力

```typescript
// テスト専用のデバッグロガー
const testLogger = (message: string, data?: any) => {
  if (process.env.DEBUG_TESTS === 'true') {
    console.log(`[TEST] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// テスト内での使用
it('認証トークンが正しく生成される', async () => {
  const user = { id: '1', email: 'test@example.com', role: UserRole.USER };
  const token = generateAccessToken(user);
  
  testLogger('生成されたトークン', { token });
  
  expect(token).toBeDefined();
});
```

### 10.2 失敗テストの詳細分析

特定のテストの失敗を詳細に分析するためのヘルパー関数：

```typescript
// テスト失敗の詳細分析
const analyzeTestFailure = async (testCase: () => Promise<any>) => {
  try {
    await testCase();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack,
      // データベース状態のスナップショット
      dbState: await captureDbState()
    };
  }
};

// データベース状態の取得
const captureDbState = async () => {
  const users = await UserModel.findAll();
  const tokens = await RefreshTokenModel.findAll();
  
  return { users, tokens };
};

// 使用例
it('ログイン失敗時の詳細分析', async () => {
  const result = await analyzeTestFailure(async () => {
    // テストケース
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrong@example.com', password: 'wrongpass' });
      
    expect(res.status).toBe(401);
  });
  
  if (!result.success) {
    console.error('テスト失敗の詳細:', result);
  }
});
```