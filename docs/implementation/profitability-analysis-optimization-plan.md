# 収益性試算分析最適化実装計画（詳細版）

**作成日**: 2025年5月20日  
**更新日**: 2025年5月20日  
**ステータス**: 計画段階  
**担当**: バックエンド開発チーム

## 1. 概要

本計画書は、収益性試算分析機能のパフォーマンス最適化と信頼性向上を実装するための詳細計画を記述したものです。現在の実装では収益性試算結果の削除処理においてシナリオの参照解除に時間がかかり、テストがタイムアウトする問題が発生しています。この問題を解決し、データモデルの設計を改善することで、システム全体の信頼性とパフォーマンスを向上させることを目的としています。

## 2. 現状の課題

### 2.1 特定された問題点

1. **シナリオと収益性試算結果の関係が多対1（非効率）**:
   - 現在の設計では複数のシナリオが1つの収益性試算結果を参照できる
   - この設計により、収益性試算結果の削除時に多数のシナリオの参照を更新する必要がある

2. **逐次処理によるパフォーマンス問題**:
   - シナリオの参照更新がループで1件ずつ実行されている
   - 多数のシナリオがある場合、この処理が120秒以上かかりタイムアウトする

3. **テスト実行の信頼性低下**:
   - 削除テストがタイムアウトするため、テスト実行の信頼性が低下

### 2.2 現在の実装状況

1. **データモデル定義の一部変更済み**:
   - `shared/index.ts`と`backend/src/types/index.ts`では既に型定義が1対1関係に変更済み
   - `Scenario`型では`profitabilityResult`を`profitabilityResultId`に改名済み
   - `ProfitabilityResult`型には`scenarioId`フィールドが追加済み

2. **一部のサービスメソッドは1対1モデルに対応**:
   - `ProfitabilityService.deleteProfitability`メソッドは既に1対1モデルに対応したコードを含む
   - `ScenarioModel.linkToProfitabilityResult`メソッドも1対1関係を前提に実装済み

3. **残存する古いコード**:
   - 他のサービスメソッドやコントローラーに旧モデルを前提としたコードが残っている可能性がある
   - 旧フィールド名（`profitabilityResult`）を参照しているコードがある可能性がある

## 3. 解決アプローチ

### 3.1 データモデルの完全な再設計（1対1関係への移行）

シナリオと収益性試算結果の関係を1対1に完全に変更し、より明確で効率的なデータモデルに再設計します：

1. 各シナリオが独自の収益性試算結果を持つ設計に変更
2. 収益性試算結果にシナリオIDを保持させる（逆参照）
3. 削除時の一貫性を保つためのカスケード削除機能の導入

これによって、収益性試算結果の削除時にループ処理が不要になり、パフォーマンス問題が根本的に解決されます。

### 3.2 MongoDB一括更新操作の活用

万が一の多対1関係が残っている場合に備えて、MongoDB一括更新操作を導入し、パフォーマンスを向上させます：

```typescript
// 一括更新を導入（多対1関係が残っている場合の対策）
await MongoScenarioModel.updateMany(
  { profitabilityResultId: profitabilityId },
  { $unset: { profitabilityResultId: "" } }
);
```

## 4. 対応するAPIエンドポイント

### 4.1 メイン対象エンドポイント

| メソッド | エンドポイント | 概要 | 認証レベル |
|---------|--------------|------|----------|
| DELETE | `/api/v1/analysis/profitability/:id` | 収益性試算結果の削除 | 認証必須 |
| POST | `/api/v1/analysis/scenarios/:scenarioId/profitability` | シナリオからの収益性試算実行 | 認証必須 |
| POST | `/api/v1/analysis/profitability` | 収益性試算の実行 | 認証必須 |
| PUT | `/api/v1/analysis/scenarios/:scenarioId` | シナリオの更新 | 認証必須 |

## 5. データモデル変更

### 5.1 データモデル変更状況

型定義は既に更新されていますが、以下のファイルの実装を確認し、必要に応じて修正します：

- `backend/src/db/models/Scenario.ts`
- `backend/src/db/models/Profitability.ts`
- `backend/src/db/models/schemas/scenario.schema.ts`
- `backend/src/db/models/schemas/profitability.schema.ts`

### 5.2 スキーマ定義更新の確認

`scenario.schema.ts`と`profitability.schema.ts`のスキーマ定義が新しい型定義と一致していることを確認し、必要に応じて更新します。

## 6. 実装改善計画

### 6.1 変更が必要なファイル一覧

```
backend/
└── src/
    ├── features/
    │   └── analysis/
    │       ├── analysis.controller.ts  # 変更要：profitabilityResultの参照を修正
    │       ├── analysis.service.ts     # 変更要：deleteProfitabilityメソッドなど
    │       └── analysis.utils.ts       # 変更要：profitabilityResultの参照を修正
    ├── db/
    │   └── models/
    │       ├── Scenario.ts             # 確認・変更要：全メソッドが1対1モデルに対応
    │       ├── Profitability.ts        # 確認・変更要：全メソッドが1対1モデルに対応
    │       └── schemas/
    │           ├── scenario.schema.ts  # 確認要：schemaの定義が正しいか
    │           └── profitability.schema.ts # 確認要：schemaの定義が正しいか
    └── types/
        └── index.ts                   # 確認済み：型定義は更新済み
```

### 6.2 詳細な変更内容

#### 6.2.1 `Scenario.ts`の変更点

- `findById`メソッドで`profitabilityResultId`を正しく参照するように修正
- `update`メソッドで`profitabilityResultId`を正しく更新するように修正
- `linkToProfitabilityResult`メソッドを確認し、1対1関係を正しく維持できていることを確認
- 必要に応じて、`ScenarioModel`に残っている`profitabilityResult`への参照を`profitabilityResultId`に変更

#### 6.2.2 `Profitability.ts`の変更点

- `create`メソッドが`scenarioId`を正しく取り扱えることを確認
- `update`メソッドが`scenarioId`を正しく更新できることを確認
- 必要に応じて、`ProfitabilityModel`内に新しい`linkToScenario`メソッドを追加

#### 6.2.3 `analysis.service.ts`の変更点

- `ProfitabilityService.deleteProfitability`メソッドを確認し、1対1モデルを正しく処理できていることを確認
- `ScenarioService.executeProfitabilityFromScenario`メソッドが1対1モデルを正しく処理できていることを確認
- `ScenarioService.linkScenarioToProfitability`メソッドを確認し、1対1関係を正しく維持できていることを確認

#### 6.2.4 `analysis.controller.ts`の変更点

- 収益性試算関連のエンドポイントハンドラーを確認し、フィールド名が正しいか確認
- 必要に応じて、`profitabilityResult`への参照を`profitabilityResultId`に変更

#### 6.2.5 `analysis.utils.ts`の変更点

- `calculateProfitability`や関連する関数が新しいフィールド名と1対1モデルに対応していることを確認
- 必要に応じて、`profitabilityResult`への参照を`profitabilityResultId`に変更

### 6.3 コード最適化とクリーンアップ

- 旧モデルに関連する不要なコードを削除
- 一貫性を保つための追加的なバリデーションやエラーハンドリングを追加
- パフォーマンス向上のための最適化（インデックス確認など）を実施

## 7. サービス実装の改善例

### 7.1 収益性試算結果削除処理の改善（既存コードの確認・最適化）

```typescript
/**
 * 収益性試算結果を削除
 * @param profitabilityId 収益性試算結果ID
 * @param userId ユーザーID（権限チェック用）
 * @returns 削除が成功したかどうか
 */
static async deleteProfitability(
  profitabilityId: string,
  userId?: string
): Promise<boolean> {
  try {
    // 結果の取得
    const profitability = await ProfitabilityModel.findById(profitabilityId);
    if (!profitability) {
      return false;
    }
    
    // ユーザーIDが指定されている場合、権限チェック
    if (userId && profitability.userId && profitability.userId !== userId) {
      // 管理者権限のチェックなどの追加ロジックをここに実装
      logger.warn('収益性試算結果削除の権限なし', { userId, profitabilityId });
      return false;
    }
    
    // 関連するシナリオの参照解除（1対1モデル）
    if (profitability.scenarioId) {
      await ScenarioModel.update(
        profitability.scenarioId,
        { profitabilityResultId: undefined }
      );
    }
    
    // 万が一の多対1関係が残っている場合の対策として一括更新を導入
    await MongoScenarioModel.updateMany(
      { profitabilityResultId: profitabilityId },
      { $unset: { profitabilityResultId: "" } }
    );
    
    // 結果の削除
    return await ProfitabilityModel.delete(profitabilityId);
  } catch (error) {
    logger.error('収益性試算結果削除エラー', { error, profitabilityId });
    throw error;
  }
}
```

### 7.2 シナリオと収益性試算結果の関連付け処理の改善

```typescript
/**
 * シナリオに収益性試算結果を関連付ける
 * @param scenarioId シナリオID
 * @param profitabilityId 収益性試算結果ID
 * @returns 更新されたシナリオオブジェクト
 */
static async linkScenarioToProfitability(
  scenarioId: string,
  profitabilityId: string,
  userId?: string
): Promise<Scenario | null> {
  try {
    // シナリオの取得
    const scenario = await ScenarioModel.findById(scenarioId);
    if (!scenario) {
      return null;
    }
    
    // ユーザーIDが指定されている場合、権限チェック
    if (userId && scenario.userId && scenario.userId !== userId) {
      // 管理者権限のチェックなどの追加ロジックをここに実装
      // 将来的な拡張のためのプレースホルダー
      // 現状ではシンプルにユーザーIDが一致するかのみをチェック
      logger.warn('シナリオ更新の権限なし', { userId, scenarioId });
      return null;
    }
    
    // 収益性試算結果の取得
    const profitability = await ProfitabilityModel.findById(profitabilityId);
    if (!profitability) {
      throw new Error(`収益性試算結果が見つかりません (ID: ${profitabilityId})`);
    }
    
    // 関連付けの整合性チェック
    if (profitability.propertyId !== scenario.propertyId || 
        profitability.volumeCheckId !== scenario.volumeCheckId) {
      throw new Error('シナリオと収益性試算結果の関連付けが一致しません');
    }
    
    // 1対1関係を維持するために、以前に関連付けられていたシナリオがあれば参照を解除
    if (profitability.scenarioId && profitability.scenarioId !== scenarioId) {
      await ScenarioModel.update(
        profitability.scenarioId,
        { profitabilityResultId: undefined }
      );
    }
    
    // 以前の収益性試算結果との関連を解除
    if (scenario.profitabilityResultId && scenario.profitabilityResultId !== profitabilityId) {
      await ProfitabilityModel.update(
        scenario.profitabilityResultId,
        { scenarioId: undefined }
      );
    }
    
    // 相互参照を設定
    await ProfitabilityModel.update(profitabilityId, { scenarioId });
    return await ScenarioModel.update(scenarioId, { profitabilityResultId: profitabilityId });
  } catch (error) {
    logger.error('シナリオと収益性試算結果の関連付けエラー', { 
      error, 
      scenarioId, 
      profitabilityId 
    });
    throw error;
  }
}
```

## 8. テスト改善計画

### 8.1 テスト実行の最適化案

1. **テストデータの最小化**:
   - テスト用の物件面積やボリュームチェックパラメータを小さく設定
   - テスト用のシナリオのパラメータも最小構成（例：運用期間を10年以下に設定）

2. **テストの分離**:
   - 特に時間のかかる操作のテストを別ファイルに分離
   - 例： `scenarios-delete-optimized.test.ts` などの最適化されたテストファイルを作成

3. **タイムアウト設定の最適化**:
   - テストの特性に応じて適切なタイムアウト値を設定
   - 軽量テストには短いタイムアウト（5秒未満）、重いテストには長めのタイムアウト（最大120秒）

4. **マイクロテストアプローチ**:
   - `SESSION_MEMORY.md`に記載されている「マイクロテストプラン」を採用
   - 各機能を単一の責務に集中させた超軽量テストを作成

### 8.2 テスト実行時の安定性向上策

1. **テストのアイソレーション強化**:
   - テスト間でデータが影響しないよう、各テストで固有のデータセットを使用
   - テスト前後で明示的なクリーンアップを行う

2. **モック・スタブの活用**:
   - 重い処理（例：計算処理）をモックに置き換えてテストの実行時間を短縮

3. **パラレル実行の検討**:
   - 可能な場合、テストをパラレルに実行して全体のテスト時間を短縮

## 9. 実装プラン

### 9.1 段階的実装アプローチ

1. **準備フェーズ (0.5人日)**:
   - 影響範囲の詳細分析
   - 既存コード内の問題箇所の特定
   - スキーマ定義の確認

2. **コア実装フェーズ (1人日)**:
   - `ProfitabilityService`と`ScenarioService`の更新
   - `ScenarioModel`と`ProfitabilityModel`の更新
   - MongoDB一括更新操作の導入

3. **検証フェーズ (0.5人日)**:
   - テストの更新と実行
   - パフォーマンスの計測と比較
   - エッジケースの検証

4. **クリーンアップフェーズ (0.5人日)**:
   - 不要なコードの削除
   - コードのリファクタリングと最適化
   - ドキュメントの更新

### 9.2 削除予定のコード

以下のコードパターンは不要となるため削除します：

1. 旧フィールド名への参照:
   ```typescript
   // 削除対象: profitabilityResult フィールドへの参照
   scenario.profitabilityResult // -> scenario.profitabilityResultId に変更
   ```

2. 逐次ループによる参照更新:
   ```typescript
   // 削除対象: 収益性試算結果を参照しているシナリオを1件ずつ更新するループ
   const scenariosResult = await ScenarioModel.findAll({ profitabilityResult: profitabilityId });
   for (const scenario of scenariosResult.scenarios) {
     await ScenarioModel.update(scenario.id, { profitabilityResult: undefined });
   }
   ```

3. 多対1関係を前提とした不要なコード:
   ```typescript
   // 削除対象: 多対1関係を前提とした条件分岐や処理
   ```

## 10. リスクと対策

### 10.1 パフォーマンスリスク

- **リスク**: 新しいデータモデルでも別の性能問題が発生する可能性
- **対策**:
  - 実装前後でのパフォーマンス計測と比較
  - クエリの最適化とインデックス確認
  - 大量データ時のエッジケーステスト実施

### 10.2 APIの下位互換性リスク

- **リスク**: API変更によるクライアント側の問題
- **対策**:
  - APIの外部インターフェースは変更せず、内部実装のみ変更
  - フロントエンド開発者と変更内容について綿密に連携

### 10.3 移行期間中のリスク

- **リスク**: 部分的な実装による一時的な不整合
- **対策**:
  - テスト環境での完全な検証後に本番環境へ移行
  - 一括デプロイによる移行
  - ロールバック計画の準備

## 11. 成功基準

実装成功の判断基準は以下の通りです：

1. **テスト実行時間**:
   - シナリオ削除テストが5秒以内に完了
   - 全てのテストが設定されたタイムアウト時間内（120秒以内）に完了

2. **データ整合性**:
   - すべてのテストケースが正常に実行できる
   - 1対1関係が常に保たれている

3. **コード品質**:
   - 旧モデルに関する参照が完全に削除されている
   - コードの一貫性が保たれている

## 12. 結論と推奨事項

この計画書では、収益性試算分析機能のパフォーマンス問題に対する解決策としてデータモデルの再設計を提案しました。プロジェクトが初期段階であることを考慮すると、シナリオと収益性試算結果の関係を1対1に変更するデータモデルの再設計が最も望ましい解決策です。

すでに型定義は新しいモデルに更新されているため、実装部分を完全に対応させることで問題を完全に解決できます。また、テストの最適化による安定性向上も同時に行うことで、開発効率と品質の両方を高めることができます。

推奨事項：
1. データモデルを1対1関係に完全移行
2. MongoDB一括更新操作の導入によるパフォーマンス向上
3. テストの最適化によるテスト実行時間の短縮
4. 不要なコードの削除によるコードベースの最適化

このアプローチにより、現在のパフォーマンス問題を根本的に解決し、将来的な機能拡張にも対応できる基盤を整備します。