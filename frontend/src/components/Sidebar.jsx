import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Grid3x3, Users, BarChart2, User, CheckSquare, LogOut, Code2, Bell, X, Check } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export const Sidebar = () => {
  const { logout, role, trainee_id, trainee_name, user, theme } = useContext(AuthContext);
  const isDark = theme === 'dark';
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (role) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // Poll every 10 seconds
      return () => clearInterval(interval);
    }
  }, [role]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const adminLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/grid', label: 'Task Grid', icon: Grid3x3 },
    { to: '/trainees', label: 'Trainees', icon: Users },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/analytics', label: 'Analytics', icon: BarChart2 },
  ];

  const traineeLinks = [
    { to: '/trainee/progress', label: 'My Progress', icon: User },
    { to: '/trainee/tasks', label: 'My Tasks', icon: CheckSquare },
  ];

  const links = role === 'admin' ? adminLinks : traineeLinks;
  
  const getInitials = (name) => {
    if (!name) return 'T';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const displayName = role === 'admin' ? 'Admin User' : (trainee_name || user?.trainee_name || 'Trainee');
  const initials = getInitials(displayName);

  return (
    <>
      <aside className={`w-[240px] flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 border-r ${
        isDark 
          ? 'bg-gray-900 border-gray-800 text-white' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        {/* Brand Header */}
        <div className={`p-5 border-b flex items-center gap-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Code2 className="text-white h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className={`font-extrabold text-sm tracking-tight leading-none truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              TC TraineeTracker
            </h1>
            <span className="text-[9px] text-indigo-500 font-black tracking-wider uppercase">Portal Management</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {links.map((link, idx) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={idx}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-500 border-l-4 border-indigo-600 pl-3 font-black'
                      : isDark 
                        ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate">{link.label}</span>
              </NavLink>
            );
          })}

          {(role === 'trainee' || role === 'admin') && (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                isOpen
                  ? 'bg-indigo-600/15 text-indigo-500 font-black'
                  : isDark 
                    ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Bell className={`h-5 w-5 shrink-0 transition-transform ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
                <span className="truncate">Notifications</span>
              </div>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {/* User Info & Logout (Bottom) */}
        <div className={`p-4 border-t shrink-0 ${
          isDark ? 'border-gray-800 bg-gray-950/40' : 'border-gray-200 bg-gray-50/50'
        }`}>
          <div className="flex items-center gap-3 mb-4 min-w-0">
            {/* Initials Circle */}
            <div className="h-10 w-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-500 font-extrabold border border-indigo-500/30 shrink-0">
              {initials}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-extrabold truncate leading-tight mb-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {displayName}
              </p>
              {/* Role Badge */}
              <span className={`inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                role === 'admin' 
                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                  : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
              }`}>
                {role}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      {/* Slide-out Drawer */}
      {(role === 'trainee' || role === 'admin') && (
        <div
          className={`fixed top-0 h-screen w-80 shadow-2xl z-20 transition-all duration-300 flex flex-col border-r ${
            isOpen ? 'left-[240px] opacity-100 visible' : 'left-[100px] opacity-0 invisible pointer-events-none'
          } ${
            isDark 
              ? 'bg-gray-900/95 border-gray-800 text-white backdrop-blur-md' 
              : 'bg-white/95 border-gray-200 text-gray-900 backdrop-blur-md'
          }`}
        >
          {/* Drawer Header */}
          <div className={`p-4 border-b flex items-center justify-between shrink-0 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-indigo-500" />
              <h2 className="font-extrabold text-sm uppercase tracking-wider">Notifications</h2>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'hover:bg-gray-800 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 space-y-2">
                <Bell className="h-8 w-8 text-gray-600/50 animate-pulse" />
                <p className="text-xs font-semibold">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 rounded-xl border transition-all relative group ${
                    n.is_read 
                      ? isDark 
                        ? 'bg-gray-950/20 border-gray-800/50 text-gray-400' 
                        : 'bg-gray-50/50 border-gray-100 text-gray-500'
                      : isDark 
                        ? 'bg-indigo-950/20 border-indigo-900/50 text-white' 
                        : 'bg-indigo-50/50 border-indigo-100 text-gray-900 shadow-sm'
                  }`}
                >
                  <div className="pr-6">
                    <p className="font-extrabold text-xs mb-1">{n.title}</p>
                    <p className="text-[11px] leading-relaxed mb-2">{n.message}</p>
                    <span className="text-[9px] font-bold text-gray-500">
                      {new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  {!n.is_read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      title="Mark as read"
                      className="absolute top-3 right-3 p-1 rounded-lg bg-indigo-600/10 text-indigo-500 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
