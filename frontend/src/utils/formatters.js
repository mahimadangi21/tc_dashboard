export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatHours = (hours) => {
  if (hours == null) return '0 hrs';
  return `${Number(hours).toFixed(1)} hrs`;
};

export const formatPercent = (value, total) => {
  if (!total) return '0%';
  return `${Math.round((value / total) * 100)}%`;
};
