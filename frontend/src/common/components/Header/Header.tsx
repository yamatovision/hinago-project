/**
 * アプリケーションヘッダーコンポーネント
 */
import { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../../hooks/useAuth';

// ナビゲーションアイテムの定義
const navItems = [
  { name: 'ダッシュボード', path: '/dashboard', icon: <DashboardIcon /> },
  { name: '物件管理', path: '/properties', icon: <BusinessIcon /> },
  { name: '分析', path: '/analysis', icon: <BarChartIcon /> },
  { name: 'レポート', path: '/reports', icon: <DescriptionIcon /> },
];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ユーザーメニューの状態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openUserMenu = Boolean(anchorEl);

  // モバイルドロワーの状態
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ユーザーメニューを開く
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // ユーザーメニューを閉じる
  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  // ログアウト処理
  const handleLogout = async () => {
    handleUserMenuClose();
    await logout();
    navigate('/login');
  };

  // モバイルドロワーを開閉
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // 現在のパスがナビゲーションアイテムのパスと一致するか確認
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  // モバイル用ドロワーコンテンツ
  const drawerContent = (
    <Box sx={{ width: 250 }} role="presentation" onClick={toggleDrawer}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ mb: 2 }}>
          ボリュームチェックシステム
        </Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 1 }} alt={user.name || user.email} src="/static/images/avatar/default.jpg" />
            <Typography variant="body1">{user.name || user.email}</Typography>
          </Box>
        )}
      </Box>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.name}
            component={RouterLink}
            to={item.path}
            selected={isActive(item.path)}
            sx={{
              '&.Mui-selected': {
                bgcolor: 'rgba(25, 118, 210, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(25, 118, 210, 0.2)',
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><ExitToAppIcon /></ListItemIcon>
          <ListItemText primary="ログアウト" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky">
      <Toolbar>
        {/* モバイル用メニューボタン */}
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* ロゴ */}
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            flexGrow: isMobile ? 1 : 0, 
            mr: isMobile ? 0 : 4,
            fontWeight: 'bold'
          }}
        >
          ボリュームチェックシステム
        </Typography>

        {/* デスクトップ用ナビゲーション */}
        {!isMobile && (
          <Box sx={{ flexGrow: 1, display: 'flex' }}>
            {navItems.map((item) => (
              <Button
                key={item.name}
                component={RouterLink}
                to={item.path}
                color="inherit"
                sx={{
                  mx: 1,
                  py: 1,
                  borderRadius: 1,
                  bgcolor: isActive(item.path) ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive(item.path) 
                      ? 'rgba(255, 255, 255, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        )}

        {/* ユーザー情報とアクション */}
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
                px: 1,
                py: 0.5,
                borderRadius: 1,
              }}
              onClick={handleUserMenuOpen}
            >
              <Avatar 
                sx={{ width: 32, height: 32, mr: 1 }} 
                alt={user.name || user.email} 
                src="/static/images/avatar/default.jpg" 
              />
              {!isMobile && (
                <Typography variant="body2" component="span">
                  {user.name || user.email}
                </Typography>
              )}
            </Box>
            
            {/* ユーザーメニュー */}
            <Menu
              anchorEl={anchorEl}
              open={openUserMenu}
              onClose={handleUserMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={handleUserMenuClose}>
                <ListItemIcon>
                  <AccountCircleIcon fontSize="small" />
                </ListItemIcon>
                プロフィール
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <ExitToAppIcon fontSize="small" />
                </ListItemIcon>
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>

      {/* モバイル用ドロワー */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};

export default Header;