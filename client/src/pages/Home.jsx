import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Clock, MapPin, Search } from 'lucide-react';

const Home = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center bg-dark-900 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 to-dark-900/80 z-10"></div>
        {/* Abstract background elements instead of a raw image to ensure it looks good immediately */}
        <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDEwaDQwTTEwIDB2NDBtMjAgMHYtNDBNMCAzMGg0MCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==')] z-0"></div>
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Find Your Perfect <span className="text-primary-500">Ride</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
            Rent cars, bikes, and SUVs from trusted local owners. Fast, secure, and affordable.
          </p>
          
          {/* Quick Search Bar */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl flex flex-col md:flex-row gap-4 max-w-3xl mx-auto shadow-2xl border border-white/20">
            <div className="flex-1 relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Location" className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
            </div>
            <Link to="/vehicles" className="bg-primary-600 hover:bg-primary-500 text-white px-8 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30">
              <Search className="h-5 w-5" />
              Search
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-dark-900 mb-4">Why Choose AutoBook?</h2>
            <div className="h-1 w-20 bg-primary-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: ShieldCheck, title: "Verified Owners", desc: "Every vehicle owner goes through a strict verification process for your safety." },
              { icon: Clock, title: "Instant Booking", desc: "Book your ride in seconds with our streamlined and secure checkout process." },
              { icon: MapPin, title: "Anywhere, Anytime", desc: "Find vehicles in your neighborhood or at your travel destination easily." }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 p-8 rounded-2xl hover:shadow-xl transition duration-300 border border-gray-100 group">
                <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:-translate-y-2 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-dark-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
