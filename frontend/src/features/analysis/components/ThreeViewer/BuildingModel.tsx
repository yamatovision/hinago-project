import React, { useMemo } from 'react';
import { VolumeCheck } from 'shared';
import { createBuildingMaterial } from './helpers/modelUtils';
import * as THREE from 'three';

interface BuildingModelProps {
  volumeCheck: VolumeCheck | null;
  showFloors?: number[]; // undefined は全ての階を表示
  viewMode: 'normal' | 'wireframe' | 'xray';
}

export const BuildingModel: React.FC<BuildingModelProps> = ({ 
  volumeCheck, 
  showFloors, 
  viewMode 
}) => {
  // ボリュームチェックデータから建物モデルを生成
  const buildingObject = useMemo(() => {
    if (!volumeCheck) return null;
    
    const group = new THREE.Group();
    
    // 各階のデータを取得
    const floors = volumeCheck.floorBreakdown || [];
    const floorHeight = volumeCheck.buildingHeight / volumeCheck.floors;
    
    // 表示する階を決定
    const floorsToShow = showFloors || floors.map((_, index) => index + 1);
    
    // 階ごとに異なるジオメトリを生成
    floors.forEach((floor, index) => {
      const floorNumber = index + 1;
      
      // 指定された階だけを表示
      if (!floorsToShow.includes(floorNumber)) return;
      
      // 階の面積から幅と奥行きを決定（単純な正方形として）
      const sideLength = Math.sqrt(floor.floorArea);
      
      const geometry = new THREE.BoxGeometry(
        sideLength, // 幅
        floorHeight, // 高さ
        sideLength  // 奥行き
      );
      
      // 階によって色を少し変える
      const hue = 0.6 - (index / floors.length) * 0.3; // 青から水色のグラデーション
      const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
      
      const material = createBuildingMaterial(viewMode, color.getHex());
      
      const mesh = new THREE.Mesh(geometry, material);
      
      // 階ごとの位置を設定
      mesh.position.set(0, index * floorHeight + floorHeight / 2, 0);
      
      // メタデータを設定
      mesh.userData.floorInfo = {
        ...floor,
        floorNumber
      };
      
      group.add(mesh);
    });
    
    return group;
  }, [volumeCheck, showFloors, viewMode]);
  
  if (!volumeCheck || !buildingObject) {
    return null;
  }
  
  return (
    <primitive object={buildingObject} />
  );
};