import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Calendar, User, Sun, Moon } from 'lucide-react';
import { formatDate } from '../utils/formatters';

export const Navbar = ({ title }) => {
  const { user, role, trainee_name, theme, toggleTheme } = useContext(AuthContext);
  const today = new Date();
  const isDark = theme === 'dark';

  const nameToDisplay = role === 'admin' ? 'Admin' : (trainee_name || user?.trainee_name || 'Trainee');
  const firstName = nameToDisplay.split(' ')[0];

  return (
    <header className={`h-16 flex items-center justify-between px-8 sticky top-0 z-20 backdrop-blur-md border-b transition-all duration-300 ${
      isDark 
        ? 'border-gray-800 bg-gray-900/60 text-white' 
        : 'border-gray-200 bg-white/80 text-gray-900 shadow-sm'
    }`}>
      <div className="flex flex-col">
        <h2 className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
          {title || 'Dashboard'}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isDark 
              ? 'bg-gray-950/40 border-gray-850 hover:bg-gray-800 text-amber-400' 
              : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-indigo-600'
          }`}
          title="Toggle Theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Date Display */}
        <div className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-1.5 rounded-xl border ${
          isDark 
            ? 'bg-gray-950/40 border-gray-850 text-gray-400' 
            : 'bg-gray-50 border-gray-200 text-gray-600'
        }`}>
          <Calendar className="h-4 w-4 text-indigo-500" />
          <span>{formatDate(today)}</span>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className={`text-xs font-bold leading-tight ${isDark ? 'text-white' : 'text-gray-850'}`}>
              Welcome, {firstName}
            </p>
            <span className="text-[10px] text-indigo-500 font-extrabold tracking-wider uppercase">Active Session</span>
          </div>
          <div className={`h-9 w-9 rounded-full flex items-center justify-center border shrink-0 ${
            isDark 
              ? 'bg-indigo-600/10 border-indigo-500/20 text-indigo-400' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-600'
          }`}>
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
