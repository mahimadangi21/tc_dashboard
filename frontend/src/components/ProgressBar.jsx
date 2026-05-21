import React from 'react';

import AuthContext from '../context/AuthContext';

export const ProgressBar = ({ progress, label, color = 'bg-brand-500' }) => {
  const { theme } = React.useContext(AuthContext);
  const isDark = theme === 'dark';
  const percentage = Math.min(Math.max(Math.round(progress), 0), 100);

  return (
    <div className="w-full">
      <div className={`flex items-center justify-between mb-1.5 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        <span>{label}</span>
        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{percentage}%</span>
      </div>
      <div className={`w-full h-2.5 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
