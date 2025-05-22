import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  FormControlLabel,
  Switch,
  IconButton,
  Divider,
  Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import OpacityIcon from '@mui/icons-material/Opacity';
import { useThreeStore } from '../ThreeViewer/helpers/useThreeStore';

interface ShadowControlsProps {
  showShadowControls?: boolean;
}

export const ShadowControls: React.FC<ShadowControlsProps> = ({
  showShadowControls = true
}) => {
  // グローバルstate
  const { 
    shadowState, 
    setShadowState, 
    showShadowVisualization, 
    setShowShadowVisualization 
  } = useThreeStore();
  
  // ローカルstate
  const [timeValue, setTimeValue] = useState<number>(shadowState?.currentTime || 12);
  const [isPlaying, setIsPlaying] = useState<boolean>(shadowState?.isAnimating || false);
  const [viewMode, setViewMode] = useState<string>('animation');
  const [opacity, setOpacity] = useState<number>(70); // 0-100
  
  // 現在時刻のフォーマット
  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };
  
  // 時間スライダーの変更ハンドラ
  const handleTimeChange = (_: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setTimeValue(value);
    
    // アニメーション中は変更しない
    if (viewMode === 'static') {
      setShadowState({
        ...shadowState,
        currentTime: value,
        isAnimating: false
      });
    }
  };
  
  // 再生・停止ボタンのハンドラ
  const handlePlayPause = () => {
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    setShadowState({
      ...shadowState,
      isAnimating: newIsPlaying
    });
    
    // 再生モードに切り替え
    if (newIsPlaying) {
      setViewMode('animation');
    }
  };
  
  // 表示モード切り替えハンドラ
  const handleViewModeChange = (_: React.MouseEvent<HTMLElement>, newMode: string) => {
    if (newMode === null) return; // 選択解除を防止
    
    setViewMode(newMode);
    
    if (newMode === 'static') {
      // 静的表示モードでは再生停止
      setIsPlaying(false);
      setShadowState({
        ...shadowState,
        isAnimating: false,
        currentTime: timeValue
      });
    } else if (newMode === 'heatmap') {
      // ヒートマップモードでは再生停止
      setIsPlaying(false);
      setShadowState({
        ...shadowState,
        isAnimating: false
      });
    } else {
      // アニメーションモードでは再生開始
      setIsPlaying(true);
      setShadowState({
        ...shadowState,
        isAnimating: true
      });
    }
  };
  
  // 不透明度変更ハンドラ
  const handleOpacityChange = (_: Event, newValue: number | number[]) => {
    const value = newValue as number;
    setOpacity(value);
  };
  
  // 表示切り替えハンドラ
  const handleToggleShadowVisualization = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowShadowVisualization(event.target.checked);
  };
  
  // shadowStateの更新に応じてローカルstateを更新
  useEffect(() => {
    if (shadowState) {
      setTimeValue(shadowState.currentTime || 12);
      setIsPlaying(shadowState.isAnimating || false);
    }
  }, [shadowState]);
  
  // 表示制御
  if (!showShadowControls) {
    return null;
  }
  
  return (
    <Box sx={{ mt: 2, mb: 2 }}>
      <Typography variant="subtitle1" gutterBottom>
        日影シミュレーション
      </Typography>
      
      <FormControlLabel
        control={
          <Switch 
            checked={showShadowVisualization} 
            onChange={handleToggleShadowVisualization}
            color="primary"
          />
        }
        label="日影表示"
        sx={{ mb: 1 }}
      />
      
      {showShadowVisualization && (
        <>
          <Divider sx={{ my: 1 }} />
          
          {/* 表示モード選択 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2">表示モード:</Typography>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={handleViewModeChange}
              size="small"
              aria-label="shadow view mode"
            >
              <ToggleButton value="animation" aria-label="animation">
                <Tooltip title="時間変化アニメーション">
                  <PlayArrowIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="static" aria-label="static time">
                <Tooltip title="特定時刻の日影">
                  <WbSunnyIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
              <ToggleButton value="heatmap" aria-label="heatmap">
                <Tooltip title="日影時間マップ">
                  <OpacityIcon fontSize="small" />
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
          
          {/* 時間スライダー（静的表示モードのみ有効） */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 2, minWidth: '40px' }}>
              時刻:
            </Typography>
            <Slider
              value={timeValue}
              min={8}
              max={16}
              step={0.25}
              onChange={handleTimeChange}
              valueLabelDisplay="auto"
              valueLabelFormat={(value: number) => formatTime(value)}
              disabled={viewMode !== 'static'}
              sx={{ mx: 1 }}
            />
            <Typography variant="body2" sx={{ ml: 2, minWidth: '50px' }}>
              {formatTime(timeValue)}
            </Typography>
          </Box>
          
          {/* アニメーション制御（アニメーションモードのみ有効） */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography variant="body2" sx={{ mr: 2 }}>
              アニメーション:
            </Typography>
            <IconButton 
              onClick={handlePlayPause} 
              disabled={viewMode === 'heatmap'}
              color={isPlaying ? "primary" : "default"}
              size="small"
            >
              {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
            </IconButton>
          </Box>
          
          {/* 不透明度スライダー */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body2" sx={{ mr: 2, minWidth: '40px' }}>
              濃さ:
            </Typography>
            <Slider
              value={opacity}
              min={0}
              max={100}
              onChange={handleOpacityChange}
              aria-labelledby="shadow-opacity-slider"
              sx={{ mx: 1 }}
            />
            <Typography variant="body2" sx={{ ml: 2, minWidth: '40px' }}>
              {opacity}%
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};