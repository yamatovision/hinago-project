/**
 * レポート生成サービスのユニットテスト
 */
import { ReportService } from '../../../../src/features/analysis/report/report.service';
import { ReportType, ReportFormat } from '../../../../src/types';
import fs from 'fs';
import path from 'path';

// モック
jest.mock('../../../../src/features/analysis/analysis.service', () => ({
  VolumeCheckService: {
    getVolumeCheckById: jest.fn(),
  },
  ProfitabilityService: {
    getProfitabilityById: jest.fn(),
  }
}));

jest.mock('../../../../src/db/models/Property', () => ({
  findById: jest.fn(),
}));

jest.mock('pdfmake', () => {
  return function() {
    return {
      createPdfKitDocument: jest.fn().mockImplementation(() => ({
        pipe: jest.fn().mockReturnThis(),
        end: jest.fn()
      }))
    };
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, callback) => {
      if (event === 'finish') {
        callback();
      }
      return {
        on: jest.fn()
      };
    })
  }))
}));

describe('ReportService', () => {
  // モックのリセット
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('validateReportParams', () => {
    it('ボリュームチェックレポートにはvolumeCheckIdが必須', async () => {
      // 非公開メソッドをテストするため、any型でキャスト
      const validateMethod = (ReportService as any).validateReportParams;
      
      expect(() => {
        validateMethod({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF
        });
      }).toThrow('ボリュームチェックレポートにはvolumeCheckIdが必須です');
    });
    
    it('収益性試算レポートにはprofitabilityIdが必須', async () => {
      const validateMethod = (ReportService as any).validateReportParams;
      
      expect(() => {
        validateMethod({
          type: ReportType.PROFITABILITY,
          format: ReportFormat.PDF
        });
      }).toThrow('収益性試算レポートにはprofitabilityIdが必須です');
    });
    
    it('CSV形式は現在サポートされていない', async () => {
      const validateMethod = (ReportService as any).validateReportParams;
      
      expect(() => {
        validateMethod({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.CSV,
          volumeCheckId: '123'
        });
      }).toThrow('CSV形式は現在サポートされていません');
    });
    
    it('有効なパラメータでは例外を投げない', async () => {
      const validateMethod = (ReportService as any).validateReportParams;
      
      expect(() => {
        validateMethod({
          type: ReportType.VOLUME_CHECK,
          format: ReportFormat.PDF,
          volumeCheckId: '123'
        });
      }).not.toThrow();
      
      expect(() => {
        validateMethod({
          type: ReportType.PROFITABILITY,
          format: ReportFormat.PDF,
          profitabilityId: '123'
        });
      }).not.toThrow();
      
      expect(() => {
        validateMethod({
          type: ReportType.COMBINED,
          format: ReportFormat.PDF,
          volumeCheckId: '123',
          profitabilityId: '123'
        });
      }).not.toThrow();
    });
  });
});