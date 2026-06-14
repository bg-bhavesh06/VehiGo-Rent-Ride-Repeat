import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import ImageGallery from './ImageGallery';
import VehicleSpecs from './VehicleSpecs';
import BookingForm from './BookingForm';
import ChatPopup from './ChatPopup';
import DirectionMap from './DirectionMap';
import LoginPrompt from './LoginPrompt';
import NotificationPopup from '../../components/ui/NotificationPopup';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };
  
  // Booking Form State
  const [pickupDate, setPickupDate] = useState(null);
  const [returnDate, setReturnDate] = useState(null);
  const [bookedIntervals, setBookedIntervals] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  // Image Gallery State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Chat State
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);

  // Direction Map State
  const [userLoc, setUserLoc] = useState(null);
  const [showDirectionMap, setShowDirectionMap] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [routePoints, setRoutePoints] = useState([]);
  const [roadDistance, setRoadDistance] = useState(null);
  const [roadDuration, setRoadDuration] = useState(null);
  const [routingLoading, setRoutingLoading] = useState(false);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d.toFixed(2);
  };

  const fetchRoute = async (userLatitude, userLongitude, vehicleLatitude, vehicleLongitude) => {
    setRoutingLoading(true);
    try {
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${userLongitude},${userLatitude};${vehicleLongitude},${vehicleLatitude}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const points = route.geometry.coordinates.map((coord) => [coord[1], coord[0]]);
        setRoutePoints(points);
        setRoadDistance((route.distance / 1000).toFixed(2));
        setRoadDuration(Math.round(route.duration / 60));
      } else {
        setRoutePoints([[userLatitude, userLongitude], [vehicleLatitude, vehicleLongitude]]);
        setRoadDistance(null);
        setRoadDuration(null);
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      setRoutePoints([[userLatitude, userLongitude], [vehicleLatitude, vehicleLongitude]]);
      setRoadDistance(null);
      setRoadDuration(null);
    }
    setRoutingLoading(false);
  };

  const handleGetDirection = () => {
    if (showDirectionMap) {
      setShowDirectionMap(false);
      return;
    }
    
    setGeoLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const uLat = position.coords.latitude;
          const uLon = position.coords.longitude;
          setUserLoc({ lat: uLat, lon: uLon });
          
          if (vehicle?.latitude && vehicle?.longitude) {
            await fetchRoute(uLat, uLon, vehicle.latitude, vehicle.longitude);
          }
          
          setShowDirectionMap(true);
          setGeoLoading(false);
        },
        (error) => {
          setGeoLoading(false);
          showNotification('error', "Error getting location. Showing vehicle location only.");
          setShowDirectionMap(true);
        }
      );
    } else {
      setGeoLoading(false);
      showNotification('error', "Geolocation is not supported by your browser");
      setShowDirectionMap(true);
    }
  };

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
        isBooked: false
      }, config);
      
      setChatRoom(room);
      setIsChatOpen(true);
      
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

  const calculateTotalAmount = () => {
    if (!pickupDate || !returnDate || !vehicle) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = end - start;
    if (diffTime <= 0) return 0;
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
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
      
      navigate('/dashboard/user');
      
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.conflictDetails) {
        showNotification('warning', "Booking Conflict!\n\n" + err.response.data.conflictDetails.smartMessage);
      } else {
        showNotification('error', err.response?.data?.message || 'Error creating booking');
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
          <ImageGallery 
            images={vehicle.images} 
            name={vehicle.name}
            currentImageIndex={currentImageIndex}
            setCurrentImageIndex={setCurrentImageIndex}
          />
          <VehicleSpecs 
            vehicle={vehicle} 
            onStartChat={handleStartChat} 
            onGetDirection={handleGetDirection}
            geoLoading={geoLoading}
          />
        </div>

        {/* Right Col: Booking Form */}
        <div>
          <BookingForm 
            vehicle={vehicle}
            pickupDate={pickupDate}
            setPickupDate={setPickupDate}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            bookedIntervals={bookedIntervals}
            documents={documents}
            setDocuments={setDocuments}
            bookingLoading={bookingLoading}
            error={error}
            totalAmount={totalAmount}
            onSubmit={handleBooking}
          />
        </div>

      </div>

      {/* Login Popup */}
      <LoginPrompt isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />

      {/* Chat Card Popup */}
      <ChatPopup 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        chatRoom={chatRoom}
        vehicle={vehicle}
        user={user}
        socket={socket}
        messages={messages}
        setMessages={setMessages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        onSendMessage={handleSendMessage}
      />

      {/* Direction Map Popup */}
      <DirectionMap 
        isOpen={showDirectionMap}
        onClose={() => setShowDirectionMap(false)}
        vehicle={vehicle}
        userLoc={userLoc}
        routePoints={routePoints}
        roadDistance={roadDistance}
        roadDuration={roadDuration}
        routingLoading={routingLoading}
        isChatOpen={isChatOpen}
        calculateDistance={calculateDistance}
      />

      {/* Custom Notification Popup */}
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />

    </div>
  );
};

export default VehicleDetail;
