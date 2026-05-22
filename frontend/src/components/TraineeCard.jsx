import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/formatters';
import { ArrowRight, Trophy, Code, Edit2, Trash2 } from 'lucide-react';
import AuthContext from '../context/AuthContext';

export const TraineeCard = ({ trainee, joiningDate, onEdit, onDelete }) => {
  const { theme, role } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const isAdmin = role === 'admin';

  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const progress = trainee.overall_progress ?? 0;
  const initials = getInitials(trainee.trainee_name);

  // platformProgress is now built dynamically per trainee from actual task data
  const pProgress = trainee.platformProgress || {};

  return (
    <div className={`p-6 rounded-2xl flex flex-col justify-between space-y-5 transition-all duration-300 border hover:-translate-y-1 group ${
      isDark 
        ? 'glass-card border-white/5 hover:border-indigo-500/30 text-white shadow-2xl hover:shadow-indigo-500/10' 
        : 'bg-white border-gray-200 hover:border-indigo-300 text-gray-900 shadow-xl hover:shadow-indigo-500/10'
    }`}>
      {/* Top Section — Avatar + Name */}
      <div className="flex items-start justify-between min-w-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-extrabold border shrink-0 ${
            isDark 
              ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/20' 
              : 'bg-indigo-55 text-indigo-600 border-indigo-200'
          }`}>
            {initials}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-extrabold truncate leading-snug">{trainee.trainee_name}</h4>
              
              {/* Admin quick controls */}
              {isAdmin && (
                <div className="flex items-center gap-0.5 shrink-0 ml-2 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onEdit && onEdit(trainee);
                    }}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isDark 
                        ? 'hover:bg-indigo-500/20 text-gray-400 hover:text-indigo-400' 
                        : 'hover:bg-indigo-50 text-gray-400 hover:text-indigo-600'
                    }`}
                    title="Edit Trainee"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (window.confirm(`Are you sure you want to delete ${trainee.trainee_name}?`)) {
                        onDelete && onDelete(trainee.id);
                      }
                    }}
                    className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                      isDark 
                        ? 'hover:bg-rose-500/20 text-gray-400 hover:text-rose-400' 
                        : 'hover:bg-rose-50 text-gray-400 hover:text-rose-600'
                    }`}
                    title="Delete Trainee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className={`text-[10px] font-semibold mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Joined {formatDate(joiningDate || trainee.created_at || new Date())}
            </p>
          </div>
        </div>

        {/* Progress Donut Ring */}
        <div className="relative flex items-center justify-center shrink-0">
          <svg className="w-12 h-12">
            <circle
              className={isDark ? 'text-gray-800' : 'text-gray-200'}
              strokeWidth="3.5"
              stroke="currentColor"
              fill="transparent"
              r="18"
              cx="24"
              cy="24"
            />
            <circle
              className="text-indigo-500 transition-all duration-700"
              strokeWidth="3.5"
              strokeDasharray={113}
              strokeDashoffset={113 - (113 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="18"
              cx="24"
              cy="24"
              transform="rotate(-90 24 24)"
            />
          </svg>
          <span className="absolute text-[10px] font-black">{Math.round(progress)}%</span>
        </div>
      </div>



      {/* Stats Row grid */}
      <div className={`grid grid-cols-4 gap-2 p-2.5 rounded-xl border shrink-0 shadow-inner ${
        isDark ? 'bg-gray-900/40 border-gray-800/60' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="text-center">
          <span className="text-[11px] font-extrabold text-sky-500 block">{trainee.completed ?? 0}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wider block mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Done</span>
        </div>
        <div className={`text-center border-l ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
          <span className="text-[11px] font-extrabold text-violet-500 block">{trainee.in_progress ?? 0}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wider block mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Active</span>
        </div>
        <div className={`text-center border-l ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
          <span className="text-[11px] font-extrabold text-slate-500 block">{trainee.not_started ?? 0}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wider block mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Unstarted</span>
        </div>
        <div className={`text-center border-l ${isDark ? 'border-gray-800/60' : 'border-gray-200'}`}>
          <span className="text-[11px] font-extrabold text-gray-500 block">{trainee.does_not_apply ?? 0}</span>
          <span className={`text-[8px] font-bold uppercase tracking-wider block mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>N/A</span>
        </div>
      </div>

      {/* View Detail Link */}
      <Link
        to={`/trainees/${trainee.id}`}
        className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-md group ${
          isDark 
            ? 'border-white/5 text-gray-300 bg-white/5 hover:bg-white/10 hover:text-white' 
            : 'border-indigo-100 text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-500'
        }`}
      >
        View Detail
        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
};

export default TraineeCard;
