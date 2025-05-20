# シナリオテスト最適化計画

## 1. 問題の詳細な分析

### 1.1 現状の問題点

1. **シナリオ削除・更新のテストが遅い**：
   - シナリオと収益性試算結果の多対1関係が影響している
   - 収益性試算結果を削除する際に、参照しているシナリオをループで一件ずつ更新している
   - 多数のシナリオがある場合、この処理が数分かかりタイムアウトする

2. **テストデータのサイズが大きい**：
   - 物件の面積（大きい）
   - 建物の階数（多い）
   - 運用期間（長い：30年）
   - これらが計算コストの増大を引き起こしている

3. **テスト前処理が重い**：
   - 物件の作成
   - ボリュームチェックの実行
   - シナリオの作成
   - これらがすべての統合テストで毎回実行されている

### 1.2 すでに実施された改善策

1. **データモデルの1対1関係への移行**：
   - 型定義はすでに1対1関係に更新されている
   - `ScenarioModel.linkToProfitabilityResult`メソッドを強化して相互参照の整合性を維持

2. **MongoDB一括更新操作の導入**：
   ```typescript
   await MongoScenarioModel.updateMany(
     { profitabilityResultId: profitabilityId },
     { $unset: { profitabilityResultId: "" } }
   );
   ```

3. **テストパラメータ最適化**：
   - 運用期間短縮（30年→5年→3年）
   - テストケースのタイムアウト設定適正化（120秒→30秒）

## 2. シナリオ削除テスト最適化プラン

### 2.1 さらなる最適化のポイント

1. **超軽量テストデータの徹底**：
   - 物件面積をさらに小さく（50㎡以下）
   - 建物階数を最小に（2階）
   - 運用期間を超短期に（3年以下）

2. **一括更新処理の拡充**：
   - シナリオや収益性試算結果のCRUD操作すべてで一括更新を使用
   - 単一更新と一括更新を併用し信頼性を高める

3. **テスト前処理の共有**：
   - テスト間でのセットアップの共有
   - 物件とボリュームチェックの再利用
   - 専用の軽量データ作成ヘルパーの導入

4. **MilestoneTrackerの活用**：
   - 詳細な処理時間計測
   - ボトルネックの可視化
   - タイムアウト原因の特定を容易に

### 2.2 シナリオ削除テスト（scenarios-delete-micro.test.ts）の実装案

```typescript
/**
 * シナリオ削除マイクロテスト - 超軽量版
 * - タイムアウト30秒以内で実行完了を目指す
 * - 専用の超小型テストデータを使用
 * - マイルストーンログによる詳細な処理時間計測
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

describe('シナリオ削除マイクロテスト', () => {
  // マイルストーントラッカー
  const tracker = new MilestoneTracker();
  
  // 認証ヘッダーとテストIDs
  let authHeader: string;
  let testPropertyId: string;
  let testVolumeCheckId: string;
  let testScenarioId: string;
  
  // 超小型テスト用の物件データ
  const microPropertyData = {
    name: 'シナリオ削除マイクロテスト物件',
    address: '福岡県福岡市中央区天神1-1-1',
    area: 50, // 極小の面積
    zoneType: ZoneType.CATEGORY9,
    fireZone: FireZoneType.FIRE,
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 100000000,
    status: PropertyStatus.ACTIVE,
    notes: 'シナリオ削除マイクロテスト用',
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
    
    // テスト用のシナリオを作成
    tracker.setOperation('テストシナリオ作成');
    const scenarioName = 'シナリオ削除マイクロテスト' + Date.now();
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: microScenarioParams
      });
    
    testScenarioId = scenarioRes.body.data.id;
    tracker.mark('シナリオ作成完了');
    
    console.log(`セットアップ完了: 物件ID=${testPropertyId}, ボリュームチェックID=${testVolumeCheckId}, シナリオID=${testScenarioId}`);
  }, 60000); // 1分のタイムアウト
  
  // テスト実行後のクリーンアップ
  afterAll(async () => {
    tracker.setOperation('データベース切断');
    await disconnectDB();
    tracker.mark('テスト終了');
    tracker.cleanup();
  });
  
  // 認証なしでのアクセス禁止テスト
  it('認証なしでシナリオを削除できない', async () => {
    tracker.setOperation('認証なし削除リクエスト送信');
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${testScenarioId}`);
    
    tracker.mark('認証なし削除レスポンス受信');
    expect(res.status).toBe(401);
  }, 5000);
  
  // 存在しないIDのテスト
  it('存在しないシナリオIDでは404が返される', async () => {
    tracker.setOperation('存在しないID削除リクエスト送信');
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    
    const res = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${nonExistentId}`)
      .set('Authorization', authHeader);
    
    tracker.mark('存在しないID削除レスポンス受信');
    expect(res.status).toBe(404);
  }, 5000);
  
  // シナリオ削除テスト
  it('認証済みユーザーはシナリオを削除できる', async () => {
    // ベーステストで使用するシナリオを削除
    tracker.setOperation('シナリオ削除リクエスト送信');
    const deleteRes = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${testScenarioId}`)
      .set('Authorization', authHeader);
    
    tracker.mark('シナリオ削除レスポンス受信');
    expect(deleteRes.status).toBe(204);
    
    // 削除確認
    tracker.setOperation('削除確認リクエスト送信');
    const getRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${testScenarioId}`)
      .set('Authorization', authHeader);
    
    tracker.mark('削除確認レスポンス受信');
    expect(getRes.status).toBe(404);
    
    tracker.mark('削除テスト完了');
  }, 30000);
  
  // 収益性試算結果を持つシナリオの削除テスト
  it('収益性試算結果を持つシナリオも削除できる', async () => {
    // 新しいシナリオを作成
    tracker.setOperation('新規シナリオ作成');
    const scenarioName = 'シナリオ削除マイクロテスト2-' + Date.now();
    const scenarioRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios`)
      .set('Authorization', authHeader)
      .send({
        propertyId: testPropertyId,
        volumeCheckId: testVolumeCheckId,
        name: scenarioName,
        params: microScenarioParams
      });
    
    const scenarioId = scenarioRes.body.data.id;
    tracker.mark('新規シナリオ作成完了');
    
    // 収益性試算を実行
    tracker.setOperation('収益性試算実行');
    const profitabilityRes = await request(app)
      .post(`${baseUrl}/analysis/scenarios/${scenarioId}/profitability`)
      .set('Authorization', authHeader);
    
    expect(profitabilityRes.status).toBe(201);
    tracker.mark('収益性試算完了');
    
    // シナリオ削除
    tracker.setOperation('収益性あるシナリオ削除');
    const deleteRes = await request(app)
      .delete(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(deleteRes.status).toBe(204);
    tracker.mark('収益性あるシナリオ削除完了');
    
    // 削除確認
    tracker.setOperation('削除確認');
    const getRes = await request(app)
      .get(`${baseUrl}/analysis/scenarios/${scenarioId}`)
      .set('Authorization', authHeader);
    
    expect(getRes.status).toBe(404);
    tracker.mark('削除確認完了');
  }, 60000);
});
```

## 3. マイルストーンロガーの実装

処理の詳細な時間計測と問題箇所の特定のために、以下のマイルストーンロガーを活用します。

```typescript
// utils/milestone-tracker.ts
export class MilestoneTracker {
  private milestones: { [key: string]: number } = {};
  private currentOp: string = "初期化";
  private startTime: number = Date.now();
  private statusTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 1秒ごとに現在の状態を報告
    this.statusTimer = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      console.log(`[${elapsed.toFixed(2)}秒経過] 現在の状態: ${this.currentOp}`);
    }, 1000);
  }

  // 操作の開始を記録
  setOperation(op: string): void {
    this.currentOp = op;
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] ▶️ 開始: ${op}`);
  }

  // マイルストーンを記録
  mark(name: string): void {
    this.milestones[name] = Date.now();
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] 🏁 マイルストーン: ${name}`);
  }

  // クリーンアップ
  cleanup(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    
    // マイルストーン間の経過時間を表示
    const sortedMilestones = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);
    console.log("\n--- マイルストーン経過時間 ---");
    
    for (let i = 1; i < sortedMilestones.length; i++) {
      const prev = sortedMilestones[i-1];
      const curr = sortedMilestones[i];
      const diffSec = (curr[1] - prev[1]) / 1000;
      console.log(`${prev[0]} → ${curr[0]}: ${diffSec.toFixed(2)}秒`);
    }
    
    const totalSec = (Date.now() - this.startTime) / 1000;
    console.log(`総実行時間: ${totalSec.toFixed(2)}秒\n`);
  }
}
```

## 4. テストデータ最適化ガイドライン

より効率的なテスト実行のために、以下のガイドラインを推奨します：

1. **物件サイズ**：
   - テスト用物件は面積50㎡以下
   - シンプルな矩形形状（4点のみ）
   - 幅・奥行きは小さい値（5-10m程度）

2. **建築パラメータ**：
   - 階数：2-3階を推奨
   - 共用部比率：10%程度
   - 階高：標準的な3.0m

3. **収益計算パラメータ**：
   - 運用期間：3-5年（30年は不要）
   - 賃料単価：標準値のみテスト
   - 稼働率・管理コスト率：標準値のみテスト

4. **タイムアウト設定**：
   - 基本認証テスト：5秒
   - 単一操作テスト：30秒
   - 複合操作テスト：60秒

これらのガイドラインを適用することで、テスト実行時間を大幅に短縮し、CI/CD環境での安定した実行が可能になります。