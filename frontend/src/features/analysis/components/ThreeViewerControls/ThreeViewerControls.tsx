import React from 'react';
import { VolumeCheck } from 'shared';
import { FloorSelector } from './FloorSelector';
import { ViewOptions } from './ViewOptions';
import { ShadowControls } from './ShadowControls';

interface ThreeViewerControlsProps {
  volumeCheck: VolumeCheck | null;
}

export const ThreeViewerControls: React.FC<ThreeViewerControlsProps> = ({ 
  volumeCheck 
}) => {
  // 日影シミュレーションが利用可能かチェック
  const hasShadowSimulation = volumeCheck?.shadowSimulation !== undefined;
  
  return (
    <div 
      style={{ 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '16px'
      }}
    >
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>3Dビューアーコントロール</h3>
      
      <ViewOptions />
      
      <FloorSelector volumeCheck={volumeCheck} />
      
      {/* 日影シミュレーションコントロール */}
      {hasShadowSimulation && (
        <ShadowControls showShadowControls={hasShadowSimulation} />
      )}
      
      <div style={{ marginTop: '16px', fontSize: '14px', color: '#757575' }}>
        <p style={{ margin: '0 0 4px 0' }}>操作方法:</p>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>回転: マウスの左ボタンドラッグ</li>
          <li>ズーム: マウスホイール</li>
          <li>移動: マウスの右ボタンドラッグ</li>
        </ul>
      </div>
    </div>
  );
};