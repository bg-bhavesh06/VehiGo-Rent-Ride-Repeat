import React from 'react';

const ConfirmDialog = ({ confirmModal, onClose, onConfirm }) => {
  if (!confirmModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-xl border border-gray-100 text-center">
        <h3 className="font-bold text-gray-900 text-base mb-2">{confirmModal.title}</h3>
        <p className="text-xs text-gray-500 mb-5 leading-normal">{confirmModal.message}</p>
        <div className="flex gap-2">
          <button 
            onClick={onClose} 
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
          >
            No, Keep
          </button>
          <button 
            onClick={onConfirm} 
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-md shadow-blue-500/10"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
