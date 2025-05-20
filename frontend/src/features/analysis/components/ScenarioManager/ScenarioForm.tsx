import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Stack,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  PlayArrow as PlayIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { 
  Scenario, 
  VolumeCheck, 
  ScenarioParams, 
  FinancialParams,
  AssetType
} from 'shared';
import { createScenario, updateScenario } from '../../api';
import { FinancialParamsInputs } from '../ProfitabilityForm';

interface ScenarioFormProps {
  volumeCheck: VolumeCheck;
  onSave: (scenario: Scenario) => void;
  onRunProfitability?: (scenario: Scenario) => void;
  onCancel: () => void;
  editScenario?: Scenario; // 編集モードの場合は既存のシナリオを渡す
}

// アセットタイプごとのデフォルト値
const ASSET_TYPE_DEFAULTS: Record<AssetType, FinancialParams> = {
  [AssetType.MANSION]: {
    rentPerSqm: 2800,
    occupancyRate: 95,
    managementCostRate: 18,
    constructionCostPerSqm: 450000,
    rentalPeriod: 20,
    capRate: 4.0
  },
  [AssetType.OFFICE]: {
    rentPerSqm: 3500,
    occupancyRate: 95,
    managementCostRate: 15,
    constructionCostPerSqm: 400000,
    rentalPeriod: 20,
    capRate: 4.0
  },
  [AssetType.WOODEN_APARTMENT]: {
    rentPerSqm: 2100,
    occupancyRate: 90,
    managementCostRate: 20,
    constructionCostPerSqm: 280000,
    rentalPeriod: 20,
    capRate: 5.0
  },
  [AssetType.HOTEL]: {
    rentPerSqm: 4500,
    occupancyRate: 85,
    managementCostRate: 25,
    constructionCostPerSqm: 550000,
    rentalPeriod: 20,
    capRate: 3.5
  }
};

const ScenarioForm: React.FC<ScenarioFormProps> = ({
  volumeCheck,
  onSave,
  onRunProfitability,
  onCancel,
  editScenario
}) => {
  // 編集モードか新規作成モードかを判定
  const isEditMode = !!editScenario;
  
  // 状態初期化
  const [name, setName] = useState<string>(editScenario?.name || `シナリオ ${new Date().toLocaleString('ja-JP')}`);
  const [params, setParams] = useState<ScenarioParams>(
    editScenario?.params || 
    { ...ASSET_TYPE_DEFAULTS[volumeCheck.assetType], assetType: volumeCheck.assetType }
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // パラメータ更新ハンドラ
  const handleParamsChange = (newParams: FinancialParams) => {
    setParams({
      ...newParams,
      assetType: params.assetType
    });
  };
  
  // フォーム送信ハンドラ
  const handleSubmit = async (event: React.FormEvent, runAfterSave: boolean = false) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // 入力検証
      if (!name.trim()) {
        throw new Error('シナリオ名を入力してください');
      }
      
      let result: Scenario | null;
      
      if (isEditMode && editScenario) {
        // 既存シナリオの更新
        result = await updateScenario(editScenario.id, {
          name,
          params
        });
      } else {
        // 新規シナリオの作成
        result = await createScenario(
          volumeCheck.id,
          volumeCheck.propertyId,
          name,
          params
        );
      }
      
      if (result) {
        setSuccess(true);
        onSave(result);
        
        // 収益性試算を実行する場合
        if (runAfterSave && onRunProfitability) {
          onRunProfitability(result);
        }
      } else {
        throw new Error('シナリオの保存に失敗しました');
      }
    } catch (err) {
      console.error('シナリオ保存エラー:', err);
      setError(err instanceof Error ? err.message : 'シナリオの保存中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  // スナックバーを閉じるハンドラ
  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  return (
    <Box component="form" onSubmit={(e) => handleSubmit(e, false)} sx={{ mt: 2 }}>
      <Paper elevation={1} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6">
            {isEditMode ? 'シナリオを編集' : '新規シナリオ作成'}
          </Typography>
        </Stack>
        
        <TextField
          fullWidth
          label="シナリオ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          margin="normal"
          required
        />
        
        <Divider sx={{ my: 3 }} />
        
        <Typography variant="subtitle1" gutterBottom>
          財務パラメータ
        </Typography>
        
        <FinancialParamsInputs
          params={params}
          onParamsChange={handleParamsChange}
          assetType={params.assetType}
        />
        
        {error && (
          <Alert severity="error" sx={{ mt: 3, mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<CancelIcon />}
            onClick={onCancel}
          >
            キャンセル
          </Button>
          
          <Stack direction="row" spacing={2}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              disabled={loading}
            >
              保存
            </Button>
            
            {onRunProfitability && (
              <Button
                variant="contained"
                color="success"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
                disabled={loading}
                onClick={(e) => handleSubmit(e, true)}
              >
                保存して試算実行
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>
      
      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          {isEditMode ? 'シナリオを更新しました' : 'シナリオを作成しました'}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScenarioForm;