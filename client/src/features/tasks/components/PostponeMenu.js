import React, { useState } from 'react';
import { Menu, MenuItem, Box, TextField, Button } from '@mui/material';

const PostponeMenu = ({ anchorEl, onClose, onPostpone }) => {
  const [customPostponeDate, setCustomPostponeDate] = useState('');

  const handlePostpone = (minutes) => {
    onPostpone(minutes);
    onClose();
  };

  const handleCustomPostpone = () => {
    if (customPostponeDate) {
      onPostpone(null, new Date(customPostponeDate));
      onClose();
      setCustomPostponeDate('');
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      <MenuItem onClick={() => handlePostpone(1)}>1 minute</MenuItem>
      <MenuItem onClick={() => handlePostpone(5)}>5 minutes</MenuItem>
      <MenuItem onClick={() => handlePostpone(10)}>10 minutes</MenuItem>
      <MenuItem onClick={() => handlePostpone(15)}>15 minutes</MenuItem>
      <MenuItem onClick={() => handlePostpone(30)}>30 minutes</MenuItem>
      <MenuItem onClick={() => handlePostpone(60)}>1 hour</MenuItem>
      <MenuItem onClick={() => handlePostpone(24 * 60)}>Tomorrow</MenuItem>
      <MenuItem>
        <Box sx={{ p: 1 }}>
          <TextField
            label="Custom Date & Time"
            type="datetime-local"
            value={customPostponeDate}
            onChange={(e) => setCustomPostponeDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            fullWidth
            sx={{ mb: 1 }}
          />
          <Button
            variant="contained"
            size="small"
            fullWidth
            onClick={handleCustomPostpone}
            disabled={!customPostponeDate}
          >
            Set Custom Time
          </Button>
        </Box>
      </MenuItem>
    </Menu>
  );
};

export default PostponeMenu; 