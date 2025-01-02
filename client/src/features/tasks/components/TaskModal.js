import React, { useState } from 'react';
import {
  Modal,
  Paper,
  Box,
  Typography,
  IconButton,
  Button,
  TextField,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { formatDateTime, formatDateForInput } from '../../../utils/dateUtils';
import { getStatusText } from '../../../utils/statusUtils';
import PostponeMenu from './PostponeMenu';

const TaskModal = ({ 
  task, 
  open, 
  onClose,
  onUpdate,
  onComplete,
  onPostpone,
  onCancel,
  onDelete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [postponeAnchorEl, setPostponeAnchorEl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditedTask({ ...task });
  };

  const handleSave = () => {
    onUpdate(editedTask);
    setIsEditing(false);
    setEditedTask(null);
  };

  const handleClose = () => {
    setIsEditing(false);
    setEditedTask(null);
    onClose();
  };

  const handlePostponeClick = (event) => {
    setPostponeAnchorEl(event.currentTarget);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(task);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
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
          {task && (
            <>
              <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 1 }}>
                {isEditing && (
                  <IconButton
                    onClick={handleSave}
                    color="success"
                  >
                    <SaveIcon />
                  </IconButton>
                )}
                {!isEditing && (
                  <IconButton
                    onClick={handleStartEdit}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                )}
                <IconButton
                  color="error"
                  size="small"
                  onClick={handleDeleteClick}
                >
                  <DeleteIcon />
                </IconButton>
                <Tooltip
                  title={
                    <Box>
                      <Typography variant="body2">Assigned to: {task?.assignedTo?.name || 'Unassigned'}</Typography>
                      <Typography variant="body2">Created by: {task?.createdBy?.name}</Typography>
                      <Typography variant="body2">Created: {formatDateTime(task?.createdAt)}</Typography>
                      <Typography variant="body2">Due: {formatDateTime(task?.dueDateTime)}</Typography>
                      <Typography variant="body2">Reminder: {formatDateTime(task?.reminderDateTime)}</Typography>
                      <Typography variant="body2">Status: {getStatusText(task?.status || 'new')}</Typography>
                    </Box>
                  }
                  placement="bottom-end"
                >
                  <IconButton size="small">
                    <InfoIcon fontSize="small" color="action" />
                  </IconButton>
                </Tooltip>
                <IconButton onClick={handleClose}>
                  <CloseIcon />
                </IconButton>
              </Box>
              
              {!isEditing ? (
                // View Mode
                <>
                  <Typography variant="h5" gutterBottom>
                    {task?.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {task?.description}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      color={task?.remainingTime === 'Overdue' ? 'error.main' : 'success.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {task?.remainingTime}
                    </Typography>
                  </Box>

                  {task.status !== 'completed' && task.status !== 'cancelled' && (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end', 
                      gap: 1, 
                      mt: 3,
                      '& .MuiButton-root': {
                        minWidth: '100px',
                        height: '32px',
                        textTransform: 'none',
                        py: 0
                      }
                    }}>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => onComplete(task)}
                        startIcon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={handlePostponeClick}
                        startIcon={<ScheduleIcon sx={{ fontSize: 18 }} />}
                      >
                        Postpone
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => onCancel(task)}
                        startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                      >
                        Cancel
                      </Button>
                    </Box>
                  )}
                </>
              ) : (
                // Edit Mode
                <Box component="form" sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={editedTask?.title || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="Description"
                    value={editedTask?.description || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
                    margin="normal"
                    multiline
                    rows={4}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Due Date & Time"
                    type="datetime-local"
                    value={formatDateForInput(editedTask?.dueDateTime) || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, dueDateTime: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Reminder Date & Time"
                    type="datetime-local"
                    value={formatDateForInput(editedTask?.reminderDateTime) || ''}
                    onChange={(e) => setEditedTask({ ...editedTask, reminderDateTime: e.target.value })}
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Box>
              )}
            </>
          )}
        </Paper>
      </Modal>

      <PostponeMenu
        anchorEl={postponeAnchorEl}
        onClose={() => setPostponeAnchorEl(null)}
        onPostpone={onPostpone}
      />

      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{task?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskModal; 