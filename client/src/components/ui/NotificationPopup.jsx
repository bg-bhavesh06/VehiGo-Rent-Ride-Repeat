import React from 'react';

const NotificationPopup = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-sm bg-gray-900 text-white py-3 px-4 rounded-xl shadow-xl flex items-center justify-between gap-4 text-xs font-semibold">
      <span>{notification.message}</span>
      <button onClick={onClose} className="text-gray-400 hover:text-white font-bold cursor-pointer">✕</button>
    </div>
  );
};

export default NotificationPopup;
