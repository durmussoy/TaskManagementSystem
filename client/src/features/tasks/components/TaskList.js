import React from 'react';
import { Grid } from '@mui/material';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, statusFilter, onTaskClick }) => {
  const filteredTasks = tasks.filter(task => 
    statusFilter === 'all' ? true : task.status === statusFilter
  );

  return (
    <Grid 
      container 
      spacing={1}
      sx={{ 
        width: '95%', 
        margin: '0 auto',
        '& .MuiGrid-item': {
          display: 'flex',
          alignItems: 'stretch',
          py: 0.5
        }
      }}
    >
      {filteredTasks.map(task => (
        <Grid item xs={12} sm={6} md={3} lg={2} key={task._id}>
          <TaskCard task={task} onClick={() => onTaskClick(task)} />
        </Grid>
      ))}
    </Grid>
  );
};

export default TaskList; 