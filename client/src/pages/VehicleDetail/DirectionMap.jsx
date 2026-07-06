import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import mapboxgl from 'mapbox-gl';

/**
 * DirectionMap Component
 * 
 * Renders the map route from user current location to the owner vehicle coordinates.
 * Draggable card layout. Replaces the React-Leaflet routing component.
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
  isChatOpen,
  calculateDistance 
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const userMarkerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);

  // Set the Mapbox access token
  mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || '';

  // Card dragging positioning state
  const [dirPosition, setDirPosition] = useState({ x: 0, y: 0 });
  const [isDirDragging, setIsDirDragging] = useState(false);
  const dirDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleDirMouseDown = (e) => {
    if (e.button !== 0) return; // Only trigger dragging with left-click
    if (e.target.closest('button') || e.target.closest('a') || e.target.closest('svg')) return;

    dirDragRef.current.isDragging = true;
    dirDragRef.current.startX = e.clientX;
    dirDragRef.current.startY = e.clientY;
    dirDragRef.current.posX = dirPosition.x;
    dirDragRef.current.posY = dirPosition.y;
    
    setIsDirDragging(true);
    
    document.addEventListener('mousemove', handleDirMouseMove);
    document.addEventListener('mouseup', handleDirMouseUp);
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
  };

  const handleDirMouseMove = (e) => {
    if (!dirDragRef.current.isDragging) return;
    const dx = e.clientX - dirDragRef.current.startX;
    const dy = e.clientY - dirDragRef.current.startY;
    
    setDirPosition({
      x: dirDragRef.current.posX + dx,
      y: dirDragRef.current.posY + dy
    });
  };

  const handleDirMouseUp = () => {
    dirDragRef.current.isDragging = false;
    setIsDirDragging(false);
    document.removeEventListener('mousemove', handleDirMouseMove);
    document.removeEventListener('mouseup', handleDirMouseUp);
    
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDirMouseMove);
      document.removeEventListener('mouseup', handleDirMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, []);

  // Initialize Mapbox instance when popup is active
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

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
      el.className = 'bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center font-bold';
      el.style.width = '28px';
      el.style.height = '28px';
      el.style.fontSize = '12px';
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
      // Reverse coordinates order: Leaflet was using [lat, lng], Mapbox requires [lng, lat]
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
          // fallback straight dotted line connecting locations
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
    <div 
      className={`fixed bottom-4 ${isChatOpen && dirPosition.x === 0 && dirPosition.y === 0 ? 'right-[324px] md:right-[360px]' : 'right-4 md:right-10'} w-[320px] md:w-[400px] h-[400px] bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-200 flex flex-col z-[100] overflow-hidden`}
      style={{
        transform: `translate(${dirPosition.x}px, ${dirPosition.y}px)`,
        transition: isDirDragging ? 'none' : 'transform 0.3s'
      }}
    >
      {/* Header */}
      <div 
        className="bg-emerald-600 p-3 flex justify-between items-center text-white cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDirMouseDown}
      >
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-emerald-100" />
          <div>
            <p className="font-bold text-sm leading-tight">Get Directions</p>
            {routingLoading ? (
              <p className="text-[10px] text-emerald-200 animate-pulse font-medium">Calculating route...</p>
            ) : roadDistance ? (
              <p className="text-[10px] text-emerald-100 font-semibold flex items-center gap-2">
                <span>🚗 {roadDistance} km</span>
                {roadDuration && <span>⏱️ {roadDuration} mins</span>}
              </p>
            ) : userLoc && vehicle?.latitude && vehicle?.longitude ? (
              <p className="text-[10px] text-emerald-100 font-semibold">
                Distance: {calculateDistance(userLoc.lat, userLoc.lon, vehicle.latitude, vehicle.longitude)} km
              </p>
            ) : (
              <p className="text-[10px] text-emerald-200">Locating vehicle...</p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-emerald-200 hover:text-white transition cursor-pointer">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        {vehicle?.latitude && vehicle?.longitude ? (
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 font-medium p-4 text-center">
            Vehicle coordinates not available.
          </div>
        )}
      </div>
    </div>
  );
};

export default DirectionMap;
