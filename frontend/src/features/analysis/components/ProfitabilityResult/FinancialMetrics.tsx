import React from 'react';
import {
  Typography,
  Paper,
  Grid,
} from '@mui/material';
import { ProfitabilityResult } from 'shared';

interface FinancialMetricsProps {
  profitability: ProfitabilityResult;
}

const FinancialMetrics: React.FC<FinancialMetricsProps> = ({ profitability }) => {

  // 財務指標の評価を行う関数
  const evaluateMetric = (type: 'irr' | 'noiYield' | 'paybackPeriod' | 'npv') => {
    switch (type) {
      case 'irr':
        if (profitability.irr >= 6.0) return { color: 'success.main', label: '高' };
        if (profitability.irr >= 4.0) return { color: 'primary.main', label: '中' };
        return { color: 'error.main', label: '低' };
      
      case 'noiYield':
        if (profitability.noiYield >= 5.5) return { color: 'success.main', label: '高' };
        if (profitability.noiYield >= 4.0) return { color: 'primary.main', label: '中' };
        return { color: 'error.main', label: '低' };
      
      case 'paybackPeriod':
        if (profitability.paybackPeriod <= 12) return { color: 'success.main', label: '短期' };
        if (profitability.paybackPeriod <= 17) return { color: 'primary.main', label: '中期' };
        return { color: 'error.main', label: '長期' };
      
      case 'npv':
        if (profitability.npv >= 100000000) return { color: 'success.main', label: '高' }; // 1億円以上
        if (profitability.npv >= 0) return { color: 'primary.main', label: '中' };
        return { color: 'error.main', label: '低' };
      
      default:
        return { color: 'text.primary', label: '-' };
    }
  };

  // 数値のフォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // IRRの評価
  const irrEvaluation = evaluateMetric('irr');
  
  // NOI利回りの評価
  const noiYieldEvaluation = evaluateMetric('noiYield');
  
  // 投資回収期間の評価
  const paybackPeriodEvaluation = evaluateMetric('paybackPeriod');
  
  // NPVの評価
  const npvEvaluation = evaluateMetric('npv');

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            投資利回り (NOI)
          </Typography>
          <Typography variant="h4" color={noiYieldEvaluation.color} gutterBottom>
            {profitability.noiYield.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            年間純収益 ÷ 総投資額
          </Typography>
          <Typography variant="caption" color={noiYieldEvaluation.color} sx={{ fontWeight: 'bold' }}>
            {noiYieldEvaluation.label}収益率
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            IRR (内部収益率)
          </Typography>
          <Typography variant="h4" color={irrEvaluation.color} gutterBottom>
            {profitability.irr.toFixed(1)}%
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profitability.parameters.rentalPeriod}年間のキャッシュフロー
          </Typography>
          <Typography variant="caption" color={irrEvaluation.color} sx={{ fontWeight: 'bold' }}>
            {irrEvaluation.label}収益性
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            投資回収期間
          </Typography>
          <Typography variant="h4" color={paybackPeriodEvaluation.color} gutterBottom>
            {profitability.paybackPeriod.toFixed(1)}年
          </Typography>
          <Typography variant="body2" color="text.secondary">
            初期投資の回収に要する期間
          </Typography>
          <Typography variant="caption" color={paybackPeriodEvaluation.color} sx={{ fontWeight: 'bold' }}>
            {paybackPeriodEvaluation.label}
          </Typography>
        </Paper>
      </Grid>

      <Grid item xs={12} md={3}>
        <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            NPV (正味現在価値)
          </Typography>
          <Typography variant="h4" color={npvEvaluation.color} gutterBottom sx={{ fontSize: '1.75rem' }}>
            {formatCurrency(profitability.npv)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            割引率{profitability.parameters.capRate}%で計算
          </Typography>
          <Typography variant="caption" color={npvEvaluation.color} sx={{ fontWeight: 'bold' }}>
            {npvEvaluation.label}価値
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default FinancialMetrics;