import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const OwnerVehicleCard = ({ v, handleToggleAvailability, handleDeleteVehicle }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (v.images && v.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === v.images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (v.images && v.images.length > 0) {
      setCurrentImageIndex((prev) => (prev === 0 ? v.images.length - 1 : prev - 1));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition hover:shadow-md group relative">
      <div className="h-48 overflow-hidden relative bg-gray-200">
        {v.images && v.images.length > 0 ? (
          <>
            <img 
              src={v.images[currentImageIndex]} 
              alt={v.name} 
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" 
            />
            {v.images.length > 1 && (
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
                  {v.images.map((_, idx) => (
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
        <div className="absolute top-3 right-3 z-10">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${v.availabilityStatus ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {v.availabilityStatus ? 'Available' : 'Unavailable'}
          </span>
        </div>
      </div>
      <div className="p-5 flex flex-col flex-grow z-10 bg-white">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{v.name}</h3>
          <span className="font-bold text-primary-600">₹{v.pricePerHour}<span className="text-xs text-gray-500 font-normal">/hr</span></span>
        </div>
        <p className="text-sm text-gray-600 mb-4">{v.brand} • {v.type}</p>
        {v.activeBookings && v.activeBookings.length > 0 && (
          <div className="mb-4 relative">
            <details className="group">
              <summary className="text-xs font-bold text-orange-800 bg-orange-50 p-2.5 rounded-xl border border-orange-100 cursor-pointer list-none flex justify-between items-center outline-none">
                <span>Booked Dates ({v.activeBookings.length})</span>
                <span className="text-orange-500 group-open:rotate-180 transition-transform text-[10px]">▼</span>
              </summary>
              <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white border border-gray-200 shadow-xl rounded-xl p-2 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="flex flex-col gap-1">
                  {v.activeBookings.map((b, i) => (
                    <div key={i} className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1.5 rounded">
                      {new Date(b.pickupDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} to {new Date(b.returnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </div>
        )}
        <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{v.vehicleNumber}</span>
          <div className="flex gap-2">
            <button onClick={() => handleToggleAvailability(v._id, v.availabilityStatus)} className={`px-2 py-1.5 rounded-md text-xs font-medium transition ${v.availabilityStatus ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
              Mark {v.availabilityStatus ? 'Unavailable' : 'Available'}
            </button>
            <button onClick={() => handleDeleteVehicle(v._id)} className="px-2 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md text-xs font-medium transition">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerVehicleCard;
