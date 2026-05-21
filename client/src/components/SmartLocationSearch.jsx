import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Search, Navigation, Building2 } from 'lucide-react';

const SmartLocationSearch = ({ onSearch, initialValue = '', autoNavigate = true }) => {
  const [query, setQuery] = useState(initialValue);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dbCities, setDbCities] = useState([]);
  const [apiSuggestions, setApiSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const dropdownRef = useRef(null);
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
          alert("Error getting location. Please enable location services.");
          console.error("Geolocation error:", error);
        }
      );
    } else {
      setGeoLoading(false);
      alert("Geolocation is not supported by your browser");
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
    <div className="relative w-full flex flex-col md:flex-row gap-4" ref={dropdownRef}>
      <div className="flex-1 relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Where do you want to rent?"
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 text-gray-900 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 transition shadow-inner"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}

        {/* Dropdown Options */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto overflow-x-hidden">
            
            {/* Show Nearby and DB Cities when query is short */}
            {query.length < 3 && (
              <div className="py-2">
                <div 
                  onClick={handleNearbyClick}
                  className="px-4 py-3 hover:bg-primary-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 transition-colors"
                >
                  <div className="bg-primary-100 p-2 rounded-lg text-primary-600">
                    {geoLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div> : <Navigation className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Nearby</p>
                    <p className="text-xs text-gray-500">Find vehicles near your current location</p>
                  </div>
                </div>

                {dbCities.length > 0 && (
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

      <button 
        onClick={handleManualSearch}
        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30 whitespace-nowrap"
      >
        <Search className="h-5 w-5" />
        Search
      </button>
    </div>
  );
};

export default SmartLocationSearch;
