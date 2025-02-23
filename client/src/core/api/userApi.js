import axios from '../utils/axios';

export const userApi = {
  getUsers: () => axios.get('/users'),
  getCurrentUser: () => axios.get('/users/me'),
  updateUser: (userId, userData) => {
    console.log('Updating user:', { userId, userData }); // Debug için
    return axios.put(`/users/${userId}`, userData);
  },
  updateUserRole: (userId, roleName) => {
    console.log('Updating user role:', { userId, roleName }); // Debug için
    return axios.put(`/users/${userId}/role`, { roleName });
  },
}; 