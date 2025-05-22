/**
 * ダッシュボードページ
 * 物件一覧を表示する
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import CalculateIcon from '@mui/icons-material/Calculate';
import ClearIcon from '@mui/icons-material/Clear';
import Header from '../../../common/components/Header/Header';
import { getProperties } from '../../properties/api/properties';
// 編集モーダルは不要になりました
import { Property, PropertyStatus, ZoneType } from 'shared';

// 物件ステータスの日本語表示とスタイル
const propertyStatusMap: Record<PropertyStatus, { label: string, color: 'success' | 'warning' | 'info' | 'default' | 'primary' | 'secondary' | 'error' }> = {
  [PropertyStatus.NEW]: { label: '新規', color: 'info' },
  [PropertyStatus.ACTIVE]: { label: '進行中', color: 'success' },
  [PropertyStatus.PENDING]: { label: '検討中', color: 'warning' },
  [PropertyStatus.NEGOTIATING]: { label: '交渉中', color: 'primary' },
  [PropertyStatus.CONTRACTED]: { label: '契約済み', color: 'secondary' },
  [PropertyStatus.COMPLETED]: { label: '完了', color: 'info' },
};

// 用途地域の日本語表示
const zoneTypeMap: Record<ZoneType, string> = {
  [ZoneType.CATEGORY1]: '第一種低層住居専用地域',
  [ZoneType.CATEGORY2]: '第二種低層住居専用地域',
  [ZoneType.CATEGORY3]: '第一種中高層住居専用地域',
  [ZoneType.CATEGORY4]: '第二種中高層住居専用地域',
  [ZoneType.CATEGORY5]: '第一種住居地域',
  [ZoneType.CATEGORY6]: '第二種住居地域',
  [ZoneType.CATEGORY7]: '準住居地域',
  [ZoneType.CATEGORY8]: '近隣商業地域',
  [ZoneType.CATEGORY9]: '商業地域',
  [ZoneType.CATEGORY10]: '準工業地域',
  [ZoneType.CATEGORY11]: '工業地域',
  [ZoneType.CATEGORY12]: '工業専用地域',
};

// エリアオプション（将来的にはAPIから取得）
const areaOptions = [
  { value: '', label: 'すべて' },
  { value: 'fukuoka-city', label: '福岡市内' },
  { value: 'fukuoka-pref', label: '福岡県' },
  { value: 'kyushu', label: '九州地方' },
];

// ステータスオプション
const statusOptions = [
  { value: '', label: 'すべて' },
  { value: PropertyStatus.ACTIVE, label: '進行中' },
  { value: PropertyStatus.PENDING, label: '検討中' },
  { value: PropertyStatus.COMPLETED, label: '完了' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  
  // 状態変数
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProperties, setTotalProperties] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  
  // 編集モーダル状態は不要になりました
  
  // フィルター状態
  const [filters, setFilters] = useState({
    name: '',
    area: '',
    status: '',
    minArea: '',
    maxArea: '',
  });

  // 物件データを取得
  const fetchProperties = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // フィルター条件を整形
      const filterOptions: Record<string, string | number> = {};
      if (filters.name) filterOptions.name = filters.name;
      if (filters.area) filterOptions.region = filters.area;
      if (filters.status) filterOptions.status = filters.status;
      if (filters.minArea) filterOptions.minArea = Number(filters.minArea);
      if (filters.maxArea) filterOptions.maxArea = Number(filters.maxArea);
      
      console.log('APIリクエスト送信:', { page, limit, filterOptions });
      
      // APIリクエスト
      const result = await getProperties({ page, limit }, filterOptions);
      
      console.log('APIレスポンス:', result);
      
      if (result) {
        if (Array.isArray(result)) {
          // 直接配列が返ってきた場合
          console.log('API直接配列レスポンス:', result);
          setProperties(result);
          setTotalProperties(result.length);
        } else if (result.properties) {
          // プロパティの配列を含むオブジェクトが返ってきた場合
          setProperties(result.properties);
          setTotalProperties(result.total || 0);
        } else {
          console.error('予期しないAPIレスポンス形式:', result);
          setError('APIからのレスポンス形式が不正です。バックエンドが正しく動作しているか確認してください。');
          setProperties([]);
          setTotalProperties(0);
        }
      } else {
        console.error('APIからの予期しないレスポンス（null/undefined）:', result);
        setError('APIからのレスポンスが不正です。バックエンドが正しく動作しているか確認してください。');
        setProperties([]);
        setTotalProperties(0);
      }
    } catch (err) {
      console.error('物件データ取得エラー:', err);
      
      // 詳細なエラー情報をログに出力
      const error = err as Error;
      if (error.message) console.error('エラーメッセージ:', error.message);
      if (error.stack) console.error('スタックトレース:', error.stack);
      if ((error as any).response) console.error('レスポンス:', (error as any).response);
      
      // ユーザーに表示するエラーメッセージを設定
      setError(`物件データの取得中にエラーが発生しました: ${err instanceof Error ? err.message : '不明なエラー'}`);
      setProperties([]);
      setTotalProperties(0);
    } finally {
      setLoading(false);
    }
  };
  
  // 初回レンダリング時とページ・フィルター変更時にデータを取得
  useEffect(() => {
    fetchProperties();
  }, [page]);
  
  // フィルター適用
  const handleApplyFilters = () => {
    setPage(1); // フィルター適用時は1ページ目に戻す
    fetchProperties();
  };
  
  // フィルタークリア
  const handleClearFilters = () => {
    setFilters({
      name: '',
      area: '',
      status: '',
      minArea: '',
      maxArea: '',
    });
    setPage(1);
    // フィルタークリア後に即座にデータを再取得
    setTimeout(() => fetchProperties(), 0);
  };
  
  // フィルター入力変更
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name as string]: value,
    }));
  };
  
  // ページネーション変更
  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
  };
  
  // 詳細ページへ遷移
  const handleRowClick = (propertyId: string) => {
    navigate(`/properties/${propertyId}`);
  };
  
  // 新規物件登録ページへ遷移
  const handleAddProperty = () => {
    navigate('/properties/create');
  };
  
  // 物件詳細ページへ遷移
  const handleEditProperty = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation(); // 行クリックイベントを阻止
    navigate(`/properties/${propertyId}`);
  };
  
  // ボリュームチェックページへ遷移
  const handleVolumeCheck = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation(); // 行クリックイベントを阻止
    navigate(`/analysis/volume-check/${propertyId}`);
  };
  
  // 収益性試算ページへ遷移
  const handleProfitability = (e: React.MouseEvent, propertyId: string) => {
    e.stopPropagation(); // 行クリックイベントを阻止
    navigate(`/analysis/profitability/${propertyId}`);
  };
  
  // 総ページ数を計算
  const totalPages = Math.ceil(totalProperties / limit);
  
  // 編集成功時のハンドラは不要になりました
  
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        {/* 物件編集モーダルは削除しました */}
        {/* ページタイトルと新規ボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            物件一覧
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddProperty}
          >
            新規物件登録
          </Button>
        </Box>
        
        {/* フィルターセクション */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="物件名"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="エリア"
                name="area"
                value={filters.area}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                {areaOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="ステータス"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                variant="outlined"
                size="small"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 0.5 }}>
                面積（㎡）
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  label="最小"
                  name="minArea"
                  value={filters.minArea}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  type="number"
                  sx={{ width: '50%' }}
                />
                <TextField
                  label="最大"
                  name="maxArea"
                  value={filters.maxArea}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  type="number"
                  sx={{ width: '50%' }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={12} md={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                クリア
              </Button>
              <Button
                variant="contained"
                onClick={handleApplyFilters}
                startIcon={<SearchIcon />}
              >
                フィルター適用
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* エラーメッセージ */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* 物件テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>物件名</TableCell>
                <TableCell>住所</TableCell>
                <TableCell align="right">面積（㎡）</TableCell>
                <TableCell>用途地域</TableCell>
                <TableCell>ステータス</TableCell>
                <TableCell align="center">アクション</TableCell>
              </TableRow>
            </TableHead>
            
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : !properties || properties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1" color="textSecondary">
                      物件が見つかりませんでした
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                properties.map(property => (
                  <TableRow 
                    key={property.id} 
                    hover 
                    onClick={() => handleRowClick(property.id)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{property.name}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell align="right">{property.area.toLocaleString('ja-JP', { maximumFractionDigits: 2 })}</TableCell>
                    <TableCell>{zoneTypeMap[property.zoneType]}</TableCell>
                    <TableCell>
                      <Chip 
                        label={property.status ? propertyStatusMap[property.status].label : '新規'} 
                        color={property.status ? propertyStatusMap[property.status].color : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box>
                        <Tooltip title="ボリュームチェック">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e: React.MouseEvent) => handleVolumeCheck(e, property.id)}
                          >
                            <ViewInArIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="収益性試算">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e: React.MouseEvent) => handleProfitability(e, property.id)}
                          >
                            <CalculateIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="詳細・編集">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={(e: React.MouseEvent) => handleEditProperty(e, property.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
          {/* ページネーション */}
          {!loading && properties.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
              <Typography variant="body2" color="textSecondary">
                {`${(page - 1) * limit + 1}-${Math.min(page * limit, totalProperties)} / 全${totalProperties}件`}
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                shape="rounded"
              />
            </Box>
          )}
        </TableContainer>
      </Container>
    </>
  );
};

export default DashboardPage;