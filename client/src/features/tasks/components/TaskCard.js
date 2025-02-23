import React, { useState, useEffect } from 'react';
import { Paper, Box, Typography, Badge, IconButton, Tooltip, LinearProgress } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { getStatusColor } from '../../../utils/statusUtils';
import { formatDateTime } from '../../../utils/dateUtils';
import { TaskService } from '../services/TaskService';
import useMinuteTimer from '../../../hooks/useMinuteTimer';

const taskCardStyle = {
  p: 1.5,
  mb: 1,
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: 3,
  },
  width: '95%',
  height: '95%',
  minHeight: '140px',
  margin: '0 auto 8px auto',
  backgroundColor: '#fff',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  gap: '5px',
  '& .task-title': {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    fontWeight: 'bold',
    marginBottom: '3px',
    fontSize: '0.9rem',
    height: '24px',
    lineHeight: '24px',
  },
  '& .task-description': {
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: '2',
    WebkitBoxOrient: 'vertical',
    textOverflow: 'ellipsis',
    lineHeight: '1.2em',
    height: '2.4em',
    fontSize: '0.9rem',
    flex: '0 0 auto',
  },
};

const TaskCard = ({ task, onClick }) => {
  const [remainingTime, setRemainingTime] = useState(task.remainingTime);
  const minute = useMinuteTimer();
  const subTaskProgress = TaskService.getSubTasksProgress(task);
  const currentUserId = JSON.parse(localStorage.getItem('user')).id;
  
  // Kullanıcıya özel hatırlatma zamanını bul
  const userReminderSetting = task.reminderSettings?.find(
    setting => setting.userId === currentUserId
  );

  const reminderDateTime = userReminderSetting ? userReminderSetting.reminderDateTime : task.dueDateTime;

  useEffect(() => {
    // Kalan zamanı güncelle
    const updateRemainingTime = () => {
      if (userReminderSetting && userReminderSetting.reminderDateTime) {
        const now = new Date();
        const reminder = new Date(userReminderSetting.reminderDateTime);
        const diff = reminder - now;

        if (diff < 0) {
          setRemainingTime('Reminder');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
          setRemainingTime(`${days}d ${hours}h remaining`);
        } else if (hours > 0) {
          setRemainingTime(`${hours}h ${minutes}m remaining`);
        } else if (minutes > 0) {
          setRemainingTime(`${minutes}m remaining`);
        } else {
          setRemainingTime('in a minute');
        }
      } else {
        setRemainingTime('No reminder set');
      }
    };

    updateRemainingTime();
  }, [userReminderSetting, minute]);

  return (
    <Paper
      sx={{
        ...taskCardStyle,
        borderLeft: '4px solid',
        borderLeftColor: getStatusColor(task.status || 'new'),
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        borderRight: '1px solid rgba(0, 0, 0, 0.12)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        position: 'relative',
        opacity: task.status === 'completed' || task.status === 'cancelled' ? 0.7 : 1,
        boxShadow: task.status === 'remind' ? '0 0 15px rgba(255, 152, 0, 0.5)' : 'none',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: task.status === 'remind' 
            ? '0 8px 16px rgba(0,0,0,0.1), 0 0 15px rgba(255, 152, 0, 0.5)'
            : '0 8px 16px rgba(0,0,0,0.1)',
        },
      }}
      onClick={() => onClick(task, task.status === 'remind')}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
        <Typography 
          variant="h6" 
          sx={{ 
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '1',
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.2em',
            maxHeight: '2.8em'
          }}
        >
          {task.title}
          {task.status === 'remind' && (
            <Badge 
              color="warning" 
              variant="dot"
              sx={{ 
                '& .MuiBadge-dot': {
                  right: -4,
                  top: 4,
                }
              }}
            />
          )}
        </Typography>
      </Box>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: '2',
          WebkitBoxOrient: 'vertical',
          mb: 1,
          fontSize: '0.875rem',
          lineHeight: '1.3em',
          height: '2.6em'
        }}
      >
        {task.description}
      </Typography>

      {subTaskProgress.total > 0 && (
        <Box sx={{ width: '100%', mb: 1 }}>
          <LinearProgress
            variant="determinate"
            value={subTaskProgress.percentage}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
              }
            }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5, fontSize: '0.75rem' }}
          >
            {subTaskProgress.completed}/{subTaskProgress.total} sub-tasks completed
          </Typography>
        </Box>
      )}

      <Box sx={{ 
        mt: 'auto',
        pt: 1,
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-end',
        height: '24px',
        flex: '0 0 auto'
      }}>
        <Typography 
          variant="caption" 
          color={remainingTime === 'Overdue' && !['completed', 'cancelled'].includes(task.status) ? 'error.main' : 'text.secondary'} 
          display="block"
          sx={{ fontWeight: 'medium' }}
        >
          {['completed', 'cancelled'].includes(task.status) ? formatDateTime(task.updatedAt) : remainingTime}
        </Typography>
        <Tooltip
          title={
            <Box>
              <Typography variant="body2">Assigned to: {task.assignedTo?.name || 'Unassigned'}</Typography>
              <Typography variant="body2">Created by: {task.createdBy?.name}</Typography>
              <Typography variant="body2">Created: {formatDateTime(task.createdAt)}</Typography>
              <Typography variant="body2">Due: {formatDateTime(task.dueDateTime)}</Typography>
              <Typography variant="body2">Reminder: {formatDateTime(reminderDateTime)}</Typography>
              <Typography variant="body2">Status: {task.status || 'new'}</Typography>
              {subTaskProgress.total > 0 && (
                <Typography variant="body2">
                  Sub Tasks: {subTaskProgress.completed}/{subTaskProgress.total} (%{subTaskProgress.percentage})
                </Typography>
              )}
            </Box>
          }
          placement="top-start"
        >
          <IconButton
            size="small"
            sx={{ 
              padding: 0,
              '&:hover': { backgroundColor: 'transparent' }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <InfoIcon fontSize="small" color="action" />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
};

export default TaskCard; 