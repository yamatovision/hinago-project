/**
 * ログインページ
 */
import { useEffect } from 'react';
import { Box, Typography, CssBaseline } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import { useAuth } from '../../../common/hooks/useAuth';

const LoginPage = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // 認証済みの場合はダッシュボードへリダイレクト
  useEffect(() => {
    if (user && !isLoading) {
      navigate('/dashboard');
    }
  }, [user, isLoading, navigate]);

  // ログイン成功時の処理
  const handleLoginSuccess = () => {
    navigate('/dashboard');
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          bgcolor: '#f5f5f5',
        }}
      >
        {/* メインコンテンツ */}
        <LoginForm onSuccess={handleLoginSuccess} />

        {/* フッター */}
        <Box
          component="footer"
          sx={{
            py: 2,
            px: 2,
            mt: 'auto',
            bgcolor: 'white',
            borderTop: 1,
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color="text.secondary">
            &copy; 2025 Hinago - ボリュームチェックシステム. All Rights Reserved.
          </Typography>
        </Box>
      </Box>
    </>
  );
};

export default LoginPage;