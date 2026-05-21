import React from 'react';

import AuthContext from '../context/AuthContext';

export const SummaryCard = ({ title, value, icon: Icon, description, trendColor = 'text-brand-400' }) => {
  const { theme } = React.useContext(AuthContext);
  const isDark = theme === 'dark';

  return (
    <div className={`p-6 rounded-2xl transition-all duration-300 border shadow-md ${
      isDark ? 'glass-card text-white border-white/5' : 'bg-white border-gray-200 text-gray-900'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl border flex items-center justify-center ${trendColor} ${
          isDark ? 'bg-gray-900/60 border-gray-800' : 'bg-gray-50 border-gray-150'
        }`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {description && (
        <p className={`text-xs font-medium leading-normal ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{description}</p>
      )}
    </div>
  );
};

export default SummaryCard;
