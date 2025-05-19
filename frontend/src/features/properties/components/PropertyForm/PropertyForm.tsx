/**
 * 物件情報入力フォームコンポーネント
 */
import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  TextField, 
  MenuItem, 
  Typography, 
  Button, 
  Collapse,
  InputAdornment,
  Paper,
  CircularProgress
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import ApartmentIcon from '@mui/icons-material/Apartment';
import GavelIcon from '@mui/icons-material/Gavel';
import DescriptionIcon from '@mui/icons-material/Description';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { 
  PropertyCreateData, 
  ZoneType, 
  FireZoneType, 
  ShadowRegulationType, 
  PropertyStatus,
  VALIDATION_RULES
} from 'shared';
import { getGeocode } from '../../api/properties';
import { PropertyMap } from '../Map';

/**
 * 物件フォームコンポーネントのProps
 */
interface PropertyFormProps {
  initialValues?: Partial<PropertyCreateData>;
  onSubmit: (data: PropertyCreateData, andNavigate?: boolean) => void;
  isSubmitting?: boolean;
  isEditing?: boolean;
  onCancel?: () => void;
  onDraft?: () => void;
}

/**
 * 物件フォームの入力値の型
 */
interface FormValues extends PropertyCreateData {
  // ジオコーディング結果を保持
  lat?: number;
  lng?: number;
}

/**
 * 物件フォームのバリデーションエラーの型
 */
interface FormErrors {
  name?: string;
  address?: string;
  area?: string;
  zoneType?: string;
  fireZone?: string;
  buildingCoverage?: string;
  floorAreaRatio?: string;
  [key: string]: string | undefined;
}

/**
 * 物件フォームコンポーネント
 */
const PropertyForm = ({
  initialValues = {},
  onSubmit,
  isSubmitting = false,
  isEditing = false,
  onCancel,
  onDraft
}: PropertyFormProps) => {
  // フォーム入力値の状態
  const [values, setValues] = useState<FormValues>({
    name: '',
    address: '',
    area: 0,
    zoneType: ZoneType.CATEGORY9, // デフォルト値
    fireZone: FireZoneType.SEMI_FIRE, // デフォルト値
    shadowRegulation: ShadowRegulationType.NONE,
    buildingCoverage: 80,
    floorAreaRatio: 400,
    price: 0,
    status: PropertyStatus.NEW,
    notes: '',
    ...initialValues
  });

  // フォームバリデーションエラーの状態
  const [errors, setErrors] = useState<FormErrors>({});
  
  // 詳細セクションの表示状態
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // ジオコーディング状態
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // 許容建築面積の自動計算
  useEffect(() => {
    if (values.area && values.buildingCoverage) {
      const allowedBuildingArea = values.area * (values.buildingCoverage / 100);
      setValues(prev => ({ ...prev, allowedBuildingArea }));
    }
  }, [values.area, values.buildingCoverage]);

  // 入力値変更時のハンドラ
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let parsedValue: any = value;

    // 数値フィールドのパース
    if (['area', 'buildingCoverage', 'floorAreaRatio', 'price', 'heightLimit', 'roadWidth'].includes(name)) {
      parsedValue = value === '' ? '' : Number(value);
    }

    setValues({
      ...values,
      [name]: parsedValue
    });

    // エラー状態をクリア
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  // 住所変更時のジオコーディング
  useEffect(() => {
    const geocodeAddress = async () => {
      if (!values.address || values.address.length < 5) return;
      
      setIsGeocodingLoading(true);
      try {
        const result = await getGeocode(values.address);
        if (result) {
          setValues(prev => ({
            ...prev,
            geoLocation: {
              lat: result.lat,
              lng: result.lng,
              formatted_address: values.address
            }
          }));
        }
      } catch (err) {
        console.error('ジオコーディングエラー:', err);
      } finally {
        setIsGeocodingLoading(false);
      }
    };

    // 入力が落ち着いてから実行するディバウンス処理
    const timer = setTimeout(() => {
      geocodeAddress();
    }, 1000);

    return () => clearTimeout(timer);
  }, [values.address]);

  // フォームバリデーション
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    const rules = VALIDATION_RULES.PROPERTY;

    // 必須フィールドのチェック
    if (!values.name) {
      newErrors.name = '物件名は必須です';
    } else if (values.name.length > rules.name.maxLength) {
      newErrors.name = `物件名は${rules.name.maxLength}文字以内で入力してください`;
    }

    if (!values.address) {
      newErrors.address = '住所は必須です';
    } else if (values.address.length < rules.address.minLength || values.address.length > rules.address.maxLength) {
      newErrors.address = `住所は${rules.address.minLength}〜${rules.address.maxLength}文字で入力してください`;
    }

    if (!values.area) {
      newErrors.area = '敷地面積は必須です';
    } else if (values.area < rules.area.min || values.area > rules.area.max) {
      newErrors.area = `敷地面積は${rules.area.min}〜${rules.area.max}m²の範囲で入力してください`;
    }

    if (!values.zoneType) {
      newErrors.zoneType = '用途地域は必須です';
    }

    if (!values.fireZone) {
      newErrors.fireZone = '防火地域区分は必須です';
    }

    if (!values.buildingCoverage) {
      newErrors.buildingCoverage = '建蔽率は必須です';
    } else if (values.buildingCoverage < 0 || values.buildingCoverage > 100) {
      newErrors.buildingCoverage = '建蔽率は0〜100%の範囲で入力してください';
    }

    if (!values.floorAreaRatio) {
      newErrors.floorAreaRatio = '容積率は必須です';
    } else if (values.floorAreaRatio < 0 || values.floorAreaRatio > 1000) {
      newErrors.floorAreaRatio = '容積率は0〜1000%の範囲で入力してください';
    }

    // オプションフィールドのチェック（値が入力されている場合のみ）
    if (values.price && values.price < 0) {
      newErrors.price = '価格は0以上で入力してください';
    }

    if (values.heightLimit && (values.heightLimit < 0 || values.heightLimit > 150)) {
      newErrors.heightLimit = '高さ制限は0〜150mの範囲で入力してください';
    }

    if (values.roadWidth && values.roadWidth < 0) {
      newErrors.roadWidth = '前面道路幅員は0以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = (e: React.FormEvent, andNavigate: boolean = false) => {
    e.preventDefault();
    
    if (validateForm()) {
      // ジオロケーション情報がない場合でも送信できるようにする
      if (!values.geoLocation && values.lat && values.lng) {
        values.geoLocation = {
          lat: values.lat,
          lng: values.lng,
          formatted_address: values.address
        };
      }
      
      onSubmit(values, andNavigate);
    }
  };

  // 坪あたりの価格計算
  const calculatePricePerTsubo = (): string => {
    if (!values.area || !values.price || values.area <= 0) {
      return '0';
    }
    
    // 1坪 = 3.30578 m²
    const areaInTsubo = values.area / 3.30578;
    const pricePerTsubo = values.price / areaInTsubo;
    
    return pricePerTsubo.toLocaleString(undefined, { maximumFractionDigits: 0 });
  };

  return (
    <Box component="form" onSubmit={(e) => handleSubmit(e)} noValidate>
      {/* 物件情報セクション */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: 'primary.main'
          }}
        >
          <ApartmentIcon sx={{ mr: 1 }} />
          物件情報
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="property-name"
              name="name"
              label="物件名"
              value={values.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="例: 東区山鹿A区画"
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="property-address"
              name="address"
              label="住所"
              value={values.address}
              onChange={handleChange}
              error={!!errors.address}
              helperText={errors.address}
              placeholder="例: 福岡市東区山鹿2-3-4"
              disabled={isSubmitting}
              InputProps={{
                endAdornment: isGeocodingLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
            
            {/* マップ表示エリア */}
            <Box sx={{ mt: 2 }}>
              {values.geoLocation ? (
                <PropertyMap 
                  latitude={values.geoLocation.lat}
                  longitude={values.geoLocation.lng}
                  address={values.address}
                  height={200}
                  onLocationChange={(lat, lng) => {
                    setValues(prev => ({
                      ...prev,
                      geoLocation: {
                        ...prev.geoLocation,
                        lat,
                        lng
                      }
                    }));
                  }}
                />
              ) : (
                <Paper 
                  sx={{ 
                    height: 200, 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexDirection: 'column',
                    backgroundColor: 'grey.100',
                    border: '1px dashed',
                    borderColor: 'grey.400'
                  }}
                >
                  <Box sx={{ color: 'text.secondary', mb: 1 }}>住所を入力すると地図が表示されます</Box>
                </Paper>
              )}
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="property-area"
              name="area"
              label="敷地面積"
              type="number"
              value={values.area || ''}
              onChange={handleChange}
              error={!!errors.area}
              helperText={errors.area}
              placeholder="例: 330"
              InputProps={{
                endAdornment: <InputAdornment position="end">m²</InputAdornment>,
              }}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="property-price"
              name="price"
              label="想定取得価格"
              type="number"
              value={values.price || ''}
              onChange={handleChange}
              error={!!errors.price}
              helperText={errors.price ? errors.price : `1坪あたり約 ${calculatePricePerTsubo()} 円`}
              placeholder="例: 50000000"
              InputProps={{
                endAdornment: <InputAdornment position="end">円</InputAdornment>,
              }}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              id="property-status"
              name="status"
              select
              label="ステータス"
              value={values.status}
              onChange={handleChange}
              disabled={isSubmitting}
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
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: 'primary.main'
          }}
        >
          <GavelIcon sx={{ mr: 1 }} />
          法規制情報
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          建築基準法に基づく規制情報を入力してください。正確な値はボリュームチェックの精度に直結します。
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="zone-type"
              name="zoneType"
              select
              label="用途地域"
              value={values.zoneType}
              onChange={handleChange}
              error={!!errors.zoneType}
              helperText={errors.zoneType}
              disabled={isSubmitting}
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
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="fire-zone"
              name="fireZone"
              select
              label="防火地域区分"
              value={values.fireZone}
              onChange={handleChange}
              error={!!errors.fireZone}
              helperText={errors.fireZone}
              disabled={isSubmitting}
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
              id="building-coverage"
              name="buildingCoverage"
              label="建蔽率"
              type="number"
              value={values.buildingCoverage || ''}
              onChange={handleChange}
              error={!!errors.buildingCoverage}
              helperText={errors.buildingCoverage}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              disabled={isSubmitting}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              required
              id="floor-area-ratio"
              name="floorAreaRatio"
              label="容積率"
              type="number"
              value={values.floorAreaRatio || ''}
              onChange={handleChange}
              error={!!errors.floorAreaRatio}
              helperText={errors.floorAreaRatio}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              disabled={isSubmitting}
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
            詳細規制情報を入力
          </Button>
          
          <Collapse in={showAdvanced}>
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="shadow-regulation"
                    name="shadowRegulation"
                    select
                    label="日影規制"
                    value={values.shadowRegulation || ShadowRegulationType.NONE}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <MenuItem value={ShadowRegulationType.TYPE1}>規制タイプ1（4時間/2.5時間）</MenuItem>
                    <MenuItem value={ShadowRegulationType.TYPE2}>規制タイプ2（5時間/3時間）</MenuItem>
                    <MenuItem value={ShadowRegulationType.NONE}>規制なし</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="height-limit"
                    name="heightLimit"
                    label="高さ制限"
                    type="number"
                    value={values.heightLimit || ''}
                    onChange={handleChange}
                    error={!!errors.heightLimit}
                    helperText={errors.heightLimit}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="road-width"
                    name="roadWidth"
                    label="前面道路幅員"
                    type="number"
                    value={values.roadWidth || ''}
                    onChange={handleChange}
                    error={!!errors.roadWidth}
                    helperText={errors.roadWidth}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m</InputAdornment>,
                    }}
                    disabled={isSubmitting}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="allowed-building-area"
                    name="allowedBuildingArea"
                    label="許容建築面積"
                    type="number"
                    value={values.allowedBuildingArea?.toFixed(2) || ''}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">m²</InputAdornment>,
                      readOnly: true,
                    }}
                    helperText="敷地面積 × 建蔽率に基づく理論値"
                    disabled
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </Box>
      </Box>
      
      {/* 備考・メモセクション */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            mb: 2, 
            display: 'flex', 
            alignItems: 'center',
            color: 'primary.main'
          }}
        >
          <DescriptionIcon sx={{ mr: 1 }} />
          備考・メモ
        </Typography>
        
        <TextField
          fullWidth
          id="property-notes"
          name="notes"
          label="特記事項"
          multiline
          rows={4}
          value={values.notes || ''}
          onChange={handleChange}
          placeholder="物件に関する補足情報を入力してください"
          disabled={isSubmitting}
        />
      </Box>
      
      {/* ボタン */}
      <Box 
        sx={{ 
          mt: 4, 
          pt: 2, 
          display: 'flex', 
          justifyContent: 'space-between',
          borderTop: 1, 
          borderColor: 'divider',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          {onCancel && (
            <Button
              variant="outlined"
              color="inherit"
              onClick={onCancel}
              startIcon={<CloseIcon />}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          )}
          
          {onDraft && (
            <Button
              variant="outlined"
              color="primary"
              onClick={onDraft}
              startIcon={<SaveIcon />}
              disabled={isSubmitting}
            >
              下書き保存
            </Button>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isEditing ? '更新' : '登録'}
            {isSubmitting && <CircularProgress size={24} sx={{ ml: 1 }} />}
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            startIcon={<ArrowForwardIcon />}
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, true)}
            sx={{ ml: 1 }}
          >
            {isEditing ? '更新して物件詳細へ' : '登録して物件詳細へ'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default PropertyForm;