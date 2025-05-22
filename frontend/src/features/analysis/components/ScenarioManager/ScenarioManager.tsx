import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogActions, 
  DialogContentText,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  Scenario, 
  VolumeCheck,
  ProfitabilityResult
} from 'shared';
import { 
  deleteScenario,
  executeProfitabilityFromScenario
} from '../../api';
import ScenarioList from './ScenarioList';
import ScenarioForm from './ScenarioForm';

interface ScenarioManagerProps {
  volumeCheck: VolumeCheck;
  scenarios: Scenario[];
  onScenarioCreated: (scenario: Scenario) => void;
  onProfitabilityCreated: (profitability: ProfitabilityResult) => void;
}

// フォームモード
type FormMode = 'none' | 'create' | 'edit';

const ScenarioManager: React.FC<ScenarioManagerProps> = ({
  volumeCheck,
  scenarios,
  onScenarioCreated,
  onProfitabilityCreated
}) => {
  // シナリオ一覧の状態
  const [scenarioList, setScenarioList] = useState<Scenario[]>(scenarios);
  
  // フォーム表示モード
  const [formMode, setFormMode] = useState<FormMode>('none');
  
  // 編集中のシナリオ
  const [editScenario, setEditScenario] = useState<Scenario | undefined>(undefined);
  
  // 削除確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // スナックバー
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // 新規シナリオ作成を開始
  const handleAddScenario = () => {
    setFormMode('create');
    setEditScenario(undefined);
  };
  
  // シナリオ編集を開始
  const handleEditScenario = (scenarioId: string) => {
    const targetScenario = scenarioList.find(s => s.id === scenarioId);
    if (targetScenario) {
      setEditScenario(targetScenario);
      setFormMode('edit');
    }
  };
  
  // シナリオ削除確認ダイアログを表示
  const handleDeleteConfirm = (scenarioId: string) => {
    setDeleteTargetId(scenarioId);
    setDeleteDialogOpen(true);
  };
  
  // シナリオ削除を実行
  const handleDeleteScenario = async () => {
    if (!deleteTargetId) return;
    
    try {
      const success = await deleteScenario(deleteTargetId);
      if (success) {
        // 一覧から削除
        setScenarioList(scenarioList.filter(s => s.id !== deleteTargetId));
        
        setSnackbar({
          open: true,
          message: 'シナリオを削除しました',
          severity: 'success'
        });
      } else {
        throw new Error('削除に失敗しました');
      }
    } catch (err) {
      console.error('シナリオ削除エラー:', err);
      setSnackbar({
        open: true,
        message: '削除中にエラーが発生しました',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTargetId(null);
    }
  };
  
  // シナリオを複製
  const handleCopyScenario = (scenarioId: string) => {
    const targetScenario = scenarioList.find(s => s.id === scenarioId);
    if (targetScenario) {
      // 編集用シナリオを作成（コピー元と同じパラメータで新規作成モード）
      setEditScenario({
        ...targetScenario,
        id: '', // 空IDで新規として扱う
        name: `${targetScenario.name} (コピー)`,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      setFormMode('create');
    }
  };
  
  // 収益性試算を実行
  const handleRunProfitability = async (scenarioId: string) => {
    try {
      const result = await executeProfitabilityFromScenario(scenarioId);
      if (result) {
        onProfitabilityCreated(result);
        
        setSnackbar({
          open: true,
          message: '収益性試算を実行しました',
          severity: 'success'
        });
      } else {
        throw new Error('収益性試算の実行に失敗しました');
      }
    } catch (err) {
      console.error('収益性試算エラー:', err);
      setSnackbar({
        open: true,
        message: '収益性試算の実行中にエラーが発生しました',
        severity: 'error'
      });
    }
  };
  
  // シナリオ保存完了ハンドラ
  const handleSaveComplete = (scenario: Scenario) => {
    if (formMode === 'create') {
      // 新規作成の場合は一覧に追加
      setScenarioList([scenario, ...scenarioList]);
      onScenarioCreated(scenario);
    } else {
      // 編集の場合は一覧を更新
      setScenarioList(scenarioList.map(s => s.id === scenario.id ? scenario : s));
    }
    
    // フォームを閉じる
    setFormMode('none');
    setEditScenario(undefined);
  };
  
  // フォームをキャンセル
  const handleCancelForm = () => {
    setFormMode('none');
    setEditScenario(undefined);
  };
  
  // スナックバーを閉じる
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };
  
  // シナリオから収益性試算を実行して結果を通知
  const handleSaveAndRun = async (scenario: Scenario) => {
    try {
      const result = await executeProfitabilityFromScenario(scenario.id);
      if (result) {
        onProfitabilityCreated(result);
        
        // フォームを閉じる
        setFormMode('none');
        setEditScenario(undefined);
      }
    } catch (err) {
      console.error('収益性試算エラー:', err);
      setSnackbar({
        open: true,
        message: '収益性試算の実行中にエラーが発生しました',
        severity: 'error'
      });
    }
  };
  
  return (
    <Box>
      {formMode === 'none' ? (
        // シナリオ一覧表示
        <ScenarioList
          scenarios={scenarioList}
          onAddScenario={handleAddScenario}
          onRunProfitability={handleRunProfitability}
          onEditScenario={handleEditScenario}
          onDeleteScenario={handleDeleteConfirm}
          onCopyScenario={handleCopyScenario}
        />
      ) : (
        // シナリオ作成/編集フォーム
        <ScenarioForm
          volumeCheck={volumeCheck}
          onSave={handleSaveComplete}
          onRunProfitability={handleSaveAndRun}
          onCancel={handleCancelForm}
          editScenario={editScenario}
        />
      )}
      
      {/* 削除確認ダイアログ */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>シナリオの削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このシナリオを削除してもよろしいですか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleDeleteScenario} color="error" autoFocus>
            削除
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* 通知スナックバー */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ScenarioManager;