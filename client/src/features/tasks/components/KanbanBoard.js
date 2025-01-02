import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TaskCard from './TaskCard';
import { getStatusColor, getStatusText } from '../../../utils/statusUtils';

const KanbanBoard = ({ tasks, onTaskClick }) => {
  const columns = ['new', 'pending', 'remind', 'completed', 'cancelled'];

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 0.5, 
      overflowX: 'auto', 
      pb: 2,
      width: '100%',
      '& > .MuiPaper-root': {
        flex: '1 1 0',
        minWidth: '250px',
        maxWidth: '350px',
        backgroundColor: '#fff',
        p: 0,
        borderRadius: 2,
        boxShadow: '0 0 10px rgba(0,0,0,0.05)',
        height: 'fit-content'
      }
    }}>
      {columns.map((status) => (
        <Paper key={status} elevation={0}>
          <Typography variant="h6" sx={{ mb: 1, color: getStatusColor(status), textAlign: 'center' }}>
            {getStatusText(status)} ({tasks.filter(t => t.status === status).length})
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 0,
            minHeight: '50px'
          }}>
            {tasks
              .filter(task => task.status === status)
              .map(task => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={onTaskClick}
                />
              ))}
          </Box>
        </Paper>
      ))}
    </Box>
  );
};

export default KanbanBoard; 