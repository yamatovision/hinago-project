/**
 * 座標入力フォームコンポーネント
 * 測量図から抽出された座標データの確認・編集用
 */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Alert,
  Stack,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { CoordinatePoint, CoordinateExtractionResult } from 'shared';

interface CoordinateInputFormProps {
  initialData?: CoordinateExtractionResult;
  onConfirm: (data: CoordinateExtractionResult) => void;
  onCancel: () => void;
}

export const CoordinateInputForm: React.FC<CoordinateInputFormProps> = ({
  initialData,
  onConfirm,
  onCancel,
}) => {
  const [coordinatePoints, setCoordinatePoints] = useState<CoordinatePoint[]>(
    initialData?.coordinatePoints || []
  );
  const [plotNumber, setPlotNumber] = useState(initialData?.plotNumber || '');
  const [area, setArea] = useState(initialData?.area || 0);
  const [registeredArea, setRegisteredArea] = useState(initialData?.registeredArea || 0);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingPoint, setEditingPoint] = useState<CoordinatePoint | null>(null);

  // 面積を再計算
  const recalculateArea = () => {
    if (coordinatePoints.length < 3) {
      setArea(0);
      return;
    }

    let calculatedArea = 0;
    const n = coordinatePoints.length;

    // ガウスの公式
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      calculatedArea += coordinatePoints[i].x * coordinatePoints[j].y;
      calculatedArea -= coordinatePoints[j].x * coordinatePoints[i].y;
    }

    setArea(Math.abs(calculatedArea) / 2);
  };

  useEffect(() => {
    recalculateArea();
  }, [coordinatePoints]);

  // 座標点の追加
  const handleAddPoint = () => {
    const newPoint: CoordinatePoint = {
      id: `P${coordinatePoints.length + 1}`,
      x: 0,
      y: 0,
    };
    setCoordinatePoints([...coordinatePoints, newPoint]);
  };

  // 座標点の削除
  const handleDeletePoint = (index: number) => {
    const newPoints = coordinatePoints.filter((_, i) => i !== index);
    setCoordinatePoints(newPoints);
  };

  // 編集開始
  const handleEditStart = (index: number) => {
    setEditingIndex(index);
    setEditingPoint({ ...coordinatePoints[index] });
  };

  // 編集キャンセル
  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditingPoint(null);
  };

  // 編集保存
  const handleEditSave = () => {
    if (editingIndex !== null && editingPoint) {
      const newPoints = [...coordinatePoints];
      newPoints[editingIndex] = editingPoint;
      setCoordinatePoints(newPoints);
      setEditingIndex(null);
      setEditingPoint(null);
    }
  };

  // 確認処理
  const handleConfirm = () => {
    const result: CoordinateExtractionResult = {
      coordinatePoints,
      totalArea: area * 2, // 倍面積
      area,
      registeredArea,
      plotNumber,
      confidence: 1.0, // 手動入力なので信頼度100%
    };
    onConfirm(result);
  };

  // 計算された面積と登録面積の差
  const areaDifference = Math.abs(area - registeredArea);
  const areaDifferencePercent = registeredArea > 0 ? (areaDifference / registeredArea) * 100 : 0;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        座標データ確認・編集
      </Typography>

      <Grid container spacing={3}>
        {/* 基本情報 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              基本情報
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="地番"
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="登録地積（㎡）"
                value={registeredArea}
                onChange={(e) => setRegisteredArea(Number(e.target.value))}
                type="number"
                fullWidth
                size="small"
                inputProps={{ step: 0.01 }}
              />
            </Stack>
          </Paper>
        </Grid>

        {/* 計算結果 */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              計算結果
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  計算面積
                </Typography>
                <Typography variant="h6">{area.toFixed(2)} ㎡</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">
                  倍面積
                </Typography>
                <Typography variant="h6">{(area * 2).toFixed(6)}</Typography>
              </Grid>
              <Grid item xs={12}>
                {areaDifferencePercent > 1 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    登録地積との差: {areaDifference.toFixed(2)} ㎡ ({areaDifferencePercent.toFixed(1)}%)
                  </Alert>
                )}
                {areaDifferencePercent <= 1 && registeredArea > 0 && (
                  <Alert severity="success" sx={{ mt: 1 }}>
                    登録地積と一致しています
                  </Alert>
                )}
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* 座標点リスト */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle2">
                座標点一覧（{coordinatePoints.length}点）
              </Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddPoint}
                size="small"
                variant="outlined"
              >
                座標点追加
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>点番号</TableCell>
                    <TableCell align="right">X座標</TableCell>
                    <TableCell align="right">Y座標</TableCell>
                    <TableCell align="right">辺長</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {coordinatePoints.map((point, index) => {
                    const isEditing = editingIndex === index;
                    const nextIndex = (index + 1) % coordinatePoints.length;
                    const dx = coordinatePoints[nextIndex].x - point.x;
                    const dy = coordinatePoints[nextIndex].y - point.y;
                    const length = Math.sqrt(dx * dx + dy * dy);

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          {isEditing ? (
                            <TextField
                              value={editingPoint?.id || ''}
                              onChange={(e) =>
                                setEditingPoint({ ...editingPoint!, id: e.target.value })
                              }
                              size="small"
                              sx={{ width: 80 }}
                            />
                          ) : (
                            point.id
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <TextField
                              value={editingPoint?.x || 0}
                              onChange={(e) =>
                                setEditingPoint({ ...editingPoint!, x: Number(e.target.value) })
                              }
                              type="number"
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ step: 0.001 }}
                            />
                          ) : (
                            point.x.toFixed(3)
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {isEditing ? (
                            <TextField
                              value={editingPoint?.y || 0}
                              onChange={(e) =>
                                setEditingPoint({ ...editingPoint!, y: Number(e.target.value) })
                              }
                              type="number"
                              size="small"
                              sx={{ width: 120 }}
                              inputProps={{ step: 0.001 }}
                            />
                          ) : (
                            point.y.toFixed(3)
                          )}
                        </TableCell>
                        <TableCell align="right">{length.toFixed(3)}</TableCell>
                        <TableCell align="center">
                          {isEditing ? (
                            <>
                              <IconButton size="small" onClick={handleEditSave} color="primary">
                                <SaveIcon />
                              </IconButton>
                              <IconButton size="small" onClick={handleEditCancel}>
                                <CancelIcon />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton size="small" onClick={() => handleEditStart(index)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeletePoint(index)}
                                color="error"
                                disabled={coordinatePoints.length <= 3}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* アクションボタン */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button onClick={onCancel} variant="outlined">
              キャンセル
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              startIcon={<CheckCircleIcon />}
              disabled={coordinatePoints.length < 3}
            >
              確認して次へ
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};