import React from 'react';

const RejectionModal = ({ isOpen, rejectionReason, setRejectionReason, customRejectionReason, setCustomRejectionReason, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-gray-100">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
          <h3 className="text-base font-bold text-gray-900">Reject Booking</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition cursor-pointer text-sm font-bold"
          >
            ✕
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mb-4 leading-normal">
          Select the document mistake or cancellation reason to show the renter.
        </p>
        
        <div className="space-y-3">
          <div>
            <select 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs bg-white"
            >
              <option value="Aadhaar Card mistake (blurred/unreadable image)">Aadhaar Card mistake (blurred/unreadable image)</option>
              <option value="Aadhaar Card mistake (name doesn't match profile)">Aadhaar Card mistake (name doesn't match profile)</option>
              <option value="Driving License mistake (expired license)">Driving License mistake (expired license)</option>
              <option value="Driving License mistake (blurred/unreadable image)">Driving License mistake (blurred/unreadable image)</option>
              <option value="Incorrect/invalid document uploaded">Incorrect/invalid document uploaded</option>
              <option value="Owner unavailable (vehicle maintenance)">Owner unavailable (vehicle maintenance)</option>
              <option value="Other">Other (Enter custom reason)</option>
            </select>
          </div>
          
          {rejectionReason === 'Other' && (
            <div>
              <textarea 
                rows="3" 
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                placeholder="Describe the reason..." 
                className="w-full p-2.5 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-5 text-xs">
          <button 
            onClick={onClose} 
            className="flex-grow py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg cursor-pointer text-center"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className="flex-grow py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer text-center shadow-md shadow-red-500/10"
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;
