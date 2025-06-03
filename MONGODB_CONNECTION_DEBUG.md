# MongoDB接続エラー デバッグドキュメント

## エラー概要
- **エラータイプ**: ECONNREFUSED
- **エラー対象**: MongoDB Atlas クラスター
- **ホスト名**: _mongodb._tcp.motherprompt-cluster.np3xp.mongodb.net

## 依存関係マップ
```
src/app.ts
  └─> initializeDatabase()
      └─> src/db/connection.ts
          └─> process.env.MONGODB_URI
              └─> .env ファイル
```

## 環境変数の実数値
- **MONGODB_URI**: `mongodb+srv://Tatsuya:aikakumei@motherprompt-cluster.np3xp.mongodb.net/hinagosan?retryWrites=true&w=majority&appName=MotherPrompt-Cluster`
- **TEST_MONGODB_URI**: `mongodb://localhost:27017/hinago-test`

## 問題の原因候補
1. **ネットワーク接続問題**
   - DNS解決の失敗
   - ファイアウォール/プロキシによるブロック
   
2. **MongoDB Atlas設定問題**
   - IPホワイトリストに現在のIPが未登録
   - クラスターが停止している
   
3. **認証情報の問題**
   - パスワードが正しくない
   - ユーザーが存在しない

## 解決手順

### ステップ1: ネットワーク診断
```bash
# DNS解決テスト
nslookup motherprompt-cluster.np3xp.mongodb.net

# 接続性テスト
ping motherprompt-cluster.np3xp.mongodb.net
```

### ステップ2: ローカルMongoDBで一時的に開発
```bash
# .envファイルを編集
MONGODB_URI=mongodb://localhost:27017/hinago

# ローカルMongoDBを起動
brew services start mongodb-community
```

### ステップ3: MongoDB Atlas設定確認
1. [MongoDB Atlas](https://cloud.mongodb.com/)にログイン
2. Network Access → IP Whitelist → "Add IP Address" → "Add Current IP Address"
3. Database Access → ユーザー認証情報を確認
4. Clusters → クラスターの状態を確認

## 解決結果
✅ ローカルMongoDBに切り替えることで接続エラーを解決
✅ サーバーが正常に起動（ポート3000）
✅ デフォルト管理者ユーザーが作成済み

## デフォルトログイン情報
- **メールアドレス**: `higano@gmail.com`
- **パスワード**: `aikakumei`

## 現在のステータス
- [x] エラー関連ファイルの依存関係を調査
- [x] 環境変数の実数値を確認
- [x] ローカルMongoDBでの動作確認
- [x] デフォルトログイン情報の確認
- [ ] MongoDB Atlas設定の修正（必要に応じて後日対応）