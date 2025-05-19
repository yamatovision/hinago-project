import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import { 
  Apartment as ApartmentIcon, 
  Map as MapIcon, 
  Folder as FolderIcon, 
  History as HistoryIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { PropertyDetail } from 'shared';
import BasicInfoTab from './BasicInfoTab';
import DocumentsTab from './DocumentsTab';
import HistoryTab from './HistoryTab';
import PropertyShapeTab from './PropertyShapeTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

/**
 * タブパネルコンポーネント
 */
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`property-tabpanel-${index}`}
      aria-labelledby={`property-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
};

interface PropertyDetailTabsProps {
  property: PropertyDetail;
  setProperty: React.Dispatch<React.SetStateAction<PropertyDetail | null>>;
}

/**
 * 物件詳細ページのタブコンポーネント
 * 基本情報、敷地形状、図面・資料、更新履歴の各タブを管理
 */
const PropertyDetailTabs: React.FC<PropertyDetailTabsProps> = ({ property, setProperty }) => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="物件詳細タブ"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<ApartmentIcon />}
            label="基本情報"
            id="property-tab-0"
            aria-controls="property-tabpanel-0"
            iconPosition="start"
          />
          <Tab
            icon={<MapIcon />}
            label="敷地形状"
            id="property-tab-1"
            aria-controls="property-tabpanel-1"
            iconPosition="start"
          />
          <Tab
            icon={<FolderIcon />}
            label="図面・資料"
            id="property-tab-2"
            aria-controls="property-tabpanel-2"
            iconPosition="start"
          />
          <Tab
            icon={<HistoryIcon />}
            label="更新履歴"
            id="property-tab-3"
            aria-controls="property-tabpanel-3"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* 基本情報タブ */}
      <TabPanel value={tabValue} index={0}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            ここで基本情報を確認・編集した後、敷地形状・文書タブで詳細設定を行ってください。準備が整ったらボリュームチェックへ進むことができます。
          </Typography>
        </Box>
        <BasicInfoTab property={property} setProperty={setProperty} />
      </TabPanel>

      {/* 敷地形状タブ */}
      <TabPanel value={tabValue} index={1}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            正確なボリュームチェックのために、敷地の形状情報を登録してください。測量図をアップロードするとより精度の高い計算が可能になります。
          </Typography>
        </Box>
        <PropertyShapeTab property={property} setProperty={setProperty} />
      </TabPanel>

      {/* 図面・資料タブ */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="primary" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <InfoIcon fontSize="small" sx={{ mr: 1 }} />
            物件に関連する測量図や資料をアップロードしてください。測量図は敷地形状やボリュームチェックの精度向上に役立ちます。
          </Typography>
        </Box>
        <DocumentsTab property={property} />
      </TabPanel>

      {/* 更新履歴タブ */}
      <TabPanel value={tabValue} index={3}>
        <HistoryTab property={property} />
      </TabPanel>
    </Box>
  );
};

export default PropertyDetailTabs;