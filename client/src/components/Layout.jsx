import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import AIChatBot from './AIChatBot';

const Layout = () => {
  const location = useLocation();
  const hideChatBotPaths = ['/', '/login', '/register'];
  const shouldShowChatBot = !hideChatBotPaths.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-gray-50">
        <Outlet />
      </main>
      {shouldShowChatBot && <AIChatBot />}
      <footer className="bg-dark-900 text-white py-6 text-center">
        <p>&copy; {new Date().getFullYear()} RidHub Platform. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
