import React from 'react';

const ProfileSettings = ({ user }) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input type="text" defaultValue={user.name} disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" defaultValue={user.email} disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500" />
        </div>
        {/* Future implementation: Update profile logic */}
      </form>
    </div>
  );
};

export default ProfileSettings;
