import React, { useContext } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AuthContext from '../context/AuthContext';

export const Layout = ({ children, title }) => {
  const { theme } = useContext(AuthContext);
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${
      isDark ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      <Sidebar />
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen">
        <Navbar title={title} />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
