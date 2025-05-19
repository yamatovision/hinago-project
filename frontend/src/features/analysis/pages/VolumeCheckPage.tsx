/**
 * ボリュームチェックページ
 * 建築可能ボリュームの計算と3D表示を行う
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../../../common/components/Header/Header';
import { getPropertyById } from '../../properties/api/properties';
import { getVolumeCheckById } from '../api/volumeCheck';
import { Property, VolumeCheck } from 'shared';
import { VolumeCheckForm, VolumeCheckResult } from '../components';

const VolumeCheckPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // 状態管理
  const [property, setProperty] = useState<Property | null>(null);
  const [volumeCheck, setVolumeCheck] = useState<VolumeCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // データ取得
  const fetchData = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 物件情報を取得
      let propertyData: Property | null = null;
      
      // URLのIDがpropertyIdかvolumeCheckIdか判断
      // ここでは簡易的に一律propertyIdとして扱い、エラー時に再試行
      propertyData = await getPropertyById(id);
      
      if (!propertyData) {
        // 物件がなければボリュームチェックIDの可能性を検証
        const volumeCheckData = await getVolumeCheckById(id);
        if (volumeCheckData) {
          setVolumeCheck(volumeCheckData);
          // ボリュームチェックの物件情報を取得
          propertyData = await getPropertyById(volumeCheckData.propertyId);
        }
      } else {
        // 物件があれば、関連するボリュームチェック一覧を取得する処理は省略
        // 将来的にここで最新のボリュームチェックを取得する機能を実装
      }
      
      if (propertyData) {
        setProperty(propertyData);
      } else {
        setError('物件情報が見つかりませんでした');
      }
    } catch (err: any) {
      console.error('データ取得エラー:', err);
      setError(`データの取得中にエラーが発生しました: ${err.message || '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };
  
  // 初回レンダリング時にデータを取得
  useEffect(() => {
    fetchData();
  }, [id]);
  
  // ボリュームチェック完了時のハンドラ
  const handleVolumeCheckComplete = (result: VolumeCheck) => {
    setVolumeCheck(result);
  };
  
  // 戻るボタン
  const handleBack = () => {
    navigate(-1);
  };
  
  // 保存ボタン
  const handleSave = () => {
    // 保存機能（未実装）
    alert('保存機能は現在開発中です');
  };
  
  // PDF出力ボタン
  const handlePdfExport = () => {
    // PDF出力機能（未実装）
    alert('PDF出力機能は現在開発中です');
  };
  
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        {/* ページヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={handleBack} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              ボリュームチェック
            </Typography>
          </Box>
          <Box>
            <Tooltip title="保存">
              <IconButton onClick={handleSave} sx={{ mr: 1 }}>
                <SaveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="PDF出力">
              <IconButton onClick={handlePdfExport}>
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        {/* ローディング表示 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            {/* 物件情報 */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                物件情報
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">物件名</Typography>
                    <Typography variant="body1">{property?.name || '不明'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">住所</Typography>
                    <Typography variant="body1">{property?.address || '不明'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">敷地面積（㎡）</Typography>
                    <Typography variant="body1">{property?.area?.toLocaleString('ja-JP', { maximumFractionDigits: 2 }) || '不明'}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">用途地域</Typography>
                    <Typography variant="body1">{property?.zoneType || '不明'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">建蔽率（%）</Typography>
                    <Typography variant="body1">{property?.buildingCoverage || '不明'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="textSecondary">容積率（%）</Typography>
                    <Typography variant="body1">{property?.floorAreaRatio || '不明'}</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
            
            {property && (
              <Paper sx={{ p: 3, mb: 3 }}>
                {volumeCheck ? (
                  // ボリュームチェック結果表示
                  <VolumeCheckResult 
                    volumeCheck={volumeCheck} 
                    property={property} 
                    onRecalculate={fetchData} 
                  />
                ) : (
                  // ボリュームチェック入力フォーム
                  <VolumeCheckForm 
                    property={property} 
                    onVolumeCheckComplete={handleVolumeCheckComplete} 
                  />
                )}
              </Paper>
            )}
          </>
        )}
      </Container>
    </>
  );
};

export default VolumeCheckPage;