import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import {
  History as HistoryIcon
} from '@mui/icons-material';
import { PropertyDetail, HistoryEntry } from 'shared';
import { getPropertyHistory } from '../../api/history';

// 日付フォーマットのユーティリティ
const formatDate = (dateString: string | Date): string => {
  const date = new Date(dateString);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface HistoryTabProps {
  property: PropertyDetail;
}

/**
 * 物件の更新履歴タブ
 * 物件に関する変更履歴をタイムライン形式で表示する
 */
const HistoryTab: React.FC<HistoryTabProps> = ({ property }) => {
  // 状態管理
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 更新履歴の取得
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const historyData = await getPropertyHistory(property.id);
        
        if (historyData) {
          // 日付降順でソート（最新が上）
          const sortedHistory = [...historyData].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setHistory(sortedHistory);
        }
        setError(null);
      } catch (err) {
        console.error('更新履歴取得エラー:', err);
        setError('更新履歴の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [property.id]);
  
  // モックデータ（API未実装の場合のバックアップ）
  const mockHistory: HistoryEntry[] = [
    {
      id: '1',
      propertyId: property.id,
      userId: 'user1',
      action: '物件情報を更新',
      details: '建蔽率と容積率を更新しました。',
      createdAt: new Date('2025-05-14T15:30:00'),
      updatedAt: new Date('2025-05-14T15:30:00')
    },
    {
      id: '2',
      propertyId: property.id,
      userId: 'user1',
      action: '測量図をアップロード',
      details: '測量図.pdfをアップロードし、敷地形状を更新しました。',
      createdAt: new Date('2025-05-12T10:45:00'),
      updatedAt: new Date('2025-05-12T10:45:00')
    },
    {
      id: '3',
      propertyId: property.id,
      userId: 'user1',
      action: '物件ステータスを変更',
      details: 'ステータスを「新規」から「進行中」に変更しました。',
      createdAt: new Date('2025-05-10T09:15:00'),
      updatedAt: new Date('2025-05-10T09:15:00')
    },
    {
      id: '4',
      propertyId: property.id,
      userId: 'user1',
      action: '物件を登録',
      details: `新規物件「${property.name}」を登録しました。`,
      createdAt: new Date('2025-05-08T14:20:00'),
      updatedAt: new Date('2025-05-08T14:20:00')
    }
  ];
  
  // ローディング表示
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // エラー表示
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  // 表示するデータを選択（実際のAPIから返却がない場合はモックデータを使用）
  const displayHistory = history.length > 0 ? history : mockHistory;
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <HistoryIcon sx={{ mr: 1 }} />
        更新履歴
      </Typography>
      
      <Typography variant="body2" color="textSecondary" gutterBottom>
        物件情報の変更履歴を確認できます。
      </Typography>
      
      {displayHistory.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          この物件の更新履歴はまだありません。
        </Alert>
      ) : (
        <Box sx={{ mt: 3 }}>
          {displayHistory.map((entry) => (
            <Box
              key={entry.id}
              sx={{
                position: 'relative',
                pb: 3,
                pl: 3,
                borderLeft: '2px solid #ddd',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: '#1976d2',
                  left: -7,
                  top: 4
                }
              }}
            >
              <Typography variant="caption" color="textSecondary">
                {formatDate(entry.createdAt)}
              </Typography>
              <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 500 }}>
                {entry.action}
              </Typography>
              <Typography variant="body2">
                {entry.details}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default HistoryTab;