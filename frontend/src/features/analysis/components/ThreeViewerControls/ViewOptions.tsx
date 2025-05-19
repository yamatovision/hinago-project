import React from 'react';
import { useThreeStore } from '../ThreeViewer/helpers/useThreeStore';

export const ViewOptions: React.FC = () => {
  const { 
    showSite, 
    setShowSite,

    showGrid, 
    setShowGrid,
    viewMode, 
    setViewMode 
  } = useThreeStore();
  
  // ビューモードの変更ハンドラー
  const handleViewModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = event.target.value as 'normal' | 'wireframe' | 'xray';
    setViewMode(mode);
  };
  
  return (
    <div style={{ margin: '10px 0' }}>
      <h4 style={{ margin: '0 0 8px 0' }}>表示オプション</h4>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* チェックボックスグループ */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showSite}
              onChange={e => setShowSite(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            敷地を表示
          </label>
          
          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={showGrid}
              onChange={e => setShowGrid(e.target.checked)}
              style={{ marginRight: '4px' }}
            />
            グリッドを表示
          </label>
        </div>
        
        {/* 表示モード選択 */}
        <div>
          <label htmlFor="viewMode" style={{ marginRight: '8px' }}>表示モード:</label>
          <select 
            id="viewMode" 
            value={viewMode}
            onChange={handleViewModeChange}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}
          >
            <option value="normal">通常</option>
            <option value="wireframe">ワイヤーフレーム</option>
            <option value="xray">レントゲン</option>
          </select>
        </div>
      </div>
    </div>
  );
};