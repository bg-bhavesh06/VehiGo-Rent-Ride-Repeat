import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Settings, User, ChevronLeft, ChevronRight } from 'lucide-react';

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
        
        <p className="text-gray-500 text-sm mb-3 line-clamp-1">{vehicle.description || `${vehicle.brand} ${vehicle.model}`}</p>
        
        {vehicle.activeBookings && vehicle.activeBookings.length > 0 && (
          <div className="mb-3 relative" onClick={(e) => e.stopPropagation()}>
            <details className="group">
              <summary className="text-xs font-bold text-orange-800 bg-orange-50 p-2.5 rounded-xl border border-orange-100 cursor-pointer list-none flex justify-between items-center outline-none">
                <span>Booked Dates ({vehicle.activeBookings.length})</span>
                <span className="text-orange-500 group-open:rotate-180 transition-transform text-[10px]">▼</span>
              </summary>
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 shadow-xl rounded-xl p-2 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {vehicle.activeBookings.map((b, i) => (
                    <div key={i} className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1.5 rounded">
                      {new Date(b.pickupDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} to {new Date(b.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}

        <div className="grid grid-cols-2 gap-y-2 mb-2">
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

        <div className="w-full mt-4 py-2.5 bg-gray-50 group-hover:bg-primary-50 group-hover:text-primary-700 text-gray-700 font-bold border border-gray-100 group-hover:border-primary-100 rounded-xl transition-all duration-300 text-center text-sm">
          View Details
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;
