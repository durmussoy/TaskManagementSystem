export const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'success.main';
    case 'cancelled':
      return 'error.main';
    case 'new':
      return 'primary.main';
    case 'pending':
      return 'warning.main';
    case 'remind':
      return 'warning.main';
    default:
      return 'primary.main';
  }
};

export const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'new':
      return 'New';
    case 'pending':
      return 'Pending';
    case 'remind':
      return 'Reminder';
    default:
      return 'New';
  }
}; 