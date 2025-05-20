/**
 * レポート生成バリデーション
 */
import Joi from 'joi';
import { Request } from 'express';
import { ReportType, ReportFormat, VALIDATION_RULES } from '../../../types';

/**
 * レポート生成リクエストのバリデーション
 */
export const validateReportRequest = (req: Request) => {
  const schema = Joi.object({
    type: Joi.string()
      .valid(...Object.values(ReportType))
      .required()
      .messages({
        'any.required': 'レポートタイプは必須です',
        'any.only': '無効なレポートタイプです'
      }),
    format: Joi.string()
      .valid(...Object.values(ReportFormat))
      .default(ReportFormat.PDF)
      .messages({
        'any.only': '無効なレポート形式です'
      }),
    volumeCheckId: Joi.string()
      .when('type', {
        is: Joi.valid(ReportType.VOLUME_CHECK, ReportType.COMBINED),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.required': 'ボリュームチェックIDは必須です'
      }),
    profitabilityId: Joi.string()
      .when('type', {
        is: Joi.valid(ReportType.PROFITABILITY, ReportType.COMBINED),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'any.required': '収益性試算IDは必須です'
      }),
    includeCharts: Joi.boolean()
      .default(true),
    template: Joi.string()
      .optional(),
    language: Joi.string()
      .valid('ja', 'en')
      .default('ja')
      .messages({
        'any.only': '対応していない言語です'
      })
  });

  return schema.validate(req.body, { abortEarly: false });
};

/**
 * ボリュームチェックIDのバリデーション
 */
export const validateVolumeCheckReportId = (req: Request) => {
  const schema = Joi.object({
    volumeCheckId: Joi.string()
      .required()
      .messages({
        'any.required': 'ボリュームチェックIDは必須です',
        'string.empty': 'ボリュームチェックIDは必須です'
      })
  });

  return schema.validate(req.params, { abortEarly: false });
};

/**
 * 収益性試算IDのバリデーション
 */
export const validateProfitabilityReportId = (req: Request) => {
  const schema = Joi.object({
    profitabilityId: Joi.string()
      .required()
      .messages({
        'any.required': '収益性試算IDは必須です',
        'string.empty': '収益性試算IDは必須です'
      })
  });

  return schema.validate(req.params, { abortEarly: false });
};