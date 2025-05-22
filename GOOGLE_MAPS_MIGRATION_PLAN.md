# Google Maps移行計画書

## 背景
- Mapboxの日本地図精度の課題
- ユーザビリティ向上のためGoogle Mapsへの移行が適切

## 選定ライブラリ: @vis.gl/react-google-maps

### 選定理由
1. **Google公式推進** - 最新かつ長期サポート保証
2. **TypeScript完全対応** - 型安全性の確保
3. **Mapboxからの移行容易性** - vis.glチーム共通基盤
4. **日本地図の高精度** - 地域最適化済み
5. **パフォーマンス最適化** - WebGL描画対応

## 移行手順

### 1. 環境準備
```bash
# 新ライブラリのインストール
npm install @vis.gl/react-google-maps

# Mapbox関連の削除
npm uninstall react-map-gl mapbox-gl
```

### 2. Google Maps API設定
- Google Cloud Console でプロジェクト作成
- Maps JavaScript API を有効化
- APIキーの取得・制限設定
- 環境変数の更新（VITE_GOOGLE_MAPS_API_KEY）

### 3. コンポーネント移行
- PropertyMap.tsx の完全書き換え
- APIProvider でアプリケーション全体をラップ
- Map、Marker コンポーネントの実装

### 4. 機能対応表
| 現在のMapbox機能 | Google Maps対応 |
|-----------------|----------------|
| Map表示 | Map コンポーネント |
| Marker配置 | Marker コンポーネント |
| クリックイベント | onClick ハンドラ |
| ナビゲーション | NavigationControl |
| スタイリング | mapStyle プロパティ |

## 実装計画

### フェーズ1: 基本地図表示
- 地図の表示とマーカー配置
- クリックイベントの実装

### フェーズ2: 高度な機能
- ジオコーディング連携
- Places API統合

## コスト試算
- 月間地図読み込み: 約10,000回想定
- 月額料金: 約$70（$7/1000読み込み）
- Mapbox比較: 機能豊富で同等価格帯

## 実装完了 ✅

### 完了した作業
1. **パッケージ移行**: ✅
   - Mapbox関連パッケージ削除（react-map-gl, mapbox-gl）
   - @vis.gl/react-google-maps インストール

2. **PropertyMapコンポーネント書き換え**: ✅
   - Google Maps API対応に完全移行
   - TypeScript対応
   - デバッグログ機能追加

3. **環境変数設定**: ✅
   - フロントエンド: VITE_GOOGLE_MAPS_API_KEY
   - バックエンド環境設定復元（GEOCODING_API_KEY）
   - 共通APIキー使用: AIzaSyCA_yHl-oSUckz7RYOSLt67oUTMqoCHlU4

### 次のステップ
1. フロントエンドアプリケーション再起動
2. 地図表示の動作確認
3. マーカー機能とクリックイベントのテスト