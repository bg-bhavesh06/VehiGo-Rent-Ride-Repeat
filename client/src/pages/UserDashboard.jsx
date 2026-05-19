import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { User, Calendar, CreditCard, XCircle, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import UserChat from '../components/UserChat';
import { io } from 'socket.io-client';

const UserDashboard = () => {
  const { user, updateUser } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('bookings');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.put('/api/auth/profile', formData, config);
      
      updateUser(data);
    } catch (error) {
      console.error(error);
      alert('Error updating profile picture');
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

  const handleCancelBooking = async (id) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.put(`/api/bookings/${id}/cancel`, {}, config);
        fetchBookings();
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Dynamically load Razorpay SDK
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (booking) => {
    try {
      const res = await loadRazorpay();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        return;
      }

      // Calculate amount to pay (50% advance if pending, remaining if partial)
      const amountToPay = booking.paymentStatus === 'Pending' ? booking.totalAmount / 2 : booking.remainingAmount;

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      // 1. Create Order
      const { data: order } = await axios.post('/api/payments/create-order', {
        bookingId: booking._id,
        amount: amountToPay
      }, config);

      // 2. Open Razorpay Checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'your_fallback_key', // This should be in frontend env or fetched from backend
        amount: order.amount,
        currency: order.currency,
        name: 'AutoBook',
        description: `Payment for ${booking.vehicle?.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            // 3. Verify Payment
            await axios.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              bookingId: booking._id
            }, config);
            
            alert('Payment Successful!');
            fetchBookings();
          } catch (err) {
            alert('Payment Verification Failed');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: { color: '#2563eb' }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error(error);
      alert('Error initiating payment');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="text-center mb-6 pb-6 border-b border-gray-100">
              <div className="h-16 w-16 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3 relative group overflow-hidden cursor-pointer shadow-sm border border-gray-200">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0)}</span>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer w-full h-full flex items-center justify-center">
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                  </label>
                </div>
              </div>
              <h3 className="font-bold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">Renter Account</p>
            </div>
            
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

        {/* Main Content */}
        <div className="flex-1">
          
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
              
              <div className="space-y-4">
                {bookings.map(booking => (
                  <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {booking.vehicle?.images?.length > 0 ? (
                        <img src={booking.vehicle.images[0]} alt={booking.vehicle.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <h3 className="text-xl font-bold text-gray-900">{booking.vehicle?.name}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            booking.bookingStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            booking.bookingStatus === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                            booking.bookingStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.bookingStatus}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">
                          {new Date(booking.pickupDate).toLocaleDateString()} to {new Date(booking.returnDate).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 items-center justify-between border-t border-gray-50 pt-4">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Total</p>
                            <p className="font-bold text-gray-900">₹{booking.totalAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Paid</p>
                            <p className="font-bold text-green-600">₹{booking.paidAmount}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Pending</p>
                            <p className="font-bold text-red-600">₹{booking.remainingAmount}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Completed' && (
                            <button onClick={() => handleCancelBooking(booking._id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                              <XCircle className="h-4 w-4" /> Cancel
                            </button>
                          )}
                          
                          {booking.paymentStatus !== 'Completed' && booking.bookingStatus !== 'Cancelled' && (
                            <button onClick={() => handlePayment(booking)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                              <CreditCard className="h-4 w-4" /> 
                              {booking.paymentStatus === 'Pending' ? 'Pay Advance (50%)' : 'Pay Remaining'}
                            </button>
                          )}
                          
                          {booking.paymentStatus === 'Completed' && (
                            <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                              <CheckCircle className="h-4 w-4" /> Fully Paid
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {bookings.length === 0 && (
                  <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
                    <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
                    <p className="text-gray-500 mt-2">You haven't made any bookings yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" defaultValue={user.name} disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue={user.email} disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
                </div>
                {/* Future implementation: Update profile logic */}
              </form>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
              <UserChat onUnreadChange={fetchUnreadCount} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
