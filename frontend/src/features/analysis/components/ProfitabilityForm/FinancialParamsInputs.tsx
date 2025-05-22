import React from 'react';
import {
  Grid,
  Typography,
  Slider,
  TextField,
  InputAdornment,
  Box,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  HelpOutline as HelpIcon
} from '@mui/icons-material';
import { FinancialParams, AssetType } from 'shared';

interface FinancialParamsInputsProps {
  params: FinancialParams;
  onParamsChange: (params: FinancialParams) => void;
  assetType: AssetType;
}

const TOOLTIPS = {
  rentPerSqm: '賃料単価は、1平方メートルあたりの月額賃料です。地域や物件タイプによって異なります。',
  occupancyRate: '稼働率は、物件が1年間で実際に賃貸される割合を示します。100%が最大です。',
  managementCostRate: '管理コスト率は、年間賃料収入に対する管理費、修繕費などの割合です。',
  constructionCostPerSqm: '建設単価は、1平方メートルあたりの建設費用です。構造や仕様によって異なります。',
  rentalPeriod: '運用期間は、物件を運用する予定の年数です。',
  capRate: '還元利回りは、不動産の価値評価に使用される指標で、年間純収益を不動産価値で割った値です。'
};


// スライダーの範囲設定
const SLIDER_RANGES = {
  rentPerSqm: { min: 1000, max: 6000, step: 100 },
  occupancyRate: { min: 70, max: 100, step: 1 },
  managementCostRate: { min: 10, max: 30, step: 1 },
  constructionCostPerSqm: { min: 200000, max: 700000, step: 10000 },
  rentalPeriod: { min: 10, max: 30, step: 1 },
  capRate: { min: 2.0, max: 7.0, step: 0.1 }
};


const FinancialParamsInputs: React.FC<FinancialParamsInputsProps> = ({
  params,
  onParamsChange
}) => {
  const handleSliderChange = (key: keyof FinancialParams) => (
    _event: Event,
    newValue: number | number[]
  ) => {
    if (typeof newValue === 'number') {
      onParamsChange({
        ...params,
        [key]: newValue
      });
    }
  };

  const handleInputChange = (key: keyof FinancialParams) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = Number(event.target.value);
    if (!isNaN(newValue)) {
      onParamsChange({
        ...params,
        [key]: newValue
      });
    }
  };


  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            収益パラメータ
          </Typography>

          {/* 賃料単価 */}
          <Box sx={{ mb: 3 }}>
            <Typography id="rent-per-sqm-slider" gutterBottom>
              賃料単価
              <Tooltip title={TOOLTIPS.rentPerSqm}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.rentPerSqm}
                  onChange={handleSliderChange('rentPerSqm')}
                  aria-labelledby="rent-per-sqm-slider"
                  min={SLIDER_RANGES.rentPerSqm.min}
                  max={SLIDER_RANGES.rentPerSqm.max}
                  step={SLIDER_RANGES.rentPerSqm.step}
                  marks={[
                    { value: SLIDER_RANGES.rentPerSqm.min, label: '低め' },
                    { value: SLIDER_RANGES.rentPerSqm.max, label: '高め' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value.toLocaleString()}円/m²`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.rentPerSqm}
                  onChange={handleInputChange('rentPerSqm')}
                  inputProps={{
                    step: SLIDER_RANGES.rentPerSqm.step,
                    min: SLIDER_RANGES.rentPerSqm.min,
                    max: SLIDER_RANGES.rentPerSqm.max,
                    type: 'number',
                    'aria-labelledby': 'rent-per-sqm-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円/m²</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 稼働率 */}
          <Box sx={{ mb: 3 }}>
            <Typography id="occupancy-rate-slider" gutterBottom>
              稼働率
              <Tooltip title={TOOLTIPS.occupancyRate}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.occupancyRate}
                  onChange={handleSliderChange('occupancyRate')}
                  aria-labelledby="occupancy-rate-slider"
                  min={SLIDER_RANGES.occupancyRate.min}
                  max={SLIDER_RANGES.occupancyRate.max}
                  step={SLIDER_RANGES.occupancyRate.step}
                  marks={[
                    { value: SLIDER_RANGES.occupancyRate.min, label: '低め' },
                    { value: SLIDER_RANGES.occupancyRate.max, label: '高め' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value}%`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.occupancyRate}
                  onChange={handleInputChange('occupancyRate')}
                  inputProps={{
                    step: SLIDER_RANGES.occupancyRate.step,
                    min: SLIDER_RANGES.occupancyRate.min,
                    max: SLIDER_RANGES.occupancyRate.max,
                    type: 'number',
                    'aria-labelledby': 'occupancy-rate-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 管理コスト率 */}
          <Box sx={{ mb: 3 }}>
            <Typography id="management-cost-slider" gutterBottom>
              管理コスト率
              <Tooltip title={TOOLTIPS.managementCostRate}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.managementCostRate}
                  onChange={handleSliderChange('managementCostRate')}
                  aria-labelledby="management-cost-slider"
                  min={SLIDER_RANGES.managementCostRate.min}
                  max={SLIDER_RANGES.managementCostRate.max}
                  step={SLIDER_RANGES.managementCostRate.step}
                  marks={[
                    { value: SLIDER_RANGES.managementCostRate.min, label: '低め' },
                    { value: SLIDER_RANGES.managementCostRate.max, label: '高め' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value}%`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.managementCostRate}
                  onChange={handleInputChange('managementCostRate')}
                  inputProps={{
                    step: SLIDER_RANGES.managementCostRate.step,
                    min: SLIDER_RANGES.managementCostRate.min,
                    max: SLIDER_RANGES.managementCostRate.max,
                    type: 'number',
                    'aria-labelledby': 'management-cost-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            建築パラメータ
          </Typography>

          {/* 建設単価 */}
          <Box sx={{ mb: 3 }}>
            <Typography id="construction-cost-slider" gutterBottom>
              建設単価
              <Tooltip title={TOOLTIPS.constructionCostPerSqm}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.constructionCostPerSqm}
                  onChange={handleSliderChange('constructionCostPerSqm')}
                  aria-labelledby="construction-cost-slider"
                  min={SLIDER_RANGES.constructionCostPerSqm.min}
                  max={SLIDER_RANGES.constructionCostPerSqm.max}
                  step={SLIDER_RANGES.constructionCostPerSqm.step}
                  marks={[
                    { value: SLIDER_RANGES.constructionCostPerSqm.min, label: '低め' },
                    { value: SLIDER_RANGES.constructionCostPerSqm.max, label: '高め' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value.toLocaleString()}円/m²`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.constructionCostPerSqm}
                  onChange={handleInputChange('constructionCostPerSqm')}
                  inputProps={{
                    step: SLIDER_RANGES.constructionCostPerSqm.step,
                    min: SLIDER_RANGES.constructionCostPerSqm.min,
                    max: SLIDER_RANGES.constructionCostPerSqm.max,
                    type: 'number',
                    'aria-labelledby': 'construction-cost-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">円/m²</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 運用期間 */}
          <Box sx={{ mb: 3 }}>
            <Typography id="rental-period-slider" gutterBottom>
              運用期間
              <Tooltip title={TOOLTIPS.rentalPeriod}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.rentalPeriod}
                  onChange={handleSliderChange('rentalPeriod')}
                  aria-labelledby="rental-period-slider"
                  min={SLIDER_RANGES.rentalPeriod.min}
                  max={SLIDER_RANGES.rentalPeriod.max}
                  step={SLIDER_RANGES.rentalPeriod.step}
                  marks={[
                    { value: SLIDER_RANGES.rentalPeriod.min, label: '短期' },
                    { value: SLIDER_RANGES.rentalPeriod.max, label: '長期' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value}年`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.rentalPeriod}
                  onChange={handleInputChange('rentalPeriod')}
                  inputProps={{
                    step: SLIDER_RANGES.rentalPeriod.step,
                    min: SLIDER_RANGES.rentalPeriod.min,
                    max: SLIDER_RANGES.rentalPeriod.max,
                    type: 'number',
                    'aria-labelledby': 'rental-period-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">年</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 還元利回り */}
          <Box sx={{ mb: 3 }}>
            <Typography id="cap-rate-slider" gutterBottom>
              還元利回り
              <Tooltip title={TOOLTIPS.capRate}>
                <IconButton size="small" sx={{ ml: 1 }}>
                  <HelpIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs>
                <Slider
                  value={params.capRate}
                  onChange={handleSliderChange('capRate')}
                  aria-labelledby="cap-rate-slider"
                  min={SLIDER_RANGES.capRate.min}
                  max={SLIDER_RANGES.capRate.max}
                  step={SLIDER_RANGES.capRate.step}
                  marks={[
                    { value: SLIDER_RANGES.capRate.min, label: '低め' },
                    { value: SLIDER_RANGES.capRate.max, label: '高め' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value: number) => `${value}%`}
                />
              </Grid>
              <Grid item>
                <TextField
                  value={params.capRate}
                  onChange={handleInputChange('capRate')}
                  inputProps={{
                    step: SLIDER_RANGES.capRate.step,
                    min: SLIDER_RANGES.capRate.min,
                    max: SLIDER_RANGES.capRate.max,
                    type: 'number',
                    'aria-labelledby': 'cap-rate-slider',
                  }}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  size="small"
                  sx={{ width: 150 }}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialParamsInputs;