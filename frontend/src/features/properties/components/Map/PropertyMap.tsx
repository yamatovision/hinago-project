/**
 * 物件位置を表示するMapコンポーネント
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import Map, { Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Box, Paper, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';

// 環境変数からMapboxのアクセストークンを取得
const MAPBOX_TOKEN = import.meta.env.VITE_REACT_APP_MAPBOX_TOKEN || '';

// 地図のデフォルト設定値
const DEFAULT_ZOOM = 15;
const DEFAULT_CENTER = { lat: 35.6812, lng: 139.7671 }; // 東京駅

interface PropertyMapProps {
  latitude?: number;
  longitude?: number;
  address?: string;
  height?: string | number;
  width?: string | number;
  interactive?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

/**
 * 物件位置表示マップコンポーネント
 */
const PropertyMap = ({
  latitude,
  longitude,
  address,
  height = 200,
  width = '100%',
  interactive = true,
  onLocationChange
}: PropertyMapProps) => {
  // 地図の中心座標
  const [viewState, setViewState] = useState({
    latitude: latitude || DEFAULT_CENTER.lat,
    longitude: longitude || DEFAULT_CENTER.lng,
    zoom: DEFAULT_ZOOM
  });

  // マーカーの座標
  const [markerPosition, setMarkerPosition] = useState({
    latitude: latitude || DEFAULT_CENTER.lat,
    longitude: longitude || DEFAULT_CENTER.lng
  });

  // 座標が更新されたらマーカー位置と地図の視点を更新
  useEffect(() => {
    if (latitude && longitude) {
      setMarkerPosition({
        latitude,
        longitude
      });
      setViewState(prev => ({
        ...prev,
        latitude,
        longitude
      }));
    }
  }, [latitude, longitude]);

  // 地図をクリックしたときの処理
  const handleMapClick = useCallback(
    (event: any) => {
      if (!interactive || !onLocationChange) return;

      const { lat, lng } = event.lngLat;
      setMarkerPosition({
        latitude: lat,
        longitude: lng
      });
      onLocationChange(lat, lng);
    },
    [interactive, onLocationChange]
  );

  // MapBoxのスタイルURL
  const mapStyle = useMemo(() => 'mapbox://styles/mapbox/streets-v11', []);

  // Mapboxトークンがない場合は警告メッセージを表示
  if (!MAPBOX_TOKEN) {
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
          Mapboxアクセストークンが設定されていません。
          <br />
          環境変数VITE_REACT_APP_MAPBOX_TOKENを設定してください。
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height, width, position: 'relative' }}>
      <Map
        {...viewState}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={evt => setViewState(evt.viewState)}
        onClick={handleMapClick}
        style={{ borderRadius: '4px' }}
      >
        <Marker
          latitude={markerPosition.latitude}
          longitude={markerPosition.longitude}
          anchor="bottom"
        >
          <LocationOnIcon 
            sx={{ 
              color: 'error.main', 
              fontSize: 36, 
              transform: 'translateY(-8px)'
            }} 
          />
        </Marker>
        <NavigationControl position="bottom-right" />
      </Map>
      
      {address && (
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 8, 
            left: 8, 
            right: 50, 
            backgroundColor: 'rgba(255, 255, 255, 0.8)', 
            p: 1,
            borderRadius: 1,
            maxWidth: 'calc(100% - 60px)'
          }}
        >
          <Typography variant="caption" noWrap>
            {address}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PropertyMap;