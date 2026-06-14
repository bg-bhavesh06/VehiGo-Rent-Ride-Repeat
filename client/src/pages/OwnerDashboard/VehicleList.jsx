import React from 'react';
import { ChevronDown } from 'lucide-react';
import OwnerVehicleCard from './OwnerVehicleCard';

const VehicleList = ({ vehicles, visibleCount, setVisibleCount, setActiveTab, handleToggleAvailability, handleDeleteVehicle }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Vehicles</h2>
        <button onClick={() => setActiveTab('add_vehicle')} className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700">Add New</button>
      </div>
      {vehicles.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
          No vehicles listed yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.slice(0, visibleCount).map(v => (
              <OwnerVehicleCard 
                key={v._id} 
                v={v} 
                handleToggleAvailability={handleToggleAvailability}
                handleDeleteVehicle={handleDeleteVehicle}
              />
            ))}
          </div>
          {/* View More Button */}
          {visibleCount < vehicles.length && (
            <div className="mt-10 mb-2 flex justify-center animate-fadeIn">
              <button
                onClick={() => setVisibleCount(prev => prev + 12)}
                className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 group cursor-pointer"
              >
                <ChevronDown className="h-4.5 w-4.5 group-hover:translate-y-0.5 transition-transform" />
                View More
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VehicleList;
