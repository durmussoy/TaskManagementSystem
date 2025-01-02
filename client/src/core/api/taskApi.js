import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tasks';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const taskApi = {
    getAllTasks: async () => {
        const response = await axios.get(API_URL, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    createTask: async (taskData) => {
        const response = await axios.post(API_URL, taskData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    updateTask: async (taskId, taskData) => {
        const response = await axios.put(`${API_URL}/${taskId}`, taskData, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    deleteTask: async (taskId) => {
        const response = await axios.delete(`${API_URL}/${taskId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    }
}; 