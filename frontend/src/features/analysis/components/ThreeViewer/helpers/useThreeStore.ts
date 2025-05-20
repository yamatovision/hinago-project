import { create } from 'zustand';
import { VolumeCheck, Property } from 'shared';
import * as THREE from 'three';

// 日影シミュレーションの状態
interface ShadowState {
  currentTime?: number;    // 現在の時刻（8-16時）
  isAnimating?: boolean;   // アニメーション中かどうか
  sunDirection?: THREE.Vector3; // 太陽光の方向ベクトル
}

interface ThreeViewerState {
  // 表示設定
  showFloors: number[] | undefined; // undefined は全て表示
  showSite: boolean;
  showGrid: boolean;
  viewMode: 'normal' | 'wireframe' | 'xray';
  
  // 設定変更アクション
  setShowFloors: (floors: number[] | undefined) => void;
  setShowSite: (show: boolean) => void;
  setShowGrid: (show: boolean) => void;
  setViewMode: (mode: 'normal' | 'wireframe' | 'xray') => void;
  
  // データ
  volumeCheck: VolumeCheck | null;
  property: Property | null;
  
  // データ設定アクション
  setVolumeCheck: (volumeCheck: VolumeCheck | null) => void;
  setProperty: (property: Property | null) => void;
  
  // 日影シミュレーション
  showShadowVisualization: boolean;
  shadowState: ShadowState | null;
  shadowOpacity: number;
  
  // 日影シミュレーション設定アクション
  setShowShadowVisualization: (show: boolean) => void;
  setShadowState: (state: ShadowState) => void;
  setShadowOpacity: (opacity: number) => void;
}

export const useThreeStore = create<ThreeViewerState>((set) => ({
  // 初期状態
  showFloors: undefined,
  showSite: true,
  showGrid: true,
  viewMode: 'normal',
  volumeCheck: null,
  property: null,
  
  // 日影シミュレーション初期状態
  showShadowVisualization: false,
  shadowState: {
    currentTime: 12,   // 正午をデフォルト
    isAnimating: false
  },
  shadowOpacity: 0.7,  // 70%
  
  // アクション
  setShowFloors: (floors) => set({ showFloors: floors }),
  setShowSite: (show) => set({ showSite: show }),
  setShowGrid: (show) => set({ showGrid: show }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setVolumeCheck: (volumeCheck) => set({ volumeCheck }),
  setProperty: (property) => set({ property }),
  
  // 日影シミュレーションアクション
  setShowShadowVisualization: (show) => set({ showShadowVisualization: show }),
  setShadowState: (state) => set((prev) => ({ 
    shadowState: { ...prev.shadowState, ...state } 
  })),
  setShadowOpacity: (opacity) => set({ shadowOpacity: opacity }),
}));