/**
 * 物件登録ページ
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Box, 
  Paper,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import Header from '../../../common/components/Header/Header';
import PropertyForm from '../components/PropertyForm/PropertyForm';
import { PropertyCreateData, Property } from 'shared';
import { createProperty } from '../api/properties';

const PropertyRegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdProperty, setCreatedProperty] = useState<Property | null>(null);

  // フォーム送信処理
  const handleSubmit = async (data: PropertyCreateData, andNavigate: boolean = false) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await createProperty(data);
      
      if (result) {
        setCreatedProperty(result);
        setSuccess(true);
        
        // 物件詳細ページへの遷移が要求された場合
        if (andNavigate) {
          setTimeout(() => {
            navigate(`/properties/${result.id}`);
          }, 1000);
        }
      } else {
        setError('物件情報の登録に失敗しました。');
      }
    } catch (err) {
      setError('エラーが発生しました。入力内容を確認してください。');
      console.error('物件登録エラー:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセルボタンのハンドラ
  const handleCancel = () => {
    navigate('/dashboard');
  };

  // 下書き保存のハンドラ（実際の保存ロジックは未実装）
  const handleDraft = () => {
    // 本実装では下書き保存APIを呼び出す
    alert('下書き保存機能は現在開発中です。');
  };

  // 通知を閉じる処理
  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">物件登録</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>基本情報を入力後、詳細ページで敷地形状や文書を登録できます</Typography>
        </Box>

        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="h2" sx={{ mb: 3 }}>基本情報</Typography>
          
          {/* 物件フォームコンポーネント */}
          <PropertyForm 
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            onCancel={handleCancel}
            onDraft={handleDraft}
          />
        </Paper>

        {/* 成功・エラー通知 */}
        <Snackbar 
          open={success} 
          autoHideDuration={5000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
            物件情報が正常に登録されました。
          </Alert>
        </Snackbar>
        
        <Snackbar 
          open={!!error} 
          autoHideDuration={5000} 
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        </Snackbar>
      </Container>
    </>
  );
};

export default PropertyRegisterPage;