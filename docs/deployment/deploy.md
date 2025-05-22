# HinagoProject デプロイメント設定

このドキュメントは、HinagoProjectのデプロイ設定と環境変数の管理方法について説明します。

## デプロイURL

### フロントエンド
- **URL**: https://hinago-project.web.app
- **プロバイダ**: Firebase Hosting (yamatovision-blue-lamp プロジェクト)

### バックエンド
- **URL**: https://hinago-backend-service-235426778039.asia-northeast1.run.app
- **プロバイダ**: Google Cloud Run (yamatovision-blue-lamp プロジェクト)
- **リージョン**: asia-northeast1

### データベース
- **プロバイダ**: MongoDB Atlas
- **クラスター**: motherprompt-cluster

## 最新デプロイ状況

**最終デプロイ日時**: 2025-05-22

### バックエンド
- **イメージタグ**: gcr.io/yamatovision-blue-lamp/hinago-backend:v3
- **リビジョン**: hinago-backend-service-00004-vf5
- **ステータス**: 稼働中

### フロントエンド
- **ビルド**: 成功 (dist/ 生成完了)
- **デプロイ**: 成功
- **ステータス**: 稼働中

## 環境変数設定

### バックエンド環境変数（Cloud Run）

**注意**: PORTは Cloud Run により自動設定されるため、環境変数に含めないでください

```
MONGODB_URI=mongodb+srv://Tatsuya:aikakumei@motherprompt-cluster.np3xp.mongodb.net/hinagosan?retryWrites=true&w=majority&appName=MotherPrompt-Cluster
NODE_ENV=production
JWT_SECRET=8f42a1d5c1e9b8a3f6d7e2c5b9a8d3f6
JWT_REFRESH_SECRET=2c5b9a8d3f678f42a1d5c1e9b8a3f6d7
CORS_ORIGIN=https://hinago-project.web.app
```

### フロントエンド環境変数（Firebase Hosting）

```
VITE_API_BASE_URL=https://hinago-backend-service-235426778039.asia-northeast1.run.app
VITE_ENV=production
```

## デプロイコマンド

### バックエンドデプロイ（Cloud Run）

```bash
# Dockerイメージのビルドとアップロード
cd backend
gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/hinago-backend:v3

# Cloud Runサービスのデプロイ（注意：PORTは自動設定されるため環境変数から除外）
gcloud run deploy hinago-backend-service \
  --image gcr.io/yamatovision-blue-lamp/hinago-backend:v3 \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --set-env-vars="MONGODB_URI=mongodb+srv://Tatsuya:aikakumei@motherprompt-cluster.np3xp.mongodb.net/hinagosan?retryWrites=true&w=majority&appName=MotherPrompt-Cluster,NODE_ENV=production,JWT_SECRET=8f42a1d5c1e9b8a3f6d7e2c5b9a8d3f6,JWT_REFRESH_SECRET=2c5b9a8d3f678f42a1d5c1e9b8a3f6d7,CORS_ORIGIN=https://hinago-project.web.app"
```

### フロントエンドデプロイ（Firebase Hosting）

**前提条件**: Firebase設定ファイルが必要です
- `firebase.json` - Firebase Hosting設定
- `.firebaserc` - プロジェクト設定

```bash
# Firebase CLIのセットアップ
cd frontend
firebase use yamatovision-blue-lamp

# ビルドとデプロイ
npm run build
firebase deploy --only hosting:hinago-project --project yamatovision-blue-lamp
```

#### Firebase設定ファイル

`firebase.json`:
```json
{
  "hosting": {
    "site": "hinago-project",
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

`.firebaserc`:
```json
{
  "projects": {
    "default": "yamatovision-blue-lamp"
  },
  "targets": {
    "yamatovision-blue-lamp": {
      "hosting": {
        "hinago-project": [
          "hinago-project"
        ]
      }
    }
  }
}
```

## CORS設定

バックエンドでCORSを適切に設定することで、フロントエンドからのAPIリクエストを許可しています。Cloud Runの環境変数で設定：

```
CORS_ORIGIN=https://hinago-project.web.app
```

## CI/CDパイプライン設定

GitHub Actionsを使用したCI/CDパイプラインの設定例：

### バックエンドCI/CD (.github/workflows/backend-cicd.yml)

```yaml
name: Backend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: yamatovision-blue-lamp
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true

    - name: Build and push Docker image
      run: |
        cd backend
        gcloud builds submit --tag gcr.io/yamatovision-blue-lamp/hinago-backend:${{ github.sha }}

    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy hinago-backend-service \
          --image gcr.io/yamatovision-blue-lamp/hinago-backend:${{ github.sha }} \
          --platform managed \
          --region asia-northeast1 \
          --allow-unauthenticated \
          --set-env-vars="MONGODB_URI=${{ secrets.MONGODB_URI }},NODE_ENV=production,JWT_SECRET=${{ secrets.JWT_SECRET }},JWT_REFRESH_SECRET=${{ secrets.JWT_REFRESH_SECRET }},CORS_ORIGIN=https://hinago-project.web.app"
```

### フロントエンドCI/CD (.github/workflows/frontend-cicd.yml)

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: 18

    - name: Install dependencies
      run: |
        cd frontend
        npm ci

    - name: Build
      run: |
        cd frontend
        echo "VITE_API_BASE_URL=${{ secrets.BACKEND_URL }}" > .env.production
        echo "VITE_ENV=production" >> .env.production
        npm run build

    - name: Deploy to Firebase
      uses: FirebaseExtended/action-hosting-deploy@v0
      with:
        repoToken: ${{ secrets.GITHUB_TOKEN }}
        firebaseServiceAccount: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        projectId: yamatovision-blue-lamp
        channelId: live
        target: hinago-project
```

## バックエンドDockerfile

```dockerfile
# Node.js 18のベースイメージを使用
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /usr/src/app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./

# 依存関係をインストール（開発依存も含む）
RUN npm ci

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番用の依存関係のみを再インストール
RUN npm ci --only=production && npm cache clean --force

# ポート8080を公開
EXPOSE 8080

# アプリケーションを起動
CMD ["npm", "start"]
```

## トラブルシューティング

### バックエンドデプロイ時のよくある問題

1. **PORT環境変数エラー**
   ```
   ERROR: spec.template.spec.containers[0].env: The following reserved env names were provided: PORT
   ```
   - 解決法：PORTは Cloud Run により自動設定されるため、環境変数から削除する

2. **Dockerfileが見つからないエラー**
   ```
   ERROR: Invalid value for [source]: Dockerfile required when specifying --tag
   ```
   - 解決法：backend/ディレクトリにDockerfileとDockerignoreを作成する

### フロントエンドデプロイ時のよくある問題

1. **Firebase初期化エラー**
   ```
   Error: firebase use must be run from a Firebase project directory
   ```
   - 解決法：firebase.jsonと.firebasercファイルを作成する

2. **TypeScriptビルドエラー**
   - 解決法：tsconfig.jsonでstrictモードを調整するか、個別にエラーを修正する

## 引き継ぎ事項と注意点

1. **環境変数の管理**：
   - 本番環境の環境変数は機密情報を含むため、GitHub Secretsなどで安全に管理してください
   - デプロイ時に環境変数の設定漏れがないように注意してください
   - **重要**: Cloud RunではPORT環境変数は自動設定されるため、手動で設定しないこと

2. **MongoDB接続**：
   - MongoDB Atlasの接続文字列にはユーザー名とパスワードが含まれています
   - 必要に応じて定期的にパスワードをローテーションしてください

3. **CORSの管理**：
   - フロントエンドのURLが変更された場合は、バックエンドのCORS設定も更新する必要があります

4. **デプロイ先の管理**：
   - yamatovision-blue-lampプロジェクトには他のサービスも含まれています
   - hinago-projectサイトとhinago-backend-serviceのみを更新するよう注意してください

5. **監視とログ**：
   - Cloud Run：https://console.cloud.google.com/run?project=yamatovision-blue-lamp でログとモニタリングを確認できます
   - Firebase：https://console.firebase.google.com/project/yamatovision-blue-lamp/hosting/sites でホスティングの状態を確認できます

6. **必要なファイル**：
   - バックエンド：`Dockerfile`, `.dockerignore`
   - フロントエンド：`firebase.json`, `.firebaserc`