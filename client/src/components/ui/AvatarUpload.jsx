import React from 'react';

const AvatarUpload = ({ user, onAvatarChange, accountType }) => {
  return (
    <div className="text-center mb-6 pb-6 border-b border-gray-100">
      <div className="h-16 w-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-3 relative group overflow-hidden cursor-pointer shadow-sm border border-gray-200">
        {user?.avatar ? (
          <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span>{user?.name?.charAt(0)}</span>
        )}
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <label className="cursor-pointer w-full h-full flex items-center justify-center">
            <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
          </label>
        </div>
      </div>
      <h3 className="font-bold text-gray-900">{user?.name}</h3>
      <p className="text-sm text-gray-500">{accountType}</p>
    </div>
  );
};

export default AvatarUpload;
