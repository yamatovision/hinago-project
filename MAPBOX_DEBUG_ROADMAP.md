# Mapboxアクセストークンエラー - デバッグロードマップ

## 問題概要
- **エラー**: Mapboxアクセストークンが設定されていません
- **環境変数**: VITE_REACT_APP_MAPBOX_TOKEN
- **影響範囲**: フロントエンドの地図表示機能

## 関連ファイル分析

### 1. エラー発生箇所
- **ファイル**: `frontend/src/features/properties/components/Map/PropertyMap.tsx:13`
- **コード**: `const MAPBOX_TOKEN = import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN || '';`
- **処理**: 環境変数からMapboxトークンを取得、空の場合はエラーメッセージ表示

### 2. 依存関係
- **ライブラリ**: react-map-gl（Mapbox GL JSのReactラッパー）
- **CSS**: mapbox-gl/dist/mapbox-gl.css
- **環境**: Vite（フロントエンドビルドツール）

### 3. 影響を受けるコンポーネント
- PropertyMap.tsx（物件位置表示）
- PropertyDetailTabs.tsx、PropertyRegisterPage.tsx（PropertyMapを使用）

## 解決ステップ

### ステップ1: 環境変数の設定状況確認 ✅
現在の状況：
- frontendディレクトリに.envファイルが存在しない
- 環境変数VITE_REACT_APP_MAPBOX_TOKENが未設定

### ステップ2: 環境変数設定と検証 ✅
1. .env.localファイルの作成 ✅
2. .envファイル（本番環境用）の作成 ✅
3. Mapboxトークンの設定 ✅
4. 動作確認用のログ追加 ✅

### ステップ3: 本番環境での設定確認
1. Firebase Hostingでの環境変数設定
2. ビルド時の環境変数の読み込み確認

## 設定されたトークン
- **トークン**: pk.eyJ1IjoidGF0YXR0YXRhdHN1aXlhIiwiYSI6ImNtYXZtaXd2eTA2OW0yb29yMHM5bmthbzgifQ._gU4NHpP4gHGNQMcTGxxhg
- **ローカル環境**: .env.local
- **本番環境**: .env
- **デバッグログ**: VITE_DEBUG_MODE=trueで有効化

## 注意事項
- Mapboxトークンは公開リポジトリにコミットされないよう注意
- .env.localは.gitignoreに含まれていることを確認
- 本番環境とローカル環境で異なるトークンを使用する場合がある