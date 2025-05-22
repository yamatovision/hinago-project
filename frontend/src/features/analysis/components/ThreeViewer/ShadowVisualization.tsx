import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { VolumeCheck, Property } from 'shared';
import { useFrame } from '@react-three/fiber';
import { useThreeStore } from './helpers/useThreeStore';

interface ShadowVisualizationProps {
  volumeCheck: VolumeCheck;
  property: Property;
  animationSpeed?: number; // アニメーション速度係数（1=リアルタイム）
  timePoint?: number; // 特定時間点（時）を表示する場合。省略時はアニメーション
  showShadowMap?: boolean; // 日影等時間線マップを表示するかどうか
  shadingOpacity?: number; // 日影の不透明度
}

// 日影の色定義（時間別）
const SHADOW_COLORS = [
  new THREE.Color('#4A6572'), // 短時間の影
  new THREE.Color('#344955'), // 中程度の影
  new THREE.Color('#232F34')  // 長時間の影
];

// 時間帯の境界（時間）
const TIME_THRESHOLDS = [2, 4];

export const ShadowVisualization: React.FC<ShadowVisualizationProps> = ({
  volumeCheck,
  property,
  animationSpeed = 1,
  timePoint,
  showShadowMap = true,
  shadingOpacity = 0.7
}) => {
  // アニメーション用の時間参照
  const timeRef = useRef<number>(8); // 8時から開始
  const animationRef = useRef<boolean>(timePoint === undefined);
  
  // グローバルstate
  const { setShadowState } = useThreeStore();
  
  // 日影計算のために必要なデータが揃っているかチェック
  const hasRequiredData = useMemo(() => {
    return (
      property?.shapeData?.points && property.shapeData.points.length > 0 &&
      volumeCheck?.shadowSimulation !== undefined
    );
  }, [property, volumeCheck]);
  
  // 影のメッシュを生成
  const shadowMesh = useMemo(() => {
    if (!hasRequiredData) return null;
    
    // 影を表示する平面のサイズを決定
    const points = property.shapeData!.points;
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    // 敷地を中心とした範囲（敷地サイズの3倍程度の範囲）
    const width = (maxX - minX) * 3;
    const height = (maxY - minY) * 3;
    
    // 影を表示する平面のジオメトリとマテリアル
    const planeGeometry = new THREE.PlaneGeometry(width, height, 50, 50);
    
    // 初期状態は不可視
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: SHADOW_COLORS[0],
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // 影のメッシュを作成
    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    
    // XY平面上に配置（地面と同じ高さ）
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.01; // 地面のすぐ上
    
    return mesh;
  }, [property, hasRequiredData]);
  
  // 日影等時間線マップを生成
  const shadowMapMesh = useMemo(() => {
    if (!hasRequiredData || !showShadowMap || !volumeCheck.shadowSimulation?.isochroneMap) return null;
    
    const isochroneMap = volumeCheck.shadowSimulation.isochroneMap;
    const { xMin, xMax, yMin, yMax, gridData } = isochroneMap;
    
    // マップのサイズ
    const width = xMax - xMin;
    const height = yMax - yMin;
    
    // ヒートマップテクスチャの作成
    const size = gridData.length;
    const data = new Uint8Array(size * size * 4);
    
    // グリッドデータからヒートマップテクスチャを生成
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const shadowHours = gridData[i][j];
        const idx = (i * size + j) * 4;
        
        // 値に応じた色を設定
        let color: THREE.Color;
        
        if (shadowHours <= TIME_THRESHOLDS[0]) {
          color = SHADOW_COLORS[0];
        } else if (shadowHours <= TIME_THRESHOLDS[1]) {
          color = SHADOW_COLORS[1];
        } else {
          color = SHADOW_COLORS[2];
        }
        
        // 不透明度も時間に応じて変更（長いほど濃く）
        const maxHours = 8; // 最大8時間（8時〜16時）
        const opacity = Math.min(shadowHours / maxHours, 1) * shadingOpacity;
        
        data[idx] = Math.floor(color.r * 255);
        data[idx + 1] = Math.floor(color.g * 255);
        data[idx + 2] = Math.floor(color.b * 255);
        data[idx + 3] = Math.floor(opacity * 255);
      }
    }
    
    // テクスチャ作成
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.needsUpdate = true;
    
    // 平面ジオメトリとマテリアル
    const planeGeometry = new THREE.PlaneGeometry(width, height);
    const planeMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    
    // メッシュ作成
    const mesh = new THREE.Mesh(planeGeometry, planeMaterial);
    
    // 配置（地面のすぐ上、敷地中心に調整）
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(
      (xMin + xMax) / 2,
      0.02, // 影のメッシュの上
      (yMin + yMax) / 2
    );
    
    return mesh;
  }, [volumeCheck, property, hasRequiredData, showShadowMap, shadingOpacity]);
  
  // 特定時間の日影を計算・表示
  const calculateShadowAtTime = (time: number) => {
    if (!shadowMesh || !property?.shapeData || !volumeCheck?.model3dData) return;
    
    // 時間を8-16の範囲に制限
    const clampedTime = Math.max(8, Math.min(16, time));
    
    // マテリアル取得
    const material = shadowMesh.material as THREE.MeshBasicMaterial;
    
    // 太陽の方位角と高度角を計算（簡易版）
    // 本来は sunPosition.ts の関数を使うべきだが、簡易実装として近似計算
    const hour = clampedTime - 12; // -4〜+4の範囲（正午が0）
    
    // 冬至の正午の高度角（福岡市の場合約32度）と方位角（真南=180度）
    const noonAltitude = 32;
    const noonAzimuth = 180;
    
    // 時間による調整（東→南→西に動く、高度は朝夕に低くなる）
    const azimuth = noonAzimuth + hour * 15; // 15度/時
    const altitude = noonAltitude - Math.abs(hour) * 5; // 正午から離れるほど低くなる
    
    // 太陽光線の方向ベクトル
    const azimuthRad = (azimuth * Math.PI) / 180;
    const altitudeRad = (altitude * Math.PI) / 180;
    
    const sunDirection = new THREE.Vector3(
      Math.sin(azimuthRad) * Math.cos(altitudeRad),
      Math.sin(altitudeRad),
      Math.cos(azimuthRad) * Math.cos(altitudeRad)
    );
    
    // 影の表示
    if (altitude > 0) { // 太陽が地平線より上
      // 時間帯に応じた影の色と濃さを設定
      const timeIndex = Math.floor((clampedTime - 8) / 3);
      material.color = SHADOW_COLORS[Math.min(timeIndex, SHADOW_COLORS.length - 1)];
      material.opacity = shadingOpacity;
      
      // 影の方向を太陽位置に合わせて調整
      // 実際には建物形状から射影計算するべきだが、簡易版として実装
      shadowMesh.position.y = 0.01;
    } else {
      // 太陽が地平線より下の場合は影を表示しない
      material.opacity = 0;
    }
    
    // 現在の時間とアニメーション状態を保存
    setShadowState({
      currentTime: clampedTime,
      isAnimating: animationRef.current,
      sunDirection
    });
  };
  
  // アニメーションフレーム処理
  useFrame(({ clock }) => {
    if (!animationRef.current || !hasRequiredData) return;
    
    // リアルタイムの1秒 = シミュレーション上の10分と仮定
    const minutes = clock.getElapsedTime() * 10 * animationSpeed;
    const hours = minutes / 60;
    
    // 8時〜16時の間をループ
    const currentTime = 8 + (hours % 8);
    timeRef.current = currentTime;
    
    // 日影の更新
    calculateShadowAtTime(currentTime);
  });
  
  // 指定された時間点がある場合、その時間で固定表示
  useEffect(() => {
    if (timePoint !== undefined) {
      animationRef.current = false;
      calculateShadowAtTime(timePoint);
    } else {
      animationRef.current = true;
    }
  }, [timePoint]);
  
  // データ不足の場合は何も表示しない
  if (!hasRequiredData) {
    return null;
  }
  
  return (
    <>
      {/* 影のメッシュ */}
      {shadowMesh && <primitive object={shadowMesh} />}
      
      {/* 日影等時間線マップ */}
      {shadowMapMesh && <primitive object={shadowMapMesh} />}
    </>
  );
};