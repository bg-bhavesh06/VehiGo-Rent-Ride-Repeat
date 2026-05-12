import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Settings, User, CheckCircle, Upload, Calendar } from 'lucide-react';

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Booking Form State
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [documents, setDocuments] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

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
    fetchVehicle();
  }, [id]);

  const calculateTotalAmount = () => {
    if (!pickupDate || !returnDate || !vehicle) return 0;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1; // at least 1 day
    return diffDays * vehicle.pricePerDay;
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
      setError(err.response?.data?.message || 'Error creating booking');
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
          
          {/* Main Image */}
          <div className="bg-gray-200 rounded-3xl overflow-hidden h-[400px]">
            {vehicle.images && vehicle.images.length > 0 ? (
              <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">No Image Available</div>
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
                <p className="text-3xl font-black text-primary-600">₹{vehicle.pricePerDay}</p>
                <p className="text-gray-500 text-sm">per day</p>
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
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-semibold text-gray-900">{vehicle.availabilityStatus ? 'Available' : 'Booked'}</p>
              </div>
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
              <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="date" 
                    required
                    min={pickupDate || new Date().toISOString().split('T')[0]}
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500" 
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
                  <span>Price per day</span>
                  <span>₹{vehicle.pricePerDay}</span>
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
    </div>
  );
};

export default VehicleDetail;
