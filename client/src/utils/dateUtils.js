export const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, 16);
};

export const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

export const roundToMinute = (date) => {
  const newDate = new Date(date);
  newDate.setSeconds(0);
  newDate.setMilliseconds(0);
  return newDate;
}; 