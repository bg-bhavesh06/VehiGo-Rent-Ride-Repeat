import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Car, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <Car className="h-8 w-8 text-primary-600" />
              <span className="font-bold text-xl text-dark-900">AutoBook</span>
            </Link>
          </div>
          
          <div className="flex items-center gap-6">
            {user?.role !== 'Owner' && (
              <Link to="/vehicles" className="text-gray-700 hover:text-primary-600 font-medium transition">
                Browse Vehicles
              </Link>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  to={user.role === 'Owner' ? '/dashboard/owner' : '/dashboard/user'}
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Dashboard</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-800 transition"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-700 font-medium hover:text-primary-600 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-primary-600 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-700 transition">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
