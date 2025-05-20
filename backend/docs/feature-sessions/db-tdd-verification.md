# データベース中心テスト（DB-TDD）検証

## 1. シナリオ関連テストのタイムアウト問題の根本原因

シナリオ関連テストのタイムアウト問題を根本的に解決するためには、単にタイムアウト値を延長するのではなく、なぜこれほど時間がかかるのかを詳細に調査し、解決する必要があります。

### 1.1 根本原因分析

1. **データモデルの問題**:
   - シナリオと収益性試算結果の関係が多対1から1対1に移行途中
   - 実際のデータでは多対1関係が残っており、参照更新処理が非効率
   - データ整合性の維持に関わる処理が複雑で重い

2. **不必要な計算の繰り返し**:
   - シナリオ作成時に建物形状や規制チェックを再計算している
   - ボリュームチェック結果から必要な情報だけを使用すべきところ、全計算をやり直している
   - 同じような計算が複数の場所で行われ、冗長性が高い

3. **データベース操作の非効率性**:
   - 1件ずつループ処理でのDBアクセスが多い
   - MongoDB一括更新操作の未使用
   - トランザクション管理が最適化されていない

4. **テストデータサイズの問題**:
   - 不必要に大きな物件サイズや階数を使用している
   - 計算期間が長すぎる（運用30年が標準）
   - 複雑な形状データを使用している

## 2. データベースの実態検証

DB-TDDアプローチでは、まず実際のデータベースの状態を確認し、その実態に基づいて解決策を検討することが重要です。

### 2.1 検証すべきデータベース項目

1. **Scenarioコレクションのデータ構造**:
   ```javascript
   // 実行コマンド
   db.scenarios.findOne()
   ```

   期待される結果:
   ```javascript
   {
     "_id": ObjectId("..."),
     "propertyId": "...",
     "volumeCheckId": "...",
     "name": "テストシナリオ",
     "params": {
       "assetType": "MANSION",
       "rentPerSqm": 3000,
       "occupancyRate": 95,
       // その他のパラメータ...
     },
     "profitabilityResultId": "...", // 1対1関係の場合のみ存在
     "createdAt": ISODate("..."),
     "updatedAt": ISODate("...")
   }
   ```

2. **Profitabilityコレクションのデータ構造**:
   ```javascript
   // 実行コマンド
   db.profitabilities.findOne()
   ```

   期待される結果:
   ```javascript
   {
     "_id": ObjectId("..."),
     "propertyId": "...",
     "volumeCheckId": "...",
     "scenarioId": "...", // 1対1関係の場合のみ存在
     "assetType": "MANSION",
     // その他のフィールド...
     "createdAt": ISODate("..."),
     "updatedAt": ISODate("...")
   }
   ```

3. **シナリオと収益性試算結果の関係の確認**:
   ```javascript
   // 実行コマンド
   db.scenarios.find({ profitabilityResultId: { $exists: true } }).count()
   db.profitabilities.find({ scenarioId: { $exists: true } }).count()
   ```

4. **データの一貫性検証**:
   ```javascript
   // 実行コマンド
   // シナリオが参照する収益性試算結果が実際に存在するか
   db.scenarios.find({ profitabilityResultId: { $exists: true } }).forEach(function(scenario) {
     var profitability = db.profitabilities.findOne({ _id: ObjectId(scenario.profitabilityResultId) });
     if (!profitability) {
       print("整合性エラー: シナリオID " + scenario._id + " は存在しない収益性試算結果 " + scenario.profitabilityResultId + " を参照しています");
     } else if (profitability.scenarioId !== scenario._id.toString()) {
       print("相互参照エラー: シナリオ " + scenario._id + " と収益性試算結果 " + profitability._id + " の参照が一致しません");
     }
   });
   ```

## 3. 問題解決アプローチ（根本的な解決策）

### 3.1 データモデルの完全刷新（1対1関係の徹底）

1. **データベースマイグレーションの実施**:
   - すべてのシナリオと収益性試算結果の関係を1対1に統一
   - 古い多対1関係のデータをクリーンアップ
   - データモデルとスキーマの整合性確保

   ```javascript
   // マイグレーションスクリプト例
   // 1. 各収益性試算結果に関連付けられたシナリオを最大1つに制限
   db.profitabilities.find().forEach(function(profitability) {
     // 関連するすべてのシナリオを検索
     var scenarios = db.scenarios.find({ profitabilityResultId: profitability._id.toString() }).toArray();
     
     if (scenarios.length > 1) {
       // 最も新しいシナリオのみを保持
       scenarios.sort(function(a, b) { return b.updatedAt - a.updatedAt; });
       var newestScenario = scenarios[0];
       
       // 古いシナリオの参照を解除
       for (var i = 1; i < scenarios.length; i++) {
         db.scenarios.updateOne(
           { _id: scenarios[i]._id },
           { $unset: { profitabilityResultId: "" } }
         );
       }
       
       // 収益性試算結果にシナリオIDを設定
       db.profitabilities.updateOne(
         { _id: profitability._id },
         { $set: { scenarioId: newestScenario._id.toString() } }
       );
     }
   });
   ```

2. **相互参照の整合性強化**:
   - シナリオを削除する際は関連する収益性試算結果も同時に削除
   - 収益性試算結果を削除する際はシナリオの参照を確実にクリーンアップ
   - 循環参照やデータ不整合を防止するための検証ロジック追加

### 3.2 計算処理の効率化

1. **計算結果の再利用**:
   - ボリュームチェック結果から必要なデータのみを抽出して利用
   - 同じ計算を繰り返し行わないよう結果をキャッシュ
   - 不要な再計算を省略するためのフラグ導入

2. **段階的計算の導入**:
   - 重い計算を複数のステップに分割
   - 必要な計算のみを実行するよう最適化
   - 計算の依存関係を明確にして不要な計算をスキップ

### 3.3 データベース操作の最適化

1. **一括操作の徹底**:
   - すべてのデータベース更新操作でループ処理を一括操作に置き換え
   - インデックスの最適化によるクエリ効率向上
   - MongoDB集約フレームワークの活用による処理効率化

2. **効率的なトランザクション管理**:
   - テスト中のデータベース操作をよりきめ細かく管理
   - 各テストで独立したデータセットを使用
   - 並列処理の導入とリソース競合の回避

### 3.4 テストデータ最適化

1. **超軽量テストデータの標準化**:
   - 物件面積: 50㎡以下
   - 階数: 2階のみ
   - 運用期間: 3年以下
   - 形状: 単純な矩形（4頂点）

2. **テストデータをコード管理**:
   - テストで使用するすべてのデータを定数として管理
   - データサイズを常に監視し、必要最小限に保つ
   - 重いテストと軽いテストの明確な分離

## 4. 実行計画と検証

### 4.1 コード検証のステップ（根本的解決）

1. データベースの実態を確認し、現在の状況を詳細に把握
2. 1対1関係を確実に維持するマイグレーションスクリプトを作成・実行
3. シナリオと収益性試算結果の相互参照処理を改善
4. 一括更新操作をすべての関連箇所に導入
5. テストデータを超軽量化して標準テンプレートを作成
6. テスト実行時間を計測し、各改善の効果を検証

### 4.2 期待される成果

- シナリオ関連テストの実行時間: **60秒以内**（従来の1/2以下）
- データベースの一貫性: **100%**（参照整合性エラーゼロ）
- テストの信頼性: 安定して実行可能なテストスイート
- CI/CD環境での実行安定性: 標準環境でのテスト実行成功率向上

この根本的なアプローチにより、単にタイムアウト値を延長するのではなく、実際の問題を解決し、テストの実行時間を大幅に短縮することが可能になります。また、データモデルの健全性も向上し、アプリケーション全体のパフォーマンス向上にもつながります。