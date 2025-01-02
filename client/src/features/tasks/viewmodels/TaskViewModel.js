import { useState, useCallback } from 'react';
import { taskApi } from '../../../core/api/taskApi';

export const useTaskViewModel = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchTasks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await taskApi.getAllTasks();
            setTasks(response);
        } catch (err) {
            setError(err.response?.data?.message || 'Görevler yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    }, []);

    const createTask = async (taskData) => {
        try {
            setLoading(true);
            setError(null);
            const newTask = await taskApi.createTask(taskData);
            setTasks(prev => [...prev, newTask]);
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Görev oluşturulurken bir hata oluştu');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updateTask = async (taskId, taskData) => {
        try {
            setLoading(true);
            setError(null);
            const updatedTask = await taskApi.updateTask(taskId, taskData);
            setTasks(prev => prev.map(task => 
                task._id === taskId ? updatedTask : task
            ));
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Görev güncellenirken bir hata oluştu');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            setLoading(true);
            setError(null);
            await taskApi.deleteTask(taskId);
            setTasks(prev => prev.filter(task => task._id !== taskId));
            return true;
        } catch (err) {
            setError(err.response?.data?.message || 'Görev silinirken bir hata oluştu');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        tasks,
        loading,
        error,
        fetchTasks,
        createTask,
        updateTask,
        deleteTask
    };
}; 