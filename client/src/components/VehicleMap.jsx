import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// Custom Map Updater component to center map on new search coordinates
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center.length === 2 && center[0] && center[1]) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

// Create custom divIcon for price pins
const createPriceIcon = (price, isHovered) => {
  const bgColor = isHovered ? 'bg-gray-900 text-white' : 'bg-white text-gray-900';
  const borderColor = isHovered ? 'border-gray-900' : 'border-gray-300';
  
  const html = `
    <div class="px-2 py-1 rounded-full font-bold text-sm shadow-md border ${bgColor} ${borderColor} flex items-center justify-center transition-all whitespace-nowrap" style="transform: translate(-50%, -100%);">
      ₹${price}
    </div>
  `;
  
  return L.divIcon({
    html,
    className: 'custom-leaflet-pin', // removes default leaflet styles
    iconSize: [0, 0], // let CSS handle size
    iconAnchor: [0, 0], 
  });
};

const userIcon = L.divIcon({
  html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)]" style="transform: translate(-50%, -50%);"></div>`,
  className: 'user-location-pin',
  iconSize: [0, 0],
});

const VehicleMap = ({ vehicles, center, userLocation, hoveredVehicleId, onPinHover, onPinClick }) => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer 
        center={center || [20.5937, 78.9629]} // default India center
        zoom={center ? 12 : 5} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {center && <MapUpdater center={center} zoom={12} />}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon} />
        )}

        {vehicles.map((vehicle) => {
          if (!vehicle.latitude || !vehicle.longitude) return null;
          
          const isHovered = hoveredVehicleId === vehicle._id;
          const position = [vehicle.latitude, vehicle.longitude];
          
          return (
            <Marker 
              key={vehicle._id} 
              position={position}
              icon={createPriceIcon(vehicle.pricePerHour, isHovered)}
              eventHandlers={{
                mouseover: () => onPinHover && onPinHover(vehicle._id),
                mouseout: () => onPinHover && onPinHover(null),
                click: () => onPinClick && onPinClick(vehicle._id),
              }}
              zIndexOffset={isHovered ? 1000 : 0}
            >
              <Popup className="vehicle-popup custom-popup" closeButton={false}>
                <div className="w-48 overflow-hidden rounded-xl bg-white border-0 shadow-lg">
                  <div className="h-24 bg-gray-200 relative">
                    {vehicle.images && vehicle.images[0] ? (
                      <img src={vehicle.images[0]} alt={vehicle.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold shadow-sm">
                      ₹{vehicle.pricePerHour}/hr
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm text-gray-900 truncate mb-1">{vehicle.name}</h4>
                    <p className="text-xs text-gray-500 mb-2 truncate">{vehicle.brand} • {vehicle.type}</p>
                    <button 
                      onClick={() => window.open(`/vehicles/${vehicle._id}`, '_blank')}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-1.5 rounded-lg text-xs font-bold transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default VehicleMap;
