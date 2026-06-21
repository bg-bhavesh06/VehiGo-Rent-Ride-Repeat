import React from "react";
import {
  MapPin,
  Settings,
  User,
  CheckCircle,
  XCircle,
  MessageCircle,
} from "lucide-react";

const VehicleSpecs = ({ vehicle, onStartChat, onGetDirection, geoLoading }) => {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {vehicle.name}
          </h1>
          <div className="flex items-center gap-4 text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {vehicle.location}
            </span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {vehicle.brand}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-primary-600">
            ₹{vehicle.pricePerHour}
          </p>
          <p className="text-gray-500 text-sm">per hour</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6 border-y border-gray-100 mb-6">
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Type</p>
          <p className="font-semibold text-gray-900">{vehicle.type}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <User className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Capacity</p>
          <p className="font-semibold text-gray-900">
            {vehicle.seatingCapacity} Seats
          </p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          <Settings className="h-6 w-6 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Fuel</p>
          <p className="font-semibold text-gray-900">{vehicle.fuelType}</p>
        </div>
        <div className="text-center p-4 bg-gray-50 rounded-2xl">
          {vehicle.availabilityStatus ? (
            <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
          ) : (
            <XCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
          )}
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-semibold text-gray-900">
            {vehicle.availabilityStatus ? "Available" : "Unavailable"}
          </p>
        </div>
      </div>

      {/* Chat & Direction Buttons */}
      <div className="mb-8 border-t border-gray-100 pt-6 flex flex-col sm:flex-row gap-4">
        {/* <button 
          onClick={onStartChat}
          className="flex items-center justify-center gap-2 flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold transition shadow-md"
        >
          <MessageCircle className="h-5 w-5" />
          Chat with Owner
        </button> */}
        <button
          onClick={onGetDirection}
          disabled={geoLoading}
          className="flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {geoLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <MapPin className="h-5 w-5" />
              Get Direction
            </>
          )}
        </button>
      </div>

      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
        <p className="text-gray-600 leading-relaxed">
          {vehicle.description ||
            "No detailed description provided by the owner."}
        </p>
      </div>

      {/* Owner Info */}
      <div className="mt-8 pt-8 border-t border-gray-100 flex items-center gap-4">
        <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
          {vehicle.owner?.name?.charAt(0) || "O"}
        </div>
        <div>
          <p className="text-sm text-gray-500">Owned by</p>
          <p className="font-bold text-gray-900">{vehicle.owner?.name}</p>
        </div>
      </div>
    </div>
  );
};

export default VehicleSpecs;
