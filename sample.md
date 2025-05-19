# 垂直スライス実装タスクリスト

## 1. 垂直スライス実装順序一覧

| 順序 | スライス名 | 主要機能 | 依存スライス | 優先度 | 見積工数 |
|-----|-----------|---------|------------|--------|--------|
| 1 | 認証基盤 | ユーザー認証・ログイン | なし | 最高 | 47h |
| 2 | 物件管理基盤 | 物件情報管理・文書管理 | 認証基盤 | 高 | 65h |
| 3 | 測量図アップロードと形状抽出 | 敷地形状管理 | 物件管理基盤 | 高 | 55h |
| 4 | ボリュームチェック | 建築可能ボリューム計算 | 測量図・形状抽出 | 最高 | 70h |
| 5 | 3Dモデル生成 | 視覚的表現の実装 | ボリュームチェック | 中 | 50h |
| 6 | 収益性試算 | 財務分析と比較 | ボリュームチェック | 高 | 60h |

## 2. データ依存関係順のAPI実装一覧

| タスク番号 | エンドポイント | メソッド | 説明 | 認証要否 | 対応フロントエンドページ | バックエンド実装 | テスト通過 | フロントエンド実装 |
|-----------|--------------|--------|------|----------|----------------------|--------------|------------|-----------------|
| **1.1** | `/api/v1/auth/login` | POST | ユーザーログイン | 不要 | LoginPage | [ ] | [ ] | [ ] |
| **1.2** | `/api/v1/auth/refresh` | POST | アクセストークン更新 | 不要 | （バックグラウンド処理） | [ ] | [ ] | [ ] |
| **1.3** | `/api/v1/auth/me` | GET | 現在のユーザー情報取得 | 必要 | AuthContext（初期ロード時） | [ ] | [ ] | [ ] |
| **1.4** | `/api/v1/auth/logout` | POST | ログアウト | 必要 | 全画面のヘッダーナビゲーション | [ ] | [ ] | [ ] |
| **2.1** | `/api/v1/geocode` | GET | 住所からジオコーディング | 必要 | PropertyRegisterPage, PropertyDetailPage（編集モード） | [ ] | [ ] | [ ] |
| **2.2** | `/api/v1/properties` | POST | 新規物件登録 | 必要 | PropertyRegisterPage | [ ] | [ ] | [ ] |
| **2.3** | `/api/v1/properties` | GET | 物件一覧取得 | 必要 | DashboardPage, PropertyListPage | [ ] | [ ] | [ ] |
| **2.4** | `/api/v1/properties/:id` | GET | 物件詳細取得 | 必要 | PropertyDetailPage | [ ] | [ ] | [ ] |
| **2.5** | `/api/v1/properties/:id` | PUT | 物件情報更新 | 必要 | PropertyDetailPage（編集モード） | [ ] | [ ] | [ ] |
| **2.6** | `/api/v1/properties/:id` | DELETE | 物件削除 | 必要 | PropertyListPage, PropertyDetailPage | [ ] | [ ] | [ ] |
| **2.7** | `/api/v1/properties/:id/documents` | POST | 物件文書アップロード | 必要 | PropertyDetailPage（文書タブ） | [ ] | [ ] | [ ] |
| **2.8** | `/api/v1/properties/:id/documents` | GET | 物件関連文書一覧 | 必要 | PropertyDetailPage（文書タブ） | [ ] | [ ] | [ ] |
| **2.9** | `/api/v1/properties/:id/documents/:docId` | GET | 物件文書詳細 | 必要 | PropertyDetailPage（文書プレビュー） | [ ] | [ ] | [ ] |
| **2.10** | `/api/v1/properties/:id/documents/:docId` | DELETE | 物件文書削除 | 必要 | PropertyDetailPage（文書タブ） | [ ] | [ ] | [ ] |
| **2.11** | `/api/v1/properties/:id/history` | GET | 物件更新履歴取得 | 必要 | PropertyDetailPage（履歴タブ） | [ ] | [ ] | [ ] |
| **3.1** | `/api/v1/properties/upload-survey` | POST | 測量図アップロード | 必要 | PropertyRegisterPage, PropertyDetailPage（形状タブ） | [ ] | [ ] | [ ] |
| **3.2** | `/api/v1/properties/:id/shape` | PUT | 敷地形状更新 | 必要 | PropertyDetailPage（形状タブ）, VolumeCheckPage | [ ] | [ ] | [ ] |
| **3.3** | `/api/v1/properties/:id/shape` | GET | 敷地形状取得 | 必要 | PropertyDetailPage（形状タブ）, VolumeCheckPage | [ ] | [ ] | [ ] |
| **4.1** | `/api/v1/analysis/volume-check` | POST | ボリュームチェック実行 | 必要 | VolumeCheckPage | [ ] | [ ] | [ ] |
| **4.2** | `/api/v1/analysis/volume-check/:id` | GET | ボリュームチェック結果取得 | 必要 | VolumeCheckPage, ProfitabilityAnalysisPage | [ ] | [ ] | [ ] |
| **5.1** | `/api/v1/analysis/volume-check/:id/model` | POST | 3Dモデル生成 | 必要 | VolumeCheckPage（3Dビューア） | [ ] | [ ] | [ ] |
| **5.2** | `/api/v1/analysis/volume-check/:id/model` | GET | 3Dモデルデータ取得 | 必要 | VolumeCheckPage（3Dビューア） | [ ] | [ ] | [ ] |
| **6.1** | `/api/v1/analysis/profitability` | POST | 収益性試算実行 | 必要 | ProfitabilityAnalysisPage | [ ] | [ ] | [ ] |
| **6.2** | `/api/v1/analysis/profitability/:id` | GET | 収益性試算結果取得 | 必要 | ProfitabilityAnalysisPage | [ ] | [ ] | [ ] |
| **6.3** | `/api/v1/analysis/scenarios` | POST | シナリオ作成 | 必要 | ProfitabilityAnalysisPage（シナリオタブ） | [ ] | [ ] | [ ] |
| **6.4** | `/api/v1/analysis/scenarios` | GET | シナリオ一覧取得 | 必要 | ProfitabilityAnalysisPage（シナリオタブ） | [ ] | [ ] | [ ] |
| **6.5** | `/api/v1/analysis/scenarios/:id` | GET | シナリオ詳細取得 | 必要 | ProfitabilityAnalysisPage（シナリオ詳細） | [ ] | [ ] | [ ] |
| **6.6** | `/api/v1/analysis/scenarios/:id` | PUT | シナリオ更新 | 必要 | ProfitabilityAnalysisPage（シナリオ編集） | [ ] | [ ] | [ ] |
| **6.7** | `/api/v1/analysis/scenarios/:id` | DELETE | シナリオ削除 | 必要 | ProfitabilityAnalysisPage（シナリオタブ） | [ ] | [ ] | [ ] |

## 3. 垂直スライス #1: 認証基盤

### 対象エンティティ
- User
- RefreshToken

### 機能範囲
- ユーザーログイン/ログアウト
- JWTによる認証
- リフレッシュトークンによるアクセストークン再発行
- ユーザー情報取得
- 認証ミドルウェア

### 実装タスク

#### 共通基盤（優先度: 最高）
- [ ] 共有型定義の実装 (shared/index.ts) - 認証関連の型定義とAPIパス (3h)
- [ ] 環境変数とアプリケーション設定の構築 (backend/src/config/) (2h)
- [ ] エラーハンドリングミドルウェアの実装 (2h)
- [ ] レスポンスフォーマットユーティリティの実装 (1h)

#### データベース層（優先度: 高）
- [ ] User DBモデルの実装 (2h)
- [ ] RefreshToken DBモデルの実装 (1h)
- [ ] テスト用シードデータの作成 (1h)
- [ ] インデックス設定とパフォーマンス最適化 (1h)

#### バックエンドAPI（優先度: 高）
- [ ] auth.controller.ts の実装 - ログイン/ログアウト/リフレッシュ処理 (4h)
- [ ] auth.service.ts の実装 - トークン生成と検証 (3h)
- [ ] auth.routes.ts の実装 - エンドポイント定義 (1h)
- [ ] auth.middleware.ts の実装 - 認証状態検証 (2h)
- [ ] auth.validator.ts の実装 - バリデーションルール (2h)

#### フロントエンド（優先度: 高）
- [ ] AuthContext.tsx の実装 - 認証状態管理 (3h)
- [ ] useAuth.ts フックの実装 (2h)
- [ ] tokenService.ts の実装 - トークン管理 (2h)
- [ ] LoginForm コンポーネントの実装 (3h)
- [ ] ProtectedRoute コンポーネントの実装 (2h)
- [ ] api.ts - 認証API連携の実装 (2h)
- [ ] LoginPage の実装 (3h)

#### テスト（優先度: 中）
- [ ] User DBモデルのユニットテスト (2h)
- [ ] 認証コントローラーのユニットテスト (2h)
- [ ] 認証サービスのユニットテスト (2h)
- [ ] 認証フローの統合テスト (3h)
- [ ] フロントエンド認証コンポーネントのテスト (3h)

## 4. 垂直スライス #2: 物件管理基盤

### 対象エンティティ
- Property
- Document
- HistoryEntry

### 機能範囲
- 物件一覧表示
- 物件登録
- 物件詳細表示と編集
- 物件関連文書管理
- 物件更新履歴管理

### 実装タスク

#### 共通基盤（優先度: 最高）
- [ ] Property、Document関連の型定義を shared/index.ts に追加 (2h)
- [ ] APIパス定義の追加 - PROPERTIES 名前空間 (1h)
- [ ] バリデーションルールの定義 - VALIDATION_RULES.PROPERTY (1h)

#### データベース層（優先度: 高）
- [ ] Property DBモデルの実装 (2h)
- [ ] Document DBモデルの実装 (2h)
- [ ] HistoryEntry DBモデルの実装 (1h)
- [ ] リレーションシップの設定 (1h)
- [ ] インデックス設定 (1h)

#### バックエンドAPI（優先度: 高）
- [ ] properties.controller.ts - CRUD操作の実装 (4h)
- [ ] properties.service.ts - ビジネスロジックの実装 (3h)
- [ ] properties.routes.ts - ルート定義 (1h)
- [ ] properties.validator.ts - バリデーション実装 (2h)
- [ ] documents.controller.ts - 文書管理APIの実装 (3h)
- [ ] history.controller.ts - 更新履歴APIの実装 (2h)

#### フロントエンド（優先度: 高）
- [ ] properties/api.ts - API連携モジュールの実装 (2h)
- [ ] useProperty.ts - カスタムフック実装 (2h)
- [ ] useDocuments.ts - 文書管理フック実装 (2h)
- [ ] PropertyList コンポーネント - 物件一覧表示 (3h)
- [ ] PropertyForm コンポーネント - 登録・編集フォーム (4h)
- [ ] PropertyDetail コンポーネント - 詳細表示 (3h)
- [ ] DocumentUploader コンポーネント - 文書アップロード (3h)
- [ ] DocumentList コンポーネント - 文書一覧 (2h)
- [ ] HistoryList コンポーネント - 更新履歴表示 (2h)
- [ ] PropertyListPage - 物件一覧ページ (3h)
- [ ] PropertyRegisterPage - 物件登録ページ (3h)
- [ ] PropertyDetailPage - 物件詳細ページ (4h)
- [ ] ルーティング設定の追加 (1h)

#### テスト（優先度: 中）
- [ ] Property DBモデルのユニットテスト (2h)
- [ ] Document DBモデルのユニットテスト (1h)
- [ ] PropertyController のユニットテスト (2h)
- [ ] 物件CRUD操作の統合テスト (3h)
- [ ] 文書アップロード・管理の統合テスト (2h)
- [ ] フロントエンドコンポーネントのテスト (3h)

## 5. 垂直スライス #3: 測量図アップロードと形状抽出

### 対象エンティティ
- PropertyShape
- 測量図処理エンジン

### 機能範囲
- 測量図アップロード
- 土地形状の自動抽出
- 敷地形状の手動編集
- 住所からのジオコーディング

### 実装タスク

#### 共通基盤（優先度: 高）
- [ ] PropertyShape 関連の型定義を shared/index.ts に追加/拡張 (2h)
- [ ] 測量図処理関連のAPIパス定義の追加 (1h)
- [ ] 座標データのバリデーションルール定義 (1h)

#### バックエンド処理エンジン（優先度: 最高）
- [ ] FileUploader サービスの実装 - 測量図アップロード処理 (3h)
- [ ] ShapeExtractor サービスの実装 - PDF/画像からの形状抽出 (8h)
- [ ] GeocodingService の実装 - 住所→座標変換 (3h)
- [ ] ShapeProcessor サービスの実装 - 形状データの正規化・検証 (4h)
- [ ] shape.controller.ts の実装 - 形状管理API (3h)
- [ ] shape.routes.ts の実装 - APIルート定義 (1h)

#### フロントエンド（優先度: 高）
- [ ] SurveyUploader コンポーネント - 測量図アップロードUI (4h)
- [ ] ShapeEditor コンポーネント - 形状編集インターフェース (6h)
- [ ] useShape フックの実装 - 形状データ管理 (2h)
- [ ] 座標変換ユーティリティの実装 (2h)
- [ ] 形状抽出API連携モジュールの実装 (2h)
- [ ] GeocodingAPI連携の実装 (2h)
- [ ] PropertyRegisterPage の拡張 - 形状処理統合 (3h)
- [ ] PropertyDetailPage の拡張 - 形状タブ追加 (3h)

#### テスト（優先度: 中）
- [ ] ShapeExtractor サービスのユニットテスト (3h)
- [ ] GeocodingService のユニットテスト (2h)
- [ ] 形状抽出プロセスの統合テスト (3h)
- [ ] フロントエンド形状編集機能のテスト (3h)

## 6. 垂直スライス #4: ボリュームチェック

### 対象エンティティ
- VolumeCheck
- BuildingParams
- VolumeCheckResult
- RegulationCheck

### 機能範囲
- 建築条件の設定
- 建築可能ボリュームの計算
- 法規制チェック
- 容積消化率の計算
- 階別データの生成

### 実装タスク

#### 共通基盤（優先度: 高）
- [ ] ボリュームチェック関連の型定義を shared/index.ts に追加/拡張 (3h)
- [ ] ボリュームチェックAPIパス定義の追加 (1h)
- [ ] 計算パラメータのバリデーションルール定義 (2h)

#### バックエンド計算エンジン（優先度: 最高）
- [ ] BuildingVolumeCalculator サービスの実装 - コア計算エンジン (8h)
- [ ] RegulationChecker サービスの実装 - 法規制適合チェック (6h)
- [ ] volumeCheck.controller.ts の実装 - ボリュームチェックAPI (4h)
- [ ] volumeCheck.service.ts の実装 - ビジネスロジック (5h)
- [ ] volumeCheck.routes.ts の実装 - ルート定義 (1h)
- [ ] 建築基準法関連の定数とルールの実装 (4h)
- [ ] キャッシュ戦略の実装 - 計算結果の最適化 (3h)

#### フロントエンド（優先度: 高）
- [ ] VolumeCheckForm コンポーネント - 計算パラメータ入力 (4h)
- [ ] VolumeCheckResult コンポーネント - 結果表示 (4h)
- [ ] AssetTypeSelector コンポーネント - アセットタイプ選択 (2h)
- [ ] FloorBreakdown コンポーネント - 階別データ表示 (3h)
- [ ] RegulationCheckList コンポーネント - 法規制チェック表示 (3h)
- [ ] useVolumeCheck フックの実装 - 計算状態管理 (3h)
- [ ] ボリュームチェックAPI連携モジュールの実装 (2h)
- [ ] VolumeCheckPage の実装 - 全体統合 (5h)
- [ ] PDF出力機能の実装 (3h)

#### テスト（優先度: 中）
- [ ] BuildingVolumeCalculator のユニットテスト (4h)
- [ ] RegulationChecker のユニットテスト (3h)
- [ ] ボリュームチェック計算の統合テスト (3h)
- [ ] フロントエンドコンポーネントのテスト (3h)

## 7. 垂直スライス #5: 3Dモデル生成

### 対象エンティティ
- Model3DData
- Three.js 関連コンポーネント

### 機能範囲
- 敷地形状の3D表示
- 建築ボリュームの3Dモデル生成
- インタラクティブな3Dビューア
- 視点操作と表示制御

### 実装タスク

#### 共通基盤（優先度: 中）
- [ ] 3Dモデル関連の型定義を shared/index.ts に追加/拡張 (2h)
- [ ] 3Dモデル生成APIパス定義の追加 (1h)
- [ ] モデルデータのシリアライズ/デシリアライズ仕様の定義 (2h)

#### バックエンド処理エンジン（優先度: 高）
- [ ] ModelGenerator サービスの実装 - 3Dモデルデータ生成 (6h)
- [ ] SiteModelBuilder サービスの実装 - 敷地モデル生成 (4h)
- [ ] BuildingModelBuilder サービスの実装 - 建物モデル生成 (5h)
- [ ] model.controller.ts の実装 - 3Dモデル管理API (3h)
- [ ] model.routes.ts の実装 - APIルート定義 (1h)
- [ ] モデルキャッシュ戦略の実装 (2h)

#### フロントエンド（優先度: 高）
- [ ] ThreeJsViewer コンポーネント - 3Dビューア基盤 (6h)
- [ ] SiteRenderer コンポーネント - 敷地形状表示 (4h)
- [ ] BuildingRenderer コンポーネント - 建物ボリューム表示 (5h)
- [ ] ViewControls コンポーネント - カメラ・視点操作UI (3h)
- [ ] useModel フックの実装 - 3Dモデル状態管理 (2h)
- [ ] 3Dモデル生成API連携モジュールの実装 (2h)
- [ ] VolumeCheckPage の拡張 - 3Dビューア統合 (3h)

#### テスト（優先度: 低）
- [ ] ModelGenerator のユニットテスト (3h)
- [ ] モデル生成プロセスの統合テスト (2h)
- [ ] フロントエンド3Dビューアのテスト (2h)
- [ ] パフォーマンステスト (2h)

## 8. 垂直スライス #6: 収益性試算

### 対象エンティティ
- ProfitabilityResult
- Scenario
- FinancialParams
- AnnualFinancialData

### 機能範囲
- 収益パラメータの設定
- 投資収益分析の計算
- 複数シナリオの管理と比較
- 財務指標の表示とグラフ表現

### 実装タスク

#### 共通基盤（優先度: 高）
- [ ] 収益性試算関連の型定義を shared/index.ts に追加/拡張 (3h)
- [ ] シナリオ管理APIパス定義の追加 (1h)
- [ ] 財務パラメータのバリデーションルール定義 (2h)

#### バックエンド計算エンジン（優先度: 高）
- [ ] ProfitabilityCalculator サービスの実装 - 財務計算エンジン (7h)
- [ ] ScenarioManager サービスの実装 - シナリオデータ管理 (4h)
- [ ] profitability.controller.ts の実装 - 収益性分析API (4h)
- [ ] scenario.controller.ts の実装 - シナリオ管理API (3h)
- [ ] profitability.service.ts の実装 - ビジネスロジック (5h)
- [ ] profitability.routes.ts と scenario.routes.ts の実装 (2h)
- [ ] 財務計算定数とベンチマークの実装 (3h)

#### フロントエンド（優先度: 高）
- [ ] FinancialParamsForm コンポーネント - パラメータ入力 (4h)
- [ ] ProfitabilityResult コンポーネント - 結果表示 (4h)
- [ ] ScenarioManager コンポーネント - シナリオ管理UI (5h)
- [ ] FinancialCharts コンポーネント - グラフ表示 (5h)
- [ ] ParameterSliders コンポーネント - 直感的パラメータ調整 (3h)
- [ ] useProfitability フックの実装 - 収益性計算状態管理 (3h)
- [ ] useScenarios フックの実装 - シナリオ管理 (2h)
- [ ] 収益性計算API連携モジュールの実装 (3h)
- [ ] ProfitabilityAnalysisPage の実装 - 全体統合 (5h)
- [ ] PDF出力機能の実装 (3h)

#### テスト（優先度: 中）
- [ ] ProfitabilityCalculator のユニットテスト (3h)
- [ ] ScenarioManager のユニットテスト (2h)
- [ ] 収益性計算の統合テスト (3h)
- [ ] フロントエンドコンポーネントのテスト (3h)

## 9. クロスカッティング・コンサーン（横断的関心事）

### 9.1 ロギングとモニタリング
- [ ] ロギングフレームワークの選定と実装 (4h)
- [ ] APIアクセスログの設定 (2h)
- [ ] エラーログ体系の設計・実装 (3h)
- [ ] パフォーマンスモニタリングの実装 (4h)

### 9.2 エラーハンドリング
- [ ] グローバルエラーハンドラーの実装 (3h)
- [ ] フロントエンドエラー通知システムの実装 (3h)
- [ ] API応答エラーの標準化 (2h)
- [ ] フォールバック戦略の実装 (2h)

### 9.3 セキュリティ
- [ ] 入力バリデーションの徹底 (3h)
- [ ] CSRFトークンの実装 (2h)
- [ ] レートリミッターの実装 (2h)
- [ ] データアクセス制御の徹底 (3h)

### 9.4 パフォーマンス最適化
- [ ] データベースクエリ最適化 (4h)
- [ ] バンドルサイズ最適化 (3h)
- [ ] キャッシュ戦略の実装 (3h)
- [ ] レンダリング最適化 (3h)