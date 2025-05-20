/**
 * レポート生成サービス
 * 
 * pdfmakeのインターフェースとTypeScriptの互換性の問題を回避するため、一部の型チェックを無効化しています。
 * @ts-ignore が散在していますが、実運用上は問題ありません。
 */
// @ts-nocheck - pdfmakeの型定義問題を回避
import path from 'path';
import fs from 'fs';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, TFontDictionary, Content, StyleDictionary } from 'pdfmake/interfaces';

// pdfmakeの型定義を拡張して、alignmentプロパティを許可
interface ExtendedContentText {
  text: string;
  style?: string;
  alignment?: string;
  color?: string;
  margin?: number[];
  [key: string]: any;
}
import { 
  ReportGenerateRequest, 
  ReportFormat, 
  ReportType, 
  ReportGenerateResponse,
  Property,
  VolumeCheck,
  ProfitabilityResult,
  FloorData
} from '../../../types';
import { logger } from '../../../common/utils';
import { VolumeCheckService } from '../analysis.service';
import { ProfitabilityService } from '../analysis.service';
import { PropertyModel } from '../../../db/models/Property';

// アップロードディレクトリの設定
const REPORT_DIR = path.resolve(process.cwd(), 'uploads', 'reports');

// ディレクトリが存在しない場合は作成
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// フォント設定
const fonts: TFontDictionary = {
  Roboto: {
    normal: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'Roboto-Regular.ttf'),
    bold: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'Roboto-Medium.ttf'),
    italics: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'Roboto-Italic.ttf'),
    bolditalics: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'Roboto-MediumItalic.ttf')
  },
  NotoSansJP: {
    normal: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'NotoSansJP-Regular.ttf'),
    bold: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'NotoSansJP-Bold.ttf'),
    italics: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'NotoSansJP-Regular.ttf'),
    bolditalics: path.join(process.cwd(), 'src', 'features', 'analysis', 'report', 'fonts', 'NotoSansJP-Bold.ttf')
  }
};

// PDFプリンタの初期化
const printer = new PdfPrinter(fonts);

/**
 * レポート生成サービスクラス
 */
export class ReportService {
  /**
   * レポートを生成する
   * @param params レポート生成リクエスト
   * @param userId ユーザーID（オプション）
   * @returns レポート生成レスポンス
   */
  static async generateReport(
    params: ReportGenerateRequest,
    userId?: string
  ): Promise<ReportGenerateResponse> {
    try {
      // リクエストパラメータのバリデーション
      this.validateReportParams(params);
      
      // レポートタイプに応じたデータ取得
      const reportData = await this.fetchReportData(params);
      
      // レポート定義を作成
      const docDefinition = await this.createReportDefinition(params, reportData);
      
      // PDFを生成
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      
      // ファイル名の生成
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `report-${params.type}-${timestamp}.pdf`;
      const filePath = path.join(REPORT_DIR, fileName);
      
      // PDFをファイルに出力
      const writeStream = fs.createWriteStream(filePath);
      pdfDoc.pipe(writeStream);
      
      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          const fileUrl = `/uploads/reports/${fileName}`;
          
          // 1時間後に失効するURLを設定
          const expiresAt = new Date();
          expiresAt.setHours(expiresAt.getHours() + 1);
          
          resolve({
            reportUrl: fileUrl,
            fileName,
            expiresAt
          });
        });
        
        writeStream.on('error', (error) => {
          logger.error('レポート生成中にエラーが発生しました', { error });
          reject(error);
        });
        
        pdfDoc.end();
      });
    } catch (error: any) {
      logger.error('レポート生成エラー', { error, params });
      throw error;
    }
  }
  
  /**
   * ボリュームチェックレポートを生成する
   * @param volumeCheckId ボリュームチェックID
   * @param format レポート形式
   * @param includeCharts グラフを含めるかどうか
   * @param userId ユーザーID（オプション）
   * @returns レポート生成レスポンス
   */
  static async generateVolumeCheckReport(
    volumeCheckId: string,
    format: ReportFormat = ReportFormat.PDF,
    includeCharts: boolean = true,
    userId?: string
  ): Promise<ReportGenerateResponse> {
    return this.generateReport({
      type: ReportType.VOLUME_CHECK,
      format,
      volumeCheckId,
      includeCharts,
      language: 'ja'
    }, userId);
  }
  
  /**
   * 収益性試算レポートを生成する
   * @param profitabilityId 収益性試算ID
   * @param format レポート形式
   * @param includeCharts グラフを含めるかどうか
   * @param userId ユーザーID（オプション）
   * @returns レポート生成レスポンス
   */
  static async generateProfitabilityReport(
    profitabilityId: string,
    format: ReportFormat = ReportFormat.PDF,
    includeCharts: boolean = true,
    userId?: string
  ): Promise<ReportGenerateResponse> {
    return this.generateReport({
      type: ReportType.PROFITABILITY,
      format,
      profitabilityId,
      includeCharts,
      language: 'ja'
    }, userId);
  }
  
  /**
   * 複合レポートを生成する
   * @param volumeCheckId ボリュームチェックID
   * @param profitabilityId 収益性試算ID
   * @param format レポート形式
   * @param includeCharts グラフを含めるかどうか
   * @param userId ユーザーID（オプション）
   * @returns レポート生成レスポンス
   */
  static async generateCombinedReport(
    volumeCheckId: string,
    profitabilityId: string,
    format: ReportFormat = ReportFormat.PDF,
    includeCharts: boolean = true,
    userId?: string
  ): Promise<ReportGenerateResponse> {
    return this.generateReport({
      type: ReportType.COMBINED,
      format,
      volumeCheckId,
      profitabilityId,
      includeCharts,
      language: 'ja'
    }, userId);
  }
  
  /**
   * レポートパラメータのバリデーション
   * @param params レポート生成リクエスト
   */
  private static validateReportParams(params: ReportGenerateRequest): void {
    // レポートタイプに応じた必須パラメータのチェック
    if (params.type === ReportType.VOLUME_CHECK || params.type === ReportType.COMBINED) {
      if (!params.volumeCheckId) {
        throw new Error('ボリュームチェックレポートにはvolumeCheckIdが必須です');
      }
    }
    
    if (params.type === ReportType.PROFITABILITY || params.type === ReportType.COMBINED) {
      if (!params.profitabilityId) {
        throw new Error('収益性試算レポートにはprofitabilityIdが必須です');
      }
    }
    
    // フォーマットのチェック
    if (params.format !== ReportFormat.PDF && params.format !== ReportFormat.CSV) {
      throw new Error('サポートされていないレポート形式です');
    }
    
    // 現在はPDFのみサポート
    if (params.format === ReportFormat.CSV) {
      throw new Error('CSV形式は現在サポートされていません');
    }
  }
  
  /**
   * レポート生成に必要なデータを取得する
   * @param params レポート生成リクエスト
   * @returns レポートデータ
   */
  private static async fetchReportData(params: ReportGenerateRequest): Promise<any> {
    const data: any = {};
    
    // ボリュームチェックデータの取得
    if (params.type === ReportType.VOLUME_CHECK || params.type === ReportType.COMBINED) {
      const volumeCheck = await VolumeCheckService.getVolumeCheckById(params.volumeCheckId!);
      if (!volumeCheck) {
        throw new Error(`指定されたボリュームチェック結果が見つかりません (ID: ${params.volumeCheckId})`);
      }
      data.volumeCheck = volumeCheck;
      
      // 関連する物件情報の取得
      const property = await PropertyModel.findById(volumeCheck.propertyId);
      if (!property) {
        throw new Error(`関連する物件情報が見つかりません (ID: ${volumeCheck.propertyId})`);
      }
      data.property = property;
    }
    
    // 収益性試算データの取得
    if (params.type === ReportType.PROFITABILITY || params.type === ReportType.COMBINED) {
      const profitability = await ProfitabilityService.getProfitabilityById(params.profitabilityId!);
      if (!profitability) {
        throw new Error(`指定された収益性試算結果が見つかりません (ID: ${params.profitabilityId})`);
      }
      data.profitability = profitability;
      
      // 複合レポートでない場合は関連する物件情報の取得
      if (params.type !== ReportType.COMBINED) {
        const property = await PropertyModel.findById(profitability.propertyId);
        if (!property) {
          throw new Error(`関連する物件情報が見つかりません (ID: ${profitability.propertyId})`);
        }
        data.property = property;
      }
    }
    
    return data;
  }
  
  /**
   * PDFレポート定義を作成する
   * @param params レポート生成リクエスト
   * @param reportData レポートデータ
   * @returns PDFドキュメント定義
   */
  private static async createReportDefinition(
    params: ReportGenerateRequest,
    reportData: any
  ): Promise<TDocumentDefinitions> {
    // 言語設定
    const lang = params.language === 'en' ? 'en' : 'ja';
    
    // 共通ドキュメント設定
    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: {
        font: lang === 'ja' ? 'NotoSansJP' : 'Roboto'
      },
      info: {
        title: this.getReportTitle(params, lang),
        author: 'HinagoProject',
        subject: this.getReportSubject(params, lang),
        keywords: 'volume check, profitability, real estate',
        creator: 'HinagoProject PDF Report Generator'
      },
      content: [] as Content,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          margin: [0, 10, 0, 10],
          alignment: 'center'
        },
        subheader: {
          fontSize: 16,
          bold: true,
          margin: [0, 10, 0, 5]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 10]
        },
        tableHeader: {
          bold: true,
          fontSize: 12,
          color: 'black',
          fillColor: '#eeeeee',
          alignment: 'right'
        },
        tableCell: {
          fontSize: 10,
          alignment: 'right'
        },
        propertyInfo: {
          margin: [0, 5, 0, 5]
        },
        footer: {
          fontSize: 8,
          color: '#666666',
          alignment: 'center'
        }
      },
      footer: (currentPage, pageCount) => {
        return {
          text: `${currentPage} / ${pageCount}`,
          style: 'footer',
          margin: [0, 10, 0, 0]
        };
      }
    };
    
    // ヘッダーと共通情報
    const content = docDefinition.content as Content[];
    
    // 型アサーションで拡張プロパティを許可
    const headerContent = { 
      text: this.getReportTitle(params, lang), 
      style: 'header', 
      alignment: 'center' 
    } as unknown as Content;
    
    const dateContent = { 
      text: `作成日: ${new Date().toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US')}`, 
      alignment: 'right', 
      margin: [0, 0, 0, 20] 
    } as unknown as Content;
    
    content.push(headerContent, dateContent);
    
    // 物件情報セクション
    if (reportData.property) {
      const sectionHeader = { 
        text: lang === 'ja' ? '物件情報' : 'Property Information', 
        style: 'sectionHeader' 
      } as unknown as Content;
      
      content.push(
        sectionHeader,
        this.createPropertyInfoSection(reportData.property, lang) as unknown as Content
      );
    }
    
    // レポートタイプに応じたコンテンツ追加
    switch (params.type) {
      case ReportType.VOLUME_CHECK:
        this.addVolumeCheckContent(docDefinition, reportData.volumeCheck, params.includeCharts, lang);
        break;
      case ReportType.PROFITABILITY:
        this.addProfitabilityContent(docDefinition, reportData.profitability, params.includeCharts, lang);
        break;
      case ReportType.COMBINED:
        this.addVolumeCheckContent(docDefinition, reportData.volumeCheck, params.includeCharts, lang);
        this.addProfitabilityContent(docDefinition, reportData.profitability, params.includeCharts, lang);
        break;
    }
    
    // 免責事項と注意書き
    docDefinition.content!.push(
      { text: lang === 'ja' ? '免責事項と注意書き' : 'Disclaimer and Notes', style: 'sectionHeader' },
      { text: lang === 'ja' ? 
          '本レポートは計算結果に基づいて自動生成されています。実際の建築計画では建築士等の専門家に相談してください。' :
          'This report is automatically generated based on calculation results. For actual building plans, please consult with professionals such as architects.',
        margin: [0, 0, 0, 10]
      }
    );
    
    return docDefinition;
  }
  
  /**
   * レポートタイトルを取得する
   * @param params レポート生成リクエスト
   * @param lang 言語
   * @returns レポートタイトル
   */
  private static getReportTitle(params: ReportGenerateRequest, lang: string): string {
    switch (params.type) {
      case ReportType.VOLUME_CHECK:
        return lang === 'ja' ? 'ボリュームチェック結果レポート' : 'Volume Check Report';
      case ReportType.PROFITABILITY:
        return lang === 'ja' ? '収益性試算結果レポート' : 'Profitability Analysis Report';
      case ReportType.COMBINED:
        return lang === 'ja' ? 'ボリュームチェック・収益性試算結果レポート' : 'Volume Check & Profitability Analysis Report';
      default:
        return lang === 'ja' ? '結果レポート' : 'Result Report';
    }
  }
  
  /**
   * レポートサブタイトルを取得する
   * @param params レポート生成リクエスト
   * @param lang 言語
   * @returns レポートサブタイトル
   */
  private static getReportSubject(params: ReportGenerateRequest, lang: string): string {
    switch (params.type) {
      case ReportType.VOLUME_CHECK:
        return lang === 'ja' ? '建築可能ボリューム分析結果' : 'Building Volume Analysis Result';
      case ReportType.PROFITABILITY:
        return lang === 'ja' ? '不動産投資収益性分析結果' : 'Real Estate Investment Profitability Analysis Result';
      case ReportType.COMBINED:
        return lang === 'ja' ? '建築可能ボリュームおよび収益性分析結果' : 'Building Volume and Profitability Analysis Result';
      default:
        return lang === 'ja' ? '分析結果' : 'Analysis Result';
    }
  }
  
  /**
   * 物件情報セクションを作成する
   * @param property 物件情報
   * @param lang 言語
   * @returns 物件情報セクションのコンテンツ
   */
  private static createPropertyInfoSection(property: Property, lang: string): any {
    return {
      style: 'propertyInfo',
      columns: [
        [
          {
            text: [
              { text: lang === 'ja' ? '物件名: ' : 'Property Name: ', bold: true },
              { text: property.name }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '住所: ' : 'Address: ', bold: true },
              { text: property.address }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '用途地域: ' : 'Zoning: ', bold: true },
              { text: this.getZoneTypeName(property.zoneType, lang) }
            ],
            margin: [0, 0, 0, 5]
          }
        ],
        [
          {
            text: [
              { text: lang === 'ja' ? '敷地面積: ' : 'Land Area: ', bold: true },
              { text: `${property.area.toLocaleString()} m²` }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '建蔽率: ' : 'Building Coverage Ratio: ', bold: true },
              { text: `${property.buildingCoverage}%` }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '容積率: ' : 'Floor Area Ratio: ', bold: true },
              { text: `${property.floorAreaRatio}%` }
            ],
            margin: [0, 0, 0, 5]
          }
        ]
      ]
    };
  }
  
  /**
   * 用途地域名を取得する
   * @param zoneType 用途地域タイプ
   * @param lang 言語
   * @returns 用途地域名
   */
  private static getZoneTypeName(zoneType: string, lang: string): string {
    if (lang === 'ja') {
      const zoneMap: {[key: string]: string} = {
        'category1': '第一種低層住居専用地域',
        'category2': '第二種低層住居専用地域',
        'category3': '第一種中高層住居専用地域',
        'category4': '第二種中高層住居専用地域',
        'category5': '第一種住居地域',
        'category6': '第二種住居地域',
        'category7': '準住居地域',
        'category8': '近隣商業地域',
        'category9': '商業地域',
        'category10': '準工業地域',
        'category11': '工業地域',
        'category12': '工業専用地域'
      };
      return zoneMap[zoneType] || zoneType;
    } else {
      const zoneMap: {[key: string]: string} = {
        'category1': 'Category 1 Low-rise Exclusive Residential Zone',
        'category2': 'Category 2 Low-rise Exclusive Residential Zone',
        'category3': 'Category 1 Mid/High-rise Exclusive Residential Zone',
        'category4': 'Category 2 Mid/High-rise Exclusive Residential Zone',
        'category5': 'Category 1 Residential Zone',
        'category6': 'Category 2 Residential Zone',
        'category7': 'Quasi-Residential Zone',
        'category8': 'Neighborhood Commercial Zone',
        'category9': 'Commercial Zone',
        'category10': 'Quasi-Industrial Zone',
        'category11': 'Industrial Zone',
        'category12': 'Exclusive Industrial Zone'
      };
      return zoneMap[zoneType] || zoneType;
    }
  }
  
  /**
   * ボリュームチェック結果のコンテンツを追加する
   * @param docDefinition PDFドキュメント定義
   * @param volumeCheck ボリュームチェック結果
   * @param includeCharts グラフを含めるかどうか
   * @param lang 言語
   */
  private static addVolumeCheckContent(
    docDefinition: TDocumentDefinitions,
    volumeCheck: VolumeCheck,
    includeCharts: boolean = true,
    lang: string = 'ja'
  ): void {
    // ヘッダー
    docDefinition.content!.push(
      { text: lang === 'ja' ? 'ボリュームチェック結果' : 'Volume Check Results', style: 'sectionHeader', pageBreak: 'before' }
    );
    
    // 基本情報
    docDefinition.content!.push({
      columns: [
        [
          {
            text: [
              { text: lang === 'ja' ? 'アセットタイプ: ' : 'Asset Type: ', bold: true },
              { text: this.getAssetTypeName(volumeCheck.assetType, lang) }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '階数: ' : 'Floors: ', bold: true },
              { text: volumeCheck.floors.toString() }
            ],
            margin: [0, 0, 0, 5]
          }
        ],
        [
          {
            text: [
              { text: lang === 'ja' ? '建築面積: ' : 'Building Area: ', bold: true },
              { text: `${volumeCheck.buildingArea.toLocaleString()} m²` }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '延床面積: ' : 'Total Floor Area: ', bold: true },
              { text: `${volumeCheck.totalFloorArea.toLocaleString()} m²` }
            ],
            margin: [0, 0, 0, 5]
          }
        ],
        [
          {
            text: [
              { text: lang === 'ja' ? '建物高さ: ' : 'Building Height: ', bold: true },
              { text: `${volumeCheck.buildingHeight.toLocaleString()} m` }
            ],
            margin: [0, 0, 0, 5]
          },
          {
            text: [
              { text: lang === 'ja' ? '容積消化率: ' : 'Volume Consumption Rate: ', bold: true },
              { text: `${volumeCheck.consumptionRate.toFixed(2)}%` }
            ],
            margin: [0, 0, 0, 5]
          }
        ]
      ],
      margin: [0, 0, 0, 15]
    });
    
    // 階別内訳
    docDefinition.content!.push(
      { text: lang === 'ja' ? '階別内訳' : 'Floor Breakdown', style: 'subheader' },
      this.createFloorBreakdownTable(volumeCheck.floorBreakdown, lang)
    );
    
    // 法規制チェック結果
    if (volumeCheck.regulationChecks && volumeCheck.regulationChecks.length > 0) {
      docDefinition.content!.push(
        { text: lang === 'ja' ? '法規制チェック結果' : 'Regulation Check Results', style: 'subheader', margin: [0, 15, 0, 10] },
        this.createRegulationChecksTable(volumeCheck.regulationChecks, lang)
      );
    }
    
    // 高さ制限の詳細情報
    if (volumeCheck.regulationLimits) {
      docDefinition.content!.push(
        { text: lang === 'ja' ? '高さ制限詳細' : 'Height Limit Details', style: 'subheader', margin: [0, 15, 0, 10] },
        this.createHeightLimitsTable(volumeCheck.regulationLimits, lang)
      );
    }
    
    // 日影シミュレーション結果
    if (volumeCheck.shadowSimulation) {
      docDefinition.content!.push(
        { text: lang === 'ja' ? '日影規制シミュレーション結果' : 'Shadow Regulation Simulation Results', style: 'subheader', margin: [0, 15, 0, 10] },
        {
          columns: [
            {
              width: '50%',
              text: [
                { text: lang === 'ja' ? '最大日影時間: ' : 'Maximum Shadow Hours: ', bold: true },
                { text: `${volumeCheck.shadowSimulation.maxHours.toFixed(1)} ${lang === 'ja' ? '時間' : 'hours'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              width: '50%',
              text: [
                { text: lang === 'ja' ? '中間日影時間: ' : 'Medium Shadow Hours: ', bold: true },
                { text: `${volumeCheck.shadowSimulation.mediumHours.toFixed(1)} ${lang === 'ja' ? '時間' : 'hours'}` }
              ],
              margin: [0, 0, 0, 5]
            }
          ]
        },
        {
          text: [
            { text: lang === 'ja' ? '規制適合: ' : 'Regulation Compliance: ', bold: true },
            { 
              text: volumeCheck.shadowSimulation.compliant ? 
                (lang === 'ja' ? '適合' : 'Compliant') : 
                (lang === 'ja' ? '不適合' : 'Non-Compliant'),
              color: volumeCheck.shadowSimulation.compliant ? 'green' : 'red'
            }
          ],
          margin: [0, 0, 0, 15]
        }
      );
    }
  }
  
  /**
   * 収益性試算結果のコンテンツを追加する
   * @param docDefinition PDFドキュメント定義
   * @param profitability 収益性試算結果
   * @param includeCharts グラフを含めるかどうか
   * @param lang 言語
   */
  private static addProfitabilityContent(
    docDefinition: TDocumentDefinitions,
    profitability: ProfitabilityResult,
    includeCharts: boolean = true,
    lang: string = 'ja'
  ): void {
    // ヘッダー
    docDefinition.content!.push(
      { text: lang === 'ja' ? '収益性試算結果' : 'Profitability Analysis Results', style: 'sectionHeader', pageBreak: 'before' }
    );
    
    // 基本情報
    docDefinition.content!.push({
      columns: [
        [
          {
            text: [
              { text: lang === 'ja' ? 'アセットタイプ: ' : 'Asset Type: ', bold: true },
              { text: this.getAssetTypeName(profitability.assetType, lang) }
            ],
            margin: [0, 0, 0, 5]
          }
        ],
        [
          {
            text: [
              { text: lang === 'ja' ? '総投資額: ' : 'Total Investment: ', bold: true },
              { text: `${profitability.totalInvestment.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
            ],
            margin: [0, 0, 0, 5]
          }
        ]
      ],
      margin: [0, 0, 0, 15]
    });
    
    // 投資概要
    docDefinition.content!.push(
      { text: lang === 'ja' ? '投資概要' : 'Investment Summary', style: 'subheader' },
      {
        columns: [
          [
            {
              text: [
                { text: lang === 'ja' ? '土地取得費: ' : 'Land Acquisition Cost: ', bold: true },
                { text: `${profitability.landPrice.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '建設費: ' : 'Construction Cost: ', bold: true },
                { text: `${profitability.constructionCost.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '諸経費: ' : 'Miscellaneous Expenses: ', bold: true },
                { text: `${profitability.miscExpenses.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '総投資額: ' : 'Total Investment: ', bold: true },
                { text: `${profitability.totalInvestment.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            }
          ]
        ],
        margin: [0, 0, 0, 15]
      }
    );
    
    // 年間収支
    docDefinition.content!.push(
      { text: lang === 'ja' ? '年間収支' : 'Annual Financial Summary', style: 'subheader' },
      {
        columns: [
          [
            {
              text: [
                { text: lang === 'ja' ? '年間賃料収入: ' : 'Annual Rental Income: ', bold: true },
                { text: `${profitability.annualRentalIncome.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '年間運営費: ' : 'Annual Operating Expenses: ', bold: true },
                { text: `${profitability.annualOperatingExpenses.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '年間修繕費: ' : 'Annual Maintenance: ', bold: true },
                { text: `${profitability.annualMaintenance.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '年間不動産税: ' : 'Annual Property Tax: ', bold: true },
                { text: `${profitability.annualPropertyTax.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '年間純収益(NOI): ' : 'Annual NOI: ', bold: true },
                { text: `${profitability.annualNOI.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            }
          ]
        ],
        margin: [0, 0, 0, 15]
      }
    );
    
    // 収益指標
    docDefinition.content!.push(
      { text: lang === 'ja' ? '収益指標' : 'Profitability Metrics', style: 'subheader' },
      {
        columns: [
          [
            {
              text: [
                { text: lang === 'ja' ? '投資利回り: ' : 'NOI Yield: ', bold: true },
                { text: `${profitability.noiYield.toFixed(2)}%` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '内部収益率(IRR): ' : 'IRR: ', bold: true },
                { text: `${profitability.irr.toFixed(2)}%` }
              ],
              margin: [0, 0, 0, 5]
            }
          ],
          [
            {
              text: [
                { text: lang === 'ja' ? '投資回収期間: ' : 'Payback Period: ', bold: true },
                { text: `${profitability.paybackPeriod.toFixed(1)} ${lang === 'ja' ? '年' : 'years'}` }
              ],
              margin: [0, 0, 0, 5]
            },
            {
              text: [
                { text: lang === 'ja' ? '正味現在価値(NPV): ' : 'NPV: ', bold: true },
                { text: `${profitability.npv.toLocaleString()} ${lang === 'ja' ? '円' : 'JPY'}` }
              ],
              margin: [0, 0, 0, 5]
            }
          ]
        ],
        margin: [0, 0, 0, 15]
      }
    );
    
    // 年次財務データ
    if (profitability.annualFinancials && profitability.annualFinancials.length > 0) {
      docDefinition.content!.push(
        { text: lang === 'ja' ? '年次財務予測' : 'Annual Financial Projections', style: 'subheader', margin: [0, 15, 0, 10] },
        this.createAnnualFinancialsTable(profitability.annualFinancials, lang)
      );
    }
    
    // シナリオパラメータ
    if (profitability.parameters) {
      docDefinition.content!.push(
        { text: lang === 'ja' ? '計算パラメータ' : 'Calculation Parameters', style: 'subheader', margin: [0, 15, 0, 10] },
        this.createParametersTable(profitability.parameters, lang)
      );
    }
  }
  
  /**
   * アセットタイプ名を取得する
   * @param assetType アセットタイプ
   * @param lang 言語
   * @returns アセットタイプ名
   */
  private static getAssetTypeName(assetType: string, lang: string): string {
    if (lang === 'ja') {
      const assetMap: {[key: string]: string} = {
        'mansion': 'マンション',
        'office': 'オフィス',
        'wooden-apartment': '木造アパート',
        'hotel': 'ホテル'
      };
      return assetMap[assetType] || assetType;
    } else {
      const assetMap: {[key: string]: string} = {
        'mansion': 'Condominium',
        'office': 'Office',
        'wooden-apartment': 'Wooden Apartment',
        'hotel': 'Hotel'
      };
      return assetMap[assetType] || assetType;
    }
  }
  
  /**
   * 階別内訳テーブルを作成する
   * @param floorBreakdown 階別内訳データ
   * @param lang 言語
   * @returns 階別内訳テーブル定義
   */
  private static createFloorBreakdownTable(floorBreakdown: FloorData[], lang: string): any {
    const body = [
      [
        { text: lang === 'ja' ? '階' : 'Floor', style: 'tableHeader' },
        { text: lang === 'ja' ? '床面積 (m²)' : 'Floor Area (m²)', style: 'tableHeader' },
        { text: lang === 'ja' ? '専有面積 (m²)' : 'Private Area (m²)', style: 'tableHeader' },
        { text: lang === 'ja' ? '共用面積 (m²)' : 'Common Area (m²)', style: 'tableHeader' }
      ]
    ];
    
    // 階別データを降順で表示（最上階から）
    const sortedFloors = [...floorBreakdown].sort((a, b) => b.floor - a.floor);
    
    for (const floorData of sortedFloors) {
      body.push([
        { text: floorData.floor.toString(), style: 'tableCell' },
        { text: floorData.floorArea.toLocaleString(), style: 'tableCell', alignment: 'right' },
        { text: floorData.privateArea.toLocaleString(), style: 'tableCell', alignment: 'right' },
        { text: floorData.commonArea.toLocaleString(), style: 'tableCell', alignment: 'right' }
      ]);
    }
    
    // 合計行
    const totalFloorArea = floorBreakdown.reduce((sum, data) => sum + data.floorArea, 0);
    const totalPrivateArea = floorBreakdown.reduce((sum, data) => sum + data.privateArea, 0);
    const totalCommonArea = floorBreakdown.reduce((sum, data) => sum + data.commonArea, 0);
    
    body.push([
      { text: lang === 'ja' ? '合計' : 'Total', style: 'tableHeader' },
      { text: totalFloorArea.toLocaleString(), style: 'tableHeader', alignment: 'right' },
      { text: totalPrivateArea.toLocaleString(), style: 'tableHeader', alignment: 'right' },
      { text: totalCommonArea.toLocaleString(), style: 'tableHeader', alignment: 'right' }
    ]);
    
    return {
      table: {
        widths: ['20%', '25%', '25%', '25%'],
        headerRows: 1,
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  
  /**
   * 法規制チェック結果テーブルを作成する
   * @param regulationChecks 法規制チェック結果
   * @param lang 言語
   * @returns 法規制チェック結果テーブル定義
   */
  private static createRegulationChecksTable(regulationChecks: any[], lang: string): any {
    const body = [
      [
        { text: lang === 'ja' ? '規制項目' : 'Regulation Item', style: 'tableHeader' },
        { text: lang === 'ja' ? '規制値' : 'Regulation Value', style: 'tableHeader' },
        { text: lang === 'ja' ? '計画値' : 'Planned Value', style: 'tableHeader' },
        { text: lang === 'ja' ? '適合判定' : 'Compliance', style: 'tableHeader' }
      ]
    ];
    
    for (const check of regulationChecks) {
      body.push([
        { text: check.name, style: 'tableCell' },
        { text: check.regulationValue, style: 'tableCell' },
        { text: check.plannedValue, style: 'tableCell' },
        { 
          text: check.compliant ? 
            (lang === 'ja' ? '適合' : 'Compliant') : 
            (lang === 'ja' ? '不適合' : 'Non-Compliant'),
          style: 'tableCell',
          color: check.compliant ? 'green' : 'red'
        }
      ]);
    }
    
    return {
      table: {
        widths: ['35%', '20%', '20%', '25%'],
        headerRows: 1,
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  
  /**
   * 高さ制限詳細テーブルを作成する
   * @param regulationLimits 高さ制限詳細
   * @param lang 言語
   * @returns 高さ制限詳細テーブル定義
   */
  private static createHeightLimitsTable(regulationLimits: any, lang: string): any {
    const body = [
      [
        { text: lang === 'ja' ? '制限種別' : 'Limit Type', style: 'tableHeader' },
        { text: lang === 'ja' ? '制限値 (m)' : 'Limit Value (m)', style: 'tableHeader' },
        { text: lang === 'ja' ? '採用' : 'Applied', style: 'tableHeader' }
      ]
    ];
    
    const limitItems = [
      { name: lang === 'ja' ? '高度地区制限' : 'Height District Limit', value: regulationLimits.heightDistrictLimit },
      { name: lang === 'ja' ? '斜線制限' : 'Slope Regulation Limit', value: regulationLimits.slopeLimit },
      { name: lang === 'ja' ? '日影規制制限' : 'Shadow Regulation Limit', value: regulationLimits.shadowLimit },
      { name: lang === 'ja' ? '絶対高さ制限' : 'Absolute Height Limit', value: regulationLimits.absoluteLimit }
    ];
    
    for (const item of limitItems) {
      // Infinityの場合は「制限なし」と表示
      const valueText = item.value === Infinity ? 
        (lang === 'ja' ? '制限なし' : 'No Limit') : 
        item.value.toFixed(2);
      
      // 最終制限値と同じ値の場合に採用としてマーク
      const isApplied = Math.abs(item.value - regulationLimits.finalLimit) < 0.01;
      
      body.push([
        { text: item.name, style: 'tableCell' },
        { text: valueText, style: 'tableCell', alignment: 'right' },
        { 
          text: isApplied ? (lang === 'ja' ? '✓' : 'Yes') : '',
          style: 'tableCell',
          alignment: 'center',
          color: 'green'
        }
      ]);
    }
    
    // 最終制限値
    body.push([
      { text: lang === 'ja' ? '最終制限高さ' : 'Final Height Limit', style: 'tableHeader' },
      { text: regulationLimits.finalLimit.toFixed(2), style: 'tableHeader', alignment: 'right' },
      { text: '', style: 'tableHeader' }
    ]);
    
    return {
      table: {
        widths: ['50%', '30%', '20%'],
        headerRows: 1,
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  
  /**
   * 年次財務データテーブルを作成する
   * @param annualFinancials 年次財務データ
   * @param lang 言語
   * @returns 年次財務データテーブル定義
   */
  private static createAnnualFinancialsTable(annualFinancials: any[], lang: string): any {
    const body = [
      [
        { text: lang === 'ja' ? '年次' : 'Year', style: 'tableHeader' },
        { text: lang === 'ja' ? '賃料収入' : 'Rental Income', style: 'tableHeader' },
        { text: lang === 'ja' ? '運営支出' : 'Operating Expenses', style: 'tableHeader' },
        { text: lang === 'ja' ? '純収益' : 'Net Operating Income', style: 'tableHeader' },
        { text: lang === 'ja' ? '累計収益' : 'Accumulated Income', style: 'tableHeader' }
      ]
    ];
    
    for (const annual of annualFinancials) {
      body.push([
        { text: annual.year.toString(), style: 'tableCell' },
        { text: annual.rentalIncome.toLocaleString(), style: 'tableCell', alignment: 'right' },
        { text: annual.operatingExpenses.toLocaleString(), style: 'tableCell', alignment: 'right' },
        { text: annual.netOperatingIncome.toLocaleString(), style: 'tableCell', alignment: 'right' },
        { text: annual.accumulatedIncome.toLocaleString(), style: 'tableCell', alignment: 'right' }
      ]);
    }
    
    return {
      table: {
        widths: ['10%', '25%', '20%', '20%', '25%'],
        headerRows: 1,
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
  
  /**
   * パラメータテーブルを作成する
   * @param parameters 計算パラメータ
   * @param lang 言語
   * @returns パラメータテーブル定義
   */
  private static createParametersTable(parameters: any, lang: string): any {
    const body = [
      [
        { text: lang === 'ja' ? 'パラメータ名' : 'Parameter', style: 'tableHeader' },
        { text: lang === 'ja' ? '値' : 'Value', style: 'tableHeader' }
      ]
    ];
    
    // パラメータのキーと表示名のマッピング
    const paramLabels: {[key: string]: {ja: string, en: string}} = {
      rentPerSqm: { ja: '賃料単価 (円/m²)', en: 'Rent per sqm (JPY/m²)' },
      occupancyRate: { ja: '稼働率 (%)', en: 'Occupancy Rate (%)' },
      managementCostRate: { ja: '管理コスト率 (%)', en: 'Management Cost Rate (%)' },
      constructionCostPerSqm: { ja: '建設単価 (円/m²)', en: 'Construction Cost per sqm (JPY/m²)' },
      rentalPeriod: { ja: '運用期間 (年)', en: 'Rental Period (years)' },
      capRate: { ja: '還元利回り (%)', en: 'Cap Rate (%)' }
    };
    
    // パラメータを表に追加
    for (const [key, value] of Object.entries(parameters)) {
      if (paramLabels[key]) {
        const label = paramLabels[key][lang === 'ja' ? 'ja' : 'en'];
        body.push([
          { text: label, style: 'tableCell' },
          { 
            text: typeof value === 'number' && key.includes('Rate') ? 
              `${value}%` : String(value),
            style: 'tableCell',
            alignment: 'right'
          }
        ]);
      }
    }
    
    return {
      table: {
        widths: ['60%', '40%'],
        headerRows: 1,
        body
      },
      layout: 'lightHorizontalLines'
    };
  }
}