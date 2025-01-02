import { useEffect } from 'react';
import axios from '../utils/axios';

const useTaskReminder = ({ tasks, onTasksUpdate, onEventAdd, onPlaySound }) => {
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      tasks.forEach(task => {
        const reminderTime = new Date(task.reminderDateTime);
        if (
          task.status !== 'completed' && 
          task.status !== 'cancelled' && 
          task.status !== 'remind' && 
          reminderTime <= now
        ) {
          handleTaskReminder(task);
        }
      });
    };

    const handleTaskReminder = async (task) => {
      try {
        const response = await axios.put(`/tasks/${task._id}`, {
          ...task,
          status: 'remind'
        });
        
        onTasksUpdate(prevTasks => prevTasks.map(t => 
          t._id === task._id ? response.data : t
        ));
        
        onEventAdd('remind', `Task "${task.title}" reminder time has arrived`, response.data);
        
        onPlaySound();
      } catch (error) {
        console.error('Error updating task reminder status:', error);
      }
    };

    const scheduleNextCheck = () => {
      const now = new Date();
      const nextMinute = new Date(now);
      nextMinute.setSeconds(0);
      nextMinute.setMilliseconds(0);
      nextMinute.setMinutes(nextMinute.getMinutes() + 1);
      
      const delay = nextMinute.getTime() - now.getTime();
      return setTimeout(() => {
        checkReminders();
        // Bir sonraki kontrol için yeni timeout ayarla
        timeoutId = scheduleNextCheck();
      }, delay);
    };

    // İlk kontrol
    checkReminders();

    // İlk timeout'u ayarla
    let timeoutId = scheduleNextCheck();

    // Cleanup
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [tasks, onTasksUpdate, onEventAdd, onPlaySound]);
};

export default useTaskReminder; 