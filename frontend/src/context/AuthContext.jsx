import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [traineeId, setTraineeId] = useState(null);
  const [traineeName, setTraineeName] = useState(null);
  const [user, setUser] = useState(null); // Full trainee details
  const [loading, setLoading] = useState(true);
  
  // Theme state: default to dark
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  // Theme Sync on Mount and Change
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      
      const { access_token, role: userRole, trainee_id, trainee_name } = response.data;
      
      // Store all fields in localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('role', userRole);
      localStorage.setItem('trainee_id', trainee_id);
      localStorage.setItem('trainee_name', trainee_name);
      
      // Update state
      setToken(access_token);
      setRole(userRole);
      setTraineeId(trainee_id);
      setTraineeName(trainee_name);
      
      // Query full profile details
      const meResponse = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      });
      setUser(meResponse.data);
      localStorage.setItem('user', JSON.stringify(meResponse.data));

      setLoading(false);
      return { token: access_token, role: userRole, trainee_id, trainee_name, user: meResponse.data };
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('trainee_id');
    localStorage.removeItem('trainee_name');
    localStorage.removeItem('user');
    setToken(null);
    setRole(null);
    setTraineeId(null);
    setTraineeName(null);
    setUser(null);
    setLoading(false);
    
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  // Rehydrate state from localStorage on mount
  useEffect(() => {
    const rehydrate = async () => {
      const savedToken = localStorage.getItem('token');
      const savedRole = localStorage.getItem('role');
      const savedTraineeId = localStorage.getItem('trainee_id');
      const savedTraineeName = localStorage.getItem('trainee_name');
      const savedUser = localStorage.getItem('user');

      if (savedToken) {
        setToken(savedToken);
        setRole(savedRole);
        setTraineeId(savedTraineeId);
        setTraineeName(savedTraineeName);
        
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        try {
          const meResponse = await api.get('/auth/me');
          const freshUser = meResponse.data;
          setUser(freshUser);
          // Always sync trainee_id from the fresh user response so stale localStorage is corrected
          setTraineeId(freshUser.id);
          setTraineeName(freshUser.trainee_name);
          localStorage.setItem('user', JSON.stringify(freshUser));
          localStorage.setItem('trainee_id', freshUser.id);
          localStorage.setItem('trainee_name', freshUser.trainee_name);
        } catch (e) {
          console.error("Session rehydration invalid, logging out.", e);
          logout();
        }
      }
      setLoading(false);
    };
    rehydrate();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      token, 
      role, 
      trainee_id: traineeId, 
      trainee_name: traineeName, 
      student_id: traineeId, // legacy support
      student_name: traineeName, // legacy support
      user, 
      loading, 
      login, 
      logout,
      setUser,
      theme,
      toggleTheme
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
