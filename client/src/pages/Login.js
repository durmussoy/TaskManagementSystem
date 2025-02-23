import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import axios from '../core/utils/axios';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login isteği gönderiliyor:', formData); // Debug için

      const response = await axios.post('/users/login', formData);
      console.log('Login response:', response); // Tüm response'u görelim
      console.log('Login response data:', response.data); // Response data'yı görelim
      console.log('Token:', response.data.token); // Token'ı görelim
      console.log('User:', response.data.user); // User bilgisini görelim

      if (!response.data.token) {
        throw new Error('Token alınamadı');
      }

      // Token ve kullanıcı bilgilerini kaydet
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // LocalStorage'a kaydedildi mi kontrol et
      console.log('LocalStorage token:', localStorage.getItem('token'));
      console.log('LocalStorage user:', localStorage.getItem('user'));

      // Axios instance'ına token'ı ekle
      axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      console.log('Axios headers:', axios.defaults.headers.common['Authorization']); // Headers'ı kontrol et

      navigate('/dashboard');
    } catch (error) {
      console.error('Login error details:', error); // Detaylı hata bilgisi
      if (error.response) {
        console.error('Error response:', error.response);
        console.error('Error data:', error.response.data);
      }
      setError(error.response?.data?.message || error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Sign in
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 