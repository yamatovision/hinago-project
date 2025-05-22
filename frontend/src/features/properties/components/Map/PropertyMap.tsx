/**
 * 物件位置を表示するGoogle Mapコンポーネント
 * 住所から直接地図表示（座標保存不要）
 */
import { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { Box, Paper, Typography, CircularProgress, IconButton, ButtonGroup } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import MapIcon from '@mui/icons-material/Map';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// 環境変数からGoogle Maps APIキーを取得
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || '';

// 地図のデフォルト設定値
const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅

interface PropertyMapProps {
  address: string; // 住所（必須）
  height?: string | number;
  width?: string | number;
  interactive?: boolean;
  allowMarkerDrag?: boolean; // マーカーのドラッグを許可するか
  showZoomControls?: boolean; // ズームコントロールを表示するか
  showMapTypeControl?: boolean; // 地図タイプ切替を表示するか
}

/**
 * 物件位置表示Google Mapコンポーネント
 */
const PropertyMap = ({
  address,
  height = 400,
  width = '100%',
  interactive = true,
  allowMarkerDrag = false,
  showZoomControls = true,
  showMapTypeControl = true
}: PropertyMapProps) => {
  // マーカーの座標
  const [markerPosition, setMarkerPosition] = useState(DEFAULT_CENTER);
  // 地図の中心座標
  const [center, setCenter] = useState(DEFAULT_CENTER);
  // ジオコーディング処理状態
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  // ズームレベル
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  // 地図タイプ
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap');

  // マップクリック処理
  const handleMapClick = useCallback((event: any) => {
    if (event.latLng && interactive && typeof event.latLng.lat === 'function') {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setMarkerPosition(newPosition);
    }
  }, [interactive]);

  // マーカードラッグ処理
  const handleMarkerDrag = useCallback((event: any) => {
    if (event.latLng && allowMarkerDrag && typeof event.latLng.lat === 'function') {
      const newPosition = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      setMarkerPosition(newPosition);
    }
  }, [allowMarkerDrag]);

  // カスタムコントロール関数
  const handleZoomIn = useCallback(() => {
    setCurrentZoom(prev => Math.min(prev + 1, 21));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCurrentZoom(prev => Math.max(prev - 1, 1));
  }, []);

  const handleMapTypeToggle = useCallback(() => {
    setMapType(prev => {
      switch (prev) {
        case 'roadmap': return 'satellite';
        case 'satellite': return 'hybrid';
        case 'hybrid': return 'roadmap';
        default: return 'roadmap';
      }
    });
  }, []);

  const handleCenterOnMarker = useCallback(() => {
    setCenter(markerPosition);
  }, [markerPosition]);

  // Google Mapsで開く
  const handleOpenInGoogleMaps = useCallback(() => {
    const lat = markerPosition.lat;
    const lng = markerPosition.lng;
    const url = `https://www.google.com/maps/@${lat},${lng},${currentZoom}z`;
    window.open(url, '_blank');
  }, [markerPosition, currentZoom]);

  // デバッグ用ログ（本番環境では削除推奨）
  if (import.meta.env.VITE_DEBUG_MODE) {
    console.log('🗺️ Google Maps Debug Info:');
    console.log('- API Key exists:', !!GOOGLE_MAPS_API_KEY);
    console.log('- API Key prefix:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');
    console.log('- Map ID exists:', !!GOOGLE_MAPS_MAP_ID);
    console.log('- Map ID:', GOOGLE_MAPS_MAP_ID);
    console.log('- Address:', address);
    console.log('- Center:', center);
    console.log('- Marker:', markerPosition);
    console.log('- Current URL:', window.location.origin);
  }

  // 住所から座標を取得（リトライ機能付き）
  const geocodeAddress = useCallback(async (address: string, retryCount = 0) => {
    if (!address.trim()) return;

    setIsGeocoding(true);
    setGeocodingError(null);

    try {
      // Google Maps APIの読み込み待機（より詳細なチェック）
      let attempts = 0;
      const maxAttempts = 50; // 5秒間待機

      while (attempts < maxAttempts) {
        if (
          typeof window !== 'undefined' &&
          typeof google !== 'undefined' && 
          google.maps && 
          google.maps.Geocoder &&
          typeof google.maps.Geocoder === 'function'
        ) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }

      // API読み込みが完了していない場合
      if (attempts >= maxAttempts) {
        throw new Error('Google Maps API の読み込みがタイムアウトしました');
      }

      // Geocoderのインスタンス作成
      const geocoder = new google.maps.Geocoder();
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode({ address }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        });
      });

      const location = result[0].geometry.location;
      const coords = { lat: location.lat(), lng: location.lng() };
      
      setCenter(coords);
      setMarkerPosition(coords);
      
    } catch (error) {
      console.error('Geocoding error:', error);
      
      // リトライ処理
      if (retryCount < 3) {
        console.log(`Geocoding retry ${retryCount + 1}/3`);
        setTimeout(() => {
          geocodeAddress(address, retryCount + 1);
        }, 1000 * (retryCount + 1)); // 指数バックオフ
        return;
      }
      
      setGeocodingError('住所から位置情報を取得できませんでした');
    } finally {
      if (retryCount === 0) { // 最初の試行でのみローディングを停止
        setIsGeocoding(false);
      }
    }
  }, []);

  // 住所が変更されたら座標を取得
  useEffect(() => {
    if (address && GOOGLE_MAPS_API_KEY) {
      geocodeAddress(address);
    }
  }, [address, GOOGLE_MAPS_API_KEY, geocodeAddress]);

  // Google Maps APIキーがない場合は警告メッセージを表示
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <Paper 
        sx={{ 
          height, 
          width, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          p: 2,
          backgroundColor: 'grey.100',
          border: '1px dashed',
          borderColor: 'grey.400'
        }}
      >
        <Typography variant="body2" color="error" align="center">
          Google Maps APIキーが設定されていません。
          <br />
          環境変数VITE_GOOGLE_MAPS_API_KEYを設定してください。
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height, width, position: 'relative' }}>
      <APIProvider 
        apiKey={GOOGLE_MAPS_API_KEY} 
        region="JP" 
        language="ja"
        libraries={['places', 'geometry']}
      >
        <Map
          mapId={GOOGLE_MAPS_MAP_ID}
          center={center}
          zoom={currentZoom}
          mapTypeId={mapType}
          onClick={interactive ? handleMapClick : undefined}
          onZoomChanged={(map) => setCurrentZoom(map.detail.zoom)}
          gestureHandling="greedy"
          disableDefaultUI={true}
          style={{ borderRadius: '4px' }}
        >
          <AdvancedMarker
            position={markerPosition}
            draggable={allowMarkerDrag}
            onDragEnd={allowMarkerDrag ? handleMarkerDrag : undefined}
            onClick={() => console.log('Marker clicked:', markerPosition)}
          >
            <Pin
              background={'#1976d2'}
              borderColor={'#FFFFFF'}
              glyphColor={'#FFFFFF'}
              scale={1.2}
            />
          </AdvancedMarker>
        </Map>

        {/* カスタムコントロールボタン */}
        {interactive && (
          <Box
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            }}
          >
            {/* ズームコントロール */}
            {showZoomControls && (
              <ButtonGroup orientation="vertical" variant="contained" size="small">
                <IconButton
                  onClick={handleZoomIn}
                  sx={{ 
                    backgroundColor: 'white', 
                    color: 'black',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    border: '1px solid #ccc'
                  }}
                >
                  <ZoomInIcon />
                </IconButton>
                <IconButton
                  onClick={handleZoomOut}
                  sx={{ 
                    backgroundColor: 'white', 
                    color: 'black',
                    '&:hover': { backgroundColor: '#f5f5f5' },
                    border: '1px solid #ccc'
                  }}
                >
                  <ZoomOutIcon />
                </IconButton>
              </ButtonGroup>
            )}

            {/* 地図タイプ切替 */}
            {showMapTypeControl && (
              <IconButton
                onClick={handleMapTypeToggle}
                sx={{ 
                  backgroundColor: 'white', 
                  color: 'black',
                  '&:hover': { backgroundColor: '#f5f5f5' },
                  border: '1px solid #ccc',
                  mt: 1
                }}
                title={`現在: ${mapType === 'roadmap' ? '地図' : mapType === 'satellite' ? '航空写真' : 'ハイブリッド'}`}
              >
                {mapType === 'roadmap' ? <MapIcon /> : <SatelliteAltIcon />}
              </IconButton>
            )}

            {/* マーカー中心化 */}
            <IconButton
              onClick={handleCenterOnMarker}
              sx={{ 
                backgroundColor: 'white', 
                color: 'black',
                '&:hover': { backgroundColor: '#f5f5f5' },
                border: '1px solid #ccc'
              }}
              title="マーカーを中心に表示"
            >
              <MyLocationIcon />
            </IconButton>

            {/* Google Mapsで開く */}
            <IconButton
              onClick={handleOpenInGoogleMaps}
              sx={{ 
                backgroundColor: '#4285f4', 
                color: 'white',
                '&:hover': { backgroundColor: '#3367d6' },
                border: '1px solid #4285f4',
                mt: 1
              }}
              title="Google Mapsで全画面表示"
            >
              <OpenInNewIcon />
            </IconButton>
          </Box>
        )}
      </APIProvider>
      
      {/* エラー表示のみを簡潔に表示 */}
      {geocodingError && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            backgroundColor: 'rgba(244, 67, 54, 0.9)', 
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.75rem'
          }}
        >
          ⚠️ {geocodingError}
        </Box>
      )}
      
      {/* ローディング表示 */}
      {isGeocoding && (
        <Box 
          sx={{ 
            position: 'absolute', 
            top: 10, 
            left: 10, 
            backgroundColor: 'rgba(33, 150, 243, 0.9)', 
            color: 'white',
            p: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <CircularProgress size={16} sx={{ color: 'white' }} />
          位置情報を取得中...
        </Box>
      )}
    </Box>
  );
};

export default PropertyMap;