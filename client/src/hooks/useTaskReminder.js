import { useEffect } from 'react';

const useTaskReminder = ({ tasks, onTasksUpdate, onEventAdd, onPlaySound }) => {
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentUserId = JSON.parse(localStorage.getItem('user')).id;
      let hasChanges = false;

      tasks.forEach(task => {
        if (task.status === 'pending') {
          // Kullanıcıya özel hatırlatma ayarını bul
          const userReminderSetting = task.reminderSettings?.find(
            setting => setting.userId === currentUserId
          );

          if (userReminderSetting) {
            const reminderTime = new Date(userReminderSetting.reminderDateTime);
            if (reminderTime <= now) {
              // Görev hatırlatma zamanı gelmiş
              hasChanges = true;
              onTasksUpdate(prevTasks => 
                prevTasks.map(t => 
                  t._id === task._id ? { ...t, status: 'remind' } : t
                )
              );
              onEventAdd('reminder', `"${task.title}" görevi için hatırlatma zamanı geldi!`, task);
              onPlaySound();
            }
          }
        }
      });
    };

    // Her dakika kontrol et
    const interval = setInterval(checkReminders, 60000);
    
    // İlk yüklemede de kontrol et
    checkReminders();

    return () => clearInterval(interval);
  }, [tasks, onTasksUpdate, onEventAdd, onPlaySound]);
};

export default useTaskReminder; 