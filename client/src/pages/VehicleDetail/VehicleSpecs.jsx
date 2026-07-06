import React from "react";
import {
  MapPin,
  Car,
  Users,
  Fuel,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Navigation,
} from "lucide-react";

/**
 * VehicleSpecs Component
 * 
 * Displays the primary specs, brand badge, pricing structure, descriptions,
 * quick action buttons (Chat with Owner, Get Directions), and owner contact info.
 */
const VehicleSpecs = ({ vehicle, onStartChat, onGetDirection, geoLoading }) => {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
            {vehicle.brand}
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
            {vehicle.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
            <MapPin className="h-4.5 w-4.5 text-gray-400" />
            <span>{vehicle.location}</span>
          </div>
        </div>
        <div className="sm:text-right">
          <div className="flex items-baseline gap-1 sm:justify-end">
            <span className="text-3xl font-black text-blue-600">₹{vehicle.pricePerHour}</span>
            <span className="text-gray-500 text-sm">/ hour</span>
          </div>
          <span className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-md mt-1 inline-block">
            No Hidden Fees
          </span>
        </div>
      </div>

      {/* Grid of Key Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-gray-100 mb-8">
        {/* Type */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition hover:bg-gray-50">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 text-gray-600">
            <Car className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Type</p>
          <p className="font-bold text-gray-900 text-sm capitalize">{vehicle.type}</p>
        </div>

        {/* Capacity */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition hover:bg-gray-50">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 text-gray-600">
            <Users className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Capacity</p>
          <p className="font-bold text-gray-900 text-sm">{vehicle.seatingCapacity} Seats</p>
        </div>

        {/* Fuel */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition hover:bg-gray-50">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 mb-3 text-gray-600">
            <Fuel className="h-5 w-5" />
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Fuel</p>
          <p className="font-bold text-gray-900 text-sm capitalize">{vehicle.fuelType}</p>
        </div>

        {/* Status */}
        <div className="flex flex-col items-center text-center p-4 bg-gray-50/50 border border-gray-100 rounded-2xl transition hover:bg-gray-50">
          <div className="p-2.5 bg-white rounded-xl shadow-sm border border-gray-100 mb-3">
            {vehicle.availabilityStatus ? (
              <ShieldCheck className="h-5 w-5 text-green-500" />
            ) : (
              <ShieldAlert className="h-5 w-5 text-red-500" />
            )}
          </div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-0.5">Status</p>
          <p className={`font-bold text-sm ${vehicle.availabilityStatus ? 'text-green-600' : 'text-red-500'}`}>
            {vehicle.availabilityStatus ? "Available" : "Unavailable"}
          </p>
        </div>
      </div>

      {/* Main Description */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-2.5">About this Vehicle</h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          {vehicle.description || "No detailed description provided by the owner."}
        </p>
      </div>

      {/* Chat & Direction Buttons (Side by Side & Styled Professionally) */}
      <div className="mb-8 p-6 bg-gray-50/50 border border-gray-100 rounded-2xl flex flex-col sm:flex-row gap-4 items-center">
        <div className="flex-1 w-full">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Need assistance?</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onStartChat}
              className="flex items-center justify-center gap-2 flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 hover:text-gray-900 px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <MessageSquare className="h-4.5 w-4.5 text-gray-500" />
              Chat with Owner
            </button>
            <button
              onClick={onGetDirection}
              disabled={geoLoading}
              className="flex items-center justify-center gap-2 flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-emerald-600/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {geoLoading ? (
                <div className="animate-spin rounded-full h-4.5 w-4.5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Navigation className="h-4.5 w-4.5" />
                  Get Direction
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Owner Profile Card info */}
      <div className="pt-6 border-t border-gray-100 flex items-center gap-3.5">
        <div className="h-11 w-11 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
          {vehicle.owner?.name?.charAt(0) || "O"}
        </div>
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Vehicle Listed By</p>
          <p className="font-bold text-gray-900 text-sm leading-none">{vehicle.owner?.name}</p>
        </div>
      </div>
    </div>
  );
};

export default VehicleSpecs;
