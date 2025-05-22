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