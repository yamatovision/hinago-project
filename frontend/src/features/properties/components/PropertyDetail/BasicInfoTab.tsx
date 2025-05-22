import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
  Alert,
  Collapse
} from '@mui/material';
import {
  Apartment as ApartmentIcon,
  Gavel as GavelIcon,
  Label as LabelIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  Save as SaveIcon,
  KeyboardArrowRight as KeyboardArrowRightIcon
} from '@mui/icons-material';
import { PropertyDetail, ZoneType, FireZoneType, ShadowRegulationType, PropertyStatus, HeightDistrictType, DistrictPlanInfo } from 'shared';
import { updateProperty, deleteProperty } from '../../api/properties';
import { PropertyMap } from '../Map';

interface BasicInfoTabProps {
  property: PropertyDetail;
  setProperty: React.Dispatch<React.SetStateAction<PropertyDetail | null>>;
}

/**
 * 物件基本情報タブ
 * 物件の基本情報、法規制情報、タグ、備考などを表示・編集する
 */
const BasicInfoTab: React.FC<BasicInfoTabProps> = ({ property, setProperty }) => {
  const navigate = useNavigate();
  
  // フォーム状態
  const [formData, setFormData] = useState({
    name: property.name,
    address: property.address,
    area: property.area,
    zoneType: property.zoneType,
    fireZone: property.fireZone,
    shadowRegulation: property.shadowRegulation || ShadowRegulationType.NONE,
    buildingCoverage: property.buildingCoverage,
    floorAreaRatio: property.floorAreaRatio,
    heightLimit: property.heightLimit || 0,
    roadWidth: property.roadWidth || 0,
    price: property.price || 0,
    status: property.status || PropertyStatus.NEW,
    notes: property.notes || '',
    // 詳細規制情報
    heightDistrict: property.heightDistrict || HeightDistrictType.NONE,
    northBoundaryDistance: property.northBoundaryDistance || 0,
    shadowRegulationDetail: property.shadowRegulationDetail || {
      measurementHeight: 4,
      hourRanges: { primary: 4, secondary: 2.5 }
    },
    districtPlanInfo: property.districtPlanInfo || { name: '' }
  });
  
  // UI状態
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 許容建築面積の計算
  const allowedBuildingArea = formData.area * (formData.buildingCoverage / 100);
  
  // 1坪あたりの価格計算
  const pricePerTsubo = formData.price > 0 && formData.area > 0 
    ? Math.round(formData.price / (formData.area / 3.30578))
    : 0;

  // フォーム入力変更ハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 数値型のフィールドを処理
    if (['area', 'buildingCoverage', 'floorAreaRatio', 'heightLimit', 'roadWidth', 'price', 'northBoundaryDistance'].includes(name)) {
      setFormData({
        ...formData,
        [name]: value === '' ? 0 : parseFloat(value)
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // 日影規制詳細のハンドラ
  const handleShadowRegulationDetailChange = (value: number) => {
    const shadowRegulationDetail = { 
      ...formData.shadowRegulationDetail,
      measurementHeight: value 
    };
    setFormData({
      ...formData,
      shadowRegulationDetail
    });
  };

  // 地区計画情報のハンドラ
  const handleDistrictPlanInfoChange = (field: keyof DistrictPlanInfo, value: string | number | undefined) => {
    const districtPlanInfo = { 
      ...formData.districtPlanInfo,
      [field]: value 
    };
    setFormData({
      ...formData,
      districtPlanInfo
    });
  };

  // フォーム送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    
    try {
      const updatedProperty = await updateProperty(property.id, formData);
      
      if (updatedProperty) {
        setProperty(updatedProperty);
        setSaveSuccess(true);

        // 3秒後に成功メッセージを消す
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setSaveError('物件情報の更新に失敗しました');
      }
    } catch (err) {
      console.error('物件更新エラー:', err);
      setSaveError('エラーが発生しました。しばらく経ってからもう一度お試しください');
    } finally {
      setSaving(false);
    }
  };

  // 物件削除ハンドラ
  const handleDelete = async () => {
    try {
      setSaving(true);
      const success = await deleteProperty(property.id);
      
      if (success) {
        // ダッシュボードへリダイレクト
        navigate('/dashboard');
      } else {
        setSaveError('物件の削除に失敗しました。物件が存在しないか、既に削除されています。');
        setDeleteDialogOpen(false);
      }
    } catch (err: any) {
      console.error('物件削除エラー:', err);
      // JSON解析エラーの場合はよりわかりやすいメッセージに
      if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        setSaveError('サーバーからのレスポンスが不正です。ネットワークまたはサーバーの状態を確認してください。');
      } else {
        setSaveError(`削除処理中にエラーが発生しました: ${err.message || '不明なエラー'}`);
      }
      setDeleteDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // ダッシュボードへ戻る
  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // 削除ダイアログを開く
  const openDeleteDialog = () => {
    setDeleteDialogOpen(true);
  };

  // 削除ダイアログを閉じる
  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 物件情報セクション */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <ApartmentIcon sx={{ mr: 1 }} />
          物件情報
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              label="物件名"
              name="name"
              value={formData.name}
              onChange={handleChange}
              margin="normal"
            />
            
            <TextField
              fullWidth
              required
              label="住所"
              name="address"
              value={formData.address}
              onChange={handleChange}
              margin="normal"
            />
            
            {/* 地図表示エリア */}
            <Box sx={{ mt: 2 }}>
              {property.geoLocation ? (
                <PropertyMap 
                  address={property.address}
                  height={200}
                  interactive={false}
                />
              ) : (
                <Box
                  sx={{
                    height: 200,
                    bgcolor: '#f0f0f0',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #ccc'
                  }}
                >
                  <Typography color="textSecondary">位置情報がありません</Typography>
                </Box>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="敷地面積"
              name="area"
              value={formData.area || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">㎡</InputAdornment>
              }}
              helperText={`約 ${(formData.area / 3.30578).toFixed(1)} 坪`}
            />
            
            <TextField
              fullWidth
              type="number"
              label="想定取得価格"
              name="price"
              value={formData.price || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>
              }}
              helperText={pricePerTsubo > 0 ? `1坪あたり約 ${pricePerTsubo.toLocaleString()} 円` : ''}
            />
            
            <TextField
              fullWidth
              select
              label="ステータス"
              name="status"
              value={formData.status}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value={PropertyStatus.NEW}>新規</MenuItem>
              <MenuItem value={PropertyStatus.ACTIVE}>進行中</MenuItem>
              <MenuItem value={PropertyStatus.PENDING}>検討中</MenuItem>
              <MenuItem value={PropertyStatus.NEGOTIATING}>交渉中</MenuItem>
              <MenuItem value={PropertyStatus.CONTRACTED}>契約済み</MenuItem>
              <MenuItem value={PropertyStatus.COMPLETED}>完了</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>
      
      {/* 法規制情報セクション */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <GavelIcon sx={{ mr: 1 }} />
          法規制情報
        </Typography>
        
        <Typography variant="body2" color="textSecondary" gutterBottom>
          建築基準法に基づく規制情報です。この情報はボリュームチェックの精度に直結します。
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              select
              label="用途地域"
              name="zoneType"
              value={formData.zoneType}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value={ZoneType.CATEGORY1}>第一種低層住居専用地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY2}>第二種低層住居専用地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY3}>第一種中高層住居専用地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY4}>第二種中高層住居専用地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY5}>第一種住居地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY6}>第二種住居地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY7}>準住居地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY8}>近隣商業地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY9}>商業地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY10}>準工業地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY11}>工業地域</MenuItem>
              <MenuItem value={ZoneType.CATEGORY12}>工業専用地域</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              required
              select
              label="防火地域区分"
              name="fireZone"
              value={formData.fireZone}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value={FireZoneType.FIRE}>防火地域</MenuItem>
              <MenuItem value={FireZoneType.SEMI_FIRE}>準防火地域</MenuItem>
              <MenuItem value={FireZoneType.NONE}>指定なし</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="建蔽率"
              name="buildingCoverage"
              value={formData.buildingCoverage || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
            />
            
            <TextField
              fullWidth
              required
              type="number"
              label="容積率"
              name="floorAreaRatio"
              value={formData.floorAreaRatio || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
            />
          </Grid>
        </Grid>
        
        {/* 詳細規制情報 */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              select
              label="日影規制"
              name="shadowRegulation"
              value={formData.shadowRegulation}
              onChange={handleChange}
              margin="normal"
            >
              <MenuItem value={ShadowRegulationType.TYPE1}>規制タイプ1（4時間/2.5時間）</MenuItem>
              <MenuItem value={ShadowRegulationType.TYPE2}>規制タイプ2（5時間/3時間）</MenuItem>
              <MenuItem value={ShadowRegulationType.NONE}>規制なし</MenuItem>
            </TextField>
            
            <TextField
              fullWidth
              type="number"
              label="高さ制限"
              name="heightLimit"
              value={formData.heightLimit || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="number"
              label="前面道路幅員"
              name="roadWidth"
              value={formData.roadWidth || ''}
              onChange={handleChange}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">m</InputAdornment>
              }}
            />
            
            <TextField
              fullWidth
              type="number"
              label="許容建築面積"
              value={allowedBuildingArea.toFixed(2)}
              margin="normal"
              InputProps={{
                endAdornment: <InputAdornment position="end">㎡</InputAdornment>,
                readOnly: true
              }}
              disabled
              helperText="敷地面積 × 建蔽率に基づく理論値"
            />
          </Grid>
        </Grid>
        
        {/* 詳細規制情報の表示切り替え */}
        <Box sx={{ mt: 2 }}>
          <Button
            color="primary"
            onClick={() => setShowAdvanced(!showAdvanced)}
            startIcon={
              <KeyboardArrowRightIcon 
                sx={{ 
                  transform: showAdvanced ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.3s'
                }}
              />
            }
            sx={{ textTransform: 'none' }}
          >
            詳細規制情報を{showAdvanced ? '隠す' : '表示'}
          </Button>
          
          <Collapse in={showAdvanced}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={3}>
                {/* 高度地区 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="高度地区"
                    name="heightDistrict"
                    value={formData.heightDistrict}
                    onChange={handleChange}
                    margin="normal"
                  >
                    <MenuItem value={HeightDistrictType.NONE}>指定なし</MenuItem>
                    <MenuItem value={HeightDistrictType.FIRST_10M}>第一種10M高度地区</MenuItem>
                    <MenuItem value={HeightDistrictType.FIRST_15M}>第一種15M高度地区</MenuItem>
                    <MenuItem value={HeightDistrictType.SECOND_15M}>第二種15M高度地区</MenuItem>
                    <MenuItem value={HeightDistrictType.SECOND_20M}>第二種20M高度地区</MenuItem>
                  </TextField>
                </Grid>
                
                {/* 北側境界線距離 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="北側境界線までの距離"
                    name="northBoundaryDistance"
                    value={formData.northBoundaryDistance || ''}
                    onChange={handleChange}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0, step: 0.1 },
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                    helperText="北側斜線制限計算に使用します"
                  />
                </Grid>

                {/* 日影規制詳細 - 測定面の高さ */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="日影規制測定面の高さ"
                    value={formData.shadowRegulationDetail?.measurementHeight || 4}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : 4;
                      handleShadowRegulationDetailChange(value);
                    }}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0, step: 0.1 },
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                    disabled={formData.shadowRegulation === ShadowRegulationType.NONE}
                  />
                </Grid>

                {/* 地区計画名 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="地区計画名"
                    value={formData.districtPlanInfo?.name || ''}
                    onChange={(e) => {
                      handleDistrictPlanInfoChange('name', e.target.value);
                    }}
                    margin="normal"
                    placeholder="例: 福岡市○○地区地区計画"
                  />
                </Grid>
                
                {/* 壁面後退距離 */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="壁面後退距離"
                    value={formData.districtPlanInfo?.wallSetbackDistance || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      handleDistrictPlanInfoChange('wallSetbackDistance', value);
                    }}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0, step: 0.1 },
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                  />
                </Grid>
                
                {/* 地区計画最高高さ */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="地区計画高さ制限"
                    value={formData.districtPlanInfo?.maxHeight || ''}
                    onChange={(e) => {
                      const value = e.target.value ? parseFloat(e.target.value) : undefined;
                      handleDistrictPlanInfoChange('maxHeight', value);
                    }}
                    margin="normal"
                    InputProps={{
                      inputProps: { min: 0, step: 0.1 },
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      </Box>
      
      {/* タグセクション */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <LabelIcon sx={{ mr: 1 }} />
          タグ
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {/* 後日、タグ編集機能を実装予定 */}
          <Chip label="商業地域" />
          <Chip label="東区" />
          <Chip label="収益物件" />
          <Chip label="角地" />
          <Chip
            label="+"
            onClick={() => {/* 後日実装 */}}
            sx={{ cursor: 'pointer', bgcolor: 'transparent', border: '1px dashed #1976d2' }}
          />
        </Box>
      </Box>
      
      {/* 備考・メモセクション */}
      <Box mb={4}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <DescriptionIcon sx={{ mr: 1 }} />
          備考・メモ
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={4}
          label="特記事項"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          margin="normal"
        />
      </Box>
      
      {/* フィードバックメッセージ */}
      {saveError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {saveError}
        </Alert>
      )}
      
      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          物件情報を保存しました
        </Alert>
      )}
      
      {/* アクションボタン */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          pt: 2,
          borderTop: '1px solid #eee'
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToDashboard}
            disabled={saving}
          >
            物件一覧へ戻る
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={openDeleteDialog}
            disabled={saving}
          >
            削除
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            disabled={saving}
          >
            複製
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </Button>
        </Box>
      </Box>
      
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>物件を削除しますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            「{property.name}」を削除します。この操作は取り消せません。
            関連するボリュームチェックデータや文書も全て削除されます。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} disabled={saving}>
            キャンセル
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            autoFocus
            disabled={saving}
          >
            {saving ? <CircularProgress size={16} /> : '削除する'}
          </Button>
        </DialogActions>
      </Dialog>
    </form>
  );
};

export default BasicInfoTab;