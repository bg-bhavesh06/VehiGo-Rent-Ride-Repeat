import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import UserChat from '../../components/UserChat';
import Sidebar from './Sidebar';
import BookingList from './BookingList';
import ProfileSettings from './ProfileSettings';
import { initiatePayment } from './PaymentHandler';
import NotificationPopup from '../../components/ui/NotificationPopup';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const UserDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/auth/profile', formData, config);
      
      updateUser(data);
      showNotification('success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error(error);
      showNotification('error', 'Error updating profile picture');
    }
  };

  const fetchUnreadCount = async () => {
    try {
      if (!user?.token) return;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/chats/user', config);
      const total = data.reduce((acc, curr) => acc + curr.userUnreadCount, 0);
      setTotalUnreadCount(total);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchUnreadCount();
    
    const newSocket = io();
    if (user && user._id) {
      newSocket.emit('join_user_room', user._id);
    }
    newSocket.on('receive_message', () => {
      fetchUnreadCount();
    });
    return () => newSocket.disconnect();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/bookings/user', config);
      setBookings(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleCancelBooking = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Booking Request',
      message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.put(`/api/bookings/${id}/cancel`, {}, config);
          fetchBookings();
          showNotification('success', 'Booking successfully cancelled.');
        } catch (error) {
          console.error(error);
          showNotification('error', error.response?.data?.message || 'Error cancelling booking');
        }
      }
    });
  };

  const handlePayment = async (booking) => {
    await initiatePayment(booking, user, axios, showNotification, fetchBookings);
  };

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          totalUnreadCount={totalUnreadCount}
          onAvatarChange={handleAvatarChange}
        />

        {/* Main Content */}
        <div className="flex-1">
          
          {activeTab === 'bookings' && (
            <BookingList 
              bookings={bookings} 
              onCancelBooking={handleCancelBooking} 
              onPayment={handlePayment} 
            />
          )}

          {activeTab === 'profile' && (
            <ProfileSettings user={user} />
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
              <UserChat onUnreadChange={fetchUnreadCount} />
            </div>
          )}

        </div>
      </div>

      {/* Custom Notification Popup */}
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />

      {/* Custom Confirmation Dialog */}
      <ConfirmDialog 
        confirmModal={confirmModal} 
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={() => {
          confirmModal.onConfirm();
          setConfirmModal({ ...confirmModal, isOpen: false });
        }}
      />

    </div>
  );
};

export default UserDashboard;
