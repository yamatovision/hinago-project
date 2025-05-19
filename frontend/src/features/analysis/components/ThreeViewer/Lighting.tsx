import React from 'react';

export const Lighting: React.FC = () => {
  return (
    <>
      {/* 環境光 - 全体を均一に照らす */}
      <ambientLight intensity={0.5} />
      
      {/* 平行光源1 - 太陽光のような主光源 */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      
      {/* 平行光源2 - 影側を柔らかく照らす補助光 */}
      <directionalLight
        position={[-10, 15, -10]}
        intensity={0.3}
        color="#e0f7fa"
      />
    </>
  );
};