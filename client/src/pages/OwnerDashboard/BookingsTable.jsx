import React from 'react';
import { XCircle } from 'lucide-react';

const BookingsTable = ({ bookings, onRejectBooking }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Manage Bookings</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Vehicle</th>
              <th className="p-4 font-medium">Dates</th>
              <th className="p-4 font-medium">Payment</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {bookings.filter(b => b.bookingStatus !== 'Pending').map(b => (
              <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4">
                  <p className="font-bold text-gray-900">{b.user?.name}</p>
                  <p className="text-xs text-gray-500">{b.user?.email}</p>
                </td>
                <td className="p-4 font-medium text-gray-700">{b.vehicle?.name}</td>
                <td className="p-4 text-sm text-gray-600">
                  {new Date(b.pickupDate).toLocaleDateString()} - {new Date(b.returnDate).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    b.paymentStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                    b.paymentStatus === 'Partial' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {b.paymentStatus === 'Completed' ? '100% Paid' : b.paymentStatus === 'Partial' ? '50% Advance' : 'Pending'}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                    b.bookingStatus === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                    b.bookingStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {b.bookingStatus}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Completed' && (
                    <button 
                      onClick={() => onRejectBooking(b._id)} 
                      className="text-red-600 hover:text-red-800 cursor-pointer"
                      title="Reject / Cancel Booking"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {bookings.filter(b => b.bookingStatus !== 'Pending').length === 0 && (
              <tr><td colSpan="6" className="p-8 text-center text-gray-500">No bookings yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsTable;
