import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

const LoginPrompt = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-xl">
        <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-500 mb-6">Please Login or Register to chat with the owner.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/login')} className="flex-1 bg-primary-600 text-white font-bold py-2 rounded-xl hover:bg-primary-700 transition">Login</button>
          <button onClick={() => navigate('/register')} className="flex-1 bg-gray-100 text-gray-700 font-bold py-2 rounded-xl hover:bg-gray-200 transition">Register</button>
        </div>
        <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">Cancel</button>
      </div>
    </div>
  );
};

export default LoginPrompt;
