/**
 * レポート生成ルート定義
 */
import { Router } from 'express';
import { ReportController } from './report.controller';
import { 
  validateReportRequest,
  validateVolumeCheckReportId,
  validateProfitabilityReportId
} from './report.validator';
import { authRequired, validateWithJoi } from '../../../common/middlewares';

// ルーターの作成
const router = Router();

// レポート生成関連のルート
router.post(
  '/',
  authRequired,
  validateWithJoi(validateReportRequest),
  ReportController.generateReport
);

router.get(
  '/volume-check/:volumeCheckId',
  authRequired,
  validateWithJoi(validateVolumeCheckReportId),
  ReportController.generateVolumeCheckReport
);

router.get(
  '/profitability/:profitabilityId',
  authRequired,
  validateWithJoi(validateProfitabilityReportId),
  ReportController.generateProfitabilityReport
);

export default router;