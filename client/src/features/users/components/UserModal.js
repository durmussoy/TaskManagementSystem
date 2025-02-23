import React, { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  IconButton,
  Avatar,
  Grid,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { userApi } from '../../../core/api/userApi';

const UserModal = ({ open, onClose, user, onUserUpdate }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedUser, setEditedUser] = useState({
    username: '',
    name: '',
    password: '',
    role: ''
  });
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role?.toLowerCase() === 'admin';
  
  console.log('Current User:', currentUser);
  console.log('Is Admin:', isAdmin);
  console.log('Current User Role:', currentUser.role);

  // Edit mode'u başlat
  const handleEditClick = () => {
    setEditMode(true);
    setEditedUser({
      username: user.username,
      name: user.name,
      password: '',
      role: user.role?.name || 'User'
    });
  };

  // Rol menüsünü aç/kapat
  const handleRoleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setAnchorEl(null);
  };

  // Rol seçimi
  const handleRoleSelect = (roleName) => {
    setEditedUser(prev => ({
      ...prev,
      role: roleName
    }));
    handleRoleMenuClose();
  };

  // Değişiklikleri kaydet
  const handleSave = async () => {
    try {
      setLoading(true);
      const updateData = {
        username: editedUser.username,
        name: editedUser.name
      };
      
      // Şifre değiştirilmişse ekle
      if (editedUser.password) {
        updateData.password = editedUser.password;
      }

      // Önce kullanıcı bilgilerini güncelle
      await userApi.updateUser(user._id, updateData);

      // Rol değişmişse, rolü güncelle
      if (editedUser.role && editedUser.role !== user.role?.name) {
        await userApi.updateUserRole(user._id, editedUser.role);
      }

      setEditMode(false);
      if (onUserUpdate) {
        await onUserUpdate();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      alert(error.response?.data?.message || 'Error updating user');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="user-modal-title"
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 600,
          bgcolor: 'background.paper',
          boxShadow: 24,
          borderRadius: 1,
          p: 4,
        }}
      >
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 80,
              height: 80,
              mr: 2,
              bgcolor: 'primary.main',
              fontSize: '2rem',
            }}
          >
            {user.name?.charAt(0)}
          </Avatar>
          <Box>
            {editMode ? (
              <Box>
                <TextField
                  label="Name"
                  value={editedUser.name}
                  onChange={(e) => setEditedUser({ ...editedUser, name: e.target.value })}
                  fullWidth
                  margin="dense"
                />
                <TextField
                  label="Username"
                  value={editedUser.username}
                  onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                  fullWidth
                  margin="dense"
                />
              </Box>
            ) : (
              <>
                <Typography variant="h5" component="h2">
                  {user.name}
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  {user.username}
                </Typography>
              </>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <List>
          {editMode && (
            <ListItem>
              <ListItemIcon>
                <PersonIcon />
              </ListItemIcon>
              <ListItemText
                primary="New Password"
                secondary={
                  <TextField
                    type="password"
                    value={editedUser.password}
                    onChange={(e) => setEditedUser({ ...editedUser, password: e.target.value })}
                    fullWidth
                    margin="dense"
                    placeholder="Leave blank to keep current password"
                  />
                }
              />
            </ListItem>
          )}

          <ListItem>
            <ListItemIcon>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText
              primary="Role"
              secondary={editMode ? editedUser.role : user.role?.name || 'User'}
            />
            {isAdmin && editMode && (
              <>
                <IconButton 
                  edge="end" 
                  aria-label="edit role"
                  onClick={handleRoleMenuClick}
                  disabled={loading}
                >
                  <EditIcon />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleRoleMenuClose}
                >
                  <MenuItem onClick={() => handleRoleSelect('User')}>User</MenuItem>
                  <MenuItem onClick={() => handleRoleSelect('Admin')}>Admin</MenuItem>
                </Menu>
              </>
            )}
          </ListItem>

          <ListItem>
            <ListItemIcon>
              <CalendarTodayIcon />
            </ListItemIcon>
            <ListItemText
              primary="Registration Date"
              secondary={new Date(user.createdAt).toLocaleDateString()}
            />
          </ListItem>
        </List>

        {isAdmin && (
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            {editMode ? (
              <>
                <Button
                  onClick={() => setEditMode(false)}
                  sx={{ mr: 1 }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={loading}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditClick}
                disabled={loading}
              >
                Edit User
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default UserModal; 