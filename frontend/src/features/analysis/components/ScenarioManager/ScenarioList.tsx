import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Stack,
  Button
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  AddCircleOutline as AddIcon
} from '@mui/icons-material';
import { Scenario, AssetType } from 'shared';

interface ScenarioListProps {
  scenarios: Scenario[];
  onAddScenario: () => void;
  onRunProfitability: (scenarioId: string) => void;
  onEditScenario: (scenarioId: string) => void;
  onDeleteScenario: (scenarioId: string) => void;
  onCopyScenario: (scenarioId: string) => void;
}

// アセットタイプごとの表示名
const assetTypeLabels: Record<AssetType, string> = {
  [AssetType.MANSION]: 'マンション',
  [AssetType.OFFICE]: 'オフィス',
  [AssetType.WOODEN_APARTMENT]: '木造アパート',
  [AssetType.HOTEL]: 'ホテル'
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ScenarioList: React.FC<ScenarioListProps> = ({
  scenarios,
  onAddScenario,
  onRunProfitability,
  onEditScenario,
  onDeleteScenario,
  onCopyScenario
}) => {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6">シナリオ一覧</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={onAddScenario}
        >
          新規シナリオ
        </Button>
      </Stack>
      
      {scenarios.length === 0 ? (
        <Paper elevation={1} sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            シナリオがまだ作成されていません
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={onAddScenario}
          >
            シナリオを作成
          </Button>
        </Paper>
      ) : (
        <Paper elevation={1}>
          <List>
            {scenarios.map((scenario, index) => (
              <React.Fragment key={scenario.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {scenario.name}
                        </Typography>
                        <Chip
                          label={assetTypeLabels[scenario.params.assetType]}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          作成日: {formatDate(scenario.createdAt)}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Typography component="span" variant="body2" sx={{ mr: 2 }}>
                            賃料単価: {scenario.params.rentPerSqm.toLocaleString()}円/m²
                          </Typography>
                          <Typography component="span" variant="body2" sx={{ mr: 2 }}>
                            建設単価: {scenario.params.constructionCostPerSqm.toLocaleString()}円/m²
                          </Typography>
                          <Typography component="span" variant="body2">
                            運用期間: {scenario.params.rentalPeriod}年
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Tooltip title="収益性試算を実行">
                      <IconButton
                        edge="end"
                        aria-label="run"
                        onClick={() => onRunProfitability(scenario.id)}
                        color="primary"
                      >
                        <PlayIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="編集">
                      <IconButton
                        edge="end"
                        aria-label="edit"
                        onClick={() => onEditScenario(scenario.id)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="複製">
                      <IconButton
                        edge="end"
                        aria-label="copy"
                        onClick={() => onCopyScenario(scenario.id)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => onDeleteScenario(scenario.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default ScenarioList;