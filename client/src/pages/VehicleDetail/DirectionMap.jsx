import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Custom component to fit bounds for route or locations
const MapBoundsFitter = ({ userLoc, vehicleLoc, routePoints }) => {
  const map = useMap();
  useEffect(() => {
    if (routePoints && routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    } else if (userLoc && vehicleLoc) {
      const bounds = L.latLngBounds([
        [userLoc.lat, userLoc.lon],
        [vehicleLoc.lat, vehicleLoc.lon]
      ]);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [userLoc, vehicleLoc, routePoints, map]);
  return null;
};

const DirectionMap = ({ 
  isOpen, onClose, vehicle, userLoc, routePoints, 
  roadDistance, roadDuration, routingLoading, isChatOpen,
  calculateDistance 
}) => {
  // Directions Card Dragging State & Refs
  const [dirPosition, setDirPosition] = useState({ x: 0, y: 0 });
  const [isDirDragging, setIsDirDragging] = useState(false);
  const dirDragRef = useRef({ isDragging: false, startX: 0, startY: 0, posX: 0, posY: 0 });

  const handleDirMouseDown = (e) => {
    if (e.button !== 0) return;
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
        <button onClick={onClose} className="text-emerald-200 hover:text-white transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Map Area */}
      <div className="flex-1 relative bg-gray-100">
        {vehicle?.latitude && vehicle?.longitude ? (
          <MapContainer 
            center={userLoc ? [(userLoc.lat + vehicle.latitude) / 2, (userLoc.lon + vehicle.longitude) / 2] : [vehicle.latitude, vehicle.longitude]}
            zoom={userLoc ? 12 : 14} 
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Fit bounds dynamically */}
            {userLoc && (
              <MapBoundsFitter 
                userLoc={userLoc} 
                vehicleLoc={{ lat: vehicle.latitude, lon: vehicle.longitude }} 
                routePoints={routePoints}
              />
            )}
            
            {/* Vehicle Marker */}
            <Marker 
              position={[vehicle.latitude, vehicle.longitude]}
              icon={L.divIcon({
                html: `<div class="bg-emerald-600 text-white p-1.5 rounded-full shadow-lg border border-white flex items-center justify-center font-bold" style="width: 28px; height: 28px; transform: translate(-50%, -50%);">🚗</div>`,
                className: 'vehicle-marker-pin',
                iconSize: [28, 28],
                iconAnchor: [14, 14],
              })}
            >
              <Popup>
                <div className="text-xs font-bold">{vehicle.name}</div>
              </Popup>
            </Marker>

            {/* User Marker */}
            {userLoc && (
              <Marker 
                position={[userLoc.lat, userLoc.lon]}
                icon={L.divIcon({
                  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]" style="transform: translate(-50%, -50%);"></div>`,
                  className: 'user-location-pin',
                  iconSize: [16, 16],
                  iconAnchor: [8, 8],
                })}
              >
                <Popup>
                  <div className="text-xs font-bold">Your Location</div>
                </Popup>
              </Marker>
            )}

            {/* Line Connecting Them (OSRM road path or straight-line fallback) */}
            {routePoints && routePoints.length > 0 ? (
              <Polyline 
                positions={routePoints}
                color="#059669"
                weight={5}
              />
            ) : userLoc ? (
              <Polyline 
                positions={[
                  [userLoc.lat, userLoc.lon],
                  [vehicle.latitude, vehicle.longitude]
                ]}
                color="#059669"
                weight={4}
                dashArray="5, 10"
              />
            ) : null}
          </MapContainer>
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
