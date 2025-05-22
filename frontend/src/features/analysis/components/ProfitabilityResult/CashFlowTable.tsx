import React, { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon 
} from '@mui/icons-material';
import { ProfitabilityResult } from 'shared';

interface CashFlowTableProps {
  profitability: ProfitabilityResult;
}

const CashFlowTable: React.FC<CashFlowTableProps> = ({ profitability }) => {
  const [expanded, setExpanded] = useState(false);
  
  // 初期表示する年数
  const initialVisibleYears = 5;
  
  // 表示する財務データ
  const visibleData = expanded 
    ? profitability.annualFinancials
    : profitability.annualFinancials.slice(0, initialVisibleYears);
    
  // 数値のフォーマット
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  const handleExpandClick = () => {
    setExpanded(!expanded);
  };
  
  return (
    <Box>
      <TableContainer component={Paper} elevation={1}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>年次</TableCell>
              <TableCell align="right">賃料収入</TableCell>
              <TableCell align="right">運営支出</TableCell>
              <TableCell align="right">年間純収益</TableCell>
              <TableCell align="right">累計収益</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.map((annual) => (
              <TableRow key={annual.year}>
                <TableCell component="th" scope="row">
                  {annual.year}年目
                </TableCell>
                <TableCell align="right">{formatCurrency(annual.rentalIncome)}</TableCell>
                <TableCell align="right">{formatCurrency(annual.operatingExpenses)}</TableCell>
                <TableCell align="right">{formatCurrency(annual.netOperatingIncome)}</TableCell>
                <TableCell align="right">{formatCurrency(annual.accumulatedIncome)}</TableCell>
              </TableRow>
            ))}
            
            {!expanded && profitability.annualFinancials.length > initialVisibleYears && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ border: 0, p: 0 }}>
                  <Button
                    startIcon={<ExpandMoreIcon />}
                    onClick={handleExpandClick}
                    sx={{ mt: 1, mb: 1 }}
                  >
                    全期間を表示
                  </Button>
                </TableCell>
              </TableRow>
            )}
            
            {expanded && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ border: 0, p: 0 }}>
                  <Button
                    startIcon={<ExpandLessIcon />}
                    onClick={handleExpandClick}
                    sx={{ mt: 1, mb: 1 }}
                  >
                    表示を縮小
                  </Button>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CashFlowTable;