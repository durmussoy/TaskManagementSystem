import React, { useState, useEffect } from 'react';
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
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction
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
import useMinuteTimer from '../../../hooks/useMinuteTimer';

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
  const [remainingTime, setRemainingTime] = useState('');
  const minute = useMinuteTimer();
  const [editedTask, setEditedTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    reminderDateTime: '',
    status: '',
    subTasks: []
  });
  const [postponeAnchorEl, setPostponeAnchorEl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newSubTask, setNewSubTask] = useState('');

  useEffect(() => {
    if (task) {
      // Kullanıcıya özel hatırlatma zamanını bul
      const userReminderSetting = task.reminderSettings?.find(
        setting => setting.userId === JSON.parse(localStorage.getItem('user')).id
      );

      setEditedTask({
        ...task,
        reminderDateTime: userReminderSetting ? 
          formatDateForInput(userReminderSetting.reminderDateTime) : 
          formatDateForInput(task.dueDateTime)
      });

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
    }
  }, [task, minute]);

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

  const handleSubTaskComplete = (index) => {
    const updatedTask = { ...task };
    updatedTask.subTasks[index].isCompleted = !updatedTask.subTasks[index].isCompleted;
    onUpdate(updatedTask);
  };

  const handleSubTaskDelete = (index) => {
    const updatedTask = { ...task };
    updatedTask.subTasks.splice(index, 1);
    onUpdate(updatedTask);
  };

  const handleAddSubTask = (e) => {
    if (e.key === 'Enter' && newSubTask.trim()) {
      const updatedTask = { ...task };
      if (!updatedTask.subTasks) {
        updatedTask.subTasks = [];
      }
      updatedTask.subTasks.push({
        title: newSubTask.trim(),
        isCompleted: false
      });
      onUpdate(updatedTask);
      setNewSubTask('');
    }
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
            maxHeight: '90vh',
            overflow: 'auto'
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
                <>
                  <Typography variant="h5" gutterBottom>
                    {task?.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {task?.description}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 1 }}>
                      Sub Tasks
                    </Typography>
                    <List sx={{ py: 0 }}>
                      {task?.subTasks?.map((subTask, index) => (
                        <ListItem
                          key={index}
                          dense
                          disableGutters
                          sx={{
                            borderRadius: 1,
                            alignItems: 'center',
                            px: 1.5,
                            height: 'auto',
                            '&:hover': {
                              bgcolor: 'action.hover',
                              '& .action-buttons': {
                                opacity: 1,
                              }
                            },
                          }}
                        >
                          <Box
                            sx={{
                              width: 4,
                              height: 4,
                              bgcolor: 'text.secondary',
                              borderRadius: '50%',
                              mr: 1,
                              flexShrink: 0,
                            }}
                          />
                          <ListItemText
                            primary={subTask.title}
                            sx={{
                              m: 0,
                              p: 0,
                              minHeight: 'unset',
                              '& .MuiTypography-root': {
                                textDecoration: subTask.isCompleted ? 'line-through' : 'none',
                                color: subTask.isCompleted ? 'text.disabled' : 'text.primary',
                                wordBreak: 'break-word',
                                fontSize: '0.95rem',
                                lineHeight: '1.4em',
                                m: 0,
                                p: 0,
                                display: 'block',
                              }
                            }}
                          />
                          <Box 
                            className="action-buttons"
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                              mr: -1
                            }}
                          >
                            <Checkbox
                              edge="end"
                              checked={subTask.isCompleted}
                              onChange={() => handleSubTaskComplete(index)}
                              size="very-small"
                              //sx={{ border: '1px solid blue' }}
                            />
                            <IconButton
                              edge="end"
                              size="small"
                              onClick={() => handleSubTaskDelete(index)}
                            >
                              <DeleteIcon fontSize="very-small" />
                            </IconButton>
                          </Box>
                        </ListItem>
                      ))}
                      <ListItem sx={{ pt: 0.5, pb: 0, px: 1.5 }}>
                        <TextField
                          fullWidth
                          placeholder="Add a new sub-task"
                          value={newSubTask}
                          onChange={(e) => setNewSubTask(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const updatedTask = { ...task };
                              if (!updatedTask.subTasks) {
                                updatedTask.subTasks = [];
                              }
                              if (newSubTask.trim()) {
                                updatedTask.subTasks.push({
                                  title: newSubTask.trim(),
                                  isCompleted: false
                                });
                                onUpdate(updatedTask);
                                setNewSubTask('');
                              }
                            }
                          }}
                          size="small"
                          sx={{ 
                            mt: 0.5,
                            '& .MuiOutlinedInput-root': {
                              fontSize: '0.85rem',
                              '& fieldset': {
                                borderStyle: 'dashed',
                                borderWidth: '1px',
                              },
                              '&:hover fieldset': {
                                borderStyle: 'dashed',
                                borderWidth: '1px',
                              },
                              '&.Mui-focused fieldset': {
                                borderStyle: 'solid',
                              }
                            }
                          }}
                        />
                      </ListItem>
                    </List>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      color={remainingTime === 'Overdue' ? 'error.main' : 'success.main'}
                      sx={{ fontWeight: 'bold' }}
                    >
                      {['completed', 'cancelled'].includes(task.status) ? `${task.status === 'completed' ? 'Finished ' : 'Cancelled'} at: ${formatDateTime(task.updatedAt)}` : remainingTime}
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