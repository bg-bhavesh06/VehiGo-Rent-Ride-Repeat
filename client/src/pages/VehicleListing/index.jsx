import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import VehicleCard from './VehicleCard';
import FilterSidebar from './FilterSidebar';
import VehicleMap from '../../components/VehicleMap';
import NotificationPopup from '../../components/ui/NotificationPopup';

const VehicleListing = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    setVisibleCount(12);
  }, [vehicles]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };
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
        (error) => showNotification('error', "Error getting location.")
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
      
      {/* LEFT SIDEBAR - Filters */}
      <FilterSidebar 
        filters={filters}
        onLocationSearch={handleLocationSearch}
        onFilterChange={handleFilterChange}
        onClearSearch={clearSearch}
      />

      {/* MAIN CONTENT AREA - List & Map */}
      <div className="flex-1 h-full flex flex-col lg:flex-row overflow-hidden">
        
        {/* Vehicle List */}
        <div className={`w-full ${hasSearchedLocation ? 'lg:w-[60%] border-r border-gray-200' : 'w-full'} h-full overflow-y-auto custom-scrollbar flex flex-col bg-white`}>
          <div className="p-5 flex-1">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">
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
              <>
                <div className={hasSearchedLocation 
                  ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4" 
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
                }>
                  {vehicles.slice(0, visibleCount).map((vehicle) => (
                    <VehicleCard 
                      key={vehicle._id} 
                      vehicle={vehicle} 
                      isHovered={hoveredVehicleId === vehicle._id}
                      onHover={setHoveredVehicleId}
                    />
                  ))}
                </div>

                {/* View More Button */}
                {visibleCount < vehicles.length && (
                  <div className="mt-10 mb-6 flex justify-center animate-fadeIn">
                    <button
                      onClick={() => setVisibleCount(prev => prev + 12)}
                      className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group cursor-pointer"
                    >
                      <ChevronDown className="h-4.5 w-4.5 group-hover:translate-y-0.5 transition-transform" />
                      View More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Map */}
        {hasSearchedLocation && (
          <div className="hidden lg:block w-[40%] h-full p-4 bg-gray-50">
            <VehicleMap 
              vehicles={vehicles} 
              center={mapCenter} 
              userLocation={userLocation}
              hoveredVehicleId={hoveredVehicleId}
              onPinHover={setHoveredVehicleId}
              onPinClick={(id) => {
                setHoveredVehicleId(id);
              }}
            />
          </div>
        )}

      </div>

      {/* Mobile Map Toggle (Optional) */}
      {hasSearchedLocation && (
        <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button 
            onClick={() => showNotification('info', 'Map view is optimized for desktop in this version.')}
            className="bg-gray-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl flex items-center gap-2 cursor-pointer"
          >
            <MapPin className="h-5 w-5" />
            Map
          </button>
        </div>
      )}

      {/* Custom Notification Popup */}
      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />

    </div>
  );
};

export default VehicleListing;
