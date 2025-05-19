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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import {
  Map as MapIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  FileUpload as FileUploadIcon
} from '@mui/icons-material';
import { PropertyDetail, PropertyShape, BoundaryPoint } from 'shared';
import { updatePropertyShape, uploadSurveyAndExtractShape } from '../../api/shape';

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
        // 物件オブジェクトの更新
        const updatedProperty = { ...property, shapeData: extractedShape };
        setProperty(updatedProperty);
        setShapeData(extractedShape);
        
        setSuccess('測量図を解析し、敷地形状を更新しました');
        
        // 成功メッセージを数秒後に消す
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
        
        // ダイアログを閉じる
        handleCloseUploadDialog();
      } else {
        setError('敷地形状の抽出に失敗しました');
      }
    } catch (err) {
      console.error('測量図アップロードエラー:', err);
      setError('測量図のアップロード中にエラーが発生しました');
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
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <MapIcon sx={{ mr: 1 }} />
        敷地形状
      </Typography>
      
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
    </Box>
  );
};

export default PropertyShapeTab;