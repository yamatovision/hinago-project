import * as THREE from 'three';
import { BoundaryPoint, PropertyShape } from 'shared';

/**
 * 敷地形状からThree.jsのShapeを生成する
 */
export function createSiteShape(points: BoundaryPoint[]): THREE.Shape {
  const shape = new THREE.Shape();
  
  // 最初の点から始める
  if (points.length > 0) {
    shape.moveTo(points[0].x, points[0].y);
    
    // 残りの点を線で結ぶ
    for (let i = 1; i < points.length; i++) {
      shape.lineTo(points[i].x, points[i].y);
    }
    
    // 形状を閉じる
    shape.lineTo(points[0].x, points[0].y);
  }
  
  return shape;
}

/**
 * 敷地の中心点を計算する
 */
export function calculateSiteCenter(points: BoundaryPoint[]): THREE.Vector3 {
  if (points.length === 0) {
    return new THREE.Vector3();
  }
  
  let sumX = 0;
  let sumY = 0;
  
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  
  return new THREE.Vector3(
    sumX / points.length,
    0,
    sumY / points.length
  );
}

/**
 * 敷地の大きさを計算して適切なスケールを返す
 */
export function calculateSiteScale(points: BoundaryPoint[]): number {
  if (points.length < 2) {
    return 1;
  }
  
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  
  const width = maxX - minX;
  const depth = maxY - minY;
  
  // 適切なスケールを計算（カメラから見やすくするため）
  return Math.max(width, depth) > 0 ? 100 / Math.max(width, depth) : 1;
}

/**
 * マテリアルを作成する
 */
export function createSiteMaterial(viewMode: 'normal' | 'wireframe' | 'xray'): THREE.Material {
  switch (viewMode) {
    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true
      });
    case 'xray':
      return new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        transparent: true,
        opacity: 0.3
      });
    case 'normal':
    default:
      return new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide
      });
  }
}

/**
 * 建物フロアのマテリアルを作成する
 */
export function createBuildingMaterial(
  viewMode: 'normal' | 'wireframe' | 'xray',
  color: number = 0x2196f3
): THREE.Material {
  switch (viewMode) {
    case 'wireframe':
      return new THREE.MeshBasicMaterial({
        color,
        wireframe: true
      });
    case 'xray':
      return new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.4
      });
    case 'normal':
    default:
      return new THREE.MeshPhongMaterial({
        color,
        transparent: true,
        opacity: 0.7
      });
  }
}