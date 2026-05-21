import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, MapPin, Settings, User, ChevronLeft, ChevronRight, X } from 'lucide-react';
import SmartLocationSearch from '../components/SmartLocationSearch';
import VehicleMap from '../components/VehicleMap';

const VehicleCard = ({ vehicle, isHovered, onHover }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === vehicle.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (vehicle.images && vehicle.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? vehicle.images.length - 1 : prev - 1));
    }
  };

  const handleCardClick = () => {
    navigate(`/vehicles/${vehicle._id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      onMouseEnter={() => onHover && onHover(vehicle._id)}
      onMouseLeave={() => onHover && onHover(null)}
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 group block relative cursor-pointer ${isHovered ? 'shadow-xl border-primary-500 scale-[1.02]' : 'border-gray-100 hover:shadow-lg'}`}
    >
      <div className="relative h-48 overflow-hidden bg-gray-200">
        {vehicle.images && vehicle.images.length > 0 ? (
          <>
            <img 
              src={vehicle.images[currentImageIndex]} 
              alt={vehicle.name} 
              className="w-full h-full object-cover transition-transform duration-500" 
            />
            {vehicle.images.length > 1 && (
              <>
                <button 
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md z-10 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button 
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-1 rounded-full shadow-md z-10 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                  {vehicle.images.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all ${idx === currentImageIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
        )}
        <div className="absolute top-3 left-3 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${vehicle.availabilityStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {vehicle.availabilityStatus ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-gray-900 shadow-sm">
          ₹{vehicle.pricePerHour} <span className="text-gray-500 text-xs font-normal">/hr</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">{vehicle.name}</h3>
          <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">{vehicle.type}</span>
        </div>
        
        <p className="text-gray-500 text-sm mb-4 line-clamp-1">{vehicle.description || `${vehicle.brand} ${vehicle.model}`}</p>
        
        <div className="grid grid-cols-2 gap-y-2">
          <div className="flex items-center text-sm text-gray-600 gap-1.5">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="truncate" title={vehicle.location}>{vehicle.location.split(',')[0]}</span>
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
      </div>
    </div>
  );
};

const VehicleListing = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // State for hover sync
  const [hoveredVehicleId, setHoveredVehicleId] = useState(null);

  // Parse URL parameters for initial filters
  const queryParams = new URLSearchParams(location.search);
  const initialLat = queryParams.get('lat');
  const initialLon = queryParams.get('lon');
  const initialLoc = queryParams.get('location') || '';
  const initialType = queryParams.get('type') || '';
  const isNearby = queryParams.get('nearby') === 'true';

  const [filters, setFilters] = useState({
    type: initialType,
    location: initialLoc,
    lat: initialLat,
    lon: initialLon,
    nearby: isNearby
  });

  const [mapCenter, setMapCenter] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const params = {
        type: filters.type,
      };
      
      // If we have coordinates, use them for $near query on the backend
      if (filters.lat && filters.lon) {
        params.lat = filters.lat;
        params.lon = filters.lon;
        // Also update map center
        setMapCenter([parseFloat(filters.lat), parseFloat(filters.lon)]);
        if (filters.nearby) {
          setUserLocation({ lat: parseFloat(filters.lat), lon: parseFloat(filters.lon) });
        } else {
          setUserLocation(null);
        }
      } else if (filters.location) {
        // Fallback to text search if no coordinates
        params.location = filters.location;
      }

      const { data } = await axios.get('/api/vehicles', { params });
      setVehicles(data);

      // If no center is set but we have vehicles with locations, center on the first one
      if (!filters.lat && !filters.lon && data.length > 0 && data[0].latitude && data[0].longitude) {
        setMapCenter([data[0].latitude, data[0].longitude]);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Sync state with URL changes (like when coming from Home)
    const urlParams = new URLSearchParams(location.search);
    setFilters({
      type: urlParams.get('type') || '',
      location: urlParams.get('location') || '',
      lat: urlParams.get('lat'),
      lon: urlParams.get('lon'),
      nearby: urlParams.get('nearby') === 'true'
    });
  }, [location.search]);

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateUrlParams({ [name]: value });
  };

  const handleLocationSearch = (data) => {
    updateUrlParams({
      location: data.location || '',
      lat: data.lat || '',
      lon: data.lon || '',
      nearby: data.nearby ? 'true' : ''
    });
  };

  const clearSearch = () => {
    navigate('/vehicles');
  };

  const showNearest = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateUrlParams({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            nearby: 'true',
            location: 'Current Location'
          });
        },
        (error) => alert("Error getting location.")
      );
    }
  };

  const updateUrlParams = (newParams) => {
    const searchParams = new URLSearchParams(location.search);
    Object.keys(newParams).forEach(key => {
      if (newParams[key]) {
        searchParams.set(key, newParams[key]);
      } else {
        searchParams.delete(key);
      }
    });
    navigate(`/vehicles?${searchParams.toString()}`);
  };

  const hasSearchedLocation = !!(filters.location || (filters.lat && filters.lon));

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] w-full overflow-hidden bg-gray-50">
      
      {/* LEFT SIDE - 60% (List and Filters) or Full Width */}
      <div className={`w-full ${hasSearchedLocation ? 'lg:w-[60%] border-r' : 'lg:w-full'} h-full overflow-y-auto custom-scrollbar flex flex-col border-gray-200 bg-white`}>
        
        {/* Filters Header (Sticky) */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-100 p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            
            {/* Location Smart Search */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location</label>
              <SmartLocationSearch 
                initialValue={filters.location} 
                onSearch={handleLocationSearch}
                autoNavigate={false}
              />
            </div>

            {/* Other Filters */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vehicle Type</label>
                <select 
                  name="type"
                  value={filters.type}
                  onChange={handleFilterChange}
                  className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                >
                  <option value="">All Types</option>
                  <option value="Car">Car</option>
                  <option value="Bike">Bike</option>
                  <option value="SUV">SUV</option>
                </select>
              </div>
              {(filters.location || filters.type) && (
                <div className="flex items-end">
                  <button 
                    onClick={clearSearch}
                    className="p-2.5 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center"
                    title="Clear Filters"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="p-4 flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">
              {loading ? 'Searching...' : `${vehicles.length} vehicles found`}
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-gray-50 p-8 text-center rounded-2xl border border-gray-100 mt-4">
              <Search className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <h3 className="text-lg font-bold text-gray-900">No vehicles found</h3>
              <p className="text-gray-500 text-sm mt-1 mb-6">We couldn't find any vehicles matching your current search criteria.</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={showNearest}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-xl font-bold transition"
                >
                  Show nearest vehicles
                </button>
                <button 
                  onClick={clearSearch}
                  className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-xl font-bold transition"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className={hasSearchedLocation 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 pb-8" 
              : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8"
            }>
              {vehicles.map((vehicle) => (
                <VehicleCard 
                  key={vehicle._id} 
                  vehicle={vehicle} 
                  isHovered={hoveredVehicleId === vehicle._id}
                  onHover={setHoveredVehicleId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SIDE - 40% (Map) */}
      {hasSearchedLocation && (
        <div className="hidden lg:block w-[40%] h-full p-4">
          <VehicleMap 
            vehicles={vehicles} 
            center={mapCenter} 
            userLocation={userLocation}
            hoveredVehicleId={hoveredVehicleId}
            onPinHover={setHoveredVehicleId}
            onPinClick={(id) => {
              setHoveredVehicleId(id);
              // Optionally scroll the left list to the card, but highlight is enough for now
            }}
          />
        </div>
      )}

      {/* Mobile Map Toggle (Optional, but good for UX. The prompt doesn't strictly ask for mobile, but it's good practice) */}
      {hasSearchedLocation && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => alert('Map view is optimized for desktop in this version.')}
            className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2"
          >
            <MapPin className="h-5 w-5" />
            Map
          </button>
        </div>
      )}

    </div>
  );
};

export default VehicleListing;
