/**
 * ログインフォームコンポーネント
 */
import { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Paper, 
  InputAdornment, 
  IconButton,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, Business } from '@mui/icons-material';
import { LoginRequest } from '../../../../shared';
import { useAuth } from '../../../common/hooks/useAuth';
import LoadingSpinner from '../../../common/components/LoadingSpinner';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  // 認証フックを使用
  const { login, isLoading, error } = useAuth();

  // フォーム状態
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
  });

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // バリデーションチェック
    let isValid = true;
    const errors = {
      email: '',
      password: '',
    };

    // メールアドレスバリデーション
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'メールアドレスを入力してください';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }

    // パスワードバリデーション
    if (!password) {
      errors.password = 'パスワードを入力してください';
      isValid = false;
    } else if (password.length < 6) {
      errors.password = 'パスワードは6文字以上で入力してください';
      isValid = false;
    }

    // バリデーションエラーがあれば表示
    if (!isValid) {
      setValidationErrors(errors);
      return;
    }

    // ログインリクエスト
    const loginData: LoginRequest = {
      email,
      password,
    };

    const success = await login(loginData);
    
    if (success && onSuccess) {
      onSuccess();
    }
  };

  // パスワード表示切り替え
  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 3,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 420,
          overflow: 'hidden',
        }}
      >
        {/* ヘッダー部分 */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            padding: 2.5,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Business sx={{ fontSize: 32, mr: 1 }} />
            <Typography variant="h5" component="span" fontWeight={500}>
              Hinago
            </Typography>
          </Box>
          <Typography variant="h6" fontWeight={400}>
            ボリュームチェックシステム
          </Typography>
        </Box>

        {/* フォーム部分 */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ padding: 4 }}
        >
          {/* エラーメッセージ */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              component="label"
              htmlFor="email"
              sx={{
                display: 'block',
                mb: 1,
                fontWeight: 500,
                color: 'text.primary',
              }}
            >
              メールアドレス
            </Typography>
            <TextField
              id="email"
              fullWidth
              placeholder="例: user@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (validationErrors.email) {
                  setValidationErrors({
                    ...validationErrors,
                    email: '',
                  });
                }
              }}
              error={!!validationErrors.email}
              helperText={validationErrors.email}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'メールアドレス',
              }}
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="subtitle2"
              component="label"
              htmlFor="password"
              sx={{
                display: 'block',
                mb: 1,
                fontWeight: 500,
                color: 'text.primary',
              }}
            >
              パスワード
            </Typography>
            <TextField
              id="password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors({
                    ...validationErrors,
                    password: '',
                  });
                }
              }}
              error={!!validationErrors.password}
              helperText={validationErrors.password}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="パスワードの表示切り替え"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isLoading}
            sx={{
              mt: 3,
              py: 1.5,
              fontWeight: 500,
            }}
          >
            {isLoading ? <LoadingSpinner size={24} /> : 'ログイン'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginForm;