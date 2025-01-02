import React from 'react';
import { Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ViewToggle = ({ viewMode, onViewChange }) => {
  return (
    <Button
      variant="contained"
      color="info"
      onClick={() => onViewChange(viewMode === 'list' ? 'kanban' : 'list')}
      size="small"
      sx={{ 
        textTransform: 'none',
        borderRadius: '20px',
        px: 2,
        py: 0.5,
        backgroundColor: 'white',
        color: 'primary.main',
        border: '1px solid',
        borderColor: 'primary.main',
        '&:hover': {
          backgroundColor: 'primary.main',
          color: 'white'
        }
      }}
      startIcon={viewMode === 'list' ? <DashboardIcon /> : <AssignmentIcon />}
    >
      {viewMode === 'list' ? 'Kanban View' : 'List View'}
    </Button>
  );
};

export default ViewToggle; 