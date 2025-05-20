/**
 * 太陽位置計算ユーティリティ
 * 
 * 日付と時刻に基づいて太陽の位置（方位角と高度角）を計算するためのユーティリティ関数群
 */

/**
 * 太陽位置の型定義
 */
export interface SunPosition {
  azimuth: number;  // 方位角（北=0°、東=90°、南=180°、西=270°）
  altitude: number; // 高度角（水平=0°、天頂=90°）
}

/**
 * 福岡市の位置情報
 */
const FUKUOKA = {
  latitude: 33.6,  // 福岡市の緯度
  longitude: 130.4 // 福岡市の経度
};

/**
 * 太陽位置の計算
 * @param date 日付
 * @param hour 時間（0〜23）
 * @param latitude 緯度（デフォルトは福岡市）
 * @param longitude 経度（デフォルトは福岡市）
 * @returns 太陽位置（方位角と高度角）
 */
export function calculateSunPosition(
  date: Date,
  hour: number,
  latitude: number = FUKUOKA.latitude,
  longitude: number = FUKUOKA.longitude
): SunPosition {
  // 日付と時刻から時角を計算
  const dayOfYear = getDayOfYear(date);
  
  // 赤緯（declination）の計算
  // 赤緯は太陽の南中高度に影響する重要な要素
  const declination = 23.45 * Math.sin(Math.PI / 180 * 360 * (284 + dayOfYear) / 365);
  
  // 時角の計算（1時間あたり15度）
  // 12時（正午）を基準として、前後の時間で角度が変わる
  const timeOffset = hour + (date.getMinutes() / 60) - 12; // 正午からのオフセット
  const hourAngle = 15 * timeOffset; // 15度/時
  
  // 高度角（太陽の高さ）を計算
  const sinAltitude = Math.sin(Math.PI / 180 * latitude) * Math.sin(Math.PI / 180 * declination) +
                    Math.cos(Math.PI / 180 * latitude) * Math.cos(Math.PI / 180 * declination) * 
                    Math.cos(Math.PI / 180 * hourAngle);
  const altitude = Math.asin(sinAltitude) * 180 / Math.PI;
  
  // 方位角を計算（北を0°として時計回り）
  const cosAzimuth = (Math.sin(Math.PI / 180 * declination) - 
                    Math.sin(Math.PI / 180 * altitude) * Math.sin(Math.PI / 180 * latitude)) /
                    (Math.cos(Math.PI / 180 * altitude) * Math.cos(Math.PI / 180 * latitude));
  
  // cosAzimuthの値が範囲外になった場合の対処
  const clampedCosAzimuth = Math.max(-1, Math.min(1, cosAzimuth));
  let azimuth = Math.acos(clampedCosAzimuth) * 180 / Math.PI;
  
  // 午後は方位角を調整
  if (hourAngle > 0) {
    azimuth = 360 - azimuth;
  }
  
  return { azimuth, altitude };
}

/**
 * 冬至日の取得
 * @param year 年
 * @returns 冬至日の日付
 */
export function getWinterSolsticeDate(year: number): Date {
  // 北半球の冬至は12月21日または22日頃
  // 簡易計算として12月22日を使用
  return new Date(year, 11, 22); // JavaScriptの月は0から始まるため、11=12月
}

/**
 * 1年のうちの日数を計算（1/1を1日目として）
 * @param date 日付
 * @returns その年の何日目か
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * 冬至日の日の出から日没までの時間帯（福岡市）
 * @param year 年
 * @returns {sunrise: number, sunset: number} 日の出時刻と日没時刻（24時間形式）
 */
export function getWinterSolsticeSunriseSunset(year: number): { sunrise: number, sunset: number } {
  // 福岡市の冬至の日の出・日没時刻（およその値）
  // 厳密には年によって若干変わるが、シミュレーション用の近似値として使用
  return {
    sunrise: 7.1, // 7:06頃
    sunset: 17.1  // 17:06頃
  };
}

/**
 * 日影規制のシミュレーション時間範囲を取得
 * @returns 検証すべき時間範囲（デフォルトは8:00から16:00まで）
 */
export function getShadowRegulationTimeRange(): { start: number, end: number } {
  // 建築基準法での日影規制の対象時間（福岡市）
  return {
    start: 8,  // 8:00
    end: 16    // 16:00
  };
}

/**
 * 指定した時間範囲の太陽位置を計算
 * @param date 日付
 * @param timeStep 時間ステップ（時間単位、デフォルトは1時間）
 * @returns 時間ごとの太陽位置
 */
export function calculateSunPositionsForDay(
  date: Date, 
  timeStep: number = 1
): {time: number, position: SunPosition}[] {
  const { start, end } = getShadowRegulationTimeRange();
  const positions: {time: number, position: SunPosition}[] = [];
  
  // 指定した時間範囲で太陽位置を計算
  for (let hour = start; hour <= end; hour += timeStep) {
    const position = calculateSunPosition(date, hour);
    positions.push({
      time: hour,
      position
    });
  }
  
  return positions;
}