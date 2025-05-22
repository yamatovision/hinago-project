/**
 * ボリュームチェック入力フォームコンポーネント
 */
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  TextField,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import { BuildingParams, AssetType, Property } from 'shared';
import { executeVolumeCheck } from '../api/volumeCheck';

interface VolumeCheckFormProps {
  property: Property;
  onVolumeCheckComplete: (result: any) => void;
}

// アセットタイプの選択肢
const assetTypeOptions = [
  { value: AssetType.MANSION, label: 'マンション' },
  { value: AssetType.OFFICE, label: 'オフィス' },
  { value: AssetType.WOODEN_APARTMENT, label: '木造アパート' },
  { value: AssetType.HOTEL, label: 'ホテル' },
];

// アセットタイプごとのデフォルト値
const assetTypeDefaults = {
  [AssetType.MANSION]: {
    floorHeight: 3.0,
    commonAreaRatio: 20,
  },
  [AssetType.OFFICE]: {
    floorHeight: 3.5,
    commonAreaRatio: 15,
  },
  [AssetType.WOODEN_APARTMENT]: {
    floorHeight: 2.7,
    commonAreaRatio: 10,
  },
  [AssetType.HOTEL]: {
    floorHeight: 3.2,
    commonAreaRatio: 25,
  },
};

const VolumeCheckForm = ({ property, onVolumeCheckComplete }: VolumeCheckFormProps) => {
  // フォーム状態
  const [formValues, setFormValues] = useState<BuildingParams>({
    assetType: AssetType.OFFICE,
    floorHeight: 3.5,
    commonAreaRatio: 15,
    floors: 10,
    roadWidth: property.roadWidth || 12,
  });
  
  // UI状態
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetTypeIndex, setSelectedAssetTypeIndex] = useState(1); // オフィスをデフォルト選択
  
  // フォーム値変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };
  
  // アセットタイプ選択ハンドラ
  const handleAssetTypeSelect = (index: number) => {
    const assetType = assetTypeOptions[index].value;
    const defaults = assetTypeDefaults[assetType];
    
    setSelectedAssetTypeIndex(index);
    setFormValues(prev => ({
      ...prev,
      assetType,
      floorHeight: defaults.floorHeight,
      commonAreaRatio: defaults.commonAreaRatio,
    }));
  };
  
  // ボリュームチェック実行
  const handleVolumeCheck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await executeVolumeCheck(property.id, formValues);
      
      if (result) {
        onVolumeCheckComplete(result);
      } else {
        setError('ボリュームチェックの実行に失敗しました。再度お試しください。');
      }
    } catch (err) {
      console.error('ボリュームチェック実行エラー:', err);
      setError(`エラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box>
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* アセットタイプ選択 */}
      <Typography variant="h6" component="h2" gutterBottom>
        アセットタイプ選択
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
        {assetTypeOptions.map((option, index) => (
          <Paper
            key={option.value}
            elevation={selectedAssetTypeIndex === index ? 4 : 1}
            sx={{
              p: 2,
              width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(25% - 16px)' },
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: selectedAssetTypeIndex === index ? 'primary.light' : 'background.paper',
              color: selectedAssetTypeIndex === index ? 'primary.contrastText' : 'text.primary',
              transition: 'all 0.3s',
              '&:hover': {
                bgcolor: selectedAssetTypeIndex === index ? 'primary.light' : 'action.hover',
              },
            }}
            onClick={() => handleAssetTypeSelect(index)}
          >
            <Box sx={{ fontSize: '3rem', mb: 1 }}>
              {option.value === AssetType.MANSION && '🏢'}
              {option.value === AssetType.OFFICE && '🏣'}
              {option.value === AssetType.WOODEN_APARTMENT && '🏠'}
              {option.value === AssetType.HOTEL && '🏨'}
            </Box>
            <Typography variant="subtitle1" fontWeight={selectedAssetTypeIndex === index ? 'bold' : 'normal'}>
              {option.label}
            </Typography>
          </Paper>
        ))}
      </Box>
      
      {/* 建築パラメータ入力 */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="階高 (m)"
            name="floorHeight"
            type="number"
            value={formValues.floorHeight}
            onChange={handleInputChange}
            inputProps={{ step: 0.1, min: 2, max: 10 }}
            helperText="2.0m～10.0mの範囲で指定"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="共用部率 (%)"
            name="commonAreaRatio"
            type="number"
            value={formValues.commonAreaRatio}
            onChange={handleInputChange}
            inputProps={{ step: 1, min: 0, max: 100 }}
            helperText="0%～100%の範囲で指定"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="前面道路幅員 (m)"
            name="roadWidth"
            type="number"
            value={formValues.roadWidth}
            onChange={handleInputChange}
            inputProps={{ step: 0.1, min: 0 }}
            helperText="前面道路の幅を指定"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="階数"
            name="floors"
            type="number"
            value={formValues.floors}
            onChange={handleInputChange}
            inputProps={{ min: 1, max: 100 }}
            helperText="1階～100階の範囲で指定"
          />
        </Grid>
      </Grid>
      
      {/* 実行ボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <CalculateIcon />}
          onClick={handleVolumeCheck}
          disabled={loading}
        >
          {loading ? 'ボリュームチェック実行中...' : 'ボリュームチェック実行'}
        </Button>
      </Box>
    </Box>
  );
};

export default VolumeCheckForm;