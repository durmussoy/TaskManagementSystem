import React from 'react';
import { Box, Button } from '@mui/material';

const TaskFilters = ({ statusFilter, onFilterChange, taskCounts }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'flex-end',
      gap: 1,
      '& .MuiButton-root': {
        minWidth: '90px',
        height: '28px',
        textTransform: 'none',
        padding: '4px 10px',
        fontSize: '0.875rem',
        lineHeight: 1
      }
    }}>
      <Button
        variant={statusFilter === 'all' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('all')}
      >
        All
      </Button>
      <Button
        variant={statusFilter === 'new' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('new')}
        color="primary"
      >
        New ({taskCounts.new})
      </Button>
      <Button
        variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('pending')}
        color="warning"
      >
        Pending ({taskCounts.pending})
      </Button>
      <Button
        variant={statusFilter === 'remind' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('remind')}
        color="warning"
        sx={{ borderColor: 'warning.main', color: statusFilter === 'remind' ? 'white' : 'warning.main' }}
      >
        Remind ({taskCounts.remind})
      </Button>
      <Button
        variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('completed')}
        color="success"
      >
        Completed ({taskCounts.completed})
      </Button>
      <Button
        variant={statusFilter === 'cancelled' ? 'contained' : 'outlined'}
        size="small"
        onClick={() => onFilterChange('cancelled')}
        color="error"
      >
        Cancelled ({taskCounts.cancelled})
      </Button>
    </Box>
  );
};

export default TaskFilters; 