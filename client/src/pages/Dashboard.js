import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Modal,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Badge,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsIcon from '@mui/icons-material/Notifications';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import AddTaskIcon from '@mui/icons-material/AddTask';
import InfoIcon from '@mui/icons-material/Info';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import axios from '../utils/axios';

// Utility function for date formatting
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Task card style güncelleme
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success.main';
    case 'cancelled':
      return 'error.main';
    case 'new':
      return 'primary.main';
    case 'pending':
      return 'warning.main';
    case 'remind':
      return 'warning.main';
    default:
      return 'primary.main';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'new':
      return 'New';
    case 'pending':
      return 'Pending';
    case 'remind':
      return 'Reminder';
    default:
      return 'New';
  }
};

// Notification sound - sadece bir ses dosyası
const notificationSound = '/sounds/bell.wav';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDateTime: '',
    reminderDateTime: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [reminderTask, setReminderTask] = useState(null);
  const [postponeAnchorEl, setPostponeAnchorEl] = useState(null);
  const [customPostponeDate, setCustomPostponeDate] = useState('');
  const [events, setEvents] = useState([]);
  const [drawerWidth] = useState(320);
  const miniDrawerWidth = 65;  // Mini drawer genişliği
  const [currentTime, setCurrentTime] = useState(new Date());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const audioRef = React.useRef(new Audio(notificationSound));
  const [viewMode, setViewMode] = useState('list'); // 'list' veya 'kanban'

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (!token) {
      navigate('/login');
      return;
    }
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchTasks();
  }, [navigate]);

  // Add dynamic time update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Round date to nearest minute
  const roundToMinute = (date) => {
    const newDate = new Date(date);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    return newDate;
  };

  // Fetch tasks
  const fetchTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Create new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const taskData = {
        ...newTask,
        status: 'new'
      };
      const response = await axios.post('/tasks', taskData);
      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDateTime: '', reminderDateTime: '' });
      fetchTasks();
      addEvent('create', `Task "${response.data.title}" has been created`, response.data);
    } catch (error) {
      console.error('Error creating task:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Task card style
  const taskCardStyle = {
    padding: '16px',
    height: '200px',
    width: '250px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    marginBottom: '16px',
    backgroundColor: '#fff',
    overflow: 'hidden',
    gap: '8px',
    '& .task-title': {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      maxWidth: '100%',
      fontWeight: 'bold',
      marginBottom: '4px',
    },
    '& .task-description': {
      overflow: 'hidden',
      display: '-webkit-box',
      WebkitLineClamp: '2',
      WebkitBoxOrient: 'vertical',
      textOverflow: 'ellipsis',
      lineHeight: '1.2em',
      maxHeight: '2.4em',
    },
  };

  // Kanban görünümü için kolon stili
  const columnStyle = {
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    minHeight: '500px',
    width: '300px',
    marginRight: '16px',
  };

  // Activity Log stili
  const activityLogStyle = {
    position: 'fixed',
    right: 0,
    top: 64,
    width: '320px',
    height: 'calc(100vh - 64px)',
    backgroundColor: '#fff',
    borderLeft: '1px solid #e0e0e0',
    padding: '16px',
    overflowY: 'auto',
  };

  // Ana içerik alanı stili
  const mainContentStyle = {
    marginRight: '320px', // Activity Log genişliği kadar sağdan boşluk
    padding: '24px',
  };

  // Handle task update
  const handleUpdateTask = async () => {
    if (!editedTask) return;
    try {
      const updatedTask = {
        ...editedTask,
        dueDateTime: new Date(editedTask.dueDateTime).toISOString(),
        reminderDateTime: new Date(editedTask.reminderDateTime).toISOString()
      };
      const response = await axios.put(`/tasks/${editedTask._id}`, updatedTask);
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === editedTask._id ? response.data : task
      ));
      setSelectedTask(response.data);
      setIsEditing(false);
      setEditedTask(null);
      addEvent('update', `Task "${response.data.title}" has been updated`, response.data);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  // Handle task delete
  const handleDeleteTask = async (taskId, taskTitle) => {
    if (!taskId) return;
    try {
      await axios.delete(`/tasks/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
      setSelectedTask(null);
      addEvent('delete', `Task "${taskTitle}" has been deleted`, { _id: taskId, title: taskTitle });
    } catch (error) {
      console.error('Error deleting task:', error);
    }
    setDeleteConfirmOpen(false);
    setTaskToDelete(null);
  };

  // Handle complete task
  const handleCompleteTask = async (task) => {
    if (!task) return;
    try {
      const response = await axios.put(`/tasks/${task._id}`, {
        ...task,
        status: 'completed',
        completed: true
      });
      setTasks(prevTasks => prevTasks.map(t => 
        task._id === t._id ? response.data : t
      ));
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask(response.data);
        if (editedTask) {
          setEditedTask(response.data);
        }
      }
      addEvent('complete', `Task "${task.title}" has been completed`, response.data);
      setReminderTask(null);
      setPostponeAnchorEl(null);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  // Handle cancel task
  const handleCancelTask = async (task) => {
    try {
      const response = await axios.put(`/tasks/${task._id}`, {
        ...task,
        status: 'cancelled'
      });
      setTasks(prevTasks => prevTasks.map(t => 
        t._id === task._id ? response.data : t
      ));
      if (selectedTask && selectedTask._id === task._id) {
        setSelectedTask(response.data);
        if (editedTask) {
          setEditedTask(response.data);
        }
      }
      addEvent('cancel', `Task "${task.title}" has been cancelled`, response.data);
      if (reminderTask && reminderTask._id === task._id) {
        setReminderTask(null);
        setPostponeAnchorEl(null);
      }
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  };

  // Check for reminders
  useEffect(() => {
    const checkReminders = async () => {
      if (!tasks.length) return;

      const now = new Date();
      const currentMinute = now.getMinutes();
      const currentSecond = now.getSeconds();

      // Her dakikanın başında kontrol et
      if (currentSecond !== 0) {
        const timeUntilNextMinute = (60 - currentSecond) * 1000;
        setTimeout(checkReminders, timeUntilNextMinute);
        return;
      }

      console.log('Checking reminders at:', now.toLocaleTimeString());

      for (const task of tasks) {
        if (task.reminderDateTime && 
            task.status !== 'completed' &&
            task.status !== 'cancelled' &&
            task.status !== 'remind') {
          
          const reminderTime = new Date(task.reminderDateTime);
          
          // Sadece dakika ve saat kontrolü yap
          if (reminderTime.getHours() === now.getHours() && 
              reminderTime.getMinutes() === now.getMinutes()) {
            console.log('Reminder triggered for task:', task.title);
            try {
              const response = await axios.put(`/tasks/${task._id}`, {
                ...task,
                status: 'remind'
              });

              setTasks(prevTasks => prevTasks.map(t => 
                t._id === task._id ? response.data : t
              ));

              // Play notification sound
              audioRef.current.play().catch(error => 
                console.error('Error playing sound:', error)
              );

              // Add event to Activity Log
              addEvent('reminder', `Task "${task.title}" needs attention now!`, response.data);
              
              console.log('Reminder processed successfully');
            } catch (error) {
              console.error('Error processing reminder:', error);
            }
          }
        }
      }
    };

    // İlk kontrol
    checkReminders();

    // Component unmount olduğunda interval'i temizle
    return () => {};
  }, [tasks]);

  const handleCancelReminder = () => {
    const taskToCancel = reminderTask;
    setReminderTask(null);
    setPostponeAnchorEl(null);
    addEvent('cancel', `Reminder cancelled: "${taskToCancel.title}"`, taskToCancel);
  };

  const handlePostponeClick = (event) => {
    setPostponeAnchorEl(event.currentTarget);
  };

  const handlePostponeClose = () => {
    setPostponeAnchorEl(null);
  };

  const handlePostpone = async (minutes) => {
    try {
      const taskToPostpone = reminderTask;
      const newReminderDate = roundToMinute(new Date());
      newReminderDate.setMinutes(newReminderDate.getMinutes() + minutes);
      const updatedTask = {
        ...taskToPostpone,
        status: 'pending',
        reminderDateTime: newReminderDate.toISOString()
      };
      setReminderTask(null);
      setPostponeAnchorEl(null);
      const response = await axios.put(`/tasks/${taskToPostpone._id}`, updatedTask);
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === taskToPostpone._id ? response.data : task
      ));
      if (selectedTask && selectedTask._id === taskToPostpone._id) {
        setSelectedTask(response.data);
        if (editedTask) {
          setEditedTask(response.data);
        }
      }
      const timeText = minutes === 60 ? "1 hour" : 
                      minutes === 1440 ? "24 hours" : 
                      `${minutes} minutes`;
      addEvent('postpone', `Task "${taskToPostpone.title}" has been postponed by ${timeText}`, response.data);
    } catch (error) {
      console.error('Error postponing task:', error);
    }
  };

  const handleCustomPostpone = async () => {
    if (customPostponeDate) {
      try {
        const response = await axios.put(`/tasks/${reminderTask._id}`, {
          ...reminderTask,
          status: 'pending',
          reminderDateTime: new Date(customPostponeDate).toISOString()
        });
        const formattedDate = new Date(customPostponeDate).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        addEvent('postpone', `Task "${reminderTask.title}" has been postponed to ${formattedDate}`, response.data);
        setReminderTask(null);
        setPostponeAnchorEl(null);
        setCustomPostponeDate('');
        fetchTasks();
      } catch (error) {
        console.error('Error setting custom postpone:', error);
      }
    }
  };

  // Add new event to the list
  const addEvent = (type, message, task) => {
    const newEvent = {
      id: Date.now(),
      type,
      message,
      task,
      timestamp: new Date(),
    };
    setEvents(prevEvents => [newEvent, ...prevEvents]);
  };

  // Get event icon
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

  // Pending task işleme fonksiyonunu ekleyelim
  const handlePendingTask = async (task) => {
    if (!task) return;
    try {
      const response = await axios.put(`/tasks/${task._id}`, {
        ...task,
        status: 'pending'
      });
      setTasks(prevTasks => prevTasks.map(t => 
        t._id === task._id ? response.data : t
      ));
      setReminderTask(null);
      setPostponeAnchorEl(null);
      addEvent('pending', `Task "${task.title}" is now pending`, response.data);
    } catch (error) {
      console.error('Error marking task as pending:', error);
    }
  };

  // Task kartına tıklandığında
  const handleTaskClick = async (task, isReminder) => {
    if (task.status === 'new') {
      try {
        const response = await axios.put(`/tasks/${task._id}`, {
          ...task,
          status: 'pending'
        });
        setTasks(prevTasks => prevTasks.map(t => 
          t._id === task._id ? response.data : t
        ));
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
    
    if (isReminder) {
      setReminderTask(task);
    } else {
      setSelectedTask(task);
    }
  };

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Play notification sound - basitleştirilmiş versiyon
  const playNotificationSound = () => {
    audioRef.current.play().catch(error => console.error('Error playing sound:', error));
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, onClick: () => setStatusFilter('all') },
    { text: 'Tools', icon: <SettingsIcon />, onClick: () => {} },
    { text: 'User Panel', icon: <PersonIcon />, onClick: () => {} },
  ];

  // Reminder Dialog'da X'e tıklandığında
  const handleCloseReminder = () => {
    setReminderTask(null);
    setPostponeAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <FilterListIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Remainder
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="info"
              onClick={() => setViewMode(viewMode === 'list' ? 'kanban' : 'list')}
              size="small"
              sx={{ textTransform: 'none' }}
            >
              {viewMode === 'list' ? 'Kanban Görünümü' : 'Liste Görünümü'}
            </Button>

            <Typography variant="subtitle1">
              {currentTime.toLocaleTimeString('tr-TR')}
            </Typography>
            
            <Typography variant="subtitle1">
              {user?.name || 'Ad Soyad'}
            </Typography>

            <Tooltip title="Çıkış Yap">
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sol Menü */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerOpen ? drawerWidth : miniDrawerWidth,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? drawerWidth : miniDrawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f5f5f5',
            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
            overflowX: 'hidden',
            transition: theme => theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            position: 'fixed',
            height: '100%',
            top: 0,
            left: 0,
          },
        }}
        open={drawerOpen}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          {user && drawerOpen && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <AccountCircleIcon sx={{ fontSize: 64, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mt: 1 }}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          )}
          {!drawerOpen && user && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <AccountCircleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <List>
            {menuItems.map((item) => (
              <React.Fragment key={item.text}>
                <ListItem
                  button
                  onClick={item.onClick}
                  sx={{
                    borderRadius: drawerOpen ? '0 20px 20px 0' : '50%',
                    mr: drawerOpen ? 2 : 'auto',
                    ml: drawerOpen ? 0 : 1,
                    mb: 1,
                    width: drawerOpen ? 'auto' : '45px',
                    height: drawerOpen ? 'auto' : '45px',
                    justifyContent: 'center',
                    '&:hover': {
                      backgroundColor: 'primary.light',
                      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                        color: 'white',
                      },
                    },
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: 'primary.main',
                      minWidth: drawerOpen ? 56 : 'auto',
                      justifyContent: 'center'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && <ListItemText primary={item.text} />}
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box component="main" sx={{ 
        position: 'relative',
        ml: `${miniDrawerWidth}px`,
        mr: `${miniDrawerWidth}px`,
        transition: theme => theme.transitions.create(['margin', 'width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        width: `calc(100% - ${drawerOpen ? drawerWidth : miniDrawerWidth}px - ${miniDrawerWidth}px)`,
      }}>
        <Toolbar />
        <Box sx={{ p: 1 }}>
          {!isLoading ? (
            <Box sx={{ my: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">
                  Tasks
                  <IconButton 
                    color="primary" 
                    onClick={() => setIsModalOpen(true)}
                    sx={{ ml: 2 }}
                  >
                    <AddIcon />
                  </IconButton>
                </Typography>
                {viewMode === 'list' && (
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
                      onClick={() => setStatusFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={statusFilter === 'new' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter('new')}
                      color="primary"
                    >
                      New ({tasks.filter(t => t.status === 'new').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter('pending')}
                      color="warning"
                    >
                      Pending ({tasks.filter(t => t.status === 'pending').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'remind' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter('remind')}
                      color="warning"
                      sx={{ borderColor: 'warning.main', color: statusFilter === 'remind' ? 'white' : 'warning.main' }}
                    >
                      Remind ({tasks.filter(t => t.status === 'remind').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'completed' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter('completed')}
                      color="success"
                    >
                      Completed ({tasks.filter(t => t.status === 'completed').length})
                    </Button>
                    <Button
                      variant={statusFilter === 'cancelled' ? 'contained' : 'outlined'}
                      size="small"
                      onClick={() => setStatusFilter('cancelled')}
                      color="error"
                    >
                      Cancelled ({tasks.filter(t => t.status === 'cancelled').length})
                    </Button>
                  </Box>
                )}
              </Box>

              {viewMode === 'list' ? (
                // Liste görünümü
                <Grid container spacing={2}>
                  {tasks
                    .filter(task => statusFilter === 'all' || task.status === statusFilter)
                    .map((task) => (
                      <Grid item key={task._id}>
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
                          onClick={() => handleTaskClick(task, task.status === 'remind')}
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
                                lineHeight: '1.4em',
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
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {task.description}
                          </Typography>
                          <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                            <Typography 
                              variant="caption" 
                              color={task.remainingTime === 'Overdue' && !['completed', 'cancelled'].includes(task.status) ? 'error.main' : 'text.secondary'} 
                              display="block"
                              sx={{ fontWeight: 'medium' }}
                            >
                              {['completed', 'cancelled'].includes(task.status) ? formatDateTime(task.dueDateTime) : task.remainingTime}
                            </Typography>
                            <Tooltip
                              title={
                                <Box>
                                  <Typography variant="body2">Assigned to: {task.assignedTo?.name || 'Unassigned'}</Typography>
                                  <Typography variant="body2">Created by: {task.createdBy?.name}</Typography>
                                  <Typography variant="body2">Created: {formatDateTime(task.createdAt)}</Typography>
                                  <Typography variant="body2">Due: {formatDateTime(task.dueDateTime)}</Typography>
                                  <Typography variant="body2">Reminder: {formatDateTime(task.reminderDateTime)}</Typography>
                                  <Typography variant="body2">Status: {getStatusText(task.status || 'new')}</Typography>
                                </Box>
                              }
                              placement="top-start"
                            >
                              <IconButton
                                size="small"
                                sx={{ 
                                  '&:hover': { backgroundColor: 'transparent' }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <InfoIcon fontSize="small" color="action" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                </Grid>
              ) : (
                // Kanban görünümü
                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  overflowX: 'auto', 
                  pb: 2,
                  width: '100%',
                  '& > .MuiPaper-root': {
                    flex: '1 1 0', // flex-grow: 1, flex-shrink: 1, flex-basis: 0
                    minWidth: '250px', // minimum genişlik
                    maxWidth: '350px', // maksimum genişlik
                    backgroundColor: '#fff',
                    p: 2,
                    borderRadius: 2,
                    boxShadow: '0 0 10px rgba(0,0,0,0.05)',
                    height: 'fit-content'
                  }
                }}>
                  {['new', 'pending', 'remind', 'completed', 'cancelled'].map((status) => (
                    <Paper key={status} elevation={0}>
                      <Typography variant="h6" sx={{ mb: 2, color: getStatusColor(status) }}>
                        {getStatusText(status)} ({tasks.filter(t => t.status === status).length})
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 2,
                        minHeight: '50px' // Boş kolonlar için minimum yükseklik
                      }}>
                        {tasks
                          .filter(task => task.status === status)
                          .map(task => (
                            <Paper
                              key={task._id}
                              sx={{
                                ...taskCardStyle,
                                width: '100%',
                                minWidth: 'unset',
                                maxWidth: '100%',
                                borderLeft: '4px solid',
                                borderLeftColor: getStatusColor(task.status || 'new'),
                                borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                                borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                                borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                                position: 'relative',
                                opacity: task.status === 'completed' || task.status === 'cancelled' ? 0.7 : 1,
                                backgroundColor: '#fff',
                                boxShadow: task.status === 'remind' ? '0 0 15px rgba(255, 152, 0, 0.5)' : 'none',
                                transition: 'all 0.3s ease-in-out',
                                '&:hover': {
                                  transform: 'scale(1.02)',
                                  boxShadow: task.status === 'remind' 
                                    ? '0 8px 16px rgba(0,0,0,0.1), 0 0 15px rgba(255, 152, 0, 0.5)'
                                    : '0 8px 16px rgba(0,0,0,0.1)',
                                },
                              }}
                              onClick={() => handleTaskClick(task, task.status === 'remind')}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    lineHeight: '1.4em',
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
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {task.description}
                              </Typography>
                              <Box sx={{ mt: 'auto', pt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <Typography 
                                  variant="caption" 
                                  color={task.remainingTime === 'Overdue' && !['completed', 'cancelled'].includes(task.status) ? 'error.main' : 'text.secondary'} 
                                  display="block"
                                  sx={{ fontWeight: 'medium' }}
                                >
                                  {['completed', 'cancelled'].includes(task.status) ? formatDateTime(task.dueDateTime) : task.remainingTime}
                                </Typography>
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="body2">Assigned to: {task.assignedTo?.name || 'Unassigned'}</Typography>
                                      <Typography variant="body2">Created by: {task.createdBy?.name}</Typography>
                                      <Typography variant="body2">Created: {formatDateTime(task.createdAt)}</Typography>
                                      <Typography variant="body2">Due: {formatDateTime(task.dueDateTime)}</Typography>
                                      <Typography variant="body2">Reminder: {formatDateTime(task.reminderDateTime)}</Typography>
                                      <Typography variant="body2">Status: {getStatusText(task.status || 'new')}</Typography>
                                    </Box>
                                  }
                                  placement="top-start"
                                >
                                  <IconButton
                                    size="small"
                                    sx={{ 
                                      '&:hover': { backgroundColor: 'transparent' }
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <InfoIcon fontSize="small" color="action" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Paper>
                          ))}
                      </Box>
                    </Paper>
                  ))}
                </Box>
              )}

              {/* New Task Modal */}
              <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
              >
                <Paper
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    p: 4,
                  }}
                >
                  <IconButton
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                    onClick={() => setIsModalOpen(false)}
                  >
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="h6" component="h2" gutterBottom>
                    New Task
                  </Typography>
                  <form onSubmit={handleCreateTask}>
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

              {/* Task Detail Modal */}
              <Modal
                open={!!selectedTask}
                onClose={() => {
                  setSelectedTask(null);
                  setIsEditing(false);
                  setEditedTask(null);
                }}
              >
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
                  {selectedTask && (
                    <>
                      <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 1 }}>
                        {isEditing && (
                          <IconButton
                            onClick={handleUpdateTask}
                            color="success"
                          >
                            <SaveIcon />
                          </IconButton>
                        )}
                        {!isEditing && (
                          <IconButton
                            onClick={() => {
                              setIsEditing(true);
                              setEditedTask({ ...selectedTask });
                            }}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => {
                            setTaskToDelete(selectedTask);
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        <Tooltip
                          title={
                            <Box>
                              <Typography variant="body2">Assigned to: {selectedTask?.assignedTo?.name || 'Unassigned'}</Typography>
                              <Typography variant="body2">Created by: {selectedTask?.createdBy?.name}</Typography>
                              <Typography variant="body2">Created: {formatDateTime(selectedTask?.createdAt)}</Typography>
                              <Typography variant="body2">Due: {formatDateTime(selectedTask?.dueDateTime)}</Typography>
                              <Typography variant="body2">Reminder: {formatDateTime(selectedTask?.reminderDateTime)}</Typography>
                              <Typography variant="body2">Status: {getStatusText(selectedTask?.status || 'new')}</Typography>
                            </Box>
                          }
                          placement="bottom-end"
                        >
                          <IconButton size="small">
                            <InfoIcon fontSize="small" color="action" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          onClick={() => {
                            setSelectedTask(null);
                            setIsEditing(false);
                            setEditedTask(null);
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      
                      {!isEditing ? (
                        // View Mode
                        <>
                          <Typography variant="h5" gutterBottom>
                            {selectedTask?.title}
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {selectedTask?.description}
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                            <Typography 
                              variant="subtitle2" 
                              color={selectedTask?.remainingTime === 'Overdue' ? 'error.main' : 'success.main'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {selectedTask?.remainingTime}
                            </Typography>
                          </Box>

                          {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
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
                                onClick={() => handleCompleteTask(selectedTask)}
                                startIcon={<CheckCircleIcon sx={{ fontSize: 18 }} />}
                              >
                                Complete
                              </Button>
                              <Button
                                variant="contained"
                                color="primary"
                                size="small"
                                onClick={(event) => {
                                  setReminderTask(selectedTask);
                                  handlePostponeClick(event);
                                }}
                                startIcon={<ScheduleIcon sx={{ fontSize: 18 }} />}
                              >
                                Postpone
                              </Button>
                              <Button
                                variant="contained"
                                color="error"
                                size="small"
                                onClick={() => handleCancelTask(selectedTask)}
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

              {/* Reminder Dialog */}
              <Dialog
                open={!!reminderTask}
                maxWidth="sm"
                fullWidth
                onClose={handleCloseReminder}
              >
                <DialogTitle sx={{ pr: 6 }}>
                  Task Reminder
                  <Box sx={{ position: 'absolute', right: 8, top: 8, display: 'flex', gap: 1 }}>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => {
                        setTaskToDelete(reminderTask);
                        setDeleteConfirmOpen(true);
                        setReminderTask(null);
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                    <Tooltip
                      title={
                        <Box>
                          <Typography variant="body2">Assigned to: {reminderTask?.assignedTo?.name || 'Unassigned'}</Typography>
                          <Typography variant="body2">Created by: {reminderTask?.createdBy?.name}</Typography>
                          <Typography variant="body2">Created: {formatDateTime(reminderTask?.createdAt)}</Typography>
                          <Typography variant="body2">Due: {formatDateTime(reminderTask?.dueDateTime)}</Typography>
                          <Typography variant="body2">Reminder: {formatDateTime(reminderTask?.reminderDateTime)}</Typography>
                          <Typography variant="body2">Status: {getStatusText(reminderTask?.status || 'new')}</Typography>
                        </Box>
                      }
                      placement="bottom-end"
                    >
                      <IconButton size="small">
                        <InfoIcon fontSize="small" color="action" />
                      </IconButton>
                    </Tooltip>
                    <IconButton onClick={handleCloseReminder}>
                      <CloseIcon />
                    </IconButton>
                  </Box>
                </DialogTitle>
                <DialogContent>
                  {reminderTask && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" gutterBottom>
                        {reminderTask.title}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {reminderTask.description}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Due: {formatDateTime(reminderTask.dueDateTime)}
                      </Typography>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ 
                  p: 2, 
                  gap: 1,
                  display: 'flex',
                  justifyContent: 'flex-end',
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
                    onClick={() => reminderTask && handleCompleteTask(reminderTask)}
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
                    onClick={async () => {
                      if (reminderTask) {
                        await handleCancelTask(reminderTask);
                        setReminderTask(null);
                        setPostponeAnchorEl(null);
                      }
                    }}
                    startIcon={<CloseIcon sx={{ fontSize: 18 }} />}
                  >
                    Cancel
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Postpone Menu */}
              <Menu
                anchorEl={postponeAnchorEl}
                open={Boolean(postponeAnchorEl)}
                onClose={handlePostponeClose}
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

              {/* Delete Confirmation Dialog */}
              <Dialog
                open={deleteConfirmOpen}
                onClose={() => {
                  setDeleteConfirmOpen(false);
                  setTaskToDelete(null);
                }}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle sx={{ pb: 1 }}>Delete Task</DialogTitle>
                <DialogContent>
                  <Typography>
                    Are you sure you want to delete "{taskToDelete?.title}"?
                    This action cannot be undone.
                  </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                  <Button
                    onClick={() => {
                      setDeleteConfirmOpen(false);
                      setTaskToDelete(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDeleteTask(taskToDelete?._id, taskToDelete?.title)}
                    startIcon={<DeleteIcon />}
                  >
                    Delete
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              minHeight: '60vh' 
            }}>
              <CircularProgress />
            </Box>
          )}
        </Box>
      </Box>

      {/* Sağ Activity Log */}
      <Drawer
        variant="permanent"
        anchor="right"
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
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <Typography variant="h6" sx={{ px: 2, mb: 2 }}>
            Activity Log
          </Typography>
          <List>
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
      </Drawer>
    </Box>
  );
};

export default Dashboard; 