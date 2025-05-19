/**
 * ジオコーディングサービス
 * 
 * 住所から緯度経度情報を取得するサービスを提供します。
 * 実際の実装では外部APIを使用しますが、このサンプルではモックデータを返します。
 */
import { logger } from '../../common/utils';

/**
 * 緯度経度情報
 */
interface GeoLocation {
  lat: number;
  lng: number;
  formatted_address: string;
}

/**
 * 住所から緯度経度情報を取得
 * @param address 住所
 * @returns 緯度経度情報
 */
export const getGeocode = async (address: string): Promise<GeoLocation | null> => {
  try {
    logger.debug('ジオコーディング実行', { address });
    
    // 実際のプロジェクトでは外部APIを呼び出しますが、ここではモックデータを返します
    if (address.includes('福岡')) {
      return {
        lat: 33.5898,
        lng: 130.3986,
        formatted_address: address
      };
    } else if (address.includes('東京')) {
      return {
        lat: 35.6764,
        lng: 139.6500,
        formatted_address: address
      };
    } else if (address.includes('大阪')) {
      return {
        lat: 34.6937,
        lng: 135.5022,
        formatted_address: address
      };
    } else if (address.includes('名古屋')) {
      return {
        lat: 35.1815,
        lng: 136.9064,
        formatted_address: address
      };
    } else if (address.includes('札幌')) {
      return {
        lat: 43.0618,
        lng: 141.3545,
        formatted_address: address
      };
    } else {
      // 実際のAPIなら住所が見つからない場合はnullを返します
      // モック実装では適当な座標を生成します
      const lat = 35 + Math.random() * 10 - 5;
      const lng = 135 + Math.random() * 10 - 5;
      return {
        lat,
        lng,
        formatted_address: address
      };
    }
  } catch (error) {
    logger.error('ジオコーディングエラー', { error, address });
    throw error;
  }
};