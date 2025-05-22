import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid as DreiGrid, Environment } from '@react-three/drei';
import { VolumeCheck, Property } from 'shared';
import { BuildingModel } from './BuildingModel';
import { SiteModel } from './SiteModel';
import { Lighting } from './Lighting';
import { useThreeStore } from './helpers/useThreeStore';
import { ShadowVisualization } from './ShadowVisualization';

interface ThreeViewerProps {
  volumeCheck: VolumeCheck;
  property: Property;
  options?: {
    showFloors?: number[];
    showSite?: boolean;
    showGrid?: boolean;
    viewMode?: 'normal' | 'wireframe' | 'xray';
  };
}

export const ThreeViewer: React.FC<ThreeViewerProps> = ({
  volumeCheck,
  property,
  options = {
    showFloors: undefined, // undefined は全て表示
    showSite: true,
    showGrid: true,
    viewMode: 'normal',
  },
}) => {
  // グローバルstate
  const { 
    setVolumeCheck, 
    setProperty,
    shadowState, 
    showShadowVisualization,
    shadowOpacity
  } = useThreeStore();
  
  // グローバルstateを更新
  useEffect(() => {
    setVolumeCheck(volumeCheck);
    setProperty(property);
    
    // クリーンアップ
    return () => {
      setVolumeCheck(null);
      setProperty(null);
    };
  }, [volumeCheck, property, setVolumeCheck, setProperty]);
  
  return (
    <div style={{ width: '100%', height: '400px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <Canvas 
        camera={{ position: [20, 20, 20], fov: 50 }}
        shadows
      >
        {/* 環境設定 */}
        <color attach="background" args={[240/255, 240/255, 240/255]} />
        <fog attach="fog" args={['#f0f0f0', 30, 100]} />
        <Lighting />
        <Environment preset="city" />
        
        {/* グリッドと座標軸 */}
        {options.showGrid && (
          <>
            <DreiGrid 
              infiniteGrid 
              fadeDistance={50} 
              cellSize={1}
              cellThickness={0.5}
              sectionSize={5}
              sectionThickness={1}
              sectionColor="#2196f3"
              fadeStrength={1.5}
            />
            <axesHelper args={[5]} />
          </>
        )}
        
        {/* 敷地モデル */}
        {options.showSite && property.shapeData && (
          <SiteModel 
            shapeData={property.shapeData} 
            viewMode={options.viewMode || 'normal'} 
          />
        )}
        
        {/* 建物モデル */}
        <BuildingModel 
          volumeCheck={volumeCheck} 
          showFloors={options.showFloors}
          viewMode={options.viewMode || 'normal'} 
        />
        
        {/* 日影シミュレーション */}
        {showShadowVisualization && volumeCheck.shadowSimulation && (
          <ShadowVisualization 
            volumeCheck={volumeCheck}
            property={property}
            timePoint={shadowState?.isAnimating ? undefined : shadowState?.currentTime}
            animationSpeed={1}
            showShadowMap={true}
            shadingOpacity={shadowOpacity}
          />
        )}
        
        {/* カメラコントロール */}
        <OrbitControls 
          enableDamping 
          dampingFactor={0.05} 
          minDistance={5}
          maxDistance={100}
        />
      </Canvas>
    </div>
  );
};