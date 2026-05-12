import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>
      <footer className="bg-dark-900 text-white py-6 text-center">
        <p>&copy; {new Date().getFullYear()} AutoBook Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
