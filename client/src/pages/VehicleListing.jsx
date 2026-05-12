import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, MapPin, Settings, User } from 'lucide-react';

const VehicleListing = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    location: '',
  });

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/vehicles', { params: filters });
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, []); // Run once on mount, then when filters are explicitly applied

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Available Vehicles</h1>
          <p className="text-gray-500 mt-1">Find the perfect vehicle for your next trip</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full lg:w-1/4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary-600" />
              Filters
            </h3>
            
            <form onSubmit={applyFilters} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select 
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Types</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input 
                    type="text" 
                    name="location"
                    value={filters.location}
                    onChange={handleFilterChange}
                    placeholder="Enter city" 
                    className="w-full pl-9 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500" 
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-xl font-medium transition mt-4">
                Apply Filters
              </button>
            </form>
          </div>
        </div>

        {/* Vehicle Grid */}
        <div className="w-full lg:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
              <Search className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No vehicles found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your filters to find what you're looking for.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {vehicles.map((vehicle) => (
                <div key={vehicle._id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
                  <div className="relative h-48 overflow-hidden bg-gray-200">
                    {vehicle.images && vehicle.images.length > 0 ? (
                      <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-gray-900 shadow-sm">
                      ₹{vehicle.pricePerDay} <span className="text-gray-500 text-xs font-normal">/day</span>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 truncate">{vehicle.name}</h3>
                      <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">{vehicle.type}</span>
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-4 line-clamp-2">{vehicle.description || `${vehicle.brand} ${vehicle.model}`}</p>
                    
                    <div className="grid grid-cols-2 gap-y-2 mb-6">
                      <div className="flex items-center text-sm text-gray-600 gap-1.5">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{vehicle.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-1.5">
                        <User className="h-4 w-4 text-gray-400" />
                        {vehicle.seatingCapacity} Seats
                      </div>
                      <div className="flex items-center text-sm text-gray-600 gap-1.5">
                        <Settings className="h-4 w-4 text-gray-400" />
                        {vehicle.fuelType}
                      </div>
                    </div>
                    
                    <Link 
                      to={`/vehicles/${vehicle._id}`}
                      className="block w-full text-center bg-gray-50 hover:bg-primary-600 text-gray-900 hover:text-white border border-gray-200 hover:border-transparent py-2.5 rounded-xl font-medium transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleListing;
