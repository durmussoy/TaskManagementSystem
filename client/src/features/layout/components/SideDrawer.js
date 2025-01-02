import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Typography,
  useTheme,
  styled
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BuildIcon from '@mui/icons-material/Build';
import PersonIcon from '@mui/icons-material/Person';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const SideDrawer = ({ open, onClose, user }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: open ? drawerWidth : theme.spacing(7),
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: open ? drawerWidth : theme.spacing(7),
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          marginTop: '64px',
          backgroundColor: theme.palette.background.default,
          borderRight: `1px solid ${theme.palette.divider}`,
        },
      }}
      open={open}
    >
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center',
        py: 2
      }}>
        <Avatar
          src={user?.profileImage || ''}
          alt={user?.name || 'User'}
          sx={{ 
            width: open ? 80 : 40,
            height: open ? 80 : 40,
            transition: theme.transitions.create(['width', 'height'], {
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        />
        {open && (
          <Typography
            variant="subtitle1"
            sx={{ 
              mt: 1,
              textAlign: 'center',
              fontWeight: 'medium'
            }}
          >
            {user?.name || 'Ad Soyad'}
          </Typography>
        )}
      </Box>

      <Divider />

      <List>
        <ListItem 
          button 
          onClick={() => navigate('/dashboard')}
          sx={{ 
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : 'auto',
              justifyContent: 'center',
            }}
          >
            <DashboardIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Dashboard" 
            sx={{ opacity: open ? 1 : 0 }} 
          />
        </ListItem>

        <ListItem 
          button
          sx={{ 
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : 'auto',
              justifyContent: 'center',
            }}
          >
            <BuildIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Tools" 
            sx={{ opacity: open ? 1 : 0 }} 
          />
        </ListItem>

        <ListItem 
          button
          sx={{ 
            minHeight: 48,
            justifyContent: open ? 'initial' : 'center',
            px: 2.5,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: open ? 3 : 'auto',
              justifyContent: 'center',
            }}
          >
            <PersonIcon />
          </ListItemIcon>
          <ListItemText 
            primary="User Panel" 
            sx={{ opacity: open ? 1 : 0 }} 
          />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default SideDrawer; 