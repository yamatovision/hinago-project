import { create } from 'zustand';
import { VolumeCheck, Property } from 'shared';

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
}

export const useThreeStore = create<ThreeViewerState>((set) => ({
  // 初期状態
  showFloors: undefined,
  showSite: true,
  showGrid: true,
  viewMode: 'normal',
  volumeCheck: null,
  property: null,
  
  // アクション
  setShowFloors: (floors) => set({ showFloors: floors }),
  setShowSite: (show) => set({ showSite: show }),
  setShowGrid: (show) => set({ showGrid: show }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setVolumeCheck: (volumeCheck) => set({ volumeCheck }),
  setProperty: (property) => set({ property }),
}));