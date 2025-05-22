import React from 'react';
import { Box, useTheme } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { ProfitabilityResult } from 'shared';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

interface CashFlowChartProps {
  profitability: ProfitabilityResult;
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ profitability }) => {
  const theme = useTheme();
  const primaryColor = theme.palette.primary.main;
  const secondaryColor = theme.palette.secondary.main;
  
  // 年次データの準備
  const years = profitability.annualFinancials.map(data => `${data.year}年目`);
  
  // 年間純収益のデータ
  const annualNOIData = profitability.annualFinancials.map(data => 
    data.netOperatingIncome / 1000000 // 百万円単位に変換
  );
  
  // 累計収益のデータ
  const accumulatedIncomeData = profitability.annualFinancials.map(data => 
    data.accumulatedIncome / 1000000 // 百万円単位に変換
  );
  
  const data = {
    labels: years,
    datasets: [
      {
        type: 'bar' as const,
        label: '年間純収益',
        data: annualNOIData,
        backgroundColor: `${primaryColor}80`, // アルファ値を追加して半透明に
        borderColor: primaryColor,
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        type: 'line' as const,
        label: '累計収益',
        data: accumulatedIncomeData,
        backgroundColor: `${secondaryColor}20`, // 非常に薄く
        borderColor: secondaryColor,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1'
      }
    ]
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `${profitability.parameters.rentalPeriod}年間のキャッシュフロー推移`,
        font: {
          size: 16,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${context.parsed.y.toFixed(1)}百万円`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '運用期間'
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '年間純収益 (百万円)'
        },
        min: 0
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '累計収益 (百万円)'
        },
        grid: {
          drawOnChartArea: false,
        },
        min: 0
      },
    },
  };
  
  return (
    <Box sx={{ height: 400, position: 'relative' }}>
      <Chart type="bar" options={options} data={data} />
    </Box>
  );
};

export default CashFlowChart;