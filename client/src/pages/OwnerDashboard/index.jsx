import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import OwnerChat from '../../components/OwnerChat';
import Sidebar from './Sidebar';
import OverviewStats from './OverviewStats';
import VehicleList from './VehicleList';
import AddVehicleForm from './AddVehicleForm';
import BookingsTable from './BookingsTable';
import RejectionModal from './RejectionModal';
import NotificationPopup from '../../components/ui/NotificationPopup';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const OwnerDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  
  // States
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [vehicles]);
  
  const [cancellationModalOpen, setCancellationModalOpen] = useState(false);
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('Aadhaar Card mistake (blurred/unreadable image)');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBookingId) return;
    const finalReason = rejectionReason === 'Other' ? customRejectionReason : rejectionReason;
    if (!finalReason.trim()) {
      showNotification('error', 'Please provide a cancellation reason.');
      return;
    }
    await updateBookingStatus(cancellingBookingId, 'Cancelled', finalReason);
    setCancellationModalOpen(false);
    setCancellingBookingId(null);
    setCustomRejectionReason('');
  };
  
  // Add Vehicle Form State
  const [formData, setFormData] = useState({
    name: '', brand: '', type: 'Car', model: '', vehicleNumber: '', 
    fuelType: 'Petrol', seatingCapacity: '', pricePerHour: '', location: '', latitude: '', longitude: '', description: ''
  });
  const [images, setImages] = useState([]);
  const [addLoading, setAddLoading] = useState(false);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      if (!user?.token) return;
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.get('/api/chats/owner', config);
      const total = data.reduce((acc, curr) => acc + curr.unreadCount, 0);
      setTotalUnreadCount(total);
    } catch (err) {
      console.error(err);
    }
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

  useEffect(() => {
    fetchData();
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      const [vehiclesRes, bookingsRes] = await Promise.all([
        axios.get('/api/vehicles/owner', config),
        axios.get('/api/bookings/owner', config)
      ]);
      
      setVehicles(vehiclesRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setImages((prevImages) => [...prevImages, ...filesArray]);
    }
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();

    if (images.length < 3) {
      showNotification('warning', 'Please upload a minimum of 3 photos for the vehicle.');
      return;
    }

    setAddLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Array.from(images).forEach(file => data.append('images', file));

      const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } };
      await axios.post('/api/vehicles', data, config);
      
      setActiveTab('vehicles');
      fetchData();
      showNotification('success', 'Vehicle successfully listed!');
      // Reset form
      setFormData({
        name: '', brand: '', type: 'Car', model: '', vehicleNumber: '', 
        fuelType: 'Petrol', seatingCapacity: '', pricePerHour: '', location: '', latitude: '', longitude: '', description: ''
      });
      setImages([]);
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Error adding vehicle');
    }
    setAddLoading(false);
  };

  const updateBookingStatus = async (id, status, rejectionReason = '') => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/bookings/${id}/status`, { status, rejectionReason }, config);
      fetchData();
      showNotification('success', `Booking has been successfully ${status.toLowerCase()}!`);
    } catch (error) {
      console.error(error);
      showNotification('error', error.response?.data?.message || 'Error updating booking');
    }
  };

  const handleDeleteVehicle = (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Listed Vehicle',
      message: 'Are you sure you want to delete this vehicle listing? This action cannot be undone and will cancel any active bookings associated with it.',
      onConfirm: async () => {
        try {
          const config = { headers: { Authorization: `Bearer ${user.token}` } };
          await axios.delete(`/api/vehicles/${id}`, config);
          fetchData();
          showNotification('success', 'Vehicle deleted successfully.');
        } catch (error) {
          showNotification('error', error.response?.data?.message || 'Error deleting vehicle');
        }
      }
    });
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/vehicles/${id}`, { availabilityStatus: !currentStatus }, config);
      fetchData();
      showNotification('success', `Vehicle availability marked as ${!currentStatus ? 'available' : 'unavailable'}.`);
    } catch (error) {
      showNotification('error', error.response?.data?.message || 'Error updating vehicle');
    }
  };

  const handleRejectBooking = (bookingId) => {
    setCancellingBookingId(bookingId);
    setCancellationModalOpen(true);
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
          
          {activeTab === 'overview' && (
            <OverviewStats vehicles={vehicles} bookings={bookings} />
          )}

          {activeTab === 'vehicles' && (
            <VehicleList 
              vehicles={vehicles}
              visibleCount={visibleCount}
              setVisibleCount={setVisibleCount}
              setActiveTab={setActiveTab}
              handleToggleAvailability={handleToggleAvailability}
              handleDeleteVehicle={handleDeleteVehicle}
            />
          )}

          {activeTab === 'add_vehicle' && (
            <AddVehicleForm 
              formData={formData}
              images={images}
              addLoading={addLoading}
              onInputChange={handleInputChange}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
              onSubmit={handleAddVehicle}
              onLocationSelect={(data) => setFormData({ ...formData, location: data.location, latitude: data.latitude, longitude: data.longitude })}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTable 
              bookings={bookings} 
              onRejectBooking={handleRejectBooking} 
            />
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Owner Chats</h2>
              <OwnerChat onUnreadChange={fetchUnreadCount} />
            </div>
          )}

        </div>
      </div>

      {/* Cancellation/Rejection Modal */}
      <RejectionModal 
        isOpen={cancellationModalOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        customRejectionReason={customRejectionReason}
        setCustomRejectionReason={setCustomRejectionReason}
        onClose={() => {
          setCancellationModalOpen(false);
          setCancellingBookingId(null);
        }}
        onConfirm={handleConfirmCancel}
      />

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

export default OwnerDashboard;
