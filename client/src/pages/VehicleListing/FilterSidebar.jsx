import React from 'react';
import { Filter, X } from 'lucide-react';
import SmartLocationSearch from '../../components/SmartLocationSearch';

const FilterSidebar = ({ filters, onLocationSearch, onFilterChange, onClearSearch }) => {
  return (
    <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-gray-200 bg-white p-4 flex flex-col gap-4 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
        <h2 className="font-bold text-gray-900 text-base flex items-center gap-1.5">
          <Filter className="h-4.5 w-4.5 text-primary-600" />
          Search & Filters
        </h2>
        {(filters.location || filters.type) && (
          <button 
            onClick={onClearSearch}
            className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors"
          >
            Reset All
          </button>
        )}
      </div>
      {/* Location Smart Search */}
      <div className="flex flex-col gap-1">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Location</label>
        <SmartLocationSearch 
          initialValue={filters.location} 
          onSearch={onLocationSearch}
          autoNavigate={false}
          isSidebar={true}
        />
      </div>        {/* Other Filters */}
      <div className="flex flex-col gap-1">
        <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider">Vehicle Type</label>
        <div className="flex gap-2 w-full">
          <div className="flex-1">
            <select 
              name="type"
              value={filters.type}
              onChange={onFilterChange}
              className="w-full py-2 px-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white"
            >
              <option value="">All Types</option>
              <option value="Car">Car</option>
              <option value="Bike">Bike</option>
              <option value="SUV">SUV</option>
            </select>
          </div>
          {(filters.location || filters.type) && (
            <button 
              onClick={onClearSearch}
              className="p-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-colors flex items-center justify-center"
              title="Clear Filters"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;
