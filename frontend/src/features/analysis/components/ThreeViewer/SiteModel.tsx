import React, { useMemo, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PropertyShape } from 'shared';
import { createSiteShape, createSiteMaterial, calculateSiteCenter } from './helpers/modelUtils';
import * as THREE from 'three';

interface SiteModelProps {
  shapeData: PropertyShape;
  viewMode: 'normal' | 'wireframe' | 'xray';
}

export const SiteModel: React.FC<SiteModelProps> = ({ shapeData, viewMode }) => {
  const { camera } = useThree();
  
  // シェイプとマテリアルをメモ化
  const { shape, material, extrudeSettings, center } = useMemo(() => {
    if (!shapeData.points || shapeData.points.length < 3) {
      return {
        shape: new THREE.Shape(),
        material: createSiteMaterial(viewMode),
        extrudeSettings: { depth: 0.2, bevelEnabled: false },
        center: new THREE.Vector3()
      };
    }
    
    const siteShape = createSiteShape(shapeData.points);
    const siteMaterial = createSiteMaterial(viewMode);
    const siteCenter = calculateSiteCenter(shapeData.points);
    
    // 敷地の押し出し設定（高さは低く）
    const extrudeSettings = {
      depth: 0.2,          // 薄く押し出す
      bevelEnabled: false  // ベベル（角の丸み）なし
    };
    
    return { shape: siteShape, material: siteMaterial, extrudeSettings, center: siteCenter };
  }, [shapeData.points, viewMode]);
  
  // コンポーネントがマウントされたら、カメラの位置を敷地に合わせる
  useEffect(() => {
    if (center.length() > 0) {
      // カメラのターゲットを敷地の中心に設定
      camera.position.set(center.x + 20, 20, center.z + 20);
      camera.lookAt(center);
    }
  }, [center, camera]);
  
  // 敷地がない場合は何も表示しない
  if (!shapeData.points || shapeData.points.length < 3) {
    return null;
  }
  
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
};