import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  InputAdornment,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Map as MapIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { PropertyDetail, PropertyShape, BoundaryPoint, CoordinateExtractionResult } from 'shared';
import { updatePropertyShape, uploadSurveyAndExtractShape } from '../../api/shape';
import { CoordinateInputForm } from '../CoordinateInput';

interface PropertyShapeTabProps {
  property: PropertyDetail;
  setProperty: React.Dispatch<React.SetStateAction<PropertyDetail | null>>;
}

/**
 * 物件の敷地形状タブ
 * 敷地形状の表示・編集機能を提供
 */
const PropertyShapeTab: React.FC<PropertyShapeTabProps> = ({ property, setProperty }) => {
  // 状態管理
  const [shapeData, setShapeData] = useState<PropertyShape>(
    property.shapeData || { points: [], width: 0, depth: 0 }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
  const [extractionResult, setExtractionResult] = useState<CoordinateExtractionResult | null>(null);
  
  // ファイル入力参照
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // 敷地形状データが存在するか
  const hasShapeData = property.shapeData && property.shapeData.points && property.shapeData.points.length > 0;
  
  // 敷地形状エディタのPlaceholderコンポーネント
  // 注意: 実際のプロジェクトでは、Three.jsなどを使った本格的な敷地形状エディタを実装する
  const ShapeEditorPlaceholder = () => (
    <Box
      sx={{
        mb: 3,
        minHeight: 300,
        border: '1px solid #ddd',
        borderRadius: 1,
        bgcolor: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        padding: 2
      }}
    >
      <Typography color="textSecondary" sx={{ mb: 2 }}>
        敷地形状エディタ（表示用プレースホルダー）
      </Typography>
      
      {hasShapeData ? (
        <Box
          sx={{
            width: '80%',
            height: 200,
            border: '1px solid #ccc',
            position: 'relative',
            bgcolor: '#ffffff'
          }}
        >
          {/* 簡易的な敷地形状の表示（実際の実装ではもっと洗練されたものになる） */}
          {property.shapeData?.points.map((point, index) => (
            <Box
              key={index}
              sx={{
                position: 'absolute',
                left: `${(point.x / 20) * 100}%`,
                top: `${(point.y / 20) * 100}%`,
                width: 8,
                height: 8,
                bgcolor: '#1976d2',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          ))}
        </Box>
      ) : (
        <Typography color="textSecondary">
          敷地形状データがありません。測量図をアップロードするか、境界点を手動で追加してください。
        </Typography>
      )}
    </Box>
  );
  
  // 敷地間口・奥行きの変更ハンドラ
  const handleDimensionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setShapeData({
      ...shapeData,
      [name]: value === '' ? 0 : parseFloat(value)
    });
  };
  
  // ファイル選択ダイアログを開く
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // ファイル選択時の処理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
      setUploadDialogOpen(true);
    }
    
    // ファイル入力をリセット（同じファイルを連続で選択可能にするため）
    if (event.target) {
      event.target.value = '';
    }
  };
  
  // アップロードダイアログを閉じる
  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
  };
  
  // 測量図アップロードと形状抽出処理
  const handleUploadSurvey = async () => {
    if (!selectedFile) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const extractedShape = await uploadSurveyAndExtractShape(selectedFile, property.id);
      
      if (extractedShape) {
        // ダイアログを閉じる
        handleCloseUploadDialog();
        
        // モックの座標データを作成（将来的にはOCRで抽出）
        const mockExtractionResult: CoordinateExtractionResult = {
          coordinatePoints: [
            { id: 'KK1', x: 62206.493, y: -53103.728, length: 22.729 },
            { id: 'KK2', x: 62220.989, y: -53121.235, length: 21.006 },
            { id: 'FK3', x: 62204.821, y: -53134.645, length: 11.100 },
            { id: 'FK4', x: 62211.906, y: -53143.190, length: 11.259 },
            { id: 'KK5', x: 62219.102, y: -53151.849, length: 19.005 },
            { id: 'KK6', x: 62203.330, y: -53162.453, length: 14.120 },
            { id: 'FK7', x: 62189.491, y: -53159.649, length: 12.779 },
            { id: 'FK8', x: 62179.393, y: -53166.457, length: 33.939 },
            { id: 'KK9', x: 62160.465, y: -53138.293, length: 0.748 },
            { id: 'KK10', x: 62161.078, y: -53137.879, length: 10.749 },
            { id: 'KK11', x: 62169.994, y: -53131.876, length: 20.071 },
            { id: 'KK12', x: 62158.788, y: -53115.225, length: 23.151 },
            { id: 'KK13', x: 62178.003, y: -53102.315, length: 19.282 },
            { id: 'FK14', x: 62190.326, y: -53117.147, length: 21.011 },
          ],
          totalArea: 5000.036646,
          area: 2500.018323,
          registeredArea: 2500.01,
          plotNumber: '32',
          confidence: 0.95,
          extractedImageUrl: extractedShape.sourceFile
        };
        
        // 座標抽出結果を保存
        setExtractionResult(mockExtractionResult);
        
        // 座標入力フォームを表示
        setShowCoordinateInput(true);
        setActiveStep(1);
      } else {
        setError('敷地形状の抽出に失敗しました');
      }
    } catch (err) {
      console.error('測量図アップロードエラー:', err);
      const errorMessage = err instanceof Error ? err.message : '測量図のアップロード中にエラーが発生しました';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };
  
  // 敷地形状保存処理
  const handleSaveShape = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedProperty = await updatePropertyShape(property.id, shapeData);
      
      if (updatedProperty) {
        setProperty(updatedProperty);
        
        setSuccess('敷地形状データを保存しました');
        setEditMode(false);
        
        // 成功メッセージを数秒後に消す
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('敷地形状データの保存に失敗しました');
      }
    } catch (err) {
      console.error('敷地形状保存エラー:', err);
      setError('敷地形状データの保存中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };
  
  // 敷地形状データのリセット
  const handleResetShape = () => {
    if (property.shapeData) {
      setShapeData(property.shapeData);
    } else {
      setShapeData({ points: [], width: 0, depth: 0 });
    }
    setEditMode(false);
    setError(null);
  };
  
  // 座標データ確認後の処理
  const handleCoordinateConfirm = async (data: CoordinateExtractionResult) => {
    try {
      setSaving(true);
      setError(null);
      
      // 座標変換処理（バックエンドで実装したconvertSurveyToDisplayを使用）
      // ここでは簡易的な変換を実施
      const minX = Math.min(...data.coordinatePoints.map(p => p.x));
      const minY = Math.min(...data.coordinatePoints.map(p => p.y));
      const maxX = Math.max(...data.coordinatePoints.map(p => p.x));
      const maxY = Math.max(...data.coordinatePoints.map(p => p.y));
      
      const width = maxX - minX;
      const height = maxY - minY;
      const scale = Math.max(width, height) / 100;
      
      const displayPoints: BoundaryPoint[] = data.coordinatePoints.map(p => ({
        x: (p.x - minX) / scale,
        y: (maxY - p.y) / scale // Y軸反転
      }));
      
      // 形状データを更新
      const newShapeData: PropertyShape = {
        points: displayPoints,
        width: width / scale,
        depth: height / scale,
        sourceFile: shapeData.sourceFile,
        coordinatePoints: data.coordinatePoints,
        area: data.area,
        perimeter: 0, // TODO: 周長計算を実装
        coordinateSystem: '平面直角座標系',
        extractionResult: data
      };
      
      // 物件データを更新
      const updatedProperty = await updatePropertyShape(property.id, newShapeData);
      
      if (updatedProperty) {
        setProperty(updatedProperty);
        setShapeData(newShapeData);
        setSuccess('座標データから敷地形状を生成しました');
        setShowCoordinateInput(false);
        setActiveStep(2);
        
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError('敷地形状データの保存に失敗しました');
      }
    } catch (err) {
      console.error('座標変換エラー:', err);
      setError('座標データの処理中にエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };
  
  // 座標入力キャンセル
  const handleCoordinateCancel = () => {
    setShowCoordinateInput(false);
    setActiveStep(0);
    setExtractionResult(null);
  };
  
  // 編集モード切り替え
  const handleToggleEditMode = () => {
    setEditMode(!editMode);
  };
  
  // 境界点の追加
  const handleAddPoint = () => {
    const newPoint: BoundaryPoint = { x: 0, y: 0 };
    setShapeData({
      ...shapeData,
      points: [...(shapeData.points || []), newPoint]
    });
    setEditMode(true);
  };
  
  return (
    <Box>
      {/* 座標入力フォーム */}
      {showCoordinateInput && extractionResult && (
        <CoordinateInputForm
          initialData={extractionResult}
          onConfirm={handleCoordinateConfirm}
          onCancel={handleCoordinateCancel}
        />
      )}
      
      {/* 通常の敷地形状管理UI */}
      {!showCoordinateInput && (
        <>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <MapIcon sx={{ mr: 1 }} />
            敷地形状
          </Typography>
          
          {/* ステップ表示 */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            <Step>
              <StepLabel>測量図アップロード</StepLabel>
            </Step>
            <Step>
              <StepLabel>座標データ確認</StepLabel>
            </Step>
            <Step>
              <StepLabel>形状生成完了</StepLabel>
            </Step>
          </Stepper>
          
          <Typography variant="body2" color="textSecondary" gutterBottom>
            測量図から抽出した敷地形状データです。境界点の座標を編集したり、敷地形状を手動で調整できます。
          </Typography>
      
      {/* 測量図アップロードボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png,.tiff,.dwg,.dxf" // 許可するファイル形式
        />
        <Button
          variant="outlined"
          startIcon={<FileUploadIcon />}
          onClick={handleOpenFileDialog}
          disabled={saving}
        >
          測量図をアップロード
        </Button>
      </Box>
      
      {/* 敷地形状エディタ */}
      <ShapeEditorPlaceholder />
      
      {/* 敷地寸法データ */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="敷地間口"
            name="width"
            type="number"
            value={shapeData.width || ''}
            onChange={handleDimensionChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
            disabled={!editMode}
            margin="normal"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="敷地奥行"
            name="depth"
            type="number"
            value={shapeData.depth || ''}
            onChange={handleDimensionChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
            disabled={!editMode}
            margin="normal"
          />
        </Grid>
      </Grid>
      
      {/* 境界点リスト */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>境界点座標</span>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={handleAddPoint}
            disabled={saving}
          >
            境界点を追加
          </Button>
        </Typography>
        
        <Paper 
          sx={{ 
            maxHeight: 200, 
            overflow: 'auto', 
            border: '1px solid #eee', 
            p: 1, 
            borderRadius: 1, 
            bgcolor: '#fff' 
          }}
        >
          {(!shapeData.points || shapeData.points.length === 0) ? (
            <Typography color="textSecondary" sx={{ p: 1 }}>
              境界点データがありません
            </Typography>
          ) : (
            <List dense>
              {shapeData.points.map((point, index) => (
                <ListItem key={index}>
                  <ListItemText primary={`点${index + 1}: X=${point.x.toFixed(1)}, Y=${point.y.toFixed(1)}`} />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      </Box>
      
      {/* エラーメッセージ */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* 成功メッセージ */}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}
      
      {/* アクションボタン */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          mt: 3,
          pt: 2,
          borderTop: '1px solid #eee'
        }}
      >
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleResetShape}
          disabled={saving}
        >
          リセット
        </Button>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleToggleEditMode}
            disabled={saving}
          >
            {editMode ? '編集モードを終了' : '編集'}
          </Button>
          
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            onClick={handleSaveShape}
            disabled={saving || !editMode}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>
      
      {/* 測量図アップロードダイアログ */}
      <Dialog open={uploadDialogOpen} onClose={handleCloseUploadDialog}>
        <DialogTitle>測量図のアップロード</DialogTitle>
        <DialogContent>
          <DialogContentText>
            選択された測量図: {selectedFile?.name}
          </DialogContentText>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            測量図から敷地形状データを抽出します。このプロセスにはしばらく時間がかかる場合があります。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUploadDialog} disabled={saving}>
            キャンセル
          </Button>
          <Button
            onClick={handleUploadSurvey}
            variant="contained"
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <FileUploadIcon />}
          >
            {saving ? 'アップロード中...' : 'アップロード'}
          </Button>
        </DialogActions>
      </Dialog>
        </>
      )}
    </Box>
  );
};

export default PropertyShapeTab;