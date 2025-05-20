import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Paper,
  Divider,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  ToggleButtonGroup,
  ToggleButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Save as SaveIcon,
  Apartment as ApartmentIcon,
  Business as BusinessIcon,
  Home as HomeIcon,
  Hotel as HotelIcon,
} from '@mui/icons-material';
import {
  VolumeCheck,
  FinancialParams,
  ProfitabilityResult,
  AssetType
} from 'shared';
import { executeProfitability } from '../../api';
import FinancialParamsInputs from './FinancialParamsInputs';

interface ProfitabilityFormProps {
  volumeCheck: VolumeCheck;
  onProfitabilityCreated: (profitability: ProfitabilityResult) => void;
  initialParams?: FinancialParams;
  scenarioName?: string;
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

export const ProfitabilityForm: React.FC<ProfitabilityFormProps> = ({
  volumeCheck,
  onProfitabilityCreated,
  initialParams,
  scenarioName
}) => {
  const [assetType, setAssetType] = useState<AssetType>(volumeCheck.assetType);
  const [financialParams, setFinancialParams] = useState<FinancialParams>(
    initialParams || ASSET_TYPE_DEFAULTS[volumeCheck.assetType]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [saveAsTempScenario, setSaveAsTempScenario] = useState<boolean>(false);
  const [scenarioNameInput, setScenarioNameInput] = useState<string>(scenarioName || '');

  // アセットタイプが変更されたらデフォルト値に戻す
  useEffect(() => {
    if (!initialParams) {
      setFinancialParams(ASSET_TYPE_DEFAULTS[assetType]);
    }
  }, [assetType, initialParams]);

  const handleAssetTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newAssetType: AssetType | null
  ) => {
    if (newAssetType !== null) {
      setAssetType(newAssetType);
    }
  };

  const handleParamsChange = (newParams: FinancialParams) => {
    setFinancialParams(newParams);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await executeProfitability(volumeCheck.id, financialParams);
      if (result) {
        onProfitabilityCreated(result);
        setSuccess(true);
      } else {
        throw new Error('収益性試算の実行に失敗しました');
      }
    } catch (err) {
      console.error('収益性試算エラー:', err);
      setError(err instanceof Error ? err.message : '収益性試算の実行中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'background.paper' }}>
        <Typography variant="h6" gutterBottom>
          {scenarioName ? `シナリオ: ${scenarioName}` : '収益性試算パラメータ'}
        </Typography>

        {!scenarioName && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              アセットタイプ
            </Typography>
            
            <ToggleButtonGroup
              value={assetType}
              exclusive
              onChange={handleAssetTypeChange}
              aria-label="asset type"
              color="primary"
              sx={{ mb: 2, width: '100%', display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' } }}
            >
              <ToggleButton value={AssetType.MANSION} aria-label="マンション" sx={{ flex: 1, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <ApartmentIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography>マンション</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value={AssetType.OFFICE} aria-label="オフィス" sx={{ flex: 1, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <BusinessIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography>オフィス</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value={AssetType.WOODEN_APARTMENT} aria-label="木造アパート" sx={{ flex: 1, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <HomeIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography>木造アパート</Typography>
                </Box>
              </ToggleButton>
              <ToggleButton value={AssetType.HOTEL} aria-label="ホテル" sx={{ flex: 1, py: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <HotelIcon sx={{ fontSize: 32, mb: 1 }} />
                  <Typography>ホテル</Typography>
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}

        {/* 財務パラメータ入力 */}
        <FinancialParamsInputs
          params={financialParams}
          onParamsChange={handleParamsChange}
          assetType={assetType}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 3, mb: 3 }}>
            {error}
          </Alert>
        )}

        {!scenarioName && (
          <Box sx={{ mt: 3, mb: 2 }}>
            <Grid container alignItems="center" spacing={2}>
              <Grid item>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => setSaveAsTempScenario(!saveAsTempScenario)}
                >
                  シナリオとして保存
                </Button>
              </Grid>
              
              {saveAsTempScenario && (
                <Grid item xs>
                  <TextField
                    label="シナリオ名"
                    value={scenarioNameInput}
                    onChange={(e) => setScenarioNameInput(e.target.value)}
                    size="small"
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            size="large"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
            disabled={loading}
          >
            収益性試算実行
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={success}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success">
          収益性試算が完了しました
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfitabilityForm;