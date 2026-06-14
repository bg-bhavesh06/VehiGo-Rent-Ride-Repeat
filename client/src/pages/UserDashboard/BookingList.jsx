import React from 'react';
import { XCircle, CheckCircle, CreditCard, Clock, AlertTriangle } from 'lucide-react';

const BookingList = ({ bookings, onCancelBooking, onPayment }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Bookings</h2>
      
      <div className="space-y-4">
        {bookings.map(booking => (
          <div key={booking._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
              {booking.vehicle?.images?.length > 0 ? (
                <img src={booking.vehicle.images[0]} alt={booking.vehicle.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
              )}
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-gray-900">{booking.vehicle?.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    booking.bookingStatus === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    booking.bookingStatus === 'Confirmed' ? 'bg-blue-100 text-blue-700' :
                    booking.bookingStatus === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {booking.bookingStatus}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mb-4">
                  {new Date(booking.pickupDate).toLocaleDateString()} to {new Date(booking.returnDate).toLocaleDateString()}
                </p>
                {booking.bookingStatus === 'Cancelled' && booking.rejectionReason && (
                  <div className="mt-3 bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs flex gap-2.5 items-start max-w-xl animate-fadeIn">
                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950 uppercase tracking-wider text-[10px] mb-0.5">Mistake in documents / details:</p>
                      <p className="font-semibold text-gray-800 mb-1 leading-normal">"{booking.rejectionReason}"</p>
                      <p className="text-[10px] text-amber-700 font-medium">Please upload correct documents and submit a new booking request.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-4 items-center justify-between border-t border-gray-50 pt-4">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-gray-900">₹{booking.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Paid</p>
                    <p className="font-bold text-green-600">₹{booking.paidAmount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pending</p>
                    <p className="font-bold text-red-600">₹{booking.remainingAmount}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Completed' && (
                    <button onClick={() => onCancelBooking(booking._id)} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> Cancel
                    </button>
                  )}
                  
                  {booking.paymentStatus !== 'Completed' && booking.bookingStatus !== 'Cancelled' && (
                    <button onClick={() => onPayment(booking)} className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> 
                      {booking.paymentStatus === 'Pending' ? 'Pay Advance (50%)' : 'Pay Remaining'}
                    </button>
                  )}
                  
                  {booking.paymentStatus === 'Completed' && (
                    <span className="flex items-center gap-1 text-green-600 text-sm font-medium">
                      <CheckCircle className="h-4 w-4" /> Fully Paid
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {bookings.length === 0 && (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-100">
            <Clock className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="text-gray-500 mt-2">You haven't made any bookings yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
