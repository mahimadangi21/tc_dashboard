import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeStyles = (statusVal) => {
    switch (statusVal) {
      case 'Completed':
        return 'bg-sky-500/20 text-sky-500 dark:text-sky-400 border border-sky-500/30';
      case 'In Progress':
        return 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border border-violet-500/30';
      case 'Not Started':
        return 'bg-slate-550/20 text-slate-400 border border-slate-500/30';
      case 'Does Not Apply':
        return 'bg-gray-500/20 text-gray-400 border border-gray-700/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-700/20';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${getBadgeStyles(status)}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
