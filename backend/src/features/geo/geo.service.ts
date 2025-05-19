/**
 * ジオコーディングサービス
 * 
 * 住所から緯度経度情報を取得するサービスと、
 * 緯度経度から住所情報を取得するサービスを提供します。
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

/**
 * 緯度経度から住所情報を取得
 * @param lat 緯度
 * @param lng 経度
 * @returns 住所情報
 */
export const getReverseGeocode = async (lat: number, lng: number): Promise<GeoLocation | null> => {
  try {
    logger.debug('逆ジオコーディング実行', { lat, lng });
    
    // 実際のプロジェクトでは外部APIを呼び出しますが、ここではモックデータを返します
    // 一定の範囲に特定の地域が存在すると想定したモックマッピング
    
    // 福岡近辺
    if (lat >= 33.5 && lat <= 33.7 && lng >= 130.3 && lng <= 130.5) {
      return {
        lat,
        lng,
        formatted_address: `福岡県福岡市中央区天神${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`
      };
    }
    // 東京近辺
    else if (lat >= 35.6 && lat <= 35.8 && lng >= 139.5 && lng <= 139.8) {
      return {
        lat,
        lng,
        formatted_address: `東京都千代田区丸の内${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`
      };
    }
    // 大阪近辺
    else if (lat >= 34.6 && lat <= 34.8 && lng >= 135.4 && lng <= 135.6) {
      return {
        lat,
        lng,
        formatted_address: `大阪府大阪市北区梅田${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`
      };
    }
    // 名古屋近辺
    else if (lat >= 35.1 && lat <= 35.3 && lng >= 136.8 && lng <= 137.0) {
      return {
        lat,
        lng,
        formatted_address: `愛知県名古屋市中区栄${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`
      };
    }
    // 札幌近辺
    else if (lat >= 43.0 && lat <= 43.2 && lng >= 141.2 && lng <= 141.4) {
      return {
        lat,
        lng,
        formatted_address: `北海道札幌市中央区大通西${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`
      };
    }
    // 上記以外の場所
    else {
      // 適当な住所を生成
      const prefecture = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県', '静岡県'][Math.floor(Math.random() * 8)];
      const city = ['中央区', '北区', '南区', '東区', '西区'][Math.floor(Math.random() * 5)];
      const address = `${prefecture}${city}不明町${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}-${Math.floor(Math.random() * 10) + 1}`;
      
      return {
        lat,
        lng,
        formatted_address: address
      };
    }
  } catch (error) {
    logger.error('逆ジオコーディングエラー', { error, lat, lng });
    throw error;
  }
};