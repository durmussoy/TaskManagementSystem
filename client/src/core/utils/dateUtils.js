export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const roundToMinute = (date) => {
  const d = new Date(date);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d;
}; 