import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Container, 
  Typography, 
  Paper, 
  Box, 
  Button, 
  Grid, 
  Stack,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Calculate as CalculateIcon,
  PictureAsPdf as PdfIcon,
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import LoadingSpinner from '../../../common/components/LoadingSpinner';
import { 
  getVolumeCheckById, 
  getProfitabilitiesByVolumeCheck,
  getScenarios
} from '../api';
import { 
  VolumeCheck, 
  ProfitabilityResult, 
  Scenario
} from 'shared';

// このコンポーネントは後で実装
import { ProfitabilityForm } from '../components/ProfitabilityForm';
import { ProfitabilityResult as ProfitabilityResultComponent } from '../components/ProfitabilityResult';
import { ScenarioManager } from '../components/ScenarioManager';

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
      id={`profitability-tabpanel-${index}`}
      aria-labelledby={`profitability-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProfitabilityPage: React.FC = () => {
  const { volumeCheckId } = useParams<{ volumeCheckId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [volumeCheck, setVolumeCheck] = useState<VolumeCheck | null>(null);
  const [profitabilities, setProfitabilities] = useState<ProfitabilityResult[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedProfitability, setSelectedProfitability] = useState<ProfitabilityResult | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // 初期データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      if (!volumeCheckId) {
        setError('ボリュームチェックIDが指定されていません');
        setLoading(false);
        return;
      }
      
      try {
        // ボリュームチェック情報の取得
        const volumeCheckData = await getVolumeCheckById(volumeCheckId);
        if (!volumeCheckData) {
          throw new Error('ボリュームチェック情報を取得できませんでした');
        }
        setVolumeCheck(volumeCheckData);
        
        // 物件情報はボリュームチェックから取得（本来はAPIから取得すべき）
        // setProperty(propertyData)
        
        // 収益性試算結果の取得
        const profitabilityData = await getProfitabilitiesByVolumeCheck(volumeCheckId);
        if (profitabilityData) {
          setProfitabilities(profitabilityData.profitabilities);
          
          // 最新の収益性試算結果を選択
          if (profitabilityData.profitabilities.length > 0) {
            setSelectedProfitability(profitabilityData.profitabilities[0]);
            setTabValue(1); // 結果タブを選択
          }
        }
        
        // シナリオ情報の取得
        const scenariosData = await getScenarios(volumeCheckId);
        if (scenariosData) {
          setScenarios(scenariosData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('データ取得エラー:', err);
        setError('データの取得中にエラーが発生しました');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [volumeCheckId]);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleProfitabilityCreated = (newProfitability: ProfitabilityResult) => {
    setProfitabilities([newProfitability, ...profitabilities]);
    setSelectedProfitability(newProfitability);
    setTabValue(1); // 結果タブに切り替え
  };
  
  const handleScenarioCreated = (newScenario: Scenario) => {
    setScenarios([newScenario, ...scenarios]);
  };
  
  const handleBackToVolumeCheck = () => {
    // 前のページに戻る（ボリュームチェックページ）
    navigate(-1);
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <Container maxWidth="lg">
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Box mt={2}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackToVolumeCheck}
          >
            ボリュームチェックに戻る
          </Button>
        </Box>
      </Container>
    );
  }
  
  if (!volumeCheck) {
    return (
      <Container maxWidth="lg">
        <Alert severity="warning" sx={{ mt: 4 }}>
          ボリュームチェック情報が見つかりませんでした
        </Alert>
        <Box mt={2}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackToVolumeCheck}
          >
            ボリュームチェックに戻る
          </Button>
        </Box>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Button
            variant="outlined"
            startIcon={<BackIcon />}
            onClick={handleBackToVolumeCheck}
          >
            ボリュームチェックに戻る
          </Button>
          
          <Typography variant="h4" component="h1" gutterBottom>
            収益性試算
          </Typography>
          
          <Box>
            <Tooltip title="PDF出力">
              <IconButton 
                color="primary"
                disabled={!selectedProfitability}
              >
                <PdfIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="保存">
              <IconButton
                color="primary"
                disabled={!selectedProfitability}
              >
                <SaveIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Stack>
        
        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>物件情報</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">物件名</Typography>
              <Typography variant="body1">{volumeCheck.propertyId}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">地域</Typography>
              <Typography variant="body1">該当データなし</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">敷地面積</Typography>
              <Typography variant="body1">該当データなし</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>ボリュームチェック概要</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">アセットタイプ</Typography>
              <Typography variant="body1">{volumeCheck.assetType}</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">延床面積</Typography>
              <Typography variant="body1">{volumeCheck.totalFloorArea} m²</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">階数</Typography>
              <Typography variant="body1">{volumeCheck.floors}階</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">容積消化率</Typography>
              <Typography variant="body1">{volumeCheck.consumptionRate}%</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">建築面積</Typography>
              <Typography variant="body1">{volumeCheck.buildingArea} m²</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle2" color="text.secondary">建物高さ</Typography>
              <Typography variant="body1">{volumeCheck.buildingHeight} m</Typography>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="収益性試算タブ"
          >
            <Tab label="パラメータ入力" />
            <Tab 
              label="試算結果" 
              disabled={!selectedProfitability}
            />
            <Tab label="シナリオ管理" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {volumeCheck && (
            <ProfitabilityForm 
              volumeCheck={volumeCheck}
              onProfitabilityCreated={handleProfitabilityCreated}
            />
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {selectedProfitability ? (
            <ProfitabilityResultComponent
              profitability={selectedProfitability}
              volumeCheck={volumeCheck}
            />
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                収益性試算結果がありません
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<CalculateIcon />}
                onClick={() => setTabValue(0)}
                sx={{ mt: 2 }}
              >
                試算を実行する
              </Button>
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <ScenarioManager
            volumeCheck={volumeCheck}
            scenarios={scenarios}
            onScenarioCreated={handleScenarioCreated}
            onProfitabilityCreated={handleProfitabilityCreated}
          />
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ProfitabilityPage;