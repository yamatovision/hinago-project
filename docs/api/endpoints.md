# APIエンドポイント一覧

**バージョン**: 1.0.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 概要

このドキュメントでは、HinagoProjectで提供されるすべてのAPIエンドポイントとその概要、必要な認証レベルを一覧形式で説明します。各エンドポイントの詳細なリクエスト/レスポンス仕様については、リソース別のAPI仕様書を参照してください。

## 認証レベル

各エンドポイントには以下の認証レベルのいずれかが設定されています：

- **公開**: 認証不要でアクセス可能
- **認証必須**: 有効なJWTトークンによる認証が必要
- **管理者**: ADMIN権限を持つユーザーのみアクセス可能
- **所有者/管理者**: リソースの所有者またはADMIN権限を持つユーザーのみアクセス可能

## エンドポイント一覧

### 認証関連

| メソッド | エンドポイント | 概要 | 認証レベル | 詳細ドキュメント |
|---------|--------------|------|----------|----------------|
| POST | `/api/v1/auth/login` | ユーザー認証とトークン取得 | 公開 | [認証API仕様書](/docs/api/auth.md#1-ログイン---post-apiv1authlogin) |
| GET | `/api/v1/auth/me` | 現在認証されているユーザー情報の取得 | 認証必須 | [認証API仕様書](/docs/api/auth.md#2-認証状態確認---get-apiv1authme) |
| POST | `/api/v1/auth/refresh` | リフレッシュトークンによるアクセストークン更新 | 公開 | [認証API仕様書](/docs/api/auth.md#3-トークン更新---post-apiv1authrefresh) |
| POST | `/api/v1/auth/logout` | ユーザーセッション終了とトークン無効化 | 認証必須 | [認証API仕様書](/docs/api/auth.md#4-ログアウト---post-apiv1authlogout) |

### 物件管理関連

| メソッド | エンドポイント | 概要 | 認証レベル | 詳細ドキュメント |
|---------|--------------|------|----------|----------------|
| GET | `/api/v1/properties` | 物件一覧の取得（フィルタリング、ページネーション対応） | 認証必須 | [物件API仕様書](/docs/api/properties.md#1-物件一覧取得---get-apiv1properties) |
| POST | `/api/v1/properties` | 新規物件の登録 | 認証必須 | [物件API仕様書](/docs/api/properties.md#2-物件登録---post-apiv1properties) |
| GET | `/api/v1/properties/{propertyId}` | 特定物件の詳細情報取得 | 認証必須 | [物件API仕様書](/docs/api/properties.md#3-物件詳細取得---get-apiv1propertiespropertyid) |
| PUT | `/api/v1/properties/{propertyId}` | 物件情報の完全更新 | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#4-物件更新---put-apiv1propertiespropertyid) |
| PATCH | `/api/v1/properties/{propertyId}` | 物件情報の部分更新 | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#5-物件部分更新---patch-apiv1propertiespropertyid) |
| DELETE | `/api/v1/properties/{propertyId}` | 物件の削除 | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#6-物件削除---delete-apiv1propertiespropertyid) |
| POST | `/api/v1/properties/upload-survey` | 測量図のアップロードと形状抽出 | 認証必須 | [物件API仕様書](/docs/api/properties.md#7-測量図アップロード---post-apiv1propertiesupload-survey) |
| PUT | `/api/v1/properties/{propertyId}/shape` | 物件の敷地形状の更新 | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#8-敷地形状更新---put-apiv1propertiespropertyidshape) |
| GET | `/api/v1/properties/{propertyId}/documents` | 物件関連文書の一覧取得 | 認証必須 | [物件API仕様書](/docs/api/properties.md#9-文書一覧取得---get-apiv1propertiespropertyiddocuments) |
| POST | `/api/v1/properties/{propertyId}/documents` | 物件関連文書のアップロード | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#10-文書アップロード---post-apiv1propertiespropertyiddocuments) |
| GET | `/api/v1/properties/{propertyId}/documents/{documentId}` | 特定文書の詳細取得 | 認証必須 | [物件API仕様書](/docs/api/properties.md#11-文書詳細取得---get-apiv1propertiespropertyiddocumentsdocumentid) |
| DELETE | `/api/v1/properties/{propertyId}/documents/{documentId}` | 文書の削除 | 所有者/管理者 | [物件API仕様書](/docs/api/properties.md#12-文書削除---delete-apiv1propertiespropertyiddocumentsdocumentid) |
| GET | `/api/v1/properties/{propertyId}/history` | 物件の更新履歴取得 | 認証必須 | [物件API仕様書](/docs/api/properties.md#13-更新履歴取得---get-apiv1propertiespropertyidhistory) |

### ボリュームチェック関連

| メソッド | エンドポイント | 概要 | 認証レベル | 詳細ドキュメント |
|---------|--------------|------|----------|----------------|
| POST | `/api/v1/analysis/volume-check` | 建築可能ボリュームの計算実行 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#1-ボリュームチェック実行---post-apiv1analysisvolume-check) |
| GET | `/api/v1/analysis/volume-check/{volumeCheckId}` | ボリュームチェック結果の取得 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#2-ボリュームチェック結果取得---get-apiv1analysisvolume-checkvolumecheckid) |
| DELETE | `/api/v1/analysis/volume-check/{volumeCheckId}` | ボリュームチェック結果の削除 | 所有者/管理者 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#3-ボリュームチェック結果削除---delete-apiv1analysisvolume-checkvolumecheckid) |
| POST | `/api/v1/analysis/profitability` | 収益性試算の実行 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#4-収益性試算実行---post-apiv1analysisprofitability) |
| GET | `/api/v1/analysis/profitability/{profitabilityId}` | 収益性試算結果の取得 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#5-収益性試算結果取得---get-apiv1analysisprofitabilityprofitabilityid) |
| DELETE | `/api/v1/analysis/profitability/{profitabilityId}` | 収益性試算結果の削除 | 所有者/管理者 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#6-収益性試算結果削除---delete-apiv1analysisprofitabilityprofitabilityid) |
| GET | `/api/v1/analysis/scenarios` | シナリオ一覧の取得 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#7-シナリオ一覧取得---get-apiv1analysisscenarios) |
| POST | `/api/v1/analysis/scenarios` | 新規シナリオの作成 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#8-シナリオ作成---post-apiv1analysisscenarios) |
| GET | `/api/v1/analysis/scenarios/{scenarioId}` | 特定シナリオの詳細取得 | 認証必須 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#9-シナリオ詳細取得---get-apiv1analysisscenariosscenarioid) |
| PUT | `/api/v1/analysis/scenarios/{scenarioId}` | シナリオの更新 | 所有者/管理者 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#10-シナリオ更新---put-apiv1analysisscenariosscenarioid) |
| DELETE | `/api/v1/analysis/scenarios/{scenarioId}` | シナリオの削除 | 所有者/管理者 | [ボリュームチェックAPI仕様書](/docs/api/volume-check.md#11-シナリオ削除---delete-apiv1analysisscenariosscenarioid) |

### ユーティリティ

| メソッド | エンドポイント | 概要 | 認証レベル | 詳細ドキュメント |
|---------|--------------|------|----------|----------------|
| GET | `/api/v1/geocode` | 住所から緯度経度情報を取得 | 認証必須 | [物件API仕様書](/docs/api/properties.md#14-ジオコーディング---get-apiv1geocode) |

## URLパターン

APIエンドポイントは以下のパターンに従って設計されています：

1. **コレクション**: `/api/v1/{resource}` - リソースのコレクションに対する操作
   - GET: コレクションの取得
   - POST: 新規リソースの作成

2. **単一リソース**: `/api/v1/{resource}/{id}` - 特定のリソースに対する操作
   - GET: リソース詳細の取得
   - PUT/PATCH: リソースの更新
   - DELETE: リソースの削除

3. **ネストされたリソース**: `/api/v1/{resource}/{id}/{subresource}` - 特定リソースに関連する子リソースに対する操作
   - GET: 子リソースコレクションの取得
   - POST: 新規子リソースの作成

4. **単一ネストリソース**: `/api/v1/{resource}/{id}/{subresource}/{subId}` - 特定の子リソースに対する操作
   - GET: 子リソース詳細の取得
   - PUT/PATCH: 子リソースの更新
   - DELETE: 子リソースの削除

5. **アクション**: `/api/v1/{resource}/{action}` - 特定のアクションを実行
   - POST: アクションの実行

## API呼び出し制限

1. **認証エンドポイント**
   - ログイン: 10回/分/IPアドレス
   - リフレッシュ: 20回/分/IPアドレス

2. **一般エンドポイント**
   - 認証済みユーザー: 120回/分
   - 未認証リクエスト: 30回/分/IPアドレス

3. **リソース集中エンドポイント**
   - ボリュームチェック実行: 10回/分
   - 測量図アップロード: 10回/分

## メンテナンス・拡張

新しいエンドポイントが追加された場合、このドキュメントを更新し、対応するリソース別API仕様書も作成または更新してください。