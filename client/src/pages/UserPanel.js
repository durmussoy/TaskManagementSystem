import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  IconButton,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { userApi } from '../core/api/userApi';
import SideDrawer from '../features/layout/components/SideDrawer';
import UserModal from '../features/users/components/UserModal';

const UserPanel = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [isSideDrawerOpen, setIsSideDrawerOpen] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

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
    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Session expired. Please login again.');
        navigate('/login');
        return;
      }

      const response = await userApi.getUsers();
      console.log('API Response:', response);
      
      if (response.data) {
        setUsers(response.data);
      } else {
        setError('Could not fetch user data.');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      
      let errorMessage = 'An error occurred while loading users.';
      
      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          navigate('/login');
        }
      } else if (error.request) {
        errorMessage = 'Could not connect to server. Please check your internet connection.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
    setSelectedUser(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '60vh' 
        }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ mt: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      );
    }

    return (
      <Box sx={{ my: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            All Users
          </Typography>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              {users.length === 0 ? (
                <Typography variant="body1" sx={{ textAlign: 'center', py: 2 }}>
                  No users found.
                </Typography>
              ) : (
                <List>
                  {users.map((user, index) => (
                    <React.Fragment key={user._id}>
                      <ListItem button onClick={() => handleUserClick(user)}>
                        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Avatar sx={{ mr: 2 }}>{user.name?.charAt(0)}</Avatar>
                          <ListItemText
                            primary={user.name}
                            secondary={user.username}
                          />
                          <Typography variant="body2" color="text.secondary">
                            Registered: {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < users.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Statistics
                </Typography>
                <Typography variant="body1">
                  Total Users: {users.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Information
                </Typography>
                <Typography variant="body1">
                  Last Update: {new Date().toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <UserModal
          open={isUserModalOpen}
          onClose={handleCloseUserModal}
          user={selectedUser}
          onUserUpdate={fetchUsers}
        />
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', overflowX: 'hidden' }}>
      <AppBar position="fixed" sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        color: (theme) => theme.palette.text.primary,
        boxShadow: 1,
      }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setIsSideDrawerOpen(!isSideDrawerOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Remainder
          </Typography>
          <Tooltip title="Logout">
            <IconButton color="inherit" onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      <SideDrawer
        open={isSideDrawerOpen}
        onClose={() => setIsSideDrawerOpen(false)}
        user={user}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          width: {
            xs: '100%',
            md: 'calc(100% - 288px)'
          },
          height: 'calc(100vh - 64px)',
          overflowY: 'auto',
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
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
};

export default UserPanel; 