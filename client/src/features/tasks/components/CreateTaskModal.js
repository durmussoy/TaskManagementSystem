import React, { useState } from 'react';
import {
  Modal,
  Paper,
  Box,
  Typography,
  IconButton,
  Button,
  TextField
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { formatDateForInput } from '../../../utils/dateUtils';

const CreateTaskModal = ({ open, onClose, onCreate }) => {
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '2030-01-01T00:00',
    reminderDateTime: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(newTask);
    setNewTask({ 
      title: '', 
      description: '', 
      dueDateTime: '2030-01-01T00:00', 
      reminderDateTime: ''
    });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          maxWidth: 600,
          p: 4,
        }}
      >
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8 }}
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
        <Typography variant="h6" component="h2" gutterBottom>
          New Task
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            required
            fullWidth
            label="Title"
            name="title"
            margin="normal"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          />
          <TextField
            required
            fullWidth
            label="Description"
            name="description"
            margin="normal"
            multiline
            rows={4}
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <TextField
            required
            fullWidth
            label="Due Date & Time"
            name="dueDateTime"
            type="datetime-local"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formatDateForInput(newTask.dueDateTime)}
            onChange={(e) => setNewTask({ ...newTask, dueDateTime: e.target.value })}
          />
          <TextField
            required
            fullWidth
            label="Reminder Date & Time"
            name="reminderDateTime"
            type="datetime-local"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formatDateForInput(newTask.reminderDateTime)}
            onChange={(e) => setNewTask({ ...newTask, reminderDateTime: e.target.value })}
            helperText="When do you want to be reminded?"
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!newTask.title || !newTask.description || !newTask.dueDateTime || !newTask.reminderDateTime}
          >
            Create
          </Button>
        </form>
      </Paper>
    </Modal>
  );
};

export default CreateTaskModal; 