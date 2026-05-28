import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search, Navigation, Building2, Locate, X } from 'lucide-react';

const SmartLocationSearch = ({ onSearch, initialValue = '', autoNavigate = true, isSidebar = false }) => {
  const [query, setQuery] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dbCities, setDbCities] = useState([]);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const dropdownRef = useRef(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(prev => prev && prev.message === message ? null : prev);
    }, 5000);
  };
  const navigate = useNavigate();

  // Fetch cities from DB on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data } = await axios.get('/api/vehicles/cities');
        // Extract basic city names from full addresses if needed, or just use as is
        // We'll deduplicate and clean up common patterns
        const cleanedCities = [...new Set(data.map(loc => loc.split(',')[0].trim()))].filter(Boolean);
        setDbCities(cleanedCities);
      } catch (error) {
        console.error('Error fetching db cities', error);
      }
    };
    fetchCities();
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Debounced Nominatim API call
  useEffect(() => {
    const fetchApiSuggestions = async () => {
      if (query.length < 3 || !showDropdown) {
        setApiSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setApiSuggestions(data);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(() => {
      fetchApiSuggestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, showDropdown]);

  const handleNearbyClick = () => {
    setGeoLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoLoading(false);
          setShowDropdown(false);
          setQuery("Current Location");
          const searchParams = new URLSearchParams();
          searchParams.set('lat', position.coords.latitude);
          searchParams.set('lon', position.coords.longitude);
          searchParams.set('nearby', 'true');
          
          if (autoNavigate) {
            navigate(`/vehicles?${searchParams.toString()}`);
          } else if (onSearch) {
            onSearch({ lat: position.coords.latitude, lon: position.coords.longitude, nearby: true, display: "Current Location" });
          }
        },
        (error) => {
          setGeoLoading(false);
          showNotification('error', "Error getting location. Please enable location services.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setGeoLoading(false);
      showNotification('error', "Geolocation is not supported by your browser");
    }
  };

  const handleCityClick = (city) => {
    setQuery(city);
    setShowDropdown(false);
    const searchParams = new URLSearchParams();
    searchParams.set('location', city);
    
    if (autoNavigate) {
      navigate(`/vehicles?${searchParams.toString()}`);
    } else if (onSearch) {
      onSearch({ location: city, display: city });
    }
  };

  const handleApiSuggestionClick = (s) => {
    const displayName = s.display_name.split(',')[0];
    setQuery(displayName);
    setShowDropdown(false);
    const searchParams = new URLSearchParams();
    searchParams.set('lat', s.lat);
    searchParams.set('lon', s.lon);
    searchParams.set('location', displayName);
    
    if (autoNavigate) {
      navigate(`/vehicles?${searchParams.toString()}`);
    } else if (onSearch) {
      onSearch({ lat: s.lat, lon: s.lon, location: displayName, display: displayName });
    }
  };

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!query) return;
    const searchParams = new URLSearchParams();
    searchParams.set('location', query);
    
    if (autoNavigate) {
      navigate(`/vehicles?${searchParams.toString()}`);
    } else if (onSearch) {
      onSearch({ location: query, display: query });
    }
    setShowDropdown(false);
  };

  return (
    <div className={`relative w-full flex ${isSidebar ? 'flex-col gap-2' : 'flex-col md:flex-row gap-4'}`} ref={dropdownRef}>
      <div className="flex-1 relative">
        <MapPin className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isSidebar ? 'left-2.5 h-4 w-4' : 'left-3 h-5 w-5'}`} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Where do you want to rent?"
          className={`w-full rounded-xl bg-white/90 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition shadow-inner ${isSidebar ? 'py-2 pl-8 pr-4 text-sm' : 'py-3 pl-10 pr-24 text-base'}`}
        />
        
        {/* Near me pill inside the input field - Main page only */}
        {!isSidebar && (
          <button
            type="button"
            onClick={handleNearbyClick}
            disabled={geoLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full font-bold transition flex items-center justify-center gap-1 cursor-pointer select-none active:scale-95 disabled:opacity-75 py-1.5 px-3 text-xs"
          >
            {geoLoading ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-600"></div>
            ) : (
              <Locate className="h-3.5 w-3.5 text-gray-600" />
            )}
            <span>Near me</span>
          </button>
        )}

        {loading && (
          <div className={`absolute top-1/2 transform -translate-y-1/2 ${isSidebar ? 'right-3' : 'right-24'}`}>
            <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${isSidebar ? 'h-3.5 w-3.5' : 'h-4 w-4'}`}></div>
          </div>
        )}

        {/* Dropdown Options */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto overflow-x-hidden">
            
            {/* Show DB Cities when query is short */}
            {query.length < 3 && dbCities.length > 0 && (
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Available Cities</p>
                {dbCities.map((city, idx) => (
                  <div 
                    key={idx}
                    onClick={() => handleCityClick(city)}
                    className="py-2.5 px-2 hover:bg-gray-50 rounded-lg cursor-pointer flex items-center gap-3 transition-colors text-gray-700"
                  >
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-800">{city}</span>
                  </div>
                ))}
              </div>
            )}

            {/* API Suggestions for typing */}
            {query.length >= 3 && apiSuggestions.length > 0 && (
              <div className="py-2">
                <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">Suggestions</p>
                {apiSuggestions.map((s) => (
                  <div 
                    key={s.place_id} 
                    onClick={() => handleApiSuggestionClick(s)}
                    className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex items-start gap-3 transition-colors"
                  >
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{s.display_name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{s.display_name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {query.length >= 3 && !loading && apiSuggestions.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                No locations found. Press search to try anyway.
              </div>
            )}

          </div>
        )}
      </div>

      {isSidebar ? (
        <div className="flex gap-2 w-full">
          <button 
            type="submit"
            onClick={handleManualSearch}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-primary-600/30 whitespace-nowrap flex-1 py-2 px-3 text-sm cursor-pointer"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
          <button 
            type="button"
            onClick={handleNearbyClick}
            disabled={geoLoading}
            className="border border-primary-200 bg-primary-50/60 hover:bg-primary-100/80 text-primary-700 rounded-xl font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap flex-1 py-2 px-3 text-sm disabled:opacity-75 cursor-pointer"
          >
            {geoLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
            ) : (
              <Navigation className="h-4 w-4 rotate-45" />
            )}
            Near Me
          </button>
        </div>
      ) : (
        <button 
          onClick={handleManualSearch}
          className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 whitespace-nowrap w-full md:w-auto cursor-pointer"
        >
          <Search className="h-5 w-5" />
          Search
        </button>
      )}
      {/* Custom Notification Popup */}
      {notification && (
        <div className="fixed top-4 right-4 z-[9999] max-w-sm bg-gray-900 text-white py-3 px-4 rounded-xl shadow-xl flex items-center justify-between gap-4 text-xs font-semibold">
          <span>{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

    </div>
  );
};

export default SmartLocationSearch;
