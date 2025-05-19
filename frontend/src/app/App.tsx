/**
 * アプリケーションルートコンポーネント
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from '../features/auth/pages/LoginPage';
import { DashboardPage } from '../features/dashboard/pages';
import ProtectedRoute from '../common/components/ProtectedRoute';
import { theme } from './theme';
import { AuthProvider } from '../common/hooks/useAuth';

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            {/* 認証不要のルート */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* 認証保護ルート */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />
            <Route path="/properties" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            
            {/* 将来的に追加される機能のプレースホルダー */}
            <Route path="/properties/:id" element={
              <ProtectedRoute>
                <div>物件詳細ページ（開発中）</div>
              </ProtectedRoute>
            } />
            <Route path="/properties/create" element={
              <ProtectedRoute>
                <div>物件登録ページ（開発中）</div>
              </ProtectedRoute>
            } />
            <Route path="/properties/:id/edit" element={
              <ProtectedRoute>
                <div>物件編集ページ（開発中）</div>
              </ProtectedRoute>
            } />
            <Route path="/analysis/volume-check/:id" element={
              <ProtectedRoute>
                <div>ボリュームチェックページ（開発中）</div>
              </ProtectedRoute>
            } />
            <Route path="/analysis/profitability/:id" element={
              <ProtectedRoute>
                <div>収益性試算ページ（開発中）</div>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <div>レポート（開発中）</div>
              </ProtectedRoute>
            } />
            
            {/* デフォルトリダイレクト */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;