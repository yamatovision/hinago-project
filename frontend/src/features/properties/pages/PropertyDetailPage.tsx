import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Button, 
  CircularProgress, 
  Alert
} from '@mui/material';
import { Visibility as VisibilityIcon, ViewInAr as ViewInArIcon } from '@mui/icons-material';
import { PropertyDetail } from 'shared';
import { getPropertyById } from '../api/properties';
import PropertyDetailTabs from '../components/PropertyDetail/PropertyDetailTabs';

/**
 * 物件詳細ページ
 * 物件情報の表示、編集、および関連する情報（敷地形状、文書、履歴）の管理を行う
 */
const PropertyDetailPage: React.FC = () => {
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  
  // 状態管理
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 物件データの取得
  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!propertyId) {
        setError('物件IDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getPropertyById(propertyId);
        
        if (data) {
          setProperty(data);
          setError(null);
        } else {
          setError('物件情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('物件データ取得エラー:', err);
        setError('エラーが発生しました。しばらく経ってからもう一度お試しください');
      } finally {
        setLoading(false);
      }
    };

    fetchPropertyData();
  }, [propertyId]);

  // ダッシュボードへ戻る
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // ボリュームチェックページへ
  const handleGoToVolumeCheck = () => {
    if (propertyId) {
      navigate(`/analysis/volume-check/${propertyId}`);
    }
  };

  // ローディング表示
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
        <Box mt={2}>
          <Button variant="outlined" onClick={handleBackToDashboard}>
            ダッシュボードへ戻る
          </Button>
        </Box>
      </Box>
    );
  }

  // データがない場合
  if (!property) {
    return (
      <Box p={3}>
        <Alert severity="warning">物件情報が見つかりませんでした</Alert>
        <Box mt={2}>
          <Button variant="outlined" onClick={handleBackToDashboard}>
            ダッシュボードへ戻る
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, maxWidth: 1280, margin: '0 auto', width: '100%' }}>
      {/* ページヘッダー */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h5" component="h1">
            {property.name}
          </Typography>
          <Chip 
            label={property.status ? property.status : '新規'} 
            color="primary" 
            size="small" 
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            startIcon={<VisibilityIcon />}
            size="small"
          >
            印刷用表示
          </Button>
          <Button 
            variant="contained" 
            startIcon={<ViewInArIcon />}
            size="medium"
            onClick={handleGoToVolumeCheck}
            color="primary"
            sx={{ fontWeight: 'bold' }}
          >
            ボリュームチェックへ
          </Button>
        </Box>
      </Box>

      {/* タブコンテンツ */}
      <Paper sx={{ mb: 3 }}>
        <PropertyDetailTabs property={property} setProperty={setProperty} />
      </Paper>
    </Box>
  );
};

export default PropertyDetailPage;