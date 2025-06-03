import React, { useMemo } from 'react';
import { VolumeCheck } from 'shared';
import { createBuildingMaterial } from './helpers/modelUtils';
import * as THREE from 'three';
import { ExtrudeGeometry, Shape } from 'three';

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
    
    // 3Dモデルデータから建物形状を取得
    const modelData = volumeCheck.model3dData?.data;
    const buildingData = modelData?.building;
    
    // 建物形状データがある場合
    if (buildingData?.floors) {
      // 各階の形状を生成
      buildingData.floors.forEach((floorData: any, index: number) => {
        const floorNumber = index + 1;
        if (!floorsToShow.includes(floorNumber)) return;
        
        // 床形状からShapeを作成
        const shape = new Shape();
        floorData.shape.forEach((point: [number, number], i: number) => {
          if (i === 0) {
            shape.moveTo(point[0], point[1]);
          } else {
            shape.lineTo(point[0], point[1]);
          }
        });
        shape.closePath();
        
        // ExtrudeGeometryで立体化
        const extrudeSettings = {
          steps: 1,
          depth: floorData.height,
          bevelEnabled: false
        };
        const geometry = new ExtrudeGeometry(shape, extrudeSettings);
        
        // ジオメトリを正しい方向に回転
        geometry.rotateX(-Math.PI / 2);
        
        // 階によって色を少し変える
        const hue = 0.6 - (index / buildingData.floors.length) * 0.3;
        const color = new THREE.Color().setHSL(hue, 0.7, 0.5);
        const material = createBuildingMaterial(viewMode, color.getHex());
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = index * floorData.height;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        group.add(mesh);
      });
    } else {
      // 従来の単純なボックス生成
      floors.forEach((floor, index) => {
        const floorNumber = index + 1;
        if (!floorsToShow.includes(floorNumber)) return;
        
        const sideLength = Math.sqrt(floor.floorArea);
        const geometry = new THREE.BoxGeometry(
          sideLength,
          floorHeight,
          sideLength
        );
        
        const hue = 0.6 - (index / floors.length) * 0.3;
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
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        group.add(mesh);
      });
    }
    
    return group;
  }, [volumeCheck, showFloors, viewMode]);
  
  if (!volumeCheck || !buildingObject) {
    return null;
  }
  
  return (
    <primitive object={buildingObject} />
  );
};