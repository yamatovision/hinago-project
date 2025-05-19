# アクセス制御マトリックス

## 1. ユーザーロール定義

| ロールID | ロール名 | 説明 |
|---------|---------|-----|
| ADMIN   | 管理者   | システム全体の管理権限を持つ。すべての機能にアクセス可能。 |

このシステムでは、基本的にシンプルな権限構造を採用し、単一のADMINロールのみを使用します。将来的な拡張性を考慮して、以下のロールも定義しておきます（現時点では実装しません）：

| ロールID | ロール名 | 説明 |
|---------|---------|-----|
| USER    | 一般ユーザー | 基本的な機能を利用する権限を持つ。自分が作成したデータのみ編集可能。 |
| GUEST   | ゲスト   | 閲覧のみの制限付き権限を持つ。データの作成・編集・削除は不可。 |

## 2. リソースアクション定義

各リソースに対して以下のアクションを定義:
- C: Create (作成)
- R: Read (読取)
- U: Update (更新)
- D: Delete (削除)

## 3. アクセス制御マトリックス

| リソース | アクション | ADMIN | USER | GUEST |
|---------|-----------|-------|------|-------|
| 物件 | C | ✓ | ✓ | ✗ |
| 物件 | R | ✓ | ✓ | ✓ |
| 物件 | U | ✓ | ✓* | ✗ |
| 物件 | D | ✓ | ✓* | ✗ |
| ボリュームチェック | C | ✓ | ✓ | ✗ |
| ボリュームチェック | R | ✓ | ✓ | ✓ |
| ボリュームチェック | U | ✓ | ✓* | ✗ |
| ボリュームチェック | D | ✓ | ✓* | ✗ |
| 収益性試算 | C | ✓ | ✓ | ✗ |
| 収益性試算 | R | ✓ | ✓ | ✓ |
| 収益性試算 | U | ✓ | ✓* | ✗ |
| 収益性試算 | D | ✓ | ✓* | ✗ |
| ユーザー | C | ✓ | ✗ | ✗ |
| ユーザー | R | ✓ | ✓* | ✗ |
| ユーザー | U | ✓ | ✓* | ✗ |
| ユーザー | D | ✓ | ✗ | ✗ |

凡例:
- ✓: 許可
- ✗: 禁止
- *: 自分自身のリソースのみ

## 4. 特殊条件

* ユーザーの閲覧 (R): USERロールのユーザーは自分のプロフィールのみ閲覧可能
* リソースの更新 (U): USERロールのユーザーは自分が作成したリソースのみ更新可能

## 5. 実装ガイドライン

### 5.1 バックエンド実装方式

#### 認証チェックミドルウェア
```typescript
// src/common/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/auth.config';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'トークンが無効です', code: 'INVALID_TOKEN' });
  }
}
```

#### 権限チェックミドルウェア
```typescript
// src/common/middlewares/permission.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
    }
    
    if (req.user.role !== role) {
      return res.status(403).json({ error: 'この操作を実行する権限がありません', code: 'FORBIDDEN' });
    }
    
    next();
  };
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  return requireRole('ADMIN')(req, res, next);
}

export function checkOwnership(resourceIdParam: string = 'id') {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '認証が必要です', code: 'AUTH_REQUIRED' });
    }
    
    // ADMINは全てのリソースにアクセス可能
    if (req.user.role === 'ADMIN') {
      return next();
    }
    
    const resourceId = req.params[resourceIdParam];
    const resource = getResourceFromDb(resourceId); // 実際の実装ではDBからリソースを取得
    
    // リソースが存在しない場合
    if (!resource) {
      return res.status(404).json({ error: 'リソースが見つかりません', code: 'RESOURCE_NOT_FOUND' });
    }
    
    // リソースの所有者でない場合
    if (resource.userId !== req.user.id) {
      return res.status(403).json({ error: 'この操作を実行する権限がありません', code: 'FORBIDDEN' });
    }
    
    next();
  };
}
```

#### ルーティングでの使用例
```typescript
// src/features/properties/properties.routes.ts
import express from 'express';
import { requireAuth } from '../../common/middlewares/auth.middleware';
import { checkOwnership } from '../../common/middlewares/permission.middleware';
import * as propertiesController from './properties.controller';

const router = express.Router();

// 物件一覧取得（認証済みユーザーのみ）
router.get('/', requireAuth, propertiesController.getAllProperties);

// 物件詳細取得（認証済みユーザーのみ）
router.get('/:id', requireAuth, propertiesController.getPropertyById);

// 物件作成（認証済みユーザーのみ）
router.post('/', requireAuth, propertiesController.createProperty);

// 物件更新（所有者またはADMINのみ）
router.put('/:id', requireAuth, checkOwnership(), propertiesController.updateProperty);

// 物件削除（所有者またはADMINのみ）
router.delete('/:id', requireAuth, checkOwnership(), propertiesController.deleteProperty);

export default router;
```

### 5.2 フロントエンド権限制御

#### 認証コンテキスト
```typescript
// src/features/auth/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { loginUser, refreshToken, fetchCurrentUser } from './api';
import { AuthUser, AuthContextType } from './types';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ログイン処理
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loginUser(email, password);
      
      // ユーザー情報とトークンをセット
      setUser(data.user);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return true;
    } catch (err) {
      setError('ログインに失敗しました');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // ログアウト処理
  const logout = () => {
    setUser(null);
    localStorage.removeItem('refreshToken');
  };
  
  // トークン検証・更新処理
  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // ローカルストレージからリフレッシュトークンを取得
      const storedRefreshToken = localStorage.getItem('refreshToken');
      
      if (!storedRefreshToken) {
        setUser(null);
        return;
      }
      
      // リフレッシュトークンを使用して新しいアクセストークンを取得
      const data = await refreshToken(storedRefreshToken);
      
      // 現在のユーザー情報を取得
      const userData = await fetchCurrentUser();
      setUser(userData);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('refreshToken');
    } finally {
      setIsLoading(false);
    }
  };
  
  // アプリケーション起動時に認証状態をチェック
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// 認証コンテキストを使用するためのフック
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};
```

#### 保護されたルートコンポーネント
```typescript
// src/features/auth/components/ProtectedRoute.tsx
import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { useAuth } from '../AuthContext';

interface ProtectedRouteProps extends RouteProps {
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredRole,
  ...routeProps
}) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // ユーザーが認証されていない場合はログインページにリダイレクト
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  // 特定のロールが必要な場合、ロールをチェック
  if (requiredRole && user.role !== requiredRole) {
    return <Redirect to="/unauthorized" />;
  }
  
  return <Route {...routeProps} />;
};
```

#### ルーティング定義の例
```typescript
// src/app/routes.tsx
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { AuthProvider } from '../features/auth/AuthContext';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import LoginPage from '../features/auth/pages/LoginPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import PropertyListPage from '../features/properties/pages/PropertyListPage';
import PropertyDetailPage from '../features/properties/pages/PropertyDetailPage';
import PropertyRegisterPage from '../features/properties/pages/PropertyRegisterPage';
import VolumeCheckPage from '../features/volume-check/pages/VolumeCheckPage';
import ProfitabilityAnalysisPage from '../features/profitability/pages/ProfitabilityAnalysisPage';
import UnauthorizedPage from '../features/common/pages/UnauthorizedPage';

const Routes: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          {/* 認証不要ルート */}
          <Route path="/login" component={LoginPage} />
          <Route path="/unauthorized" component={UnauthorizedPage} />
          
          {/* 認証必須ルート */}
          <ProtectedRoute path="/dashboard" component={DashboardPage} />
          <ProtectedRoute path="/properties" exact component={PropertyListPage} />
          <ProtectedRoute path="/properties/new" component={PropertyRegisterPage} />
          <ProtectedRoute path="/properties/:id" component={PropertyDetailPage} />
          <ProtectedRoute path="/volume-check/:id?" component={VolumeCheckPage} />
          <ProtectedRoute path="/profitability/:id?" component={ProfitabilityAnalysisPage} />
          
          {/* Admin専用ルート（将来拡張用） */}
          <ProtectedRoute path="/admin" requiredRole="ADMIN" />
          
          {/* デフォルトルート */}
          <Route path="/" exact>
            <Redirect to="/dashboard" />
          </Route>
          
          {/* 存在しないルート */}
          <Route path="*">
            <Redirect to="/dashboard" />
          </Route>
        </Switch>
      </AuthProvider>
    </Router>
  );
};

export default Routes;
```

### 5.3 UI要素の条件付き表示

権限に基づいてUI要素の表示・非表示を制御するためのコンポーネント例：

```typescript
// src/features/common/components/PermissionGuard.tsx
import React from 'react';
import { useAuth } from '../../auth/AuthContext';

interface PermissionGuardProps {
  requiredRole?: string;
  ownerOnly?: boolean;
  resourceOwnerId?: string;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredRole,
  ownerOnly,
  resourceOwnerId,
  fallback = null,
}) => {
  const { user } = useAuth();
  
  // ユーザーが認証されていない場合
  if (!user) {
    return <>{fallback}</>;
  }
  
  // 特定のロールが必要な場合
  if (requiredRole && user.role !== requiredRole) {
    // ADMINは全てのロールの権限を持つ
    if (user.role !== 'ADMIN') {
      return <>{fallback}</>;
    }
  }
  
  // 所有者のみの場合
  if (ownerOnly && resourceOwnerId && user.role !== 'ADMIN') {
    if (resourceOwnerId !== user.id) {
      return <>{fallback}</>;
    }
  }
  
  // 条件を満たした場合、子要素を表示
  return <>{children}</>;
};
```

#### 使用例
```jsx
// 例: 編集ボタン（管理者または所有者のみ表示）
<PermissionGuard
  ownerOnly={true}
  resourceOwnerId={property.userId}
>
  <button onClick={handleEdit}>編集</button>
</PermissionGuard>

// 例: 管理者専用セクション
<PermissionGuard requiredRole="ADMIN">
  <div className="admin-section">
    <h3>管理者設定</h3>
    {/* 管理者専用の設定項目 */}
  </div>
</PermissionGuard>
```