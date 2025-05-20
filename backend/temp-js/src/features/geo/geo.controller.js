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
var express_validator_1 = require("express-validator");
var geoService = require("./geo.service");
var response_1 = require("../../common/utils/response");
var utils_1 = require("../../common/utils");
/**
 * 住所から緯度経度情報を取得
 * GET /api/v1/geocode
 */
var getGeocode = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, address, geoLocation, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                address = ((_a = req.query.address) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                return [4 /*yield*/, geoService.getGeocode(address)];
            case 1:
                geoLocation = _b.sent();
                if (!geoLocation) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された住所の位置情報が見つかりません')];
                }
                return [2 /*return*/, (0, response_1.sendSuccess)(res, geoLocation)];
            case 2:
                error_1 = _b.sent();
                utils_1.logger.error('ジオコーディングエラー', { error: error_1, address: req.query.address });
                return [2 /*return*/, (0, response_1.sendError)(res, 'ジオコーディングに失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getGeocode = getGeocode;
/**
 * 緯度経度から住所情報を取得
 * GET /api/v1/geocode/reverse
 */
var getReverseGeocode = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var errors, errorDetails, lat, lng, geoLocation, error_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                errors = (0, express_validator_1.validationResult)(req);
                if (!errors.isEmpty()) {
                    errorDetails = errors.array().reduce(function (acc, error) {
                        acc[error.path] = error.msg;
                        return acc;
                    }, {});
                    return [2 /*return*/, (0, response_1.sendValidationError)(res, errorDetails)];
                }
                lat = parseFloat(((_a = req.query.lat) === null || _a === void 0 ? void 0 : _a.toString()) || '0');
                lng = parseFloat(((_b = req.query.lng) === null || _b === void 0 ? void 0 : _b.toString()) || '0');
                return [4 /*yield*/, geoService.getReverseGeocode(lat, lng)];
            case 1:
                geoLocation = _c.sent();
                if (!geoLocation) {
                    return [2 /*return*/, (0, response_1.sendNotFoundError)(res, '指定された緯度経度の住所情報が見つかりません')];
                }
                return [2 /*return*/, (0, response_1.sendSuccess)(res, geoLocation)];
            case 2:
                error_2 = _c.sent();
                utils_1.logger.error('逆ジオコーディングエラー', { error: error_2, lat: req.query.lat, lng: req.query.lng });
                return [2 /*return*/, (0, response_1.sendError)(res, '逆ジオコーディングに失敗しました', 'SERVER_ERROR', 500)];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getReverseGeocode = getReverseGeocode;
