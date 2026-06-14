import React from 'react';
import { List, Calendar, Activity } from 'lucide-react';

const OverviewStats = ({ vehicles, bookings }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-blue-100 p-4 rounded-xl text-blue-600"><List className="h-8 w-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Vehicles</p>
            <p className="text-3xl font-bold text-gray-900">{vehicles.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl text-green-600"><Calendar className="h-8 w-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Bookings</p>
            <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="bg-purple-100 p-4 rounded-xl text-purple-600"><Activity className="h-8 w-8" /></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Earnings (Est.)</p>
            <p className="text-3xl font-bold text-gray-900">₹{bookings.reduce((acc, curr) => acc + curr.totalAmount, 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewStats;
