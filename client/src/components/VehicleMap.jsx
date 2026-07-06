import React, { useEffect, useState, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

/**
 * VehicleMap Component
 * 
 * Displays multiple vehicle locations on an interactive Mapbox GL map.
 * Replaces the previous React-Leaflet implementation.
 */
const VehicleMap = ({ 
  vehicles, 
  center, 
  userLocation, 
  hoveredVehicleId, 
  onPinHover, 
  onPinClick 
}) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);

  // Load the Mapbox access token from the environment config
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

  // Initialize Mapbox map on component mount
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Use center coordinate query, else default to center of India [lng, lat]
    const initialLng = center ? center[1] : 78.9629;
    const initialLat = center ? center[0] : 20.5937;
    const initialZoom = center ? 12 : 5;

    const mapInstance = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [initialLng, initialLat],
      zoom: initialZoom,
    });

    // Add navigation controls (zoom buttons) in the bottom right corner
    mapInstance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');

    setMap(mapInstance);

    // Clean up map container resource on unmount
    return () => {
      mapInstance.remove();
    };
  }, []);

  // Update map camera center when search location changes
  useEffect(() => {
    if (!map || !center) return;

    const [lat, lng] = center;
    if (lat && lng) {
      map.flyTo({
        center: [lng, lat],
        zoom: 12,
        essential: true
      });
    }
  }, [map, center]);

  // Update user current position marker dot on the map
  useEffect(() => {
    if (!map) return;

    // Remove existing user marker if user disables location search
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && userLocation.lat && userLocation.lon) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]';

      const userMarker = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lon, userLocation.lat])
        .addTo(map);

      userMarkerRef.current = userMarker;
    }
  }, [map, userLocation]);

  // Handle building and rendering dynamic price markers for listings
  useEffect(() => {
    if (!map) return;

    // Clear existing vehicle markers before re-rendering
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};

    vehicles.forEach(vehicle => {
      if (!vehicle.latitude || !vehicle.longitude) return;

      const isHovered = hoveredVehicleId === vehicle._id;

      // Create a custom HTML element for the marker pin
      const el = document.createElement('div');
      el.id = `marker-${vehicle._id}`;
      // Removed transitions and scaling animations as per request to keep it simple and static
      el.className = `px-2 py-1 rounded-full font-bold text-xs shadow-md border flex items-center justify-center whitespace-nowrap cursor-pointer ${
        isHovered ? 'bg-gray-900 text-white border-gray-900 z-50' : 'bg-white text-gray-900 border-gray-300'
      }`;
      el.style.transform = 'translate(-50%, -100%)';
      el.style.width = 'max-content';
      el.innerHTML = `₹${vehicle.pricePerHour}`;

      // Custom HTML popup window containing vehicle details card
      const popup = new mapboxgl.Popup({ offset: [0, -15], closeButton: false })
        .setHTML(`
          <div id="popup-card-${vehicle._id}" class="w-48 overflow-hidden rounded-xl bg-white border border-gray-100 shadow-lg cursor-pointer hover:shadow-xl transition-all duration-300">
            <div class="h-24 bg-gray-200 relative">
              ${vehicle.images && vehicle.images[0] 
                ? `<img src="${vehicle.images[0]}" alt="${vehicle.name}" class="w-full h-full object-cover" />`
                : `<div class="w-full h-full flex items-center justify-center text-gray-400 text-xs">No Image</div>`
              }
              <div class="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold shadow-sm text-gray-900">
                ₹${vehicle.pricePerHour}/hr
              </div>
            </div>
            <div class="p-3">
              <h4 class="font-bold text-sm text-gray-900 truncate mb-0.5">${vehicle.name}</h4>
              <p class="text-xs text-gray-500 mb-2 truncate">${vehicle.brand} • ${vehicle.type}</p>
              <div class="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                <span>View Details</span>
                <span>→</span>
              </div>
            </div>
          </div>
        `);

      // Initialize the Mapbox marker and add it to the map
      const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .setPopup(popup)
        .addTo(map);

      // Bind routing redirection to detail pages when clicking popup CTA card
      popup.on('open', () => {
        const card = document.getElementById(`popup-card-${vehicle._id}`);
        if (card) {
          card.addEventListener('click', () => {
            window.open(`/vehicles/${vehicle._id}`, '_blank');
          });
        }
      });

      // Bind hover and select handlers
      el.addEventListener('mouseenter', () => onPinHover && onPinHover(vehicle._id));
      el.addEventListener('mouseleave', () => onPinHover && onPinHover(null));
      el.addEventListener('click', () => {
        onPinClick && onPinClick(vehicle._id);
        // Explicitly toggle map popup display
        if (!marker.getPopup().isOpen()) {
          marker.togglePopup();
        }
      });

      markersRef.current[vehicle._id] = marker;
    });
  }, [map, vehicles, onPinHover, onPinClick]);

  // Synchronize hover state updates from list items to the map pins
  useEffect(() => {
    vehicles.forEach(vehicle => {
      const el = document.getElementById(`marker-${vehicle._id}`);
      if (!el) return;

      const isHovered = hoveredVehicleId === vehicle._id;
      if (isHovered) {
        el.className = 'px-2 py-1 rounded-full font-bold text-xs shadow-md border flex items-center justify-center whitespace-nowrap cursor-pointer bg-gray-900 text-white border-gray-900 z-50';
      } else {
        el.className = 'px-2 py-1 rounded-full font-bold text-xs shadow-md border flex items-center justify-center whitespace-nowrap cursor-pointer bg-white text-gray-900 border-gray-300';
      }
    });
  }, [hoveredVehicleId, vehicles]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative">
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export default VehicleMap;
