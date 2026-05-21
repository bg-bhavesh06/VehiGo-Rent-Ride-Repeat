import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';

const LocationSearchInput = ({ value, onLocationSelect, placeholder = "Search location...", className = "" }) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Debounced search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3 || !showDropdown) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Error fetching location suggestions:', error);
      }
      setLoading(false);
    };

    const timeoutId = setTimeout(() => {
      fetchSuggestions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [query, showDropdown]);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSelect = (s) => {
    setQuery(s.display_name);
    setShowDropdown(false);
    onLocationSelect({
      location: s.display_name,
      latitude: s.lat,
      longitude: s.lon
    });
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input 
          type="text" 
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <div 
              key={s.place_id} 
              onClick={() => handleSelect(s)}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 flex items-start gap-3 last:border-0"
            >
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 line-clamp-1">{s.display_name.split(',')[0]}</p>
                <p className="text-xs text-gray-500 line-clamp-1">{s.display_name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationSearchInput;
