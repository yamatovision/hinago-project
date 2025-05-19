# 認証API仕様書

**バージョン**: 1.0.0  
**最終更新日**: 2025-05-19  
**ステータス**: ドラフト  

## 概要

認証APIは、HinagoProjectへのセキュアなアクセスを提供するために、JWTベースの認証システムを実装しています。アクセストークンとリフレッシュトークンを組み合わせたメカニズムにより、セキュリティと利便性のバランスを確保しています。

## エンドポイント一覧

### 1. ログイン - POST /api/v1/auth/login

- **認証**: 不要
- **概要**: ユーザーのメールアドレスとパスワードを検証し、認証情報を提供

#### リクエスト

```json
{
  "email": "higano@gmail.com",
  "password": "aikakumei",
  "rememberMe": true
}
```

#### バリデーションルール

- `email`: 必須、有効なメールアドレス形式、最大100文字
- `password`: 必須、最小6文字、最大100文字
- `rememberMe`: オプション、真偽値

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "higano@gmail.com",
      "name": "管理者",
      "role": "ADMIN"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**エラー**: 認証失敗 - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "メールアドレスまたはパスワードが間違っています"
  }
}
```

**エラー**: バリデーションエラー - 400 Bad Request

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力データが無効です",
    "details": {
      "email": "有効なメールアドレスを入力してください",
      "password": "パスワードは6文字以上で入力してください"
    }
  }
}
```

### 2. 認証状態確認 - GET /api/v1/auth/me

- **認証**: 必須
- **概要**: 現在認証されているユーザーの情報を取得

#### リクエスト

認証ヘッダー：
```
Authorization: Bearer {accessToken}
```

リクエストボディ: なし

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "email": "higano@gmail.com",
      "name": "管理者",
      "role": "ADMIN"
    }
  }
}
```

**エラー**: 認証エラー - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "認証が必要です"
  }
}
```

### 3. トークン更新 - POST /api/v1/auth/refresh

- **認証**: 不要
- **概要**: リフレッシュトークンを使用して新しいアクセストークンを取得

#### リクエスト

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### バリデーションルール

- `refreshToken`: 必須、文字列

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**エラー**: 無効なトークン - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "リフレッシュトークンが無効です"
  }
}
```

**エラー**: 期限切れトークン - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "EXPIRED_TOKEN",
    "message": "リフレッシュトークンの有効期限が切れています"
  }
}
```

### 4. ログアウト - POST /api/v1/auth/logout

- **認証**: 必須
- **概要**: ユーザーセッションを終了し、リフレッシュトークンを無効化

#### リクエスト

認証ヘッダー：
```
Authorization: Bearer {accessToken}
```

リクエストボディ: なし

#### レスポンス

**成功**: 200 OK

```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

**エラー**: 認証エラー - 401 Unauthorized

```json
{
  "success": false,
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "認証が必要です"
  }
}
```

## 実装ノート

### トークン仕様

#### アクセストークン

- **アルゴリズム**: HS256
- **有効期限**: 15分
- **ペイロード構造**:
  ```json
  {
    "sub": "1",               // ユーザーID
    "email": "higano@gmail.com",
    "role": "ADMIN",
    "iat": 1620000000,        // 発行時間
    "exp": 1620001800         // 有効期限
  }
  ```

#### リフレッシュトークン

- **アルゴリズム**: HS256
- **有効期限**: 7日間（rememberMe=trueの場合）または1日間（デフォルト）
- **ペイロード構造**:
  ```json
  {
    "sub": "1",               // ユーザーID
    "iat": 1620000000,        // 発行時間
    "exp": 1620604800         // 有効期限
  }
  ```

### セキュリティ考慮事項

1. **トークンの保存**
   - **アクセストークン**: HttpOnly Cookie（可能であれば）またはメモリ内
   - **リフレッシュトークン**: HttpOnly Cookie、secure cookie、またはローカルストレージ

2. **認証エラー処理**
   - 認証エラーの詳細情報は最小限に抑え、攻撃者に有用な情報を与えない
   - 認証試行失敗に対するレート制限を実装（10回/分）

3. **CSRF対策**
   - 適切なCSRF対策の実装（Origin/Refererヘッダーチェックなど）

## 型定義参照

```typescript
// ユーザーロールの列挙型
export enum UserRole {
  ADMIN = 'ADMIN', // 管理者
  USER = 'USER',   // 一般ユーザー（将来拡張用）
  GUEST = 'GUEST'  // ゲスト（将来拡張用）
}

// 認証ユーザーの型
export interface AuthUser {
  id: ID;
  email: string;
  name?: string;
  role: UserRole;
}

// ログインリクエストの型
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ログインレスポンスの型
export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// リフレッシュトークンリクエストの型
export interface RefreshTokenRequest {
  refreshToken: string;
}

// リフレッシュトークンレスポンスの型
export interface RefreshTokenResponse {
  accessToken: string;
}

// JWT Payloadの型
export interface JwtPayload {
  sub: string;     // ユーザーID
  email: string;   // メールアドレス
  role: UserRole;  // ロール
  iat: number;     // 発行時間
  exp: number;     // 有効期限
}
```