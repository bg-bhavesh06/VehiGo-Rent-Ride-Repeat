import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

/**
 * DirectionMap Component
 * 
 * Displays the route directions from the user's location to the vehicle location.
 * Renders on a Mapbox GL map inside a centered modal overlay.
 */
const DirectionMap = ({ 
  isOpen, 
  onClose, 
  vehicle, 
  userLoc, 
  routePoints, 
  roadDistance, 
  roadDuration, 
  routingLoading, 
  calculateDistance 
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const [mapError, setMapError] = useState(null);

  // Set the Mapbox access token
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

  // Initialize Mapbox instance when popup is active
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    try {
      if (!mapboxgl.accessToken) {
        throw new Error("Mapbox API access token is missing.");
      }

      const initialLng = vehicle ? vehicle.longitude : 78.9629;
      const initialLat = vehicle ? vehicle.latitude : 20.5937;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [initialLng, initialLat],
        zoom: 12,
      });

      mapRef.current = map;

      // Define line layer source on map loaded
      map.on('load', () => {
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          }
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#059669',
            'line-width': 5
          }
        });
      });

      // Handle canvas resizing correctly
      setTimeout(() => {
        map.resize();
      }, 100);

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    } catch (err) {
      console.error("Failed to initialize direction Mapbox GL map:", err);
      setMapError(err.message || "Failed to load directions map.");
    }
  }, [isOpen]);

  // Synchronize route lines, markers, and bounds fitting
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Render Owner Vehicle Marker
    if (vehicleMarkerRef.current) {
      vehicleMarkerRef.current.remove();
      vehicleMarkerRef.current = null;
    }
    if (vehicle && vehicle.latitude && vehicle.longitude) {
      const el = document.createElement('div');
      el.className = 'bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center font-bold text-xs w-7 h-7';
      el.innerHTML = '🚗';

      const popup = new mapboxgl.Popup({ offset: [0, -10] })
        .setHTML(`<div class="text-xs font-bold text-gray-900">${vehicle.name}</div>`);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([vehicle.longitude, vehicle.latitude])
        .setPopup(popup)
        .addTo(map);

      vehicleMarkerRef.current = marker;
    }

    // 2. Render User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userLoc && userLoc.lat && userLoc.lon) {
      const el = document.createElement('div');
      el.className = 'w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]';

      const popup = new mapboxgl.Popup({ offset: [0, -10] })
        .setHTML('<div class="text-xs font-bold text-gray-900">Your Location</div>');

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([userLoc.lon, userLoc.lat])
        .setPopup(popup)
        .addTo(map);

      userMarkerRef.current = marker;
    }

    // 3. Draw Route and adjust Zoom bounds
    const drawAndFit = () => {
      const mapboxRoutePoints = routePoints && routePoints.length > 0
        ? routePoints.map(p => [p[1], p[0]]) 
        : [];

      const source = map.getSource('route');
      if (source) {
        if (mapboxRoutePoints.length > 0) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: mapboxRoutePoints
            }
          });
        } else if (userLoc && vehicle && vehicle.latitude && vehicle.longitude) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [userLoc.lon, userLoc.lat],
                [vehicle.longitude, vehicle.latitude]
              ]
            }
          });
        }
      }

      // Auto fit bounds
      if (mapboxRoutePoints.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        mapboxRoutePoints.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, { padding: 40, duration: 1000 });
      } else if (userLoc && vehicle && vehicle.latitude && vehicle.longitude) {
        const bounds = new mapboxgl.LngLatBounds()
          .extend([userLoc.lon, userLoc.lat])
          .extend([vehicle.longitude, vehicle.latitude]);
        map.fitBounds(bounds, { padding: 40, duration: 1000 });
      }
    };

    if (map.loaded()) {
      drawAndFit();
    } else {
      map.once('load', drawAndFit);
    }
  }, [userLoc, vehicle, routePoints]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[1000] backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl h-[85vh] md:h-[650px] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <MapPin className="h-6 w-6 text-emerald-100" />
            <div>
              <p className="font-bold text-base leading-tight">Route Directions</p>
              {routingLoading ? (
                <p className="text-xs text-emerald-200 animate-pulse font-medium">Calculating route...</p>
              ) : roadDistance ? (
                <p className="text-xs text-emerald-100 font-semibold flex items-center gap-2 mt-0.5">
                  <span>🚗 {roadDistance} km</span>
                  {roadDuration && <span>⏱️ {roadDuration} mins</span>}
                </p>
              ) : userLoc && vehicle?.latitude && vehicle?.longitude ? (
                <p className="text-xs text-emerald-100 font-semibold mt-0.5">
                  Distance: {calculateDistance(userLoc.lat, userLoc.lon, vehicle.latitude, vehicle.longitude)} km
                </p>
              ) : (
                <p className="text-xs text-emerald-200 mt-0.5">Locating vehicle...</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-emerald-200 hover:text-white hover:bg-emerald-700/50 rounded-lg transition cursor-pointer">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Map Area */}
        <div className="flex-1 relative bg-gray-100">
          {mapError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
              <MapPin className="h-10 w-10 text-red-500 mb-3 animate-bounce" />
              <h4 className="text-base font-bold text-gray-900">Map Unavailable</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-[320px]">{mapError}</p>
              <span className="text-xs text-gray-400 font-mono mt-4">Configure VITE_MAPBOX_TOKEN in .env</span>
            </div>
          ) : vehicle?.latitude && vehicle?.longitude ? (
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium p-4 text-center">
              Vehicle coordinates not available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectionMap;
