import { useState, useEffect } from 'react';

const useMinuteTimer = () => {
  const [minute, setMinute] = useState(new Date().getMinutes());

  useEffect(() => {
    const updateMinute = () => {
      const now = new Date();
      const currentMinute = now.getMinutes();
      
      if (currentMinute !== minute) {
        setMinute(currentMinute);
      }
    };

    // İlk gecikmeyi hesapla (bir sonraki dakikanın başlangıcına kadar)
    const now = new Date();
    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // İlk timer'ı bir sonraki dakikanın başında başlat
    const timer = setTimeout(() => {
      updateMinute();
      // Sonraki güncellemeler için her dakika başında çalışacak interval'i başlat
      const interval = setInterval(updateMinute, 60000);
      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [minute]);

  return minute;
};

export default useMinuteTimer; 