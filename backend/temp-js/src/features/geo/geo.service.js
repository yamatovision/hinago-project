"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReverseGeocode = exports.getGeocode = void 0;
/**
 * ジオコーディングサービス
 *
 * 住所から緯度経度情報を取得するサービスと、
 * 緯度経度から住所情報を取得するサービスを提供します。
 * 実際の実装では外部APIを使用しますが、このサンプルではモックデータを返します。
 */
var utils_1 = require("../../common/utils");
/**
 * 住所から緯度経度情報を取得
 * @param address 住所
 * @returns 緯度経度情報
 */
var getGeocode = function (address) { return __awaiter(void 0, void 0, void 0, function () {
    var lat, lng;
    return __generator(this, function (_a) {
        try {
            utils_1.logger.debug('ジオコーディング実行', { address: address });
            // 実際のプロジェクトでは外部APIを呼び出しますが、ここではモックデータを返します
            if (address.includes('福岡')) {
                return [2 /*return*/, {
                        lat: 33.5898,
                        lng: 130.3986,
                        formatted_address: address
                    }];
            }
            else if (address.includes('東京')) {
                return [2 /*return*/, {
                        lat: 35.6764,
                        lng: 139.6500,
                        formatted_address: address
                    }];
            }
            else if (address.includes('大阪')) {
                return [2 /*return*/, {
                        lat: 34.6937,
                        lng: 135.5022,
                        formatted_address: address
                    }];
            }
            else if (address.includes('名古屋')) {
                return [2 /*return*/, {
                        lat: 35.1815,
                        lng: 136.9064,
                        formatted_address: address
                    }];
            }
            else if (address.includes('札幌')) {
                return [2 /*return*/, {
                        lat: 43.0618,
                        lng: 141.3545,
                        formatted_address: address
                    }];
            }
            else {
                lat = 35 + Math.random() * 10 - 5;
                lng = 135 + Math.random() * 10 - 5;
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: address
                    }];
            }
        }
        catch (error) {
            utils_1.logger.error('ジオコーディングエラー', { error: error, address: address });
            throw error;
        }
        return [2 /*return*/];
    });
}); };
exports.getGeocode = getGeocode;
/**
 * 緯度経度から住所情報を取得
 * @param lat 緯度
 * @param lng 経度
 * @returns 住所情報
 */
var getReverseGeocode = function (lat, lng) { return __awaiter(void 0, void 0, void 0, function () {
    var prefecture, city, address;
    return __generator(this, function (_a) {
        try {
            utils_1.logger.debug('逆ジオコーディング実行', { lat: lat, lng: lng });
            // 実際のプロジェクトでは外部APIを呼び出しますが、ここではモックデータを返します
            // 一定の範囲に特定の地域が存在すると想定したモックマッピング
            // 福岡近辺
            if (lat >= 33.5 && lat <= 33.7 && lng >= 130.3 && lng <= 130.5) {
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: "\u798F\u5CA1\u770C\u798F\u5CA1\u5E02\u4E2D\u592E\u533A\u5929\u795E".concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1)
                    }];
            }
            // 東京近辺
            else if (lat >= 35.6 && lat <= 35.8 && lng >= 139.5 && lng <= 139.8) {
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: "\u6771\u4EAC\u90FD\u5343\u4EE3\u7530\u533A\u4E38\u306E\u5185".concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1)
                    }];
            }
            // 大阪近辺
            else if (lat >= 34.6 && lat <= 34.8 && lng >= 135.4 && lng <= 135.6) {
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: "\u5927\u962A\u5E9C\u5927\u962A\u5E02\u5317\u533A\u6885\u7530".concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1)
                    }];
            }
            // 名古屋近辺
            else if (lat >= 35.1 && lat <= 35.3 && lng >= 136.8 && lng <= 137.0) {
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: "\u611B\u77E5\u770C\u540D\u53E4\u5C4B\u5E02\u4E2D\u533A\u6804".concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1)
                    }];
            }
            // 札幌近辺
            else if (lat >= 43.0 && lat <= 43.2 && lng >= 141.2 && lng <= 141.4) {
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: "\u5317\u6D77\u9053\u672D\u5E4C\u5E02\u4E2D\u592E\u533A\u5927\u901A\u897F".concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1)
                    }];
            }
            // 上記以外の場所
            else {
                prefecture = ['東京都', '神奈川県', '埼玉県', '千葉県', '茨城県', '栃木県', '群馬県', '静岡県'][Math.floor(Math.random() * 8)];
                city = ['中央区', '北区', '南区', '東区', '西区'][Math.floor(Math.random() * 5)];
                address = "".concat(prefecture).concat(city, "\u4E0D\u660E\u753A").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1, "-").concat(Math.floor(Math.random() * 10) + 1);
                return [2 /*return*/, {
                        lat: lat,
                        lng: lng,
                        formatted_address: address
                    }];
            }
        }
        catch (error) {
            utils_1.logger.error('逆ジオコーディングエラー', { error: error, lat: lat, lng: lng });
            throw error;
        }
        return [2 /*return*/];
    });
}); };
exports.getReverseGeocode = getReverseGeocode;
