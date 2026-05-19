import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Settings, User, CheckCircle, XCircle, Upload, Calendar, MessageCircle, Send, X, ChevronLeft, ChevronRight } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { io } from 'socket.io-client';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // Image Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = () => {
    if (vehicle?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev === vehicle.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = () => {
    if (vehicle?.images?.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? vehicle.images.length - 1 : prev - 1));
    }
  };

  // Chat State
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const { data } = await axios.get(`/api/vehicles/${id}`);
        setVehicle(data);
      } catch (error) {
        console.error('Error fetching vehicle', error);
      }
      setLoading(false);
    };

    const fetchBookings = async () => {
      try {
        const { data } = await axios.get(`/api/bookings/vehicle/${id}/dates`);
        const intervals = data.map(b => ({
          start: new Date(b.pickupDate),
          end: new Date(b.returnDate)
        }));
        setBookedIntervals(intervals);
      } catch (err) {
        console.error('Error fetching booked dates', err);
      }
    };

    fetchVehicle();
    fetchBookings();
  }, [id]);

  useEffect(() => {
    if (user && isChatOpen && chatRoom) {
      const newSocket = io();
      setSocket(newSocket);
      
      newSocket.emit('join_room', chatRoom._id);
      
      newSocket.on('receive_message', (data) => {
        setMessages((prev) => [...prev, data]);
      });

      return () => newSocket.disconnect();
    }
  }, [user, isChatOpen, chatRoom]);

  const handleStartChat = async () => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: room } = await axios.post('/api/chats/room', {
        vehicleId: vehicle._id,
        ownerId: vehicle.owner._id,
        isBooked: false // simplified for now
      }, config);
      
      setChatRoom(room);
      setIsChatOpen(true);
      
      // Fetch previous messages
      const { data: pastMessages } = await axios.get(`/api/chats/room/${room._id}/messages`, config);
      setMessages(pastMessages);
    } catch (err) {
      console.error('Error starting chat', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !chatRoom) return;

    const messageData = {
      chatroomId: chatRoom._id,
      receiverId: vehicle.owner._id,
      messageText: newMessage
    };

    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data: savedMessage } = await axios.post('/api/chats/message', messageData, config);
      
      socket.emit('send_message', { ...savedMessage, roomId: chatRoom._id });
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const isDateBlocked = (date) => {
    if (vehicle && !vehicle.availabilityStatus) return true;
    return bookedIntervals.some(interval => {
      const d = new Date(date).setHours(0,0,0,0);
      const s = new Date(interval.start).setHours(0,0,0,0);
      const e = new Date(interval.end).setHours(0,0,0,0);
      return d >= s && d <= e;
    });
  };

  const getDayClassName = (date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return "text-gray-300";
    return isDateBlocked(date) 
      ? "bg-red-100 text-red-600 font-bold !cursor-not-allowed" 
      : "bg-green-100 text-green-700 font-bold hover:bg-green-200";
  };

  const calculateTotalAmount = () => {
    if (!pickupDate || !returnDate || !vehicle) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60)); // round up to nearest hour
    return diffHours * vehicle.pricePerHour;
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    
    setError('');
    setBookingLoading(true);

    try {
      const formData = new FormData();
      formData.append('vehicleId', vehicle._id);
      formData.append('pickupDate', pickupDate);
      formData.append('returnDate', returnDate);
      formData.append('totalAmount', calculateTotalAmount());
      
      Array.from(documents).forEach(file => {
        formData.append('documents', file);
      });

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${user.token}`
        }
      };

      const { data } = await axios.post('/api/bookings', formData, config);
      
      // Navigate to user dashboard to see the pending booking & make payment
      navigate('/dashboard/user');
      
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflictDetails) {
        alert("Booking Conflict!\n\n" + err.response.data.conflictDetails.smartMessage);
      } else {
        alert(err.response?.data?.message || 'Error creating booking');
      }
    }
    setBookingLoading(false);
  };

  if (loading) return <div className="flex justify-center items-center h-[80vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  if (!vehicle) return <div className="text-center py-20 text-xl font-bold">Vehicle not found</div>;

  const totalAmount = calculateTotalAmount();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Col: Images & Details */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="bg-gray-200 rounded-3xl overflow-hidden h-[400px] md:h-[500px] relative group">
              {vehicle.images && vehicle.images.length > 0 ? (
                <>
                  <img 
                    src={vehicle.images[currentImageIndex]} 
                    alt={vehicle.name} 
                    className="w-full h-full object-cover transition-opacity duration-300" 
                  />
                  
                  {vehicle.images.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all focus:outline-none"
                      >
                        <ChevronRight className="h-6 w-6" />
                      </button>
                      <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-sm font-bold backdrop-blur-sm">
                        {currentImageIndex + 1} / {vehicle.images.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium">No Image Available</div>
              )}
            </div>
            
            {/* Thumbnails */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-3">
                {vehicle.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-20 rounded-xl overflow-hidden cursor-pointer transition-all border-2 ${idx === currentImageIndex ? 'border-primary-600 shadow-md ring-2 ring-primary-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`${vehicle.name} view ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{vehicle.name}</h1>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {vehicle.location}</span>
                  <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{vehicle.brand}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black text-primary-600">₹{vehicle.pricePerHour}</p>
                <p className="text-gray-500 text-sm">per hour</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Type</p>
                <p className="font-semibold text-gray-900">{vehicle.type}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <User className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Capacity</p>
                <p className="font-semibold text-gray-900">{vehicle.seatingCapacity} Seats</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Fuel</p>
                <p className="font-semibold text-gray-900">{vehicle.fuelType}</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                {vehicle.availabilityStatus ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                )}
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{vehicle.availabilityStatus ? 'Available' : 'Unavailable'}</p>
              </div>
            </div>

            {/* Chat Button */}
            <div className="mb-8 border-t border-gray-100 pt-6">
              <button 
                onClick={handleStartChat}
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 rounded-xl font-bold transition shadow-md"
              >
                <MessageCircle className="h-5 w-5" />
                Chat with Owner
              </button>
            </div>

            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 leading-relaxed">
                {vehicle.description || 'No detailed description provided by the owner.'}
              </p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-4">
              <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                {vehicle.owner?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-sm text-gray-500">Owned by</p>
                <p className="font-bold text-gray-900">{vehicle.owner?.name}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Booking Form */}
        <div>
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Book this Vehicle</h3>
            
            {!vehicle.availabilityStatus && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-medium text-center">
                This vehicle is currently unavailable.
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap">
                {error}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <DatePicker
                    selected={pickupDate}
                    onChange={(date) => setPickupDate(date)}
                    selectsStart
                    startDate={pickupDate}
                    endDate={returnDate}
                    minDate={new Date()}
                    excludeDateIntervals={vehicle && !vehicle.availabilityStatus ? [{start: new Date('1970-01-01'), end: new Date('2100-01-01')}] : bookedIntervals}
                    dayClassName={getDayClassName}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                    placeholderText="Select pickup date and time"
                    showTimeSelect
                    timeFormat="hh:mm aa"
                    timeIntervals={30}
                    dateFormat="MMM d, yyyy h:mm aa"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                  <DatePicker
                    selected={returnDate}
                    onChange={(date) => setReturnDate(date)}
                    selectsEnd
                    startDate={pickupDate}
                    endDate={returnDate}
                    minDate={pickupDate || new Date()}
                    excludeDateIntervals={vehicle && !vehicle.availabilityStatus ? [{start: new Date('1970-01-01'), end: new Date('2100-01-01')}] : bookedIntervals}
                    dayClassName={getDayClassName}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
                    placeholderText="Select return date and time"
                    showTimeSelect
                    timeFormat="hh:mm aa"
                    timeIntervals={30}
                    dateFormat="MMM d, yyyy h:mm aa"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Documents (Aadhaar/License)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
                  <input 
                    type="file" 
                    multiple 
                    onChange={(e) => setDocuments(e.target.files)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600">
                    {documents.length > 0 ? `${documents.length} files selected` : 'Click to upload files'}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl mt-6">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>Price per hour</span>
                  <span>₹{vehicle.pricePerHour}</span>
                </div>
                {totalAmount > 0 && (
                  <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
                    <span>Total Amount</span>
                    <span>₹{totalAmount}</span>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2 text-center">You'll need to pay 50% advance to confirm booking.</p>
              </div>

              <button 
                type="submit" 
                disabled={!vehicle.availabilityStatus || bookingLoading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bookingLoading ? 'Processing...' : 'Proceed to Book'}
              </button>
            </form>
          </div>
        </div>

      </div>

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
            <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-500 mb-6">Please Login or Register to chat with the owner.</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/login')} className="flex-1 bg-primary-600 text-white font-bold py-2 rounded-xl hover:bg-primary-700 transition">Login</button>
              <button onClick={() => navigate('/register')} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 transition">Register</button>
            </div>
            <button onClick={() => setShowLoginPopup(false)} className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
          </div>
        </div>
      )}

      {/* Chat Card Popup */}
      {isChatOpen && (
        <div className="fixed bottom-4 right-4 md:bottom-10 md:right-10 w-[300px] h-[400px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-200 flex flex-col z-[100] overflow-hidden">
          {/* Header */}
          <div className="bg-blue-600 p-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-sm">
                {vehicle?.owner?.name?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="font-bold text-sm leading-tight truncate max-w-[150px]">{vehicle?.owner?.name}</p>
                <p className="text-[10px] text-blue-200">Owner</p>
              </div>
            </div>
            <button onClick={() => setIsChatOpen(false)} className="text-blue-200 hover:text-white transition">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto bg-gray-50 flex flex-col gap-2 custom-scrollbar">
            {messages.length === 0 ? (
              <p className="text-xs text-center text-gray-400 mt-auto mb-auto">Start chatting with {vehicle?.owner?.name}</p>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderId === user?._id;
                return (
                  <div key={idx} className={`max-w-[85%] p-2.5 rounded-2xl text-sm ${isMine ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 self-start rounded-tl-none shadow-sm'}`}>
                    <p>{msg.messageText}</p>
                    <p className={`text-[9px] mt-1 text-right ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                );
              })
            )}
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <input 
              type="text" 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type message..." 
              className="flex-1 bg-gray-100 rounded-full px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={!newMessage.trim()} className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 hover:bg-blue-700 transition flex-shrink-0">
              <Send className="h-4 w-4 -ml-0.5" />
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default VehicleDetail;
