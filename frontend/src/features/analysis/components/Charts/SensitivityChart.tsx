import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { ProfitabilityResult } from 'shared';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend
);

interface SensitivityChartProps {
  profitability: ProfitabilityResult;
  type: 'irr' | 'noi' | 'npv';
}

type SensitivityData = {
  constructionCost: { low: number; base: number; high: number };
  rent: { low: number; base: number; high: number };
};

// 実際のAPIでは取得できないため、仮想的なデータを生成
const generateSensitivityData = (
  profitability: ProfitabilityResult,
  type: 'irr' | 'noi' | 'npv'
): SensitivityData => {
  // IRRの場合の感度分析データ（例）
  if (type === 'irr') {
    const baseValue = profitability.irr;
    return {
      constructionCost: {
        low: baseValue + 0.7, // 建設費-10%
        base: baseValue,     // 基本ケース
        high: baseValue - 0.7, // 建設費+10%
      },
      rent: {
        low: baseValue - 0.7, // 賃料-10%
        base: baseValue,     // 基本ケース
        high: baseValue + 0.7, // 賃料+10%
      }
    };
  }
  
  // NOIの場合の感度分析データ（例）
  if (type === 'noi') {
    const baseValue = profitability.noiYield;
    return {
      constructionCost: {
        low: baseValue + 0.3, // 建設費-10%
        base: baseValue,     // 基本ケース
        high: baseValue - 0.3, // 建設費+10%
      },
      rent: {
        low: baseValue - 0.3, // 賃料-10%
        base: baseValue,     // 基本ケース
        high: baseValue + 0.3, // 賃料+10%
      }
    };
  }
  
  // NPVの場合の感度分析データ（例）
  const baseValue = profitability.npv / 1000000; // 百万円単位
  return {
    constructionCost: {
      low: baseValue + 15, // 建設費-10%
      base: baseValue,     // 基本ケース
      high: baseValue - 15, // 建設費+10%
    },
    rent: {
      low: baseValue - 15, // 賃料-10%
      base: baseValue,     // 基本ケース
      high: baseValue + 15, // 賃料+10%
    }
  };
};

const SensitivityChart: React.FC<SensitivityChartProps> = ({ profitability, type }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  const errorColor = theme.palette.error.main;
  
  // 感度分析データの生成
  const sensitivityData = generateSensitivityData(profitability, type);
  
  // ChartJSで使用するデータの準備
  const labels = ['賃料-10%', '賃料-5%', '基本ケース', '賃料+5%', '賃料+10%'];
  
  // 賃料変動に応じて各データポイントを計算（線形補間）
  const calculateValue = (low: number, base: number, high: number, step: number) => {
    if (step < 0) {
      // 賃料が減少する場合
      return base + (step / -10) * (base - low);
    } else if (step > 0) {
      // 賃料が増加する場合
      return base + (step / 10) * (high - base);
    }
    return base; // 基本ケース
  };
  
  // 建設費+10%のデータセット
  const constructionHighData = [
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -10) - 0.7,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -5) - 0.7,
    sensitivityData.constructionCost.high,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 5) - 0.7,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 10) - 0.7,
  ];
  
  // 建設費±0%のデータセット（基本ケース）
  const constructionBaseData = [
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -10),
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -5),
    sensitivityData.constructionCost.base,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 5),
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 10),
  ];
  
  // 建設費-10%のデータセット
  const constructionLowData = [
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -10) + 0.7,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, -5) + 0.7,
    sensitivityData.constructionCost.low,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 5) + 0.7,
    calculateValue(sensitivityData.rent.low, sensitivityData.rent.base, sensitivityData.rent.high, 10) + 0.7,
  ];
  
  const data = {
    labels,
    datasets: [
      {
        label: '建設費+10%',
        data: constructionHighData,
        backgroundColor: `${errorColor}80`,
        borderColor: errorColor,
        borderWidth: 1,
      },
      {
        label: '建設費±0%',
        data: constructionBaseData,
        backgroundColor: `${primaryColor}80`,
        borderColor: primaryColor,
        borderWidth: 1,
      },
      {
        label: '建設費-10%',
        data: constructionLowData,
        backgroundColor: `${secondaryColor}80`,
        borderColor: secondaryColor,
        borderWidth: 1,
      }
    ]
  };
  
  const getChartTitle = () => {
    switch (type) {
      case 'irr':
        return 'IRR感度分析（賃料と建設費の変動による影響）';
      case 'noi':
        return 'NOI利回り感度分析（賃料と建設費の変動による影響）';
      case 'npv':
        return 'NPV感度分析（賃料と建設費の変動による影響）';
      default:
        return '感度分析';
    }
  };
  
  const getYAxisLabel = () => {
    switch (type) {
      case 'irr':
        return 'IRR (%)';
      case 'noi':
        return 'NOI利回り (%)';
      case 'npv':
        return 'NPV (百万円)';
      default:
        return '値';
    }
  };
  
  const getTooltipLabel = (value: number) => {
    switch (type) {
      case 'irr':
      case 'noi':
        return `${value.toFixed(1)}%`;
      case 'npv':
        return `${value.toFixed(1)}百万円`;
      default:
        return `${value}`;
    }
  };
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: getChartTitle(),
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${getTooltipLabel(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '賃料変動'
        }
      },
      y: {
        title: {
          display: true,
          text: getYAxisLabel()
        },
        // Y軸の範囲を適切に設定
        ...(type === 'npv' ? {} : { min: 0 })
      },
    },
  };
  
  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Bar options={options} data={data} />
    </Box>
  );
};

export default SensitivityChart;