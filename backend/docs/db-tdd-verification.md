# DB-TDD原則に基づくテスト検証ガイド

データベース中心テスト駆動開発（DB-TDD）は、実際のデータベースの状態を検証することで、より信頼性の高いテストを実現する手法です。本ドキュメントでは、認証システムのテストにDB-TDD原則を適用するための具体的な実装方法を解説します。

## 1. DB-TDDサイクルの基本

### DB-TDD基本サイクル

1. **TypeScriptエラーチェック**: `npx tsc --noEmit`でエラーゼロを確認
2. **データベース接続と状態確認**: 実際のDBに接続し、データ構造と状態を把握
3. **テスト設計と実装**: 実データに基づくテストケースを設計
4. **コード実装**: テストを通過するコードを実装
5. **検証と再テスト**: 実装後に再度テストを実行し結果を確認
6. **データベース状態の再検証**: テスト後のデータ整合性を確認
7. **知識の共有**: 学んだ内容を記録

### DB-TDDの利点

- 実際のデータベースに基づくテストで本番環境との乖離を防止
- データの不整合やデータモデルの問題を早期に発見
- 実際のデータフローを検証することでより信頼性の高いテストを実現
- データベース操作に関する暗黙の前提条件を明確化

## 2. 認証システムへのDB-TDD適用方法

### 2.1 テスト前状態検証ヘルパー関数

```typescript
/**
 * データベース状態検証ヘルパー
 */
export const verifyDatabaseState = async () => {
  // データベース接続状態確認
  if (mongoose.connection.readyState !== 1) {
    throw new Error('データベースに接続されていません');
  }
  
  // コレクション存在確認
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  const requiredCollections = ['users', 'refreshtokens'];
  const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
  
  if (missingCollections.length > 0) {
    throw new Error(`必要なコレクションが不足しています: ${missingCollections.join(', ')}`);
  }
  
  // 管理者ユーザー存在確認
  const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
  if (!adminUser) {
    throw new Error('管理者ユーザーがデータベースに存在しません');
  }
  
  return {
    connectionStatus: 'connected',
    collections: collectionNames,
    adminUserExists: !!adminUser,
  };
};
```

### 2.2 テスト前データ状態のスナップショット

```typescript
/**
 * データベース状態のスナップショットを作成
 */
export const captureDbSnapshot = async () => {
  // ユーザー数
  const userCount = await mongoose.connection.db.collection('users').countDocuments();
  
  // リフレッシュトークン数
  const tokenCount = await mongoose.connection.db.collection('refreshtokens').countDocuments();
  
  // 管理者ユーザー情報
  const adminUser = await UserModel.findByEmail(authConfig.auth.adminUser.email);
  
  return {
    timestamp: new Date(),
    userCount,
    tokenCount,
    adminUser: adminUser ? {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    } : null,
  };
};
```

### 2.3 ステップ別のデータ変化検証

```typescript
/**
 * テスト実行前後のデータ変化を検証
 */
export const verifyDataChanges = async (beforeSnapshot: any, operation: () => Promise<any>) => {
  // テスト操作の実行
  const result = await operation();
  
  // テスト後のデータスナップショット
  const afterSnapshot = await captureDbSnapshot();
  
  // データ変化の計算
  const changes = {
    userCountDiff: afterSnapshot.userCount - beforeSnapshot.userCount,
    tokenCountDiff: afterSnapshot.tokenCount - beforeSnapshot.tokenCount,
    timestamp: new Date(),
    result,
  };
  
  return {
    before: beforeSnapshot,
    after: afterSnapshot,
    changes,
  };
};
```

## 3. 認証フローテストへのDB-TDD適用

### 3.1 ログインプロセスの状態検証

```typescript
describe('POST /auth/login', () => {
  it('有効な認証情報でログインができ、データベースにトークンが保存される', async () => {
    // テスト前のデータスナップショット
    const beforeSnapshot = await captureDbSnapshot();
    
    // 有効な認証情報
    const credentials = {
      email: authConfig.auth.adminUser.email,
      password: authConfig.auth.adminUser.password,
    };
    
    // APIリクエスト実行と検証
    const result = await verifyDataChanges(beforeSnapshot, async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/login`)
        .send(credentials);
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      
      return {
        accessToken: res.body.data.accessToken,
        refreshToken: res.body.data.refreshToken,
      };
    });
    
    // データベース状態の変化を検証
    expect(result.changes.tokenCountDiff).toBe(1); // リフレッシュトークンが1つ増加
    
    // トークンがデータベースに存在することを確認
    const tokenExists = await RefreshTokenModel.findByToken(result.changes.result.refreshToken);
    expect(tokenExists).toBeTruthy();
    
    // トークンの有効期限が正しく設定されていることを確認
    expect(tokenExists.expiresAt).toBeInstanceOf(Date);
    expect(tokenExists.expiresAt > new Date()).toBe(true);
    
    // 後続のテストのためにトークンを保存
    accessToken = result.changes.result.accessToken;
    refreshToken = result.changes.result.refreshToken;
  });
});
```

### 3.2 リフレッシュトークン更新の状態検証

```typescript
describe('POST /auth/refresh', () => {
  it('リフレッシュトークンを使用すると、データベース内のトークンが更新される', async () => {
    // テスト前のデータスナップショット
    const beforeSnapshot = await captureDbSnapshot();
    
    // リフレッシュトークンリクエスト
    const result = await verifyDataChanges(beforeSnapshot, async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/refresh`)
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      
      return {
        newAccessToken: res.body.data.accessToken,
      };
    });
    
    // データベース状態の変化を検証（トークン数は変わらない）
    expect(result.changes.tokenCountDiff).toBe(0);
    
    // 元のリフレッシュトークンがまだデータベースに存在することを確認
    const tokenExists = await RefreshTokenModel.findByToken(refreshToken);
    expect(tokenExists).toBeTruthy();
    
    // 後続テストのためにアクセストークンを更新
    accessToken = result.changes.result.newAccessToken;
  });
});
```

### 3.3 ログアウト処理の状態検証

```typescript
describe('POST /auth/logout', () => {
  it('ログアウト時にデータベースからリフレッシュトークンが削除される', async () => {
    // テスト前のデータスナップショット
    const beforeSnapshot = await captureDbSnapshot();
    
    // ログアウトリクエスト
    const result = await verifyDataChanges(beforeSnapshot, async () => {
      const res = await request(app)
        .post(`${baseUrl}/auth/logout`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      return {
        status: res.status,
        success: res.body.success,
      };
    });
    
    // データベース状態の変化を検証
    expect(result.changes.tokenCountDiff).toBe(-1); // リフレッシュトークンが1つ減少
    
    // トークンがデータベースから削除されたことを確認
    const tokenExists = await RefreshTokenModel.findByToken(refreshToken);
    expect(tokenExists).toBeNull();
  });
});
```

## 4. データベース状態検証の自動化

### 4.1 テスト前後の自動検証

```typescript
// tests/test-utils/db-verification.ts
import { UserModel, RefreshTokenModel } from '../../src/db/models';
import mongoose from 'mongoose';

// グローバル状態保存
let globalDbState = {
  snapshotsBefore: {},
  snapshotsAfter: {},
};

// テスト前のデータベース状態を記録
beforeEach(async () => {
  const testName = expect.getState().currentTestName;
  if (testName) {
    globalDbState.snapshotsBefore[testName] = await captureDbSnapshot();
  }
});

// テスト後のデータベース状態を記録と検証
afterEach(async () => {
  const testName = expect.getState().currentTestName;
  if (testName) {
    globalDbState.snapshotsAfter[testName] = await captureDbSnapshot();
    
    // 変化を計算
    const before = globalDbState.snapshotsBefore[testName];
    const after = globalDbState.snapshotsAfter[testName];
    
    console.log(`[DB-TDD] テスト "${testName}" のデータベース変化:`, {
      userCountDiff: after.userCount - before.userCount,
      tokenCountDiff: after.tokenCount - before.tokenCount,
    });
  }
});
```

### 4.2 明示的なデータ整合性検証

```typescript
// 特定のリソースの整合性を検証
export const verifyResourceConsistency = async (resourceType, id) => {
  switch (resourceType) {
    case 'user':
      const user = await UserModel.findById(id);
      return {
        exists: !!user,
        data: user,
        // 関連データの検証
        associatedTokens: await RefreshTokenModel.findByUserId(id),
      };
      
    case 'refreshToken':
      const token = await RefreshTokenModel.findByToken(id);
      return {
        exists: !!token,
        data: token,
        // トークンが有効かどうか（期限切れでないか）
        isValid: token ? token.expiresAt > new Date() : false,
        // 関連ユーザーの存在確認
        userExists: token ? !!(await UserModel.findById(token.userId)) : false,
      };
      
    default:
      throw new Error(`未知のリソースタイプ: ${resourceType}`);
  }
};
```

## 5. テスト結果の詳細分析と報告

### 5.1 テスト結果の詳細レポート生成

```typescript
// tests/test-utils/test-reporter.ts
import fs from 'fs';
import path from 'path';

// テスト結果のレポート生成
export const generateTestReport = async (testResults) => {
  const report = {
    timestamp: new Date(),
    totalTests: testResults.length,
    passedTests: testResults.filter(r => r.status === 'passed').length,
    failedTests: testResults.filter(r => r.status === 'failed').length,
    dbOperations: testResults.reduce((acc, curr) => acc + (curr.dbOperations || 0), 0),
    results: testResults,
  };
  
  // レポートをJSONファイルに保存
  const reportPath = path.join(process.cwd(), 'test-reports');
  if (!fs.existsSync(reportPath)) {
    fs.mkdirSync(reportPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(reportPath, `db-tdd-report-${Date.now()}.json`),
    JSON.stringify(report, null, 2)
  );
  
  return report;
};
```

### 5.2 データベース操作の詳細ログ

```typescript
// データベース操作のロギング拡張
if (process.env.DB_TDD_LOGGING === 'true') {
  // Mongooseのデバッグモードを有効化
  mongoose.set('debug', (collectionName, method, query, doc) => {
    console.log(`[DB-TDD] ${collectionName}.${method}`, JSON.stringify(query), doc);
  });
}
```

## 6. 実際のプロジェクトへの適用

### 6.1 Jest設定にカスタムレポーターを追加

```javascript
// jest.config.js
module.exports = {
  // 既存の設定...
  reporters: [
    'default',
    ['<rootDir>/tests/test-utils/db-tdd-reporter.js', {}]
  ],
};
```

### 6.2 カスタムレポーターの実装

```javascript
// tests/test-utils/db-tdd-reporter.js
class DbTddReporter {
  constructor(globalConfig, options) {
    this._globalConfig = globalConfig;
    this._options = options;
    this.dbOperations = 0;
    this.dbVerifications = 0;
  }

  onRunStart() {
    console.log('[DB-TDD] テスト実行開始: データベース状態検証を開始します');
  }

  onTestStart(test) {
    console.log(`[DB-TDD] テスト開始: ${test.path}`);
  }

  onTestResult(test, testResult) {
    // テスト結果にDB-TDD関連のメタデータを追加
    if (testResult.testResults && global.__DB_TDD_STATS__) {
      testResult.testResults.forEach(result => {
        const testName = result.fullName || result.title;
        if (global.__DB_TDD_STATS__[testName]) {
          result.dbOperations = global.__DB_TDD_STATS__[testName].operations;
          result.dbVerifications = global.__DB_TDD_STATS__[testName].verifications;
          
          this.dbOperations += result.dbOperations || 0;
          this.dbVerifications += result.dbVerifications || 0;
        }
      });
    }
  }

  onRunComplete(contexts, results) {
    console.log('[DB-TDD] テスト実行完了: データベース操作統計');
    console.log(`- 総データベース操作数: ${this.dbOperations}`);
    console.log(`- 総データベース検証数: ${this.dbVerifications}`);
    
    // テスト結果レポートを生成
    const { generateTestReport } = require('./test-reporter');
    generateTestReport(results);
  }
}

module.exports = DbTddReporter;
```

## 7. まとめ：DB-TDD原則の適用チェックリスト

### 7.1 テスト前

- [ ] TypeScriptコンパイルエラーがないことを確認
- [ ] データベース接続が確立されていることを確認
- [ ] 必要なコレクションが存在することを確認
- [ ] テストに必要な初期データが存在することを確認
- [ ] データベース状態のスナップショットを作成

### 7.2 テスト中

- [ ] テスト操作でデータベースの状態が変化することを検証
- [ ] トランザクションを使用して独立したテスト環境を確保
- [ ] データベース操作の順序と依存関係を明確にする
- [ ] エラーケースでのデータベース状態の整合性を検証

### 7.3 テスト後

- [ ] テスト操作後のデータベース状態を検証
- [ ] 期待通りのデータ変化が発生したことを確認
- [ ] リソース間の関連性と整合性を検証
- [ ] データベース状態の変化を報告
- [ ] テスト環境のクリーンアップを実施

### 7.4 継続的改善

- [ ] テストカバレッジを向上させるために新たなデータ検証を追加
- [ ] テスト実行時間とリソース使用量を最適化
- [ ] テスト結果の報告とドキュメント化
- [ ] DB-TDDプラクティスをチームで共有