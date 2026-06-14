import React from 'react';
import { Calendar, Upload } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const BookingForm = ({ 
  vehicle, pickupDate, setPickupDate, returnDate, setReturnDate, 
  bookedIntervals, documents, setDocuments, bookingLoading, error, 
  totalAmount, onSubmit 
}) => {
  const isDateBlocked = (date) => {
    if (vehicle && !vehicle.availabilityStatus) return true;
    return bookedIntervals.some(interval => {
      const d = new Date(date).setHours(0,0,0,0);
      const s = new Date(interval.start).setHours(0,0,0,0);
      const e = new Date(interval.end).setHours(0,0,0,0);
      return d >= s && d <= e;
    });
  };

  const getDayClassName = (date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    if (date < today) return "text-gray-300";
    return isDateBlocked(date) 
      ? "bg-red-100 text-red-600 font-bold !cursor-not-allowed" 
      : "bg-green-100 text-green-700 font-bold hover:bg-green-200";
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-100 sticky top-24">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Book this Vehicle</h3>
      
      {!vehicle.availabilityStatus && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 font-medium text-center">
          This vehicle is currently unavailable.
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm whitespace-pre-wrap">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <DatePicker
              selected={pickupDate}
              onChange={(date) => setPickupDate(date)}
              selectsStart
              startDate={pickupDate}
              endDate={returnDate}
              minDate={new Date()}
              excludeDateIntervals={vehicle && !vehicle.availabilityStatus ? [{start: new Date('1970-01-01'), end: new Date('2100-01-01')}] : bookedIntervals}
              dayClassName={getDayClassName}
              className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
              placeholderText="Select pickup date and time"
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={30}
              dateFormat="MMM d, yyyy h:mm aa"
              required
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
            <DatePicker
              selected={returnDate}
              onChange={(date) => setReturnDate(date)}
              selectsEnd
              startDate={pickupDate}
              endDate={returnDate}
              minDate={pickupDate || new Date()}
              excludeDateIntervals={vehicle && !vehicle.availabilityStatus ? [{start: new Date('1970-01-01'), end: new Date('2100-01-01')}] : bookedIntervals}
              dayClassName={getDayClassName}
              className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500"
              placeholderText="Select return date and time"
              showTimeSelect
              timeFormat="hh:mm aa"
              timeIntervals={30}
              dateFormat="MMM d, yyyy h:mm aa"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documents (Aadhaar/License)</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-gray-50 transition cursor-pointer relative">
            <input 
              type="file" 
              multiple 
              onChange={(e) => setDocuments(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Upload className="mx-auto h-6 w-6 text-gray-400 mb-2" />
            <span className="text-sm text-gray-600">
              {documents.length > 0 ? `${documents.length} files selected` : 'Click to upload files'}
            </span>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl mt-6">
          <div className="flex justify-between text-gray-600 mb-2">
            <span>Price per hour</span>
            <span>₹{vehicle.pricePerHour}</span>
          </div>
          {totalAmount > 0 && (
            <div className="flex justify-between font-bold text-lg text-gray-900 border-t border-gray-200 pt-2 mt-2">
              <span>Total Amount</span>
              <span>₹{totalAmount}</span>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2 text-center">You'll need to pay 50% advance to confirm booking.</p>
        </div>

        <button 
          type="submit" 
          disabled={!vehicle.availabilityStatus || bookingLoading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {bookingLoading ? 'Processing...' : 'Proceed to Book'}
        </button>
      </form>
    </div>
  );
};

export default BookingForm;
