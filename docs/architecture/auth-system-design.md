# 認証システム設計書

## 1. 概要

このドキュメントではHinagoプロジェクト（ボリュームチェックシステム）の認証システムの詳細設計を定義します。このシステムでは、シンプルかつ安全な認証メカニズムを実装し、認証されたユーザーのみがアプリケーションの機能にアクセスできるようにします。

## 2. 認証メカニズム

### 2.1 選定方式
* JWT（JSON Web Token）ベースの認証
* リフレッシュトークンによるアクセストークン再発行

### 2.2 選定理由
* ステートレス性によるスケーラビリティ確保
* フロントエンド/バックエンド分離アーキテクチャとの親和性
* セッション管理の単純化
* 将来的な拡張性の確保

## 3. 認証フロー

### 3.1 ログイン（サインイン）フロー
1. ユーザーがログインフォームからメールアドレスとパスワードを入力して送信
2. バックエンドがユーザー情報を検証（固定ユーザー: higano@gmail.com / aikakumei）
3. 認証成功時：
   - アクセストークン（短期、15分有効）を生成
   - リフレッシュトークン（長期、7日有効）を生成
   - 両トークンをクライアントに返却（アクセストークンはHTTPOnly Cookieに設定）
4. 認証失敗時：
   - エラーメッセージを返却

### 3.2 認証状態確認フロー
1. クライアントが保護されたリソースへのリクエストを送信
2. 認証ミドルウェアがリクエストヘッダー内のアクセストークンを検証
3. トークン有効時：
   - リクエストを処理し、結果を返却
4. トークン無効/期限切れ時：
   - 401 Unauthorized レスポンスを返却

### 3.3 トークン更新フロー
1. アクセストークンの期限切れ検出時、クライアントがリフレッシュトークンを使用して更新リクエスト
2. バックエンドがリフレッシュトークンを検証
3. トークン有効時：
   - 新しいアクセストークンを生成
   - 新しいアクセストークンをクライアントに返却
4. トークン無効/期限切れ時：
   - 401 Unauthorized レスポンスを返却
   - ユーザーを再ログイン画面にリダイレクト

### 3.4 ログアウトフロー
1. ユーザーがログアウトボタンをクリック
2. クライアントがログアウトリクエストをバックエンドに送信
3. バックエンドがリフレッシュトークンを無効化（実装では削除）
4. クライアントがローカルストレージとCookieからトークン情報を削除
5. ログイン画面へリダイレクト

## 4. セキュリティ対策

### 4.1 パスワード管理
* ハッシュアルゴリズム: bcrypt (コスト係数 10)
* パスワードポリシー: 最低6文字（実際の環境では最低8文字、英数字・特殊文字混在が推奨）

### 4.2 トークン管理
* アクセストークン有効期限: 15分
* リフレッシュトークン有効期限: 7日
* アクセストークン保存: HttpOnly, Secure Cookie（可能であれば）での保存
* リフレッシュトークン保存: バックエンドのDBと、フロントエンドのローカルストレージ

### 4.3 保護対策
* CSRF対策: HttpOnly Cookieの使用、Origin/Refererヘッダーチェック
* レート制限: 同一IPからの試行を10回/分に制限
* ブルートフォース対策: 連続5回失敗で一時的ロック（簡易実装では省略可）

## 5. コード構造とアーキテクチャガイドライン

### 5.1 認証関連コードの構成
* バックエンド側の認証関連コードは `features/auth/` ディレクトリに集約する
* 単一責任の原則に基づき、以下のファイル構造を維持する:
  - `auth.controller.ts`: リクエスト処理とレスポンス整形
  - `auth.service.ts`: 認証ロジックの中核と業務処理
  - `auth.routes.ts`: エンドポイント定義とミドルウェア適用
  - `auth.middleware.ts`: 認証状態検証と権限チェック機能
  - `auth.config.ts`: JWT設定やその他認証関連設定
  - `RefreshToken.ts`: リフレッシュトークンモデル（必要に応じて）

### 5.2 フロントエンド認証管理
* 認証状態は専用のコンテキストで管理: `features/auth/AuthContext.tsx`
* トークン管理とセキュアなストレージ: `features/auth/services/tokenService.ts`
* 認証専用フック: `features/auth/hooks/useAuth.ts`
* 保護されたルート処理: `features/auth/components/ProtectedRoute.tsx`

### 5.3 依存関係と責任分離
* 認証モジュールは他の機能モジュールに依存しない（単方向依存）
* 認証状態の変更は適切なイベントシステムを通じて通知する
* 認証関連のエラー処理は専用のエラーハンドラーで一元管理
* 環境ごとの認証設定は設定ファイルから注入（ハードコード禁止）

## 6. API認証エンドポイント

### 6.1 ログインエンドポイント
```
POST /api/auth/login
リクエスト: { email: string, password: string, rememberMe?: boolean }
成功レスポンス: { user: { id: string, email: string, name: string, role: string }, token: string }
エラーレスポンス: { error: string, code: string }
```

### 6.2 認証状態確認エンドポイント
```
GET /api/auth/me
ヘッダー: Authorization: Bearer {token}
成功レスポンス: { user: { id: string, email: string, name: string, role: string } }
エラーレスポンス: { error: string, code: string }
```

### 6.3 トークン更新エンドポイント
```
POST /api/auth/refresh
リクエスト: { refreshToken: string }
成功レスポンス: { token: string }
エラーレスポンス: { error: string, code: string }
```

### 6.4 ログアウトエンドポイント
```
POST /api/auth/logout
ヘッダー: Authorization: Bearer {token}
成功レスポンス: { success: true }
```

## 7. 実装ガイドライン

### 7.1 固定ユーザー設定
このシステムでは、以下の決め打ちユーザーを使用します：
- メールアドレス: higano@gmail.com
- パスワード: aikakumei
- ロール: ADMIN

### 7.2 トークン生成・検証
```typescript
// トークン生成例
function generateTokens(user: User): { accessToken: string, refreshToken: string } {
  const accessToken = jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { sub: user.id },
    REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

// トークン検証例
function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
}
```

### 7.3 認証ミドルウェア実装
```typescript
// 認証ミドルウェア例
function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Authorizationヘッダーからトークン取得
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'トークンが無効です', code: 'INVALID_TOKEN' });
  }
  
  // リクエストにユーザー情報を追加
  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };
  
  next();
}
```

## 8. エラーレスポンス標準化

### 8.1 認証エラーの種類

| エラーコード | HTTP ステータス | メッセージ | 説明 |
|------------|---------------|----------|------|
| AUTH_REQUIRED | 401 | 認証が必要です | ヘッダにトークンがない |
| INVALID_TOKEN | 401 | トークンが無効です | トークン形式や署名が不正 |
| EXPIRED_TOKEN | 401 | トークンの有効期限が切れています | トークンが期限切れ |
| INVALID_CREDENTIALS | 401 | メールアドレスまたはパスワードが間違っています | ログイン認証失敗 |
| FORBIDDEN | 403 | この操作を実行する権限がありません | ユーザー権限が不足 |

### 8.2 エラーレスポンス形式
```json
{
  "error": "エラーメッセージ",
  "code": "エラーコード"
}
```