/**
 * ボリュームチェック結果表示コンポーネント
 */
import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Button,
  Stack,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalculateIcon from '@mui/icons-material/Calculate';
import { useNavigate } from 'react-router-dom';
import { VolumeCheck, FloorData, RegulationCheck, Property } from 'shared';
import { ThreeViewer } from './ThreeViewer';
import { ThreeViewerControls } from './ThreeViewerControls';
import { useThreeStore } from './ThreeViewer/helpers/useThreeStore';
import RegulationDetailPanel from './RegulationDetailPanel';

interface VolumeCheckResultProps {
  volumeCheck: VolumeCheck;
  property: Property;
  onRecalculate: () => void;
}

// タブパネル用のコンポーネント
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`volume-check-tabpanel-${index}`}
      aria-labelledby={`volume-check-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// アセットタイプの日本語表示
const assetTypeMap: Record<string, string> = {
  'mansion': 'マンション',
  'office': 'オフィス',
  'wooden-apartment': '木造アパート',
  'hotel': 'ホテル',
};

const VolumeCheckResult = ({ volumeCheck, property, onRecalculate }: VolumeCheckResultProps) => {
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  
  // Three.js用の状態を取得
  const { showFloors, showSite, showGrid, viewMode } = useThreeStore();
  
  // 必要なデータの計算
  const maxTheoretical = property.area * property.floorAreaRatio / 100;
  
  // タブ切り替え
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // 収益性試算ページへ遷移
  const handleNavigateToProfitability = () => {
    navigate(`/analysis/profitability/${volumeCheck.id}`);
  };
  
  // 階別データのソート（降順）
  const sortedFloorData = [...(volumeCheck.floorBreakdown || [])].sort((a, b) => b.floor - a.floor);
  
  // 日影シミュレーションがあるかどうか
  const hasShadowSimulation = volumeCheck.shadowSimulation !== undefined;
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          計算結果
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            size="small"
            color="primary"
            startIcon={<CalculateIcon />}
            onClick={handleNavigateToProfitability}
          >
            収益性試算
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon />}
            onClick={onRecalculate}
          >
            再計算
          </Button>
        </Stack>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      {/* 3Dモデルと数値概要 */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            {/* 3Dモデル表示エリア */}
            <ThreeViewer
              volumeCheck={volumeCheck}
              property={property}
              options={{
                showFloors,
                showSite,
                showGrid,
                viewMode,
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            {/* 3Dビューアーコントロール */}
            <ThreeViewerControls volumeCheck={volumeCheck} />
            
            {/* 数値サマリー */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="caption" color="textSecondary">最大建築可能ボリューム</Typography>
                <Typography variant="h5">{maxTheoretical.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} ㎡</Typography>
                <Typography variant="caption" color="textSecondary">敷地面積 × 容積率に基づく理論値</Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="caption" color="textSecondary">実現可能床面積</Typography>
                <Typography variant="h5">{volumeCheck.totalFloorArea?.toLocaleString('ja-JP', { maximumFractionDigits: 2 })} ㎡</Typography>
                <Typography variant="caption" color="textSecondary">アセットタイプの特性を考慮した実現値</Typography>
              </Paper>
              
              <Paper elevation={2} sx={{ p: 2 }}>
                <Typography variant="caption" color="textSecondary">容積消化率</Typography>
                <Typography variant="h5">{volumeCheck.consumptionRate?.toLocaleString('ja-JP', { maximumFractionDigits: 1 })} %</Typography>
                <Typography variant="caption" color="textSecondary">実現可能床面積 ÷ 最大建築可能ボリューム</Typography>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* タブコンテンツ */}
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            aria-label="volume check tabs"
          >
            <Tab label="階別内訳" id="volume-check-tab-0" aria-controls="volume-check-tabpanel-0" />
            <Tab label="建築仕様" id="volume-check-tab-1" aria-controls="volume-check-tabpanel-1" />
            <Tab label="規制チェック" id="volume-check-tab-2" aria-controls="volume-check-tabpanel-2" />
            {hasShadowSimulation && volumeCheck.regulationLimits && (
              <Tab label="詳細規制情報" id="volume-check-tab-3" aria-controls="volume-check-tabpanel-3" />
            )}
          </Tabs>
        </Box>
        
        {/* 階別内訳タブ */}
        <TabPanel value={activeTab} index={0}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>階</TableCell>
                  <TableCell align="right">床面積 (㎡)</TableCell>
                  <TableCell align="right">専有面積 (㎡)</TableCell>
                  <TableCell align="right">共用面積 (㎡)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFloorData.map((floor) => (
                  <TableRow key={floor.floor}>
                    <TableCell>{floor.floor}階</TableCell>
                    <TableCell align="right">{floor.floorArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right">{floor.privateArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell align="right">{floor.commonArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                  <TableCell>合計</TableCell>
                  <TableCell align="right">
                    {volumeCheck.totalFloorArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right">
                    {sortedFloorData.reduce((sum, floor) => sum + floor.privateArea, 0).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right">
                    {sortedFloorData.reduce((sum, floor) => sum + floor.commonArea, 0).toLocaleString('ja-JP', { maximumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* 建築仕様タブ */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ width: '30%', fontWeight: 500 }}>構造</TableCell>
                  <TableCell>RC造</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>階高</TableCell>
                  <TableCell>{volumeCheck.buildingHeight / volumeCheck.floors}m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>建物高さ</TableCell>
                  <TableCell>{volumeCheck.buildingHeight}m</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>基準階床面積</TableCell>
                  <TableCell>
                    {sortedFloorData.length > 0 &&
                      sortedFloorData.find(f => f.floor > 1 && f.floor < volumeCheck.floors)?.floorArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 }) + '㎡'}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>アセットタイプ</TableCell>
                  <TableCell>{assetTypeMap[volumeCheck.assetType] || volumeCheck.assetType}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>建築面積</TableCell>
                  <TableCell>{volumeCheck.buildingArea.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}㎡</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>建蔽率</TableCell>
                  <TableCell>
                    {(volumeCheck.buildingArea / property.area * 100).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}%
                    （許容：{property.buildingCoverage}%）
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>容積率</TableCell>
                  <TableCell>
                    {(volumeCheck.totalFloorArea / property.area * 100).toLocaleString('ja-JP', { maximumFractionDigits: 1 })}%
                    （許容：{property.floorAreaRatio}%）
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* 規制チェックタブ */}
        <TabPanel value={activeTab} index={2}>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>規制項目</TableCell>
                  <TableCell>規制値</TableCell>
                  <TableCell>計画値</TableCell>
                  <TableCell>適合判定</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {volumeCheck.regulationChecks && volumeCheck.regulationChecks.map((check, index) => (
                  <TableRow key={index}>
                    <TableCell>{check.name}</TableCell>
                    <TableCell>{check.regulationValue}</TableCell>
                    <TableCell>{check.plannedValue}</TableCell>
                    <TableCell sx={{ color: check.compliant ? 'success.main' : 'error.main' }}>
                      {check.compliant ? '適合' : '不適合'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
        
        {/* 詳細規制情報タブ */}
        {hasShadowSimulation && volumeCheck.regulationLimits && (
          <TabPanel value={activeTab} index={3}>
            <RegulationDetailPanel 
              volumeCheck={volumeCheck} 
              property={property} 
            />
          </TabPanel>
        )}
      </Box>
    </Box>
  );
};

export default VolumeCheckResult;