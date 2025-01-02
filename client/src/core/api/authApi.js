import axios from 'axios';

const API_URL = 'http://localhost:5000/api/users';

export const authApi = {
    login: async (credentials) => {
        const response = await axios.post(`${API_URL}/login`, credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await axios.post(`${API_URL}/register`, userData);
        return response.data;
    },

    getCurrentUser: async () => {
        const token = localStorage.getItem('token');
        if (!token) return null;

        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
}; 