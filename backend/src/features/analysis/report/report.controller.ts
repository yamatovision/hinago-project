/**
 * レポート生成コントローラー
 */
import { Request, Response, NextFunction } from 'express';
import { AuthRequest, ReportType, ReportFormat } from '../../../types';
import { ReportService } from './report.service';
import { logger } from '../../../common/utils';
import { sendSuccess, sendError, sendNotFoundError } from '../../../common/utils/response';

/**
 * レポートコントローラークラス
 */
export class ReportController {
  /**
   * レポート生成
   * POST /api/v1/analysis/report
   */
  static async generateReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, format, volumeCheckId, profitabilityId, includeCharts, template, language } = req.body;
      const userId = req.user?.id;
      
      // レポート生成
      const result = await ReportService.generateReport({
        type,
        format: format || ReportFormat.PDF,
        volumeCheckId,
        profitabilityId,
        includeCharts: includeCharts !== false, // デフォルトはtrue
        template,
        language: language || 'ja'
      }, userId);
      
      // 成功レスポンス
      sendSuccess(res, result, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('レポート生成エラー', { error, body: req.body });
      
      // 適切なエラーレスポンス
      if (error.message.includes('必須です')) {
        sendError(res, error.message, 'VALIDATION_ERROR', 400);
      } else if (error.message.includes('見つかりません')) {
        sendNotFoundError(res, error.message);
      } else if (error.message.includes('サポートされていません')) {
        sendError(res, error.message, 'NOT_SUPPORTED', 400);
      } else {
        next(error);
      }
    }
  }
  
  /**
   * ボリュームチェックレポート生成
   * GET /api/v1/analysis/report/volume-check/:volumeCheckId
   */
  static async generateVolumeCheckReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { volumeCheckId } = req.params;
      const { format, includeCharts, language } = req.query;
      const userId = req.user?.id;
      
      // クエリパラメータの処理
      const reportFormat = format === 'csv' ? ReportFormat.CSV : ReportFormat.PDF;
      const charts = includeCharts === 'false' ? false : true;
      const lang = typeof language === 'string' ? language : 'ja';
      
      // レポート生成
      const result = await ReportService.generateVolumeCheckReport(
        volumeCheckId,
        reportFormat,
        charts,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, result, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('ボリュームチェックレポート生成エラー', { 
        error,
        volumeCheckId: req.params.volumeCheckId,
        query: req.query
      });
      
      // 適切なエラーレスポンス
      if (error.message.includes('見つかりません')) {
        sendNotFoundError(res, error.message);
      } else if (error.message.includes('サポートされていません')) {
        sendError(res, error.message, 'NOT_SUPPORTED', 400);
      } else {
        next(error);
      }
    }
  }
  
  /**
   * 収益性試算レポート生成
   * GET /api/v1/analysis/report/profitability/:profitabilityId
   */
  static async generateProfitabilityReport(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { profitabilityId } = req.params;
      const { format, includeCharts, language } = req.query;
      const userId = req.user?.id;
      
      // クエリパラメータの処理
      const reportFormat = format === 'csv' ? ReportFormat.CSV : ReportFormat.PDF;
      const charts = includeCharts === 'false' ? false : true;
      const lang = typeof language === 'string' ? language : 'ja';
      
      // レポート生成
      const result = await ReportService.generateProfitabilityReport(
        profitabilityId,
        reportFormat,
        charts,
        userId
      );
      
      // 成功レスポンス
      sendSuccess(res, result, 201);
    } catch (error: any) {
      // エラーログ
      logger.error('収益性試算レポート生成エラー', { 
        error,
        profitabilityId: req.params.profitabilityId,
        query: req.query
      });
      
      // 適切なエラーレスポンス
      if (error.message.includes('見つかりません')) {
        sendNotFoundError(res, error.message);
      } else if (error.message.includes('サポートされていません')) {
        sendError(res, error.message, 'NOT_SUPPORTED', 400);
      } else {
        next(error);
      }
    }
  }
}