/**
 * アプリケーションルートコンポーネント
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import LoginPage from '../features/auth/pages/LoginPage';
import { theme } from './theme';
import { AuthProvider } from '../common/hooks/useAuth';

// ダッシュボードのプレースホルダー（実際には別ファイルに実装）
const DashboardPlaceholder = () => (
  <div style={{ padding: '20px' }}>
    <h1>ダッシュボード</h1>
    <p>ログイン成功！実際のダッシュボード画面がここに表示されます。</p>
  </div>
);

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<DashboardPlaceholder />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;