# API接続エラー - デバッグ報告書

## 問題概要
- **エラー**: `POST http://localhost:8080/api/v1/auth/login net::ERR_CONNECTION_REFUSED`
- **原因**: フロントエンドとバックエンドのポート設定不一致

## 現在の設定状況

### バックエンド設定
- **ポート**: 3000 (実際の動作ポート)
- **APIプレフィックス**: `/api/v1`
- **CORS設定**: `http://localhost:5173`
- **実際のエンドポイント**: `http://localhost:3000/api/v1/auth/login`

### フロントエンド設定（修正前）
- **ポート**: 3001
- **API_BASE_URL**: `http://localhost:8080` ❌
- **プロキシ設定**: `http://localhost:8080` ❌
- **リクエスト先**: `http://localhost:8080/api/v1/auth/login` ❌

## 実行した修正
1. ✅ **Vite プロキシ設定**: `localhost:8080` → `localhost:3000`
2. ✅ **API_BASE_URL**: `localhost:8080` → `localhost:3000`

## 残る課題
- CORS設定: `localhost:5173` → `localhost:3001` への変更が必要
- フロントエンドの再起動が必要

## 次のステップ
1. バックエンドのCORS設定を修正
2. フロントエンドを再起動
3. 接続テスト実行