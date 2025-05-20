# シナリオ作成マイクロテスト実装計画

## 1. 実装目標

1. **テスト実行時間の短縮**：
   - 目標時間：60秒以内
   - 前処理（物件・ボリュームチェック作成）：30秒以内
   - シナリオ作成テスト本体：30秒以内

2. **テストカバレッジの維持**：
   - 基本機能（CRUD操作）の確実な検証
   - 権限チェック（認証エラー）の確認
   - バリデーションエラーの確認

3. **詳細な処理時間計測**：
   - 各処理ステップの所要時間を可視化
   - ボトルネックの特定を容易に
   - タイムアウト時の原因箇所を明確に

## 2. シナリオ作成マイクロテスト実装案

```typescript
/**
 * シナリオ作成マイクロテスト
 * - 超軽量テストデータ使用
 * - 処理時間の詳細な計測
 * - 60秒以内での完了を目指す
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../../src/app';
import { appConfig } from '../../../src/config';
import { connectDB, disconnectDB } from '../../utils/db-test-helper';
import { getTestAuth } from '../../utils/test-auth-helper';
import { 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus, 
  AssetType,
  ScenarioParams
} from '../../../types';
import { MilestoneTracker } from './utils/milestone-tracker';

// APIのベースURL
const baseUrl = appConfig.app.apiPrefix;

describe('シナリオ作成マイクロテスト', () => {
  // マイルストーントラッカー
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  
  // 超小型テスト用の物件データ
  const microPropertyData = {
    name: 'シナリオ作成マイクロテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 50, // 極小の面積
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 100000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ作成マイクロテスト用',
    shapeData: {
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 0 }, // 極小サイズ
        { x: 5, y: 10 },
        { x: 0, y: 10 }
      ],
      width: 5, // 極小サイズ
      depth: 10
    }
  };
  
  // 超軽量建築パラメータ
  const microBuildingParams = {
    floorHeight: 3.0,
    commonAreaRatio: 10,
    floors: 2, // 最小フロア数
    roadWidth: 4,
    assetType: AssetType.MANSION
  };
  
  // 超軽量計算用パラメータ
  const microScenarioParams = {
    assetType: AssetType.MANSION,
    rentPerSqm: 3000,
    occupancyRate: 95,
    managementCostRate: 10,
    constructionCostPerSqm: 350000,
    rentalPeriod: 3, // 超短期間
    capRate: 4.0
  };

  // テスト実行前のセットアップ
  beforeAll(async () => {
    tracker.mark('テスト開始');
    tracker.setOperation('データベース接続');
    await connectDB();
    tracker.mark('DB接続完了');
    
    tracker.setOperation('認証情報取得');
    const auth = await getTestAuth();
    authHeader = auth.authHeader;
    tracker.mark('認証情報取得完了');
    
    // テスト用の物件を作成
    tracker.setOperation('テスト物件作成');
    const propertyRes = await request(app)
      .post(`${baseUrl}/properties`)
      .set('Authorization', authHeader)
      .send(microPropertyData);
    
    testPropertyId = propertyRes.body.data.id;
    tracker.mark('物件作成完了');
    
    // テスト用のボリュームチェックを実行
    tracker.setOperation('ボリュームチェック実行');
    const volumeCheckRes = await request(app)
      .post(`${baseUrl}/analysis/volume-check`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        buildingParams: microBuildingParams
      });
    
    testVolumeCheckId = volumeCheckRes.body.data.id;
    tracker.mark('ボリュームチェック完了');
    
    console.log(`セットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}`);
  }, 60000); // 1分のタイムアウト
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    tracker.setOperation('データベース切断');
    await disconnectDB();
    tracker.mark('テスト終了');
    tracker.cleanup();
  });
  
  // シナリオ作成成功テスト
  it('認証済みユーザーはシナリオを作成できる', async () => {
    tracker.setOperation('シナリオ作成リクエスト準備');
    
    // 前提条件のチェック
    expect(testPropertyId).toBeDefined();
    expect(testVolumeCheckId).toBeDefined();
    
    const scenarioName = 'テストシナリオ' + Date.now();
    
    tracker.setOperation('シナリオ作成リクエスト送信');
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: microScenarioParams
      });
    
    tracker.mark('シナリオ作成レスポンス受信');
    
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data).toHaveProperty('propertyId', testPropertyId);
    expect(res.body.data).toHaveProperty('volumeCheckId', testVolumeCheckId);
    expect(res.body.data).toHaveProperty('name', scenarioName);
    
    // 後続のテストのためにシナリオIDを保存
    testScenarioId = res.body.data.id;
    console.log(`作成されたシナリオID: ${testScenarioId}`);
    
    tracker.mark('シナリオ作成テスト完了');
  }, 30000); // 30秒のタイムアウト

  // 認証エラーテスト
  it('認証なしでシナリオを作成できない', async () => {
    tracker.setOperation('認証なしリクエスト送信');
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('認証なしレスポンス受信');
    
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'AUTH_REQUIRED');
    
    tracker.mark('認証エラーテスト完了');
  }, 5000); // 5秒のタイムアウト

  // バリデーションエラーテスト
  it('必須パラメータが欠けている場合はエラーになる', async () => {
    tracker.setOperation('バリデーションエラーリクエスト送信');
    
    // 必須パラメータを欠いたデータ
    const invalidData = {
      propertyId: testPropertyId,
      volumeCheckId: testVolumeCheckId,
      // nameが欠けている
      params: {
        assetType: AssetType.MANSION,
        rentPerSqm: 3000,
        // occupancyRateが欠けている
        managementCostRate: 10,
        constructionCostPerSqm: 350000,
        rentalPeriod: 3,
        capRate: 4.0
      }
    };
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send(invalidData);
    
    tracker.mark('バリデーションエラーレスポンス受信');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    
    tracker.mark('バリデーションエラーテスト完了');
  }, 5000); // 5秒のタイムアウト

  // 存在しない物件IDテスト
  it('存在しない物件IDでは404が返される', async () => {
    tracker.setOperation('存在しない物件IDリクエスト送信');
    
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: nonExistentId,
        volumeCheckId: testVolumeCheckId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('存在しない物件IDレスポンス受信');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    
    tracker.mark('存在しない物件IDテスト完了');
  }, 5000); // 5秒のタイムアウト

  // 存在しないボリュームチェックIDテスト
  it('存在しないボリュームチェックIDでは404が返される', async () => {
    tracker.setOperation('存在しないVCIDリクエスト送信');
    
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: nonExistentId,
        name: 'テストシナリオ',
        params: microScenarioParams
      });
    
    tracker.mark('存在しないVCIDレスポンス受信');
    
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    
    tracker.mark('存在しないVCIDテスト完了');
  }, 5000); // 5秒のタイムアウト

  // シナリオ作成後の一覧取得テスト
  it('作成したシナリオが一覧に表示される', async () => {
    tracker.setOperation('シナリオ一覧リクエスト送信');
    
    // 作成したシナリオを含む一覧を取得
    const listRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios?propertyId=${testPropertyId}&limit=5`)
      .set('Authorization', authHeader);
    
    tracker.mark('シナリオ一覧レスポンス受信');
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    
    // 作成したシナリオが一覧に含まれていることを確認
    const ids = listRes.body.data.map((item: any) => item.id);
    expect(ids).toContain(testScenarioId);
    
    tracker.mark('シナリオ一覧テスト完了');
  }, 10000); // 10秒のタイムアウト
});
```

## 3. テスト最適化のポイント

### 3.1 超軽量テストデータによる効率化

- **物件面積**: 50㎡（通常の1/10〜1/20サイズ）
- **建物階数**: 2階のみ（4階以上使わない）
- **運用期間**: 3年（通常の1/10程度）
- **形状**: シンプルな矩形（複雑な多角形を避ける）

これらの軽量化により、ボリュームチェック計算と収益性計算の処理時間を大幅に短縮できます。

### 3.2 処理の独立化と時間計測

テスト処理を以下のように独立させて時間計測を行います：

1. **セットアップフェーズ**:
   - データベース接続: 〜3秒
   - 認証情報取得: 〜2秒
   - 物件作成: 〜10秒
   - ボリュームチェック実行: 〜15秒

2. **シナリオ作成テスト**:
   - シナリオ作成リクエスト: 〜10秒
   - レスポンス検証: 〜1秒

3. **エラーケーステスト**:
   - 各エラーケース: 〜5秒以内

各処理にマイルストーンを設定することで、どの処理がボトルネックになっているかを特定できます。

### 3.3 エラーケースの効率的なテスト

エラーケースは軽量に実装し、それぞれのエラーパターンを高速に検証します：

- **認証エラー**: 5秒以内
- **バリデーションエラー**: 5秒以内
- **存在しないIDエラー**: 5秒以内

これらのエラーケースは実際の計算処理を伴わないため、短時間で検証可能です。

## 4. 実行計画と期待される結果

タイムアウト値を現実的に調整し、処理内容により以下のようにタイムアウトを設定します：

1. 全体のテストスイート: 2分（beforeAll含む）
2. 基本処理テスト: 30秒
3. エラーケーステスト: 各5秒
4. 連携テスト: 10秒

### 4.1 実行時間の目標

| テストフェーズ | 想定時間 | タイムアウト値 |
|----------|--------|----------|
| 前処理（物件・VC作成） | 20-30秒 | 60秒 |
| シナリオ作成 | 10-15秒 | 30秒 |
| エラーケース検証 | 1-3秒 | 5秒 |
| 一覧取得 | 3-5秒 | 10秒 |
| 全体 | 40-60秒 | 120秒 |

### 4.2 期待される改善効果

1. CI/CD環境でも安定して実行可能
2. テスト実行時間を従来の1/5〜1/10に短縮
3. 問題発生時のデバッグが容易になる
4. 開発者の生産性向上

## 5. 将来的な拡張

1. **テストデータ生成の共通ユーティリティ化**:
   ```typescript
   // test-data-factory.ts
   class TestDataFactory {
     static createMicroProperty() { /* ... */ }
     static createMicroVolumeCheck(propertyId) { /* ... */ }
     static createMicroScenario(propertyId, volumeCheckId) { /* ... */ }
   }
   ```

2. **共有セットアップの導入**:
   ```typescript
   // 複数のテストで共有するセットアップ
   const sharedSetup = async () => {
     // 認証情報と基本データを一度だけ作成
     const data = {
       auth: null,
       property: null,
       volumeCheck: null
     };
     // データ作成・初期化ロジック
     return data;
   };
   ```

3. **マイクロテストスイートのグループ化**:
   ```typescript
   // 複数のマイクロテストを統合して実行
   describe.each([
     ['scenarios-create-micro.test.ts', createMicroTest],
     ['scenarios-update-micro.test.ts', updateMicroTest],
     ['scenarios-delete-micro.test.ts', deleteMicroTest]
   ])('テストスイート: %s', (name, testFn) => {
     testFn();
   });
   ```

これらの拡張により、テストの保守性と再利用性がさらに向上します。