import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  IconButton,
  AppBar,
  Toolbar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import axios from '../core/utils/axios';

// Components
import ViewToggle from '../features/tasks/components/ViewToggle';
import TaskList from '../features/tasks/components/TaskList';
import KanbanBoard from '../features/tasks/components/KanbanBoard';
import TaskFilters from '../features/tasks/components/TaskFilters';
import TaskModal from '../features/tasks/components/TaskModal';
import CreateTaskModal from '../features/tasks/components/CreateTaskModal';
import SideDrawer from '../features/layout/components/SideDrawer';
import ActivityLog from '../features/tasks/components/ActivityLog';

// Utils
import { formatDateTime, roundToMinute } from '../core/utils/dateUtils';
import useTaskReminder from '../hooks/useTaskReminder';

// Notification sound
const notificationSound = '/sounds/bell.wav';

// Scroll çubuğu genişliğini hesapla
const scrollbarWidth = {
  current: window.innerWidth - document.documentElement.clientWidth
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [selectedTask, setSelectedTask] = useState(null);
  const audioRef = React.useRef(new Audio(notificationSound));
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleTaskClick = async (task) => {
    setSelectedTask(task);
    
    // Eğer görev "new" durumundaysa, "pending" durumuna güncelle
    if (task.status === 'new') {
      try {
        const response = await axios.put(`/tasks/${task._id}`, {
          ...task,
          status: 'pending'
        });
        setTasks(prevTasks => prevTasks.map(t => 
          t._id === task._id ? response.data : t
        ));
        addEvent('update', `Task "${task.title}" status changed from new to pending`, response.data);
      } catch (error) {
        console.error('Error updating task status:', error);
      }
    }
  };

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

  const handleUpdateTask = async (updatedTask) => {
    try {
      const response = await axios.put(`/tasks/${updatedTask._id}`, {
        ...updatedTask,
        //dueDateTime: new Date(updatedTask.dueDateTime).toISOString(),
        reminderDateTime: new Date(updatedTask.reminderDateTime).toISOString()
      });
      setTasks(prevTasks => prevTasks.map(task => 
        task._id === updatedTask._id ? response.data : task
      ));
      addEvent('update', `Task "${response.data.title}" has been updated`, response.data);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCompleteTask = async (task) => {
    try {
      const response = await axios.put(`/tasks/${task._id}`, {
        ...task,
        status: 'completed'
      });
      setTasks(prevTasks => prevTasks.map(t => 
        task._id === t._id ? response.data : t
      ));
      addEvent('complete', `Task "${task.title}" has been completed`, response.data);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const handleCancelTask = async (task) => {
    try {
      const response = await axios.put(`/tasks/${task._id}`, {
        ...task,
        status: 'cancelled'
      });
      setTasks(prevTasks => prevTasks.map(t => 
        t._id === task._id ? response.data : t
      ));
      addEvent('cancel', `Task "${task.title}" has been cancelled`, response.data);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error cancelling task:', error);
    }
  };

  const handleDeleteTask = async (task) => {
    try {
      await axios.delete(`/tasks/${task._id}`);
      setTasks(tasks.filter(t => t._id !== task._id));
      addEvent('delete', `Task "${task.title}" has been deleted`, task);
      setSelectedTask(null);
            } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handlePostponeTask = async (minutes, customDate) => {
    if (!selectedTask) return;

    try {
      let newReminderDate;
      if (customDate) {
        newReminderDate = customDate;
      } else {
        newReminderDate = roundToMinute(new Date());
      newReminderDate.setMinutes(newReminderDate.getMinutes() + minutes);
      }

      const response = await axios.put(`/tasks/${selectedTask._id}`, {
        ...selectedTask,
        status: 'pending',
        reminderDateTime: newReminderDate.toISOString()
      });

      setTasks(prevTasks => prevTasks.map(task => 
        task._id === selectedTask._id ? response.data : task
      ));

      const timeText = minutes === 60 ? "1 hour" : 
                      minutes === 1440 ? "24 hours" : 
                      minutes ? `${minutes} minutes` :
                      formatDateTime(customDate);

      addEvent('postpone', `Task "${selectedTask.title}" has been postponed by ${timeText}`, response.data);
      setSelectedTask(null);
    } catch (error) {
      console.error('Error postponing task:', error);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await axios.post('/tasks', {
        ...taskData,
        status: 'new'
      });
      await fetchTasks(); // Tüm görevleri yeniden yükle
      addEvent('create', `Task "${response.data.title}" has been created`, response.data);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Calculate task counts for filters
  const taskCounts = {
    new: tasks.filter(t => t.status === 'new').length,
    pending: tasks.filter(t => t.status === 'pending').length,
    remind: tasks.filter(t => t.status === 'remind').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    cancelled: tasks.filter(t => t.status === 'cancelled').length
  };

  // Ses çalma fonksiyonu
  const playNotificationSound = () => {
    audioRef.current.play().catch(error => {
      console.error('Error playing notification sound:', error);
    });
  };

  // Hatırlatma hook'unu kullan
  useTaskReminder({
    tasks,
    onTasksUpdate: setTasks,
    onEventAdd: addEvent,
    onPlaySound: playNotificationSound
  });

  return (
    <Box sx={{ 
      display: 'flex',
      overflowX: 'hidden', // Yatay scroll'u engelle
      // Her zaman scroll çubuğu için yer ayır
      '&::-webkit-scrollbar': {
        width: `${scrollbarWidth.current}px`,
      },
    }}>
      <AppBar position="fixed" sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        width: `calc(100% - ${scrollbarWidth.current}px)` // Scroll çubuğu genişliğini çıkar
      }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
            sx={{ mr: 2 }}
          >
            <FilterListIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Remainder
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ViewToggle 
              viewMode={viewMode} 
              onViewChange={setViewMode} 
            />

            <Typography variant="subtitle1">
              {currentTime.toLocaleTimeString('tr-TR')}
            </Typography>
            
            <Typography variant="subtitle1">
              {user?.name || 'Ad Soyad'}
            </Typography>

            <Tooltip title="Aktivite Günlüğü">
              <IconButton 
                color="inherit" 
                onClick={() => setIsActivityLogOpen(!isActivityLogOpen)}
              >
                <HistoryIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Ayarlar">
              <IconButton color="inherit" onClick={() => navigate('/settings')}>
                <SettingsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Çıkış Yap">
              <IconButton color="inherit" onClick={handleLogout}>
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <SideDrawer 
        open={isSideDrawerOpen} 
        onClose={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
        user={user}
      />

      <Box component="main" sx={{ 
        flexGrow: 1,
        p: 3,
        marginTop: '64px',
        width: {
          xs: '100%',
          md: 'calc(100% - 288px)'
        },
        height: 'calc(100vh - 64px)', // Viewport yüksekliğinden AppBar'ı çıkar
        overflowY: 'auto', // Dikey scroll'u içerik alanına ekle
        // Scroll çubuğu stilini özelleştir
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
                    '&:hover': {
            background: '#666',
          },
        },
      }}>
          {!isLoading ? (
            <Box sx={{ my: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h4" component="h1">
                  Tasks
                </Typography>
                  <IconButton 
                    color="primary" 
                  onClick={() => setIsCreateModalOpen(true)}
                          sx={{
                    backgroundColor: 'rgba(25, 118, 210, 0.08)',
                            '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)',
                    }
                  }}
                >
                  <AddIcon />
                              </IconButton>
                          </Box>
              {viewMode === 'list' && (
                <TaskFilters
                  statusFilter={statusFilter}
                  onFilterChange={setStatusFilter}
                  taskCounts={taskCounts}
                />
              )}
                              </Box>

            {viewMode === 'list' ? (
              <TaskList
                tasks={tasks}
                statusFilter={statusFilter}
                onTaskClick={handleTaskClick}
              />
            ) : (
              <KanbanBoard
                tasks={tasks}
                onTaskClick={handleTaskClick}
              />
            )}

            <TaskModal
              task={selectedTask}
              open={!!selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdate={handleUpdateTask}
              onComplete={handleCompleteTask}
              onPostpone={handlePostponeTask}
              onCancel={handleCancelTask}
              onDelete={handleDeleteTask}
            />

            <CreateTaskModal
              open={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onCreate={handleCreateTask}
            />
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

      <ActivityLog
        events={events}
        drawerWidth={288}
        open={isActivityLogOpen}
        onClose={() => setIsActivityLogOpen(!isActivityLogOpen)}
      />
    </Box>
  );
};

export default Dashboard; 