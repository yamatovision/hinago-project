/**
 * マイルストーントラッカー
 * テスト実行時間の詳細な計測と分析を行うためのユーティリティ
 */
export class MilestoneTracker {
  private milestones: { [key: string]: number } = {};
  private currentOp: string = "初期化";
  private startTime: number = Date.now();
  private statusTimer: NodeJS.Timeout | null = null;

  constructor() {
    // 1秒ごとに現在の状態を報告
    this.statusTimer = setInterval(() => {
      const elapsed = (Date.now() - this.startTime) / 1000;
      console.log(`[${elapsed.toFixed(2)}秒経過] 現在の状態: ${this.currentOp}`);
    }, 1000);
  }

  // 操作の開始を記録
  setOperation(op: string): void {
    this.currentOp = op;
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] ▶️ 開始: ${op}`);
  }

  // マイルストーンを記録
  mark(name: string): void {
    this.milestones[name] = Date.now();
    const elapsed = (Date.now() - this.startTime) / 1000;
    console.log(`[${elapsed.toFixed(2)}秒経過] 🏁 マイルストーン: ${name}`);
  }

  // クリーンアップ
  cleanup(): void {
    if (this.statusTimer) {
      clearInterval(this.statusTimer);
      this.statusTimer = null;
    }
    
    // マイルストーン間の経過時間を表示
    const sortedMilestones = Object.entries(this.milestones).sort((a, b) => a[1] - b[1]);
    console.log("\n--- マイルストーン経過時間 ---");
    
    for (let i = 1; i < sortedMilestones.length; i++) {
      const prev = sortedMilestones[i-1];
      const curr = sortedMilestones[i];
      const diffSec = (curr[1] - prev[1]) / 1000;
      console.log(`${prev[0]} → ${curr[0]}: ${diffSec.toFixed(2)}秒`);
    }
    
    const totalSec = (Date.now() - this.startTime) / 1000;
    console.log(`総実行時間: ${totalSec.toFixed(2)}秒\n`);
  }
}