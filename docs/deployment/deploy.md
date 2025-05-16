# HinagoProject デプロイメント設定ガイド

このドキュメントは、HinagoProjectのデプロイ設定と環境変数の管理方法について説明します。

## 環境変数設定状況

### 認証情報とシークレット

プロジェクトで使用される認証情報とシークレットは以下の通りです。これらの値は各環境に適切に設定する必要があります。

| 変数名 | 説明 | 状態 |
|-------|------|------|
| MONGODB_URI | MongoDB接続文字列 | ✅ 設定済み |
| JWT_SECRET | JWT認証用シークレットキー | ✅ 設定済み |
| JWT_REFRESH_SECRET | JWT更新用シークレットキー | ✅ 設定済み |
| AWS_ACCESS_KEY_ID | AWS認証キー | ✅ 設定済み |
| AWS_SECRET_ACCESS_KEY | AWSシークレットキー | ✅ 設定済み |
| AWS_S3_BUCKET | S3バケット名 | ✅ 設定済み (higanoproject) |
| GEOCODING_API_KEY | Google Maps APIキー | ✅ 設定済み |
| SESSION_SECRET | セッション暗号化キー | ✅ 設定済み |
| REACT_APP_MAPBOX_TOKEN | 地図表示用トークン | ⚠️ 未設定（必要に応じて設定） |
| REACT_APP_SENTRY_DSN | エラー監視設定 | ⚠️ 未設定（必要に応じて設定） |

## デプロイ環境

### フロントエンド (Vercel)

- **リポジトリ連携**: GitHub (https://github.com/yamatovision/hinago-project)
- **ビルド設定**:
  - フレームワークプリセット: Create React App
  - ビルドコマンド: `npm run build`
  - 出力ディレクトリ: `build`
- **環境変数**: `frontend/.env.production`の内容をVercelプロジェクト設定に追加

### バックエンド (Railway)

- **リポジトリ連携**: GitHub (https://github.com/yamatovision/hinago-project)
- **ビルド設定**:
  - 開始コマンド: `npm start`
  - ルートディレクトリ: `backend`
- **環境変数**: `backend/.env`の内容をRailwayプロジェクト設定に追加（本番環境用に一部変更）

## CORS設定

フロントエンドとバックエンドが別ドメインでホスティングされるため、以下のCORS設定が必要です：

```javascript
// バックエンドのCORS設定 (例: Express.js)
app.use(cors({
  origin: ['https://hinago-project.vercel.app'], // 本番環境のフロントエンドドメイン
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
```

本番環境では `CORS_ORIGIN` 環境変数を `https://hinago-project.vercel.app` に設定します。

## CI/CD パイプライン

GitHub Actionsを使用したCI/CDパイプラインを設定することを推奨します。基本的な設定例：

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
        
  # デプロイジョブはVercelとRailwayの自動デプロイ機能を使用するため不要
```

## 環境ごとの設定

### 開発環境

- フロントエンド: `frontend/.env.development`
- バックエンド: `backend/.env`
- MongoDB: ローカルインスタンスまたはAtlasの開発クラスター

### 本番環境

- フロントエンド: Vercel (`frontend/.env.production`の内容を環境変数として設定)
- バックエンド: Railway (`backend/.env`の内容を必要に応じて修正して環境変数として設定)
- MongoDB: Atlas本番クラスター

## セキュリティ注意事項

- 環境変数ファイル（`.env`）はGitリポジトリにコミットしないでください
- 本番環境のシークレットキーは、開発環境とは異なる値を使用してください
- AWSのIAMユーザーには最小権限の原則を適用してください
- 定期的に認証情報をローテーションすることを検討してください

## トラブルシューティング

- CORS関連の問題: バックエンドの`CORS_ORIGIN`設定とフロントエンドのドメインが一致しているか確認してください
- 認証関連の問題: JWTトークンの設定とシークレットキーが正しく設定されているか確認してください
- MongoDB接続問題: ネットワーク設定でAtlasへのアクセスが許可されているか確認してください
- S3アクセス問題: IAMユーザーの権限が適切に設定されているか確認してください