import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { PlusCircle, List, Calendar, Settings, Activity, Upload, CheckCircle, XCircle, MessageCircle } from 'lucide-react';
import OwnerChat from '../components/OwnerChat';

const OwnerDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview');
  
  // States
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Vehicle Form State
  const [formData, setFormData] = useState({
    name: '', brand: '', type: 'Car', model: '', vehicleNumber: '', 
    fuelType: 'Petrol', seatingCapacity: '', pricePerHour: '', location: '', description: ''
  });
  const [images, setImages] = useState([]);
  const [addLoading, setAddLoading] = useState(false);

  useEffect(() => {
    fetchData();
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

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      Array.from(images).forEach(file => data.append('images', file));

      const config = { headers: { Authorization: `Bearer ${user.token}`, 'Content-Type': 'multipart/form-data' } };
      await axios.post('/api/vehicles', data, config);
      
      setActiveTab('vehicles');
      fetchData();
      // Reset form
      setFormData({
        name: '', brand: '', type: 'Car', model: '', vehicleNumber: '', 
        fuelType: 'Petrol', seatingCapacity: '', pricePerHour: '', location: '', description: ''
      });
      setImages([]);
    } catch (error) {
      alert(error.response?.data?.message || 'Error adding vehicle');
    }
    setAddLoading(false);
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/bookings/${id}/status`, { status }, config);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteVehicle = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`/api/vehicles/${id}`, config);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Error deleting vehicle');
      }
    }
  };

  const handleToggleAvailability = async (id, currentStatus) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`/api/vehicles/${id}`, { availabilityStatus: !currentStatus }, config);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating vehicle');
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
              <div className="h-16 w-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3">
                {user?.name?.charAt(0)}
              </div>
              <h3 className="font-bold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">Owner Account</p>
            </div>
            
            <nav className="space-y-2">
              <button onClick={() => setActiveTab('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'overview' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Activity className="h-5 w-5" /> Overview
              </button>
              <button onClick={() => setActiveTab('vehicles')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'vehicles' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <List className="h-5 w-5" /> My Vehicles
              </button>
              <button onClick={() => setActiveTab('add_vehicle')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'add_vehicle' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <PlusCircle className="h-5 w-5" /> Add Vehicle
              </button>
              <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'bookings' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Calendar className="h-5 w-5" /> Bookings
              </button>
              <button onClick={() => setActiveTab('chats')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'chats' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                <MessageCircle className="h-5 w-5" /> Chats
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><List className="h-8 w-8" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Vehicles</p>
                    <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-green-100 p-4 rounded-xl text-green-600"><Calendar className="h-8 w-8" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                  <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Activity className="h-8 w-8" /></div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Earnings (Est.)</p>
                    <p className="text-3xl font-bold text-gray-900">₹{bookings.reduce((acc, curr) => acc + curr.totalAmount, 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">My Vehicles</h2>
                <button onClick={() => setActiveTab('add_vehicle')} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add New</button>
              </div>
              {vehicles.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
                  No vehicles listed yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {vehicles.map(v => (
                    <div key={v._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition hover:shadow-md">
                      <div className="h-48 overflow-hidden relative">
                        <img src={v.images[0] || 'https://via.placeholder.com/300x200'} alt={v.name} className="w-full h-full object-cover transition-transform hover:scale-105" />
                        <div className="absolute top-3 right-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${v.availabilityStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {v.availabilityStatus ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{v.name}</h3>
                          <span className="font-bold text-primary-600">₹{v.pricePerHour}<span className="text-xs text-gray-500 font-normal">/hr</span></span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{v.brand} • {v.type}</p>
                        {v.activeBookings && v.activeBookings.length > 0 && (
                          <div className="mb-4 relative">
                            <details className="group">
                              <summary className="text-xs font-bold text-orange-800 bg-orange-50 p-2.5 rounded-xl border border-orange-100 cursor-pointer list-none flex justify-between items-center outline-none">
                                <span>Booked Dates ({v.activeBookings.length})</span>
                                <span className="text-orange-500 group-open:rotate-180 transition-transform text-[10px]">▼</span>
                              </summary>
                              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 shadow-xl rounded-xl p-2 max-h-32 overflow-y-auto custom-scrollbar">
                                <div className="flex flex-col gap-1">
                                  {v.activeBookings.map((b, i) => (
                                    <div key={i} className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1.5 rounded">
                                      {new Date(b.pickupDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} to {new Date(b.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          </div>
                        )}
                        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{v.vehicleNumber}</span>
                          <div className="flex gap-2">
                            <button onClick={() => handleToggleAvailability(v._id, v.availabilityStatus)} className={`px-2 py-1.5 rounded-md text-xs font-medium transition ${v.availabilityStatus ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                              Mark {v.availabilityStatus ? 'Unavailable' : 'Available'}
                            </button>
                            <button onClick={() => handleDeleteVehicle(v._id)} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-medium transition">
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'add_vehicle' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Add New Vehicle</h2>
              <form onSubmit={handleAddVehicle} className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Name</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" placeholder="e.g. Honda City 2022" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input required type="text" name="brand" value={formData.brand} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" placeholder="e.g. Honda" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select name="type" value={formData.type} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200">
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="SUV">SUV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model / Year</label>
                    <input required type="text" name="model" value={formData.model} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                    <input required type="text" name="vehicleNumber" value={formData.vehicleNumber} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
                    <select name="fuelType" value={formData.fuelType} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200">
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seating Capacity</label>
                    <input required type="number" name="seatingCapacity" value={formData.seatingCapacity} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Hour (₹)</label>
                    <input required type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea rows="3" name="description" value={formData.description} onChange={handleInputChange} className="w-full p-3 rounded-xl border border-gray-200"></textarea>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Images (Multiple)</label>
                    <input type="file" multiple accept="image/*" onChange={(e) => setImages(e.target.files)} className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50" />
                  </div>
                </div>
                <button type="submit" disabled={addLoading} className="w-full bg-primary-600 text-white font-bold py-4 rounded-xl disabled:opacity-50">
                  {addLoading ? 'Uploading...' : 'List Vehicle'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Manage Bookings</h2>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                      <th className="p-4 font-medium">User</th>
                      <th className="p-4 font-medium">Vehicle</th>
                      <th className="p-4 font-medium">Dates</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map(b => (
                      <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="p-4">
                          <p className="font-bold text-gray-900">{b.user?.name}</p>
                          <p className="text-xs text-gray-500">{b.user?.email}</p>
                        </td>
                        <td className="p-4 font-medium text-gray-700">{b.vehicle?.name}</td>
                        <td className="p-4 text-sm text-gray-600">
                          {new Date(b.pickupDate).toLocaleDateString()} - {new Date(b.returnDate).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            b.bookingStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            b.bookingStatus === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                            b.bookingStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          {b.bookingStatus === 'Pending' && (
                            <button onClick={() => updateBookingStatus(b._id, 'Confirmed')} className="text-green-600 hover:text-green-800"><CheckCircle className="h-5 w-5" /></button>
                          )}
                          {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                            <button onClick={() => updateBookingStatus(b._id, 'Cancelled')} className="text-red-600 hover:text-red-800"><XCircle className="h-5 w-5" /></button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {bookings.length === 0 && (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500">No bookings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'chats' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Chats</h2>
              <OwnerChat />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
