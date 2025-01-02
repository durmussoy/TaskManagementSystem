import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Drawer,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AddTaskIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventNoteIcon from '@mui/icons-material/EventNote';
import HistoryIcon from '@mui/icons-material/History';
import { formatDateTime } from '../../../utils/dateUtils';

const getEventIcon = (type) => {
  switch (type) {
    case 'reminder':
      return <NotificationsIcon color="warning" />;
    case 'create':
      return <AddTaskIcon color="primary" />;
    case 'complete':
      return <CheckCircleIcon color="success" />;
    case 'postpone':
      return <ScheduleIcon color="info" />;
    case 'cancel':
      return <CloseIcon color="error" />;
    case 'pending':
      return <ScheduleIcon color="warning" />;
    case 'delete':
      return <DeleteIcon color="error" />;
    case 'update':
      return <EditIcon color="info" />;
    default:
      return <EventNoteIcon />;
  }
};

const ActivityLog = ({ events, drawerWidth, open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 1.5 }}>
        <Box sx={{ 
          px: 1.5, 
          mb: 1.5, 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontSize: '1.1rem' }}>
            Activity Log
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        <List sx={{ 
          '& .MuiListItem-root': { 
            py: 1,
            px: 1.5,
            '& .MuiListItemIcon-root': {
              minWidth: 40
            },
            '& .MuiListItemText-primary': {
              fontSize: '0.9rem'
            },
            '& .MuiListItemText-secondary': {
              fontSize: '0.8rem'
            }
          }
        }}>
          {events.map((event, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {getEventIcon(event.type)}
              </ListItemIcon>
              <ListItemText
                primary={event.message}
                secondary={formatDateTime(event.timestamp)}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </>
  );

  // Kapalıyken aktivite log butonunu göster
  if (!open) {
    return (
      <IconButton
        onClick={onClose}
        sx={{
          position: 'fixed',
          right: theme.spacing(2),
          bottom: theme.spacing(2),
          backgroundColor: theme.palette.primary.main,
          color: 'white',
          '&:hover': {
            backgroundColor: theme.palette.primary.dark,
          },
          zIndex: theme.zIndex.drawer - 1,
          display: { xs: 'flex', md: 'none' } // Sadece mobilde göster
        }}
      >
        <HistoryIcon />
      </IconButton>
    );
  }

  return (
    <Drawer
      variant={isMobile ? "temporary" : "persistent"}
      anchor="right"
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          position: 'fixed',
          height: '100%',
          top: 0,
          right: 0,
          borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
};

export default ActivityLog; 