import React, { useState, useEffect } from 'react';
import { VolumeCheck } from 'shared';
import { useThreeStore } from '../ThreeViewer/helpers/useThreeStore';

interface FloorSelectorProps {
  volumeCheck: VolumeCheck | null;
}

export const FloorSelector: React.FC<FloorSelectorProps> = ({ volumeCheck }) => {
  const { showFloors, setShowFloors } = useThreeStore();
  const [selectedFloors, setSelectedFloors] = useState<number[]>([]);
  const [showAllFloors, setShowAllFloors] = useState(true);
  
  // ボリュームチェックデータが変更されたとき、すべての階を表示状態にする
  useEffect(() => {
    if (volumeCheck) {
      const allFloors = Array.from(
        { length: volumeCheck.floors }, 
        (_, i) => i + 1
      );
      setSelectedFloors(allFloors);
      setShowAllFloors(true);
      setShowFloors(undefined); // すべての階を表示
    }
  }, [volumeCheck, setShowFloors]);
  
  // 階の選択状態が変更されたとき
  const handleFloorToggle = (floorNumber: number) => {
    const updatedFloors = selectedFloors.includes(floorNumber)
      ? selectedFloors.filter(f => f !== floorNumber)
      : [...selectedFloors, floorNumber];
    
    setSelectedFloors(updatedFloors);
    
    // すべての階が選択されているか確認
    const allSelected = volumeCheck && 
      updatedFloors.length === volumeCheck.floors;
    
    setShowAllFloors(allSelected);
    
    // 表示する階を更新
    setShowFloors(allSelected ? undefined : updatedFloors);
  };
  
  // 「すべて表示」ボタンのハンドラー
  const handleToggleAll = () => {
    if (volumeCheck) {
      if (showAllFloors) {
        // すべての階を非表示に
        setSelectedFloors([]);
        setShowAllFloors(false);
        setShowFloors([]);
      } else {
        // すべての階を表示に
        const allFloors = Array.from(
          { length: volumeCheck.floors }, 
          (_, i) => i + 1
        );
        setSelectedFloors(allFloors);
        setShowAllFloors(true);
        setShowFloors(undefined);
      }
    }
  };
  
  if (!volumeCheck) return null;
  
  return (
    <div style={{ margin: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, marginRight: '10px' }}>階表示設定</h4>
        <button
          onClick={handleToggleAll}
          style={{
            background: showAllFloors ? '#2196f3' : '#e0e0e0',
            color: showAllFloors ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          {showAllFloors ? 'すべて非表示' : 'すべて表示'}
        </button>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {Array.from({ length: volumeCheck.floors }, (_, i) => {
          const floorNumber = volumeCheck.floors - i;
          const isSelected = selectedFloors.includes(floorNumber);
          
          return (
            <button
              key={floorNumber}
              onClick={() => handleFloorToggle(floorNumber)}
              style={{
                background: isSelected ? '#2196f3' : '#e0e0e0',
                color: isSelected ? 'white' : 'black',
                border: 'none',
                borderRadius: '4px',
                padding: '6px 10px',
                cursor: 'pointer',
                minWidth: '40px'
              }}
            >
              {floorNumber}F
            </button>
          );
        })}
      </div>
    </div>
  );
};