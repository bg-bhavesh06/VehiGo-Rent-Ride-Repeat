import React from 'react';
import { Calendar, MessageCircle, User } from 'lucide-react';
import AvatarUpload from '../../components/ui/AvatarUpload';

const Sidebar = ({ user, activeTab, setActiveTab, totalUnreadCount, onAvatarChange }) => {
  return (
    <div className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <AvatarUpload user={user} onAvatarChange={onAvatarChange} accountType="Renter Account" />
        
        <nav className="space-y-2">
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'bookings' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Calendar className="h-5 w-5" /> My Bookings
          </button>
          <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'chats' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <div className="relative flex items-center justify-center">
              <MessageCircle className="h-5 w-5" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1 shadow-sm border border-white">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </span>
              )}
            </div>
            Chats
          </button>
          <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'profile' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
            <User className="h-5 w-5" /> Profile
          </button>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
