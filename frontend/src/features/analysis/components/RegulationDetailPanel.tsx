import React from 'react';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Divider,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { VolumeCheck, Property, ShadowRegulationType, HeightDistrictType } from 'shared';

interface RegulationDetailPanelProps {
  volumeCheck: VolumeCheck;
  property: Property;
}

export const RegulationDetailPanel: React.FC<RegulationDetailPanelProps> = ({
  volumeCheck,
  property,
}) => {
  // 日影規制の日本語表示
  const shadowRegulationLabel = {
    'type1': '規制タイプ1（4時間/2.5時間）',
    'type2': '規制タイプ2（5時間/3時間）',
    'none': '規制なし',
  };

  // 高度地区の日本語表示
  const heightDistrictLabel = {
    'first10m': '第一種10M高度地区',
    'first15m': '第一種15M高度地区',
    'second15m': '第二種15M高度地区',
    'second20m': '第二種20M高度地区',
    'none': '指定なし',
  };

  // 地区計画情報の有無
  const hasDistrictPlanInfo = property.districtPlanInfo !== undefined;

  // 緩和措置の有無
  const hasRelaxations = hasDistrictPlanInfo || 
                         (property.shadowRegulation === ShadowRegulationType.NONE && 
                          property.heightDistrict === HeightDistrictType.NONE);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        建築規制詳細
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {/* 高さ制限詳細 */}
      {volumeCheck.regulationLimits && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="高さ制限詳細" 
            titleTypographyProps={{ variant: 'subtitle1' }}
            action={
              <Tooltip title="各種制限のうち最も厳しい値が適用されます">
                <IconButton size="small">
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>制限種別</TableCell>
                  <TableCell align="right">制限値（m）</TableCell>
                  <TableCell align="center">採用</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Tooltip title="用途地域に基づく絶対高さ制限">
                      <Box component="span" sx={{ cursor: 'help' }}>絶対高さ制限</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {volumeCheck.regulationLimits.absoluteLimit === Infinity 
                      ? '制限なし' 
                      : volumeCheck.regulationLimits.absoluteLimit.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.absoluteLimit && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Tooltip title="高度地区による高さ制限">
                      <Box component="span" sx={{ cursor: 'help' }}>高度地区制限</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {volumeCheck.regulationLimits.heightDistrictLimit === Infinity 
                      ? '制限なし' 
                      : volumeCheck.regulationLimits.heightDistrictLimit.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.heightDistrictLimit && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Tooltip title="道路斜線・隣地斜線・北側斜線による制限">
                      <Box component="span" sx={{ cursor: 'help' }}>斜線制限</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {volumeCheck.regulationLimits.slopeLimit === Infinity 
                      ? '制限なし' 
                      : volumeCheck.regulationLimits.slopeLimit.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.slopeLimit && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>
                    <Tooltip title="隣地の日照確保のための日影規制による制限">
                      <Box component="span" sx={{ cursor: 'help' }}>日影規制</Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    {volumeCheck.regulationLimits.shadowLimit === Infinity 
                      ? '制限なし' 
                      : volumeCheck.regulationLimits.shadowLimit.toFixed(1)}
                  </TableCell>
                  <TableCell align="center">
                    {volumeCheck.regulationLimits.finalLimit === volumeCheck.regulationLimits.shadowLimit && (
                      <CheckCircleIcon color="primary" fontSize="small" />
                    )}
                  </TableCell>
                </TableRow>
                <TableRow sx={{ '& td': { fontWeight: 'bold' } }}>
                  <TableCell>最終制限高さ</TableCell>
                  <TableCell align="right">
                    {volumeCheck.regulationLimits.finalLimit === Infinity 
                      ? '制限なし' 
                      : volumeCheck.regulationLimits.finalLimit.toFixed(1)}
                  </TableCell>
                  <TableCell align="center"></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 日影規制シミュレーション結果 */}
      {volumeCheck.shadowSimulation && (
        <Card sx={{ mb: 3 }}>
          <CardHeader 
            title="日影規制シミュレーション" 
            titleTypographyProps={{ variant: 'subtitle1' }}
            subheader="冬至日（12月22日）における日影時間のシミュレーション"
            action={
              volumeCheck.shadowSimulation.compliant ? (
                <Chip 
                  label="適合" 
                  color="success" 
                  size="small" 
                  icon={<CheckCircleIcon />} 
                />
              ) : (
                <Chip 
                  label="不適合" 
                  color="error" 
                  size="small" 
                  icon={<ErrorIcon />} 
                />
              )
            }
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell component="th" sx={{ width: '40%', fontWeight: 500 }}>対象規制</TableCell>
                  <TableCell>
                    {shadowRegulationLabel[property.shadowRegulation || 'none']}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>測定面高さ</TableCell>
                  <TableCell>
                    {property.shadowRegulationDetail?.measurementHeight || 4}m
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>最大日影時間</TableCell>
                  <TableCell>
                    {volumeCheck.shadowSimulation.maxHours.toFixed(1)}時間
                    （規制値: {property.shadowRegulationDetail?.hourRanges.primary || 4}時間）
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell component="th" sx={{ fontWeight: 500 }}>中間日影時間</TableCell>
                  <TableCell>
                    {volumeCheck.shadowSimulation.mediumHours.toFixed(1)}時間
                    （規制値: {property.shadowRegulationDetail?.hourRanges.secondary || 2.5}時間）
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 規制緩和・特例情報 */}
      {hasRelaxations && (
        <Card>
          <CardHeader 
            title="緩和措置・特例情報" 
            titleTypographyProps={{ variant: 'subtitle1' }}
          />
          <CardContent sx={{ pt: 0 }}>
            <Table size="small">
              <TableBody>
                {hasDistrictPlanInfo && (
                  <>
                    <TableRow>
                      <TableCell component="th" sx={{ width: '40%', fontWeight: 500 }}>地区計画名</TableCell>
                      <TableCell>{property.districtPlanInfo?.name}</TableCell>
                    </TableRow>
                    {property.districtPlanInfo?.wallSetbackDistance !== undefined && (
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 500 }}>壁面後退距離</TableCell>
                        <TableCell>{property.districtPlanInfo.wallSetbackDistance}m</TableCell>
                      </TableRow>
                    )}
                    {property.districtPlanInfo?.maxHeight !== undefined && (
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 500 }}>最高高さ制限</TableCell>
                        <TableCell>{property.districtPlanInfo.maxHeight}m</TableCell>
                      </TableRow>
                    )}
                    {property.districtPlanInfo?.specialRegulations && 
                     property.districtPlanInfo.specialRegulations.length > 0 && (
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 500 }}>特別規制事項</TableCell>
                        <TableCell>
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {property.districtPlanInfo.specialRegulations.map((reg, idx) => (
                              <li key={idx}>{reg}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
                {property.shadowRegulation === ShadowRegulationType.NONE && (
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 500 }}>日影規制</TableCell>
                    <TableCell>
                      <Chip label="適用除外" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                )}
                {property.heightDistrict === HeightDistrictType.NONE && (
                  <TableRow>
                    <TableCell component="th" sx={{ fontWeight: 500 }}>高度地区</TableCell>
                    <TableCell>
                      <Chip label="指定なし" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RegulationDetailPanel;