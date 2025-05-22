import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Stack,
  Chip
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  PictureAsPdf as PdfIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { ProfitabilityResult as ProfitabilityResultType, VolumeCheck, AssetType } from 'shared';
import FinancialMetrics from './FinancialMetrics';
import CashFlowTable from './CashFlowTable';
import { CashFlowChart, SensitivityChart } from '../Charts';

interface ProfitabilityResultProps {
  profitability: ProfitabilityResultType;
  volumeCheck: VolumeCheck;
  onEdit?: () => void;
  onDelete?: () => void;
  onRefresh?: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// アセットタイプごとの表示名
const assetTypeLabels: Record<AssetType, string> = {
  [AssetType.MANSION]: 'マンション',
  [AssetType.OFFICE]: 'オフィス',
  [AssetType.WOODEN_APARTMENT]: '木造アパート',
  [AssetType.HOTEL]: 'ホテル'
};

export const ProfitabilityResult: React.FC<ProfitabilityResultProps> = ({
  profitability,
  volumeCheck,
  onEdit,
  onDelete,
  onRefresh
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [sensitivityTab, setSensitivityTab] = useState<'irr' | 'noi' | 'npv'>('irr');
  
  // IRRなどの値から収益性評価を判断
  const getOverallEvaluation = () => {
    if (profitability.irr >= 6.0) {
      return {
        label: '高収益',
        color: 'success'
      };
    } else if (profitability.irr >= 4.0) {
      return {
        label: '中程度',
        color: 'primary'
      };
    } else {
      return {
        label: '低収益',
        color: 'error'
      };
    }
  };
  
  const evaluation = getOverallEvaluation();
  
  // 数値のフォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleSensitivityTabChange = (_event: React.SyntheticEvent, newValue: 'irr' | 'noi' | 'npv') => {
    setSensitivityTab(newValue);
  };
  
  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5" component="h2">
            収益性分析結果
          </Typography>
          <Chip 
            label={evaluation.label} 
            color={evaluation.color as 'success' | 'primary' | 'error'} 
            size="medium"
          />
        </Stack>
        
        <Stack direction="row" spacing={1}>
          {onRefresh && (
            <Tooltip title="再計算">
              <IconButton onClick={onRefresh} color="primary">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip title="パラメータ編集">
              <IconButton onClick={onEdit} color="primary">
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="PDF出力">
            <IconButton color="primary">
              <PdfIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="保存">
            <IconButton color="primary">
              <SaveIcon />
            </IconButton>
          </Tooltip>
          {onDelete && (
            <Tooltip title="削除">
              <IconButton onClick={onDelete} color="error">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Box>
      
      <FinancialMetrics profitability={profitability} />
      
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              初期投資
            </Typography>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">土地取得費</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1">{formatCurrency(profitability.landPrice)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">建設費</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1">{formatCurrency(profitability.constructionCost)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">諸経費</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1">{formatCurrency(profitability.miscExpenses)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="subtitle2">総投資額</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle1" fontWeight="bold">{formatCurrency(profitability.totalInvestment)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              年間収支
            </Typography>
            <Paper elevation={1} sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">年間賃料収入</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1">{formatCurrency(profitability.annualRentalIncome)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">運営費</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" color="error">-{formatCurrency(profitability.annualOperatingExpenses)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">修繕費</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" color="error">-{formatCurrency(profitability.annualMaintenance)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Box sx={{ mb: 1 }}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="body2" color="text.secondary">不動産税</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="body1" color="error">-{formatCurrency(profitability.annualPropertyTax)}</Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Typography variant="subtitle2">年間純収益(NOI)</Typography>
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle1" color="success.main" fontWeight="bold">{formatCurrency(profitability.annualNOI)}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
      
      <Box sx={{ mt: 4 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          aria-label="収益性分析タブ"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="キャッシュフロー" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="感度分析" icon={<CalculateIcon />} iconPosition="start" />
          <Tab label="パラメータ" icon={<AssessmentIcon />} iconPosition="start" />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 4 }}>
            <CashFlowChart profitability={profitability} />
          </Box>
          
          <CashFlowTable profitability={profitability} />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Tabs 
              value={sensitivityTab} 
              onChange={handleSensitivityTabChange}
              aria-label="感度分析タブ"
            >
              <Tab label="IRR分析" value="irr" />
              <Tab label="NOI分析" value="noi" />
              <Tab label="NPV分析" value="npv" />
            </Tabs>
          </Box>
          
          <SensitivityChart profitability={profitability} type={sensitivityTab} />
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              感度分析は、賃料と建設費の変動が収益性指標に与える影響を示しています。
              例えば、賃料が10%上昇すると{sensitivityTab === 'irr' ? 'IRR' : sensitivityTab === 'noi' ? 'NOI利回り' : 'NPV'}は上昇し、
              建設費が10%上昇すると{sensitivityTab === 'irr' ? 'IRR' : sensitivityTab === 'noi' ? 'NOI利回り' : 'NPV'}は減少します。
            </Typography>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                アセット情報
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">アセットタイプ</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{assetTypeLabels[profitability.assetType]}</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">延床面積</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{volumeCheck.totalFloorArea} m²</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">階数</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{volumeCheck.floors}階</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">容積消化率</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{volumeCheck.consumptionRate}%</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                財務パラメータ
              </Typography>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">賃料単価</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.rentPerSqm.toLocaleString()} 円/m²</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">稼働率</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.occupancyRate}%</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">管理コスト率</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.managementCostRate}%</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">建設単価</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.constructionCostPerSqm.toLocaleString()} 円/m²</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box sx={{ mb: 1 }}>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">運用期間</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.rentalPeriod}年</Typography>
                    </Grid>
                  </Grid>
                </Box>
                <Box>
                  <Grid container justifyContent="space-between">
                    <Grid item>
                      <Typography variant="body2" color="text.secondary">還元利回り</Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body1">{profitability.parameters.capRate}%</Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default ProfitabilityResult;